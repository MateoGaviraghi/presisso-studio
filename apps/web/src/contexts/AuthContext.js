import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api-client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api
                .get('/auth/me')
                .then(({ user }) => setUser(user))
                .catch(() => api.clearToken())
                .finally(() => setIsLoading(false));
        }
        else {
            setIsLoading(false);
        }
    }, []);
    const login = useCallback(async (email, password) => {
        const { token, user } = await api.post('/auth/login', {
            email,
            password,
        });
        api.setToken(token);
        setUser(user);
    }, []);
    const register = useCallback(async (data) => {
        const { token, user } = await api.post('/auth/register', data);
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
    return (_jsx(AuthContext.Provider, { value: { user, isLoading, login, loginWithGoogle, register, logout }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth debe estar dentro de AuthProvider');
    return ctx;
}
