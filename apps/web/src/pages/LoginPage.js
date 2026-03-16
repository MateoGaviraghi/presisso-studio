import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export function LoginPage() {
    const { user, login, register, loginWithGoogle, isLoading } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    if (user)
        return _jsx(Navigate, { to: "/", replace: true });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            }
            else {
                await register({ email, password, name });
            }
            navigate('/');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("div", { className: "hidden lg:flex lg:w-[480px] xl:w-[540px] bg-presisso-black flex-col justify-between p-10 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-[0.03] login-grid-texture" }), _jsx("div", { className: "relative z-10", children: _jsx("img", { src: "/logo-presisso.png", alt: "Presisso", className: "h-8 brightness-0 invert" }) }), _jsxs("div", { className: "relative z-10 space-y-6", children: [_jsxs("h2", { className: "font-display text-4xl xl:text-5xl font-semibold text-white leading-[1.15]", children: ["Dise\u00F1\u00E1 tu espacio", _jsx("br", {}), _jsx("span", { className: "text-presisso-red", children: "en 3D" })] }), _jsx("p", { className: "text-white/50 text-[15px] leading-relaxed max-w-sm", children: "Configurador 3D + realidad aumentada para muebles premium. Visualiz\u00E1, personaliz\u00E1 y compart\u00ED tu proyecto." }), _jsxs("div", { className: "flex items-center gap-4 pt-2", children: [_jsx("div", { className: "flex -space-x-2", children: ['D', 'A', 'M'].map((letter, i) => (_jsx("div", { className: "w-8 h-8 rounded-full bg-white/10 border-2 border-presisso-black flex items-center justify-center text-[11px] font-medium text-white/60", children: letter }, i))) }), _jsx("p", { className: "text-white/30 text-[12px]", children: "Usado por dise\u00F1adores en toda Argentina" })] })] }), _jsxs("p", { className: "relative z-10 text-white/20 text-[11px]", children: ["\u00A9 ", new Date().getFullYear(), " Presisso Muebles"] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center bg-surface-tertiary p-6", children: _jsxs("div", { className: "w-full max-w-[380px]", children: [_jsx("div", { className: "lg:hidden mb-10 text-center", children: _jsx("img", { src: "/logo-presisso.png", alt: "Presisso", className: "h-8 mx-auto mb-2" }) }), _jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-semibold text-presisso-charcoal", children: mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta' }), _jsx("p", { className: "mt-1.5 text-[14px] text-presisso-gray", children: mode === 'login'
                                        ? 'Ingresá a tu cuenta de Presisso Studio'
                                        : 'Registrate para empezar a diseñar' })] }), _jsxs("button", { type: "button", onClick: loginWithGoogle, className: "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white text-[14px] font-medium text-presisso-charcoal hover:bg-surface-secondary transition-colors", children: [_jsxs("svg", { className: "w-[18px] h-[18px]", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z", fill: "#4285F4" }), _jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }), _jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }), _jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })] }), "Continuar con Google"] }), _jsxs("div", { className: "my-6 flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-px bg-border" }), _jsx("span", { className: "text-[12px] text-presisso-gray/60 uppercase tracking-wider", children: "o" }), _jsx("div", { className: "flex-1 h-px bg-border" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [mode === 'register' && (_jsxs("div", { children: [_jsx("label", { className: "block text-[12px] font-medium text-presisso-charcoal mb-1.5", children: "Nombre completo" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), required: true, className: "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all", placeholder: "Juan P\u00E9rez" })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-[12px] font-medium text-presisso-charcoal mb-1.5", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all", placeholder: "tu@email.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[12px] font-medium text-presisso-charcoal mb-1.5", children: "Contrase\u00F1a" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 8, className: "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all", placeholder: "M\u00EDnimo 8 caracteres" })] }), error && (_jsx("div", { className: "px-4 py-2.5 rounded-xl bg-presisso-red-light text-presisso-red text-[13px]", children: error })), _jsx("button", { type: "submit", disabled: submitting || isLoading, className: "btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed", children: submitting ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta' })] }), _jsxs("p", { className: "mt-6 text-center text-[13px] text-presisso-gray", children: [mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?', ' ', _jsx("button", { type: "button", onClick: () => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                        setError('');
                                    }, className: "text-presisso-red font-medium hover:underline", children: mode === 'login' ? 'Registrate' : 'Iniciá sesión' })] })] }) })] }));
}
