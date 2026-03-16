# 10 — Foto del Espacio (Upload + Background Layer)

> **Sprint**: 2 (Día 10-12)
> **Dependencias**: `07-EDITOR-3D.md`, `05-STORAGE-CDN.md`
> **Resultado**: Cliente sube foto de su cocina/living y se usa como fondo del editor 3D

---

## 1. Flujo Completo

```
1. Cliente clickea "Subir foto de mi espacio"
2. Selecciona imagen (JPG/PNG, max 10MB)
3. Frontend sube a S3 via backend (/api/upload/image)
4. Backend retorna CDN URL
5. Babylon.js crea un plano de fondo con la imagen como textura
6. Se guarda la URL en el proyecto (backgroundImageUrl)
7. Los muebles 3D se superponen sobre la foto
```

---

## 2. Componente de Upload

```tsx
// apps/web/src/components/editor/PhotoUpload.tsx
import { useState, useRef } from 'react';
import { Upload, Camera, Image, X } from 'lucide-react';
import { api } from '../../services/api-client';
import { useEditorStore } from '../../stores/editor-store';

export function PhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { backgroundImageUrl, setBackgroundImage, projectId } = useEditorStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se aceptan imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no puede superar los 10MB');
      return;
    }

    // Preview local inmediato
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // Subir a S3 via backend
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${api.getToken()}` },
        body: formData,
      });
      const { url } = await response.json();

      // Actualizar store y scene
      setBackgroundImage(url);

      // Aplicar en Babylon.js
      const editorScene = (window as any).__editorScene;
      if (editorScene) editorScene.setBackgroundImage(url);

      // Persistir en backend
      if (projectId) {
        await api.put(`/projects/${projectId}`, { backgroundImageUrl: url });
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const removeBackground = () => {
    setBackgroundImage(null);
    setPreview(null);
    const editorScene = (window as any).__editorScene;
    if (editorScene) editorScene.removeBackgroundImage();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Foto del espacio</h3>

      {backgroundImageUrl || preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={preview || backgroundImageUrl!} alt="Espacio" className="w-full h-32 object-cover" />
          <button
            onClick={removeBackground}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-presisso-gold hover:bg-presisso-gold/5 transition-all"
        >
          {uploading ? (
            <div className="animate-spin w-6 h-6 border-2 border-presisso-gold border-t-transparent rounded-full mx-auto" />
          ) : (
            <>
              <Upload className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm text-gray-500">Subí una foto de tu espacio</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP — Max 10MB</p>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
```

---

## 3. Medidas del Espacio

```tsx
// apps/web/src/components/editor/RoomDimensions.tsx
import { useState } from 'react';
import { useEditorStore } from '../../stores/editor-store';
import { Ruler } from 'lucide-react';

export function RoomDimensions() {
  const { roomDimensions, setRoomDimensions } = useEditorStore();
  const [width, setWidth] = useState(roomDimensions?.width?.toString() || '');
  const [height, setHeight] = useState(roomDimensions?.height?.toString() || '');
  const [depth, setDepth] = useState(roomDimensions?.depth?.toString() || '');

  const handleApply = () => {
    const dims = {
      width: parseFloat(width) || 300,
      height: parseFloat(height) || 260,
      depth: parseFloat(depth) || 400,
    };
    setRoomDimensions(dims);

    // Actualizar el grid de Babylon.js para reflejar las medidas
    const editorScene = (window as any).__editorScene;
    if (editorScene) {
      editorScene.updateRoomScale(dims.width / 100, dims.depth / 100); // cm → metros
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Ruler size={16} /> Medidas del espacio (cm)
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-400">Ancho</label>
          <input type="number" value={width} onChange={(e) => setWidth(e.target.value)}
            placeholder="300" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Alto</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
            placeholder="260" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Profundidad</label>
          <input type="number" value={depth} onChange={(e) => setDepth(e.target.value)}
            placeholder="400" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
      </div>
      <button onClick={handleApply} className="w-full btn-primary text-sm">Aplicar medidas</button>
    </div>
  );
}
```

---

## 4. Background Image en Babylon.js

```typescript
// Agregar a editor-scene.ts:
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Layer } from '@babylonjs/core/Layers/layer';

let backgroundLayer: Layer | null = null;

function setBackgroundImage(imageUrl: string): void {
  // Remover fondo anterior
  removeBackgroundImage();

  // Usar Layer para fondo (siempre detrás de todo)
  backgroundLayer = new Layer('bgLayer', imageUrl, scene, true); // isBackground = true
  backgroundLayer.isBackground = true;

  // Hacer el grid semi-transparente para ver la foto
  if (ground.material) {
    (ground.material as GridMaterial).opacity = 0.4;
  }
}

function removeBackgroundImage(): void {
  if (backgroundLayer) {
    backgroundLayer.dispose();
    backgroundLayer = null;
  }
  if (ground.material) {
    (ground.material as GridMaterial).opacity = 0.8;
  }
}
```

---

## Siguiente paso → `11-AR-8THWALL.md`
