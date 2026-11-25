import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { notificationApi } from '../../api/notificationApi';
import {
  Bell,
  LogOut,
  User,
  Shield,
  Wrench,
  Radio,
  Check,
  CheckCheck,
  Menu,
  Search,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = ({ onToggleSidebar, onToggleCollapse, sidebarCollapsed }) => {
  const { user, role, logout } = useAuth();
  const { connected, unreadCount, clearUnread } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = async () => {
    if (!showNotifications) {
      setLoadingNotifs(true);
      setShowNotifications(true);
      try {
        const res = await notificationApi.getMyNotifications({ limit: 6 });
        setNotifications(res?.data || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoadingNotifs(false);
      }
    } else {
      setShowNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAsRead('read-all');
      clearUnread();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (role === 'admin') {
      navigate(`/admin/complaints?search=${encodeURIComponent(searchQuery)}`);
    } else if (role === 'maintenance') {
      navigate(`/maintenance/tasks?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/citizen/complaints?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        
        {/* Left: Mobile Toggle & Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B1A] to-[#FF8A00] text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all">
              <Shield className="w-4 h-4 fill-white/20" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900">
                  ROAD<span className="text-[#FF6B1A]">GUARD</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-orange-50 text-[#FF6B1A] border border-orange-200">
                  AI PLATFORM
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Search Field */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports, streets, or coordinates..."
              className="w-full pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#FF6B1A] focus:ring-1 focus:ring-[#FF6B1A] transition-all font-sans"
            />
          </form>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Live System Indicator */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 font-medium"
            title={connected ? 'Connected to AI Telemetry' : 'Offline'}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                connected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
              }`}
            />
            <span className="text-[11px] font-bold text-slate-700">
              {connected ? 'LIVE DISPATCH' : 'CONNECTING'}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-label="View notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#FF6B1A] rounded-full ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                      Alerts
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-[#FF6B1A]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[#FF6B1A] hover:underline font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3.5 text-xs transition-colors hover:bg-slate-50 ${
                          !notif.isRead ? 'bg-orange-50/50' : ''
                        }`}
                      >
                        <p className="font-semibold text-slate-800">
                          {notif.title}
                        </p>
                        <p className="text-slate-500 mt-0.5 text-[11px]">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0A84FF] font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                  {role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
