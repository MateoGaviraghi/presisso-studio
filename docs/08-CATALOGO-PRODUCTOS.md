# 08 — Catálogo de Productos

> **Sprint**: 1-2 (Día 7-10)
> **Dependencias**: `04-API-BACKEND.md`, `06-FRONTEND-BASE.md`
> **Resultado**: Grid de productos con filtros, mini-viewer 3D y acción de agregar al editor

---

## 1. Componente ProductGrid

```tsx
// apps/web/src/components/catalog/ProductGrid.tsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api-client';
import { ProductCard } from './ProductCard';
import { CatalogFilters } from './CatalogFilters';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  roomType: string;
  line: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  modelUrl: string;
  thumbnailUrl: string;
  materials: Array<{ id: string; name: string; colorHex: string }>;
  priceArs: string;
}

interface Filters {
  roomType: string;
  category: string;
  search: string;
}

export function ProductGrid({ onAddToEditor }: { onAddToEditor?: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({ roomType: '', category: '', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.roomType) params.set('roomType', filters.roomType);
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);

    api.get<{ products: Product[] }>(`/products?${params}`)
      .then(({ products }) => setProducts(products))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <CatalogFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 h-64 animate-pulse bg-surface-tertiary" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={onAddToEditor} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 2. Componente ProductCard con Mini-Viewer 3D

```tsx
// apps/web/src/components/catalog/ProductCard.tsx
import { useRef, useEffect, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { Plus, Maximize2 } from 'lucide-react';

interface Props {
  product: {
    id: string;
    name: string;
    description: string;
    widthCm: string;
    heightCm: string;
    depthCm: string;
    modelUrl: string;
    thumbnailUrl: string;
    materials: Array<{ id: string; name: string; colorHex: string }>;
    line: string;
  };
  onAdd?: (product: any) => void;
}

export function ProductCard({ product, onAdd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mini-viewer 3D al hacer hover
  useEffect(() => {
    if (!isHovered || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false });
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera('previewCam', -Math.PI / 4, Math.PI / 3, 5, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    new HemisphericLight('light', new Vector3(0, 1, 0), scene).intensity = 1;

    SceneLoader.ImportMeshAsync('', product.modelUrl, '', scene).then((result) => {
      // Auto-centrar el modelo
      const root = result.meshes[0];
      root.normalizeToUnitCube();
      root.position = Vector3.Zero();

      // Auto-rotar
      scene.registerBeforeRender(() => {
        root.rotation.y += 0.005;
      });
    });

    engine.runRenderLoop(() => scene.render());

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, [isHovered, product.modelUrl]);

  return (
    <div
      className="card overflow-hidden group cursor-pointer transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <div className="relative h-48 bg-surface-tertiary">
        {isHovered ? (
          <canvas ref={canvasRef} className="w-full h-full" />
        ) : (
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            loading="lazy"
          />
        )}
        {/* Badge de línea */}
        <span className="absolute top-3 left-3 px-2 py-0.5 bg-presisso-dark/80 text-white text-xs rounded-lg">
          {product.line}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-sm">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          {product.widthCm} × {product.heightCm} × {product.depthCm} cm
        </p>

        {/* Materiales */}
        <div className="flex gap-1 mt-2">
          {product.materials.map((mat) => (
            <div
              key={mat.id}
              className="w-5 h-5 rounded-full border border-gray-200"
              style={{ backgroundColor: mat.colorHex }}
              title={mat.name}
            />
          ))}
        </div>

        {/* Acción */}
        {onAdd && (
          <button
            onClick={() => onAdd(product)}
            className="mt-3 w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Agregar al editor
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 3. Filtros

```tsx
// apps/web/src/components/catalog/CatalogFilters.tsx
import { Search } from 'lucide-react';

const ROOM_TYPES = [
  { value: '', label: 'Todos los ambientes' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'living', label: 'Living' },
  { value: 'bedroom', label: 'Dormitorio' },
  { value: 'dining', label: 'Comedor' },
  { value: 'bathroom', label: 'Baño' },
  { value: 'office', label: 'Oficina' },
];

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'cabinet', label: 'Muebles bajo mesada' },
  { value: 'countertop', label: 'Mesadas' },
  { value: 'table', label: 'Mesas' },
  { value: 'shelf', label: 'Estanterías' },
  { value: 'wardrobe', label: 'Vestidores' },
];

interface Props {
  filters: { roomType: string; category: string; search: string };
  onChange: (filters: any) => void;
}

export function CatalogFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-presisso-gold focus:ring-1 focus:ring-presisso-gold/30 outline-none"
        />
      </div>
      <select
        value={filters.roomType}
        onChange={(e) => onChange({ ...filters, roomType: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
      >
        {ROOM_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
      </select>
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
      >
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </div>
  );
}
```

---

## Siguiente paso → `09-DRAG-DROP-INTERACCION.md`
