import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Routes>
        <Route
          path="/"
          element={
            <main className="flex flex-col items-center justify-center min-h-screen">
              <img src="/logo-presisso.png" alt="Presisso" className="h-16 mb-6" />
              <h1 className="font-display text-4xl font-bold text-presisso-black mb-4">
                Presisso Studio
              </h1>
              <p className="text-presisso-gray text-lg">
                Configurador 3D + AR para muebles premium
              </p>
              <div className="mt-8 flex gap-4">
                <button className="btn-primary">Comenzar</button>
                <button className="btn-secondary">Ver Catálogo</button>
              </div>
            </main>
          }
        />
      </Routes>
    </div>
  );
}
