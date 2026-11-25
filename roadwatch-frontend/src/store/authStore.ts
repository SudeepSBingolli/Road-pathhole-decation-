import { create } from 'zustand';
import { User, Role } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const getStoredToken = () => localStorage.getItem('roadwatch_token');
const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('roadwatch_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = getStoredToken();
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  role: initialUser?.role || null,
  isAuthenticated: Boolean(initialToken && initialUser),

  login: (token: string, user: User) => {
    localStorage.setItem('roadwatch_token', token);
    localStorage.setItem('roadwatch_user', JSON.stringify(user));
    set({
      token,
      user,
      role: user.role,
      isAuthenticated: true
    });
  },

  logout: () => {
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
    set({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false
    });
  },

  setUser: (user: User) => {
    localStorage.setItem('roadwatch_user', JSON.stringify(user));
    set({
      user,
      role: user.role
    });
  }
}));
