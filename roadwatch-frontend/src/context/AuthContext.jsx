import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('roadwatch_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('roadwatch_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync / verify current user on initial mount if token exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('roadwatch_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Token validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('roadwatch_token', newToken);
    localStorage.setItem('roadwatch_user', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('roadwatch_token', newToken);
    localStorage.setItem('roadwatch_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

