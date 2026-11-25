import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notificationApi';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map of event listeners registered by active components: { eventName: Set<callback> }
  const listenersRef = useRef(new Map());

  // Fetch initial unread count on login
  useEffect(() => {
    if (isAuthenticated) {
      notificationApi
        .getMyNotifications({ unreadOnly: 'true', limit: 1 })
        .then((res) => {
          if (typeof res?.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Connect to Socket.IO after user authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to server as ${user?.name} (${socket.id})`);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    // Helper to dispatch event to both toasts and component subscribers
    const handleIncomingEvent = (eventName, data, toastMessage, icon = '🔔') => {
      // 1. Increment bell badge
      setUnreadCount((prev) => prev + 1);

      // 2. Trigger interactive toast
      toast(toastMessage, {
        icon,
        duration: 5000,
        style: {
          borderRadius: '10px',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '14px',
        },
      });

      // 3. Dispatch to all active component subscribers
      const handlers = listenersRef.current.get(eventName);
      if (handlers) {
        handlers.forEach((cb) => {
          try {
            cb(data);
          } catch (e) {
            console.error(`Error in socket listener for ${eventName}:`, e);
          }
        });
      }
    };

    // Listen to standard server events
    socket.on('report:new', (data) => {
      handleIncomingEvent(
        'report:new',
        data,
        `New Pothole Reported: ${data.complaintId} in ${data.area}`,
        '⚠️'
      );
    });

    socket.on('report:statusChanged', (data) => {
      handleIncomingEvent(
        'report:statusChanged',
        data,
        `Report ${data.complaintId || 'Status'}: now ${data.status || 'updated'}`,
        '🔄'
      );
    });

    socket.on('task:assigned', (data) => {
      handleIncomingEvent(
        'task:assigned',
        data,
        `New Task Assigned: ${data.complaintId} at ${data.address}`,
        '📋'
      );
    });

    socket.on('repair:submitted', (data) => {
      handleIncomingEvent(
        'repair:submitted',
        data,
        `Repair Completed: ${data.complaintId} awaiting verification!`,
        '🛠️'
      );
    });

    socket.on('repair:verified', (data) => {
      const isApproved = data.verificationStatus === 'approved';
      handleIncomingEvent(
        'repair:verified',
        data,
        isApproved
          ? `Repair Approved: ${data.complaintId} has been verified! 🎉`
          : `Repair Rejected: ${data.complaintId} needs rework.`,
        isApproved ? '✅' : '❌'
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token, user?.name]);

  /**
   * Subscribe to a live event from any component
   * @param {string} eventName - e.g. 'report:new', 'report:statusChanged', etc.
   * @param {Function} callback - (data) => void
   * @returns {Function} unsubscribe function
   */
  const subscribe = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName).add(callback);

    return () => {
      const handlers = listenersRef.current.get(eventName);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          listenersRef.current.delete(eventName);
        }
      }
    };
  }, []);

  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider
      value={{
        connected,
        unreadCount,
        clearUnread,
        subscribe,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

