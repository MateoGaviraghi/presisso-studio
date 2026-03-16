import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'vendor' | 'admin';
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .get<{ user: User }>('/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => api.clearToken())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    api.setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string }) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', data);
    api.setToken(token);
    setUser(user);
  }, []);

  const loginWithGoogle = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
    window.location.href = `${apiUrl}/auth/google`;
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe estar dentro de AuthProvider');
  return ctx;
}
