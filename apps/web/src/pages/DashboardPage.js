import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Clock, ChevronRight } from 'lucide-react';
import { api } from '../services/api-client';
import { useAuth } from '../contexts/AuthContext';
const statusLabels = {
    draft: 'Borrador',
    in_progress: 'En progreso',
    completed: 'Completado',
};
const statusColors = {
    draft: 'bg-presisso-gray/10 text-presisso-gray',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
};
export function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api
            .get('/projects')
            .then(({ projects }) => setProjects(projects))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    const formatDate = (iso) => new Date(iso).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    return (_jsxs("div", { className: "p-6 lg:p-8 max-w-6xl", children: [_jsxs("div", { className: "flex items-end justify-between mb-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-semibold text-presisso-charcoal", children: ["Bienvenido, ", user?.name?.split(' ')[0] ?? 'Usuario'] }), _jsx("p", { className: "mt-1 text-[14px] text-presisso-gray", children: "Tus proyectos de dise\u00F1o" })] }), _jsxs(Link, { to: "/editor/new", className: "btn-primary flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nuevo proyecto"] })] }), loading ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: [1, 2, 3].map((i) => (_jsxs("div", { className: "card animate-pulse", children: [_jsx("div", { className: "h-32 bg-surface-tertiary rounded-lg mb-4" }), _jsx("div", { className: "h-4 bg-surface-tertiary rounded w-2/3 mb-2" }), _jsx("div", { className: "h-3 bg-surface-tertiary rounded w-1/3" })] }, i))) })) : projects.length === 0 ? (_jsxs("div", { className: "card flex flex-col items-center justify-center py-16 text-center", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mb-4", children: _jsx(FolderOpen, { className: "w-6 h-6 text-presisso-red" }) }), _jsx("h3", { className: "text-lg font-semibold text-presisso-charcoal mb-1", children: "Sin proyectos a\u00FAn" }), _jsx("p", { className: "text-[14px] text-presisso-gray mb-6 max-w-xs", children: "Cre\u00E1 tu primer proyecto para empezar a dise\u00F1ar tu espacio en 3D." }), _jsxs(Link, { to: "/editor/new", className: "btn-primary flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Crear proyecto"] })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: projects.map((project) => (_jsxs(Link, { to: `/editor/${project.id}`, className: "card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200", children: [_jsx("div", { className: "h-32 bg-surface-tertiary rounded-lg mb-4 flex items-center justify-center overflow-hidden", children: _jsx(FolderOpen, { className: "w-8 h-8 text-presisso-gray/20 group-hover:text-presisso-red/30 transition-colors" }) }), _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-medium text-presisso-charcoal truncate group-hover:text-presisso-red transition-colors", children: project.name }), _jsxs("div", { className: "flex items-center gap-2 mt-1.5 text-[12px] text-presisso-gray", children: [_jsx(Clock, { className: "w-3 h-3" }), formatDate(project.updatedAt)] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-presisso-gray/30 mt-1 group-hover:text-presisso-red transition-colors" })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("span", { className: `inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColors[project.status] ?? statusColors.draft}`, children: statusLabels[project.status] ?? project.status }), project.roomType && (_jsx("span", { className: "text-[11px] text-presisso-gray/50", children: project.roomType }))] })] }, project.id))) }))] }));
}
