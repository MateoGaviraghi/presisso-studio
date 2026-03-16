# 06 — Frontend Base (React + Routing + Estado Global)

> **Sprint**: 1 (Día 5-8)
> **Dependencias**: `01-SETUP-ENTORNO.md`, `04-API-BACKEND.md`
> **Resultado**: SPA funcional con routing, auth context, layout principal y API client

---

## 1. Entry Point y Router

```tsx
// apps/web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

```tsx
// apps/web/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { CatalogPage } from './pages/CatalogPage';
import { ArPage } from './pages/ArPage';
import { VendorPage } from './pages/VendorPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="editor/:projectId" element={<EditorPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="ar/:projectId" element={<ArPage />} />
          <Route path="vendor" element={<VendorPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
```

---

## 2. Auth Context

```tsx
// apps/web/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'vendor' | 'admin';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .get<{ user: User }>('/auth/me')
        .then(({ user }) => setUser(user))
        .catch(() => api.clearToken())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    api.setToken(token);
    setUser(user);
  };

  const register = async (data: { email: string; password: string; name: string }) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', data);
    api.setToken(token);
    setUser(user);
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
```

---

## 3. Layout Principal

```tsx
// apps/web/src/components/layout/MainLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Box, Grid3X3, User, LogOut } from 'lucide-react';

export function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-surface-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-presisso-black text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-display text-xl font-semibold tracking-wide">
            PRESISSO <span className="text-presisso-red">STUDIO</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink to="/" icon={<Home size={20} />} label="Dashboard" />
          <SidebarLink to="/catalog" icon={<Grid3X3 size={20} />} label="Catálogo" />
          {user?.role !== 'client' && (
            <SidebarLink to="/vendor" icon={<Box size={20} />} label="Panel Vendedor" />
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-presisso-red/20 flex items-center justify-center text-sm font-medium text-presisso-red">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-white/10 text-presisso-red'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
```

---

## 4. Estado Global con Zustand

```typescript
// apps/web/src/stores/editor-store.ts
import { create } from 'zustand';

interface EditorItem {
  id: string;
  productId: string;
  productName: string;
  modelUrl: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  scale: number;
  selectedMaterialId?: string;
}

interface EditorStore {
  projectId: string | null;
  items: EditorItem[];
  selectedItemId: string | null;
  backgroundImageUrl: string | null;
  roomDimensions: { width: number; height: number; depth: number } | null;

  // Actions
  setProjectId: (id: string) => void;
  setItems: (items: EditorItem[]) => void;
  addItem: (item: EditorItem) => void;
  removeItem: (id: string) => void;
  updateItemTransform: (
    id: string,
    transform: Partial<Pick<EditorItem, 'position' | 'rotationY' | 'scale'>>,
  ) => void;
  selectItem: (id: string | null) => void;
  setBackgroundImage: (url: string | null) => void;
  setRoomDimensions: (dims: { width: number; height: number; depth: number }) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  projectId: null,
  items: [],
  selectedItemId: null,
  backgroundImageUrl: null,
  roomDimensions: null,

  setProjectId: (id) => set({ projectId: id }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),
  updateItemTransform: (id, transform) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...transform } : i)),
    })),
  selectItem: (id) => set({ selectedItemId: id }),
  setBackgroundImage: (url) => set({ backgroundImageUrl: url }),
  setRoomDimensions: (dims) => set({ roomDimensions: dims }),
}));
```

---

## Siguiente paso → `07-EDITOR-3D.md`
