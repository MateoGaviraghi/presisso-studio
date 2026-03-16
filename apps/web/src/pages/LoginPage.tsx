import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, login, register, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-presisso-black flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03] login-grid-texture" />

        <div className="relative z-10">
          <img src="/logo-presisso.png" alt="Presisso" className="h-8 brightness-0 invert" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl xl:text-5xl font-semibold text-white leading-[1.15]">
            Diseñá tu espacio
            <br />
            <span className="text-presisso-red">en 3D</span>
          </h2>
          <p className="text-white/50 text-[15px] leading-relaxed max-w-sm">
            Configurador 3D + realidad aumentada para muebles premium. Visualizá, personalizá y
            compartí tu proyecto.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {['D', 'A', 'M'].map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white/10 border-2 border-presisso-black flex items-center justify-center text-[11px] font-medium text-white/60"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-white/30 text-[12px]">Usado por diseñadores en toda Argentina</p>
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-[11px]">
          © {new Date().getFullYear()} Presisso Muebles
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-surface-tertiary p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <img src="/logo-presisso.png" alt="Presisso" className="h-8 mx-auto mb-2" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-presisso-charcoal">
              {mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
            </h1>
            <p className="mt-1.5 text-[14px] text-presisso-gray">
              {mode === 'login'
                ? 'Ingresá a tu cuenta de Presisso Studio'
                : 'Registrate para empezar a diseñar'}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white text-[14px] font-medium text-presisso-charcoal hover:bg-surface-secondary transition-colors"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-presisso-gray/60 uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] font-medium text-presisso-charcoal mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all"
                  placeholder="Juan Pérez"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-presisso-charcoal mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-presisso-charcoal mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-[14px] text-presisso-charcoal placeholder:text-presisso-gray/40 focus:outline-none focus:ring-2 focus:ring-presisso-red/20 focus:border-presisso-red transition-all"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-presisso-red-light text-presisso-red text-[13px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-[13px] text-presisso-gray">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-presisso-red font-medium hover:underline"
            >
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
