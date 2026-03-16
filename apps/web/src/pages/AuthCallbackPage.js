import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api-client';
export function AuthCallbackPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    useEffect(() => {
        const token = params.get('token');
        if (token) {
            api.setToken(token);
            // Reload the page to trigger AuthProvider's /auth/me fetch
            window.location.href = '/';
        }
        else {
            navigate('/login', { replace: true });
        }
    }, [params, navigate]);
    return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-surface-tertiary", children: _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-presisso-red border-t-transparent rounded-full animate-spin mx-auto" }), _jsx("p", { className: "text-[14px] text-presisso-gray", children: "Autenticando..." })] }) }));
}
