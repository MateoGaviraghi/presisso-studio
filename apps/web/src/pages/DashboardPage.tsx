import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Clock, ChevronRight } from 'lucide-react';
import { api } from '../services/api-client';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed';
  roomType: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-presisso-gray/10 text-presisso-gray',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
};

export function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ projects: Project[] }>('/projects')
      .then(({ projects }) => setProjects(projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-presisso-charcoal">
            Bienvenido, {user?.name?.split(' ')[0] ?? 'Usuario'}
          </h1>
          <p className="mt-1 text-[14px] text-presisso-gray">Tus proyectos de diseño</p>
        </div>
        <Link to="/editor/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-surface-tertiary rounded-lg mb-4" />
              <div className="h-4 bg-surface-tertiary rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-tertiary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-presisso-red" />
          </div>
          <h3 className="text-lg font-semibold text-presisso-charcoal mb-1">Sin proyectos aún</h3>
          <p className="text-[14px] text-presisso-gray mb-6 max-w-xs">
            Creá tu primer proyecto para empezar a diseñar tu espacio en 3D.
          </p>
          <Link to="/editor/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Crear proyecto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/editor/${project.id}`}
              className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Thumbnail placeholder */}
              <div className="h-32 bg-surface-tertiary rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <FolderOpen className="w-8 h-8 text-presisso-gray/20 group-hover:text-presisso-red/30 transition-colors" />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-presisso-charcoal truncate group-hover:text-presisso-red transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-presisso-gray">
                    <Clock className="w-3 h-3" />
                    {formatDate(project.updatedAt)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-presisso-gray/30 mt-1 group-hover:text-presisso-red transition-colors" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColors[project.status] ?? statusColors.draft}`}
                >
                  {statusLabels[project.status] ?? project.status}
                </span>
                {project.roomType && (
                  <span className="text-[11px] text-presisso-gray/50">{project.roomType}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
