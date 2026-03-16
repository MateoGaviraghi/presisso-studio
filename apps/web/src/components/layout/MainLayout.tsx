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

  return (
    <div className="flex h-screen bg-surface-tertiary">
      {/* Sidebar */}
      <aside className="w-64 bg-presisso-black flex flex-col shrink-0">
        {/* Brand header */}
        <div className="px-6 pt-7 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/logo-presisso.png" alt="Presisso" className="h-7 brightness-0 invert" />
            <span className="text-white/40 text-[11px] font-light tracking-[0.35em] uppercase mt-px">
              Studio
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-6 space-y-0.5">
          <p className="px-4 mb-3 text-[10px] font-medium tracking-[0.2em] uppercase text-white/25">
            Navegación
          </p>
          <SidebarLink to="/" icon={<Home size={18} />} label="Dashboard" end />
          <SidebarLink to="/catalog" icon={<Grid3X3 size={18} />} label="Catálogo" />
          {user?.role !== 'client' && (
            <SidebarLink to="/vendor" icon={<Box size={18} />} label="Panel Vendedor" />
          )}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4">
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-presisso-red/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-presisso-red">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/90 truncate">{user?.name}</p>
                <p className="text-[11px] text-white/35 truncate">
                  {user?.role === 'admin'
                    ? 'Administrador'
                    : user?.role === 'vendor'
                      ? 'Vendedor'
                      : 'Cliente'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/[0.08] text-white'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={isActive ? 'text-presisso-red' : 'text-white/40 group-hover:text-white/60'}
          >
            {icon}
          </span>
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={14} className="text-white/20" />}
        </>
      )}
    </NavLink>
  );
}
