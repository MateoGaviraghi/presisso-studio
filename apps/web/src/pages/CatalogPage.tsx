import { ShoppingBag } from 'lucide-react';

export function CatalogPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-presisso-charcoal">Catálogo</h1>
        <p className="mt-1 text-[14px] text-presisso-gray">
          Explorá nuestra colección de muebles premium
        </p>
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mb-4">
          <ShoppingBag className="w-6 h-6 text-presisso-red" />
        </div>
        <h3 className="text-lg font-semibold text-presisso-charcoal mb-1">Catálogo de productos</h3>
        <p className="text-[14px] text-presisso-gray">En construcción</p>
      </div>
    </div>
  );
}
