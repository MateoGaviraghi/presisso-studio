import { BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function VendorPage() {
  const { user } = useAuth();

  if (user && user.role === 'client') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-presisso-charcoal">Panel vendedor</h1>
        <p className="mt-1 text-[14px] text-presisso-gray">Gestión de clientes y proyectos</p>
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-presisso-red" />
        </div>
        <h3 className="text-lg font-semibold text-presisso-charcoal mb-1">Panel de vendedor</h3>
        <p className="text-[14px] text-presisso-gray">En construcción</p>
      </div>
    </div>
  );
}
