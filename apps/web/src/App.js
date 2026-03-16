import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
export function App() {
    return (_jsx("div", { className: "min-h-screen bg-surface-secondary", children: _jsx(Routes, { children: _jsx(Route, { path: "/", element: _jsxs("main", { className: "flex flex-col items-center justify-center min-h-screen", children: [_jsx("img", { src: "/logo-presisso.png", alt: "Presisso", className: "h-16 mb-6" }), _jsx("h1", { className: "font-display text-4xl font-bold text-presisso-black mb-4", children: "Presisso Studio" }), _jsx("p", { className: "text-presisso-gray text-lg", children: "Configurador 3D + AR para muebles premium" }), _jsxs("div", { className: "mt-8 flex gap-4", children: [_jsx("button", { className: "btn-primary", children: "Comenzar" }), _jsx("button", { className: "btn-secondary", children: "Ver Cat\u00E1logo" })] })] }) }) }) }));
}
