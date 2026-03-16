import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Grid3X3, Box, LogOut, ChevronRight } from 'lucide-react';
export function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs("div", { className: "flex h-screen bg-surface-tertiary", children: [_jsxs("aside", { className: "w-64 bg-presisso-black flex flex-col shrink-0", children: [_jsx("div", { className: "px-6 pt-7 pb-6 border-b border-white/[0.06]", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: "/logo-presisso.png", alt: "Presisso", className: "h-7 brightness-0 invert" }), _jsx("span", { className: "text-white/40 text-[11px] font-light tracking-[0.35em] uppercase mt-px", children: "Studio" })] }) }), _jsxs("nav", { className: "flex-1 px-3 pt-6 space-y-0.5", children: [_jsx("p", { className: "px-4 mb-3 text-[10px] font-medium tracking-[0.2em] uppercase text-white/25", children: "Navegaci\u00F3n" }), _jsx(SidebarLink, { to: "/", icon: _jsx(Home, { size: 18 }), label: "Dashboard", end: true }), _jsx(SidebarLink, { to: "/catalog", icon: _jsx(Grid3X3, { size: 18 }), label: "Cat\u00E1logo" }), user?.role !== 'client' && (_jsx(SidebarLink, { to: "/vendor", icon: _jsx(Box, { size: 18 }), label: "Panel Vendedor" }))] }), _jsx("div", { className: "px-3 pb-4", children: _jsxs("div", { className: "rounded-xl bg-white/[0.04] p-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [user?.avatarUrl ? (_jsx("img", { src: user.avatarUrl, alt: "", className: "w-8 h-8 rounded-full object-cover ring-1 ring-white/10" })) : (_jsx("div", { className: "w-8 h-8 rounded-full bg-presisso-red/20 flex items-center justify-center", children: _jsx("span", { className: "text-xs font-semibold text-presisso-red", children: user?.name?.charAt(0).toUpperCase() }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[13px] font-medium text-white/90 truncate", children: user?.name }), _jsx("p", { className: "text-[11px] text-white/35 truncate", children: user?.role === 'admin'
                                                        ? 'Administrador'
                                                        : user?.role === 'vendor'
                                                            ? 'Vendedor'
                                                            : 'Cliente' })] })] }), _jsxs("button", { onClick: handleLogout, className: "mt-3 flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors", children: [_jsx(LogOut, { size: 14 }), "Cerrar sesi\u00F3n"] })] }) })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx(Outlet, {}) })] }));
}
function SidebarLink({ to, icon, label, end, }) {
    return (_jsx(NavLink, { to: to, end: end, className: ({ isActive }) => `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${isActive
            ? 'bg-white/[0.08] text-white'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx("span", { className: isActive ? 'text-presisso-red' : 'text-white/40 group-hover:text-white/60', children: icon }), _jsx("span", { className: "flex-1", children: label }), isActive && _jsx(ChevronRight, { size: 14, className: "text-white/20" })] })) }));
}
