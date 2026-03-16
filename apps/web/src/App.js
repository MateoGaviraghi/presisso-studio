import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { CatalogPage } from './pages/CatalogPage';
import { ArPage } from './pages/ArPage';
import { VendorPage } from './pages/VendorPage';
function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-surface-tertiary", children: _jsx("div", { className: "w-8 h-8 border-2 border-presisso-red border-t-transparent rounded-full animate-spin" }) }));
    }
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(Outlet, {});
}
export function App() {
    return (_jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/auth/callback", element: _jsx(AuthCallbackPage, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "editor/:projectId", element: _jsx(EditorPage, {}) }), _jsx(Route, { path: "catalog", element: _jsx(CatalogPage, {}) }), _jsx(Route, { path: "ar/:projectId", element: _jsx(ArPage, {}) }), _jsx(Route, { path: "vendor", element: _jsx(VendorPage, {}) })] }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
