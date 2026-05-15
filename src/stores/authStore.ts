import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'tally_staff' | 'driver_view';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

const getInitialAuth = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (token && userJson) {
    try {
      return { user: JSON.parse(userJson), isAuthenticated: true };
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return { user: null, isAuthenticated: false };
};

const initialState = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: () => {
    // Optional: already handled by initial state, but keep for explicit refreshes
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ isAuthenticated: true, user });
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      }
    }
  }
}));
