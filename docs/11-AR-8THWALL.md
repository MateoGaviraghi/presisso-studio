# 11 — Realidad Aumentada (8thWall + Babylon.js)

> **Sprint**: 2 (Día 12-16)
> **Dependencias**: `07-EDITOR-3D.md`, `05-STORAGE-CDN.md`
> **Resultado**: Experiencia AR en el navegador donde el cliente ve muebles reales en su espacio
> **Skills a leer antes de implementar**: `frontend-design`, `vercel-react-best-practices`, `webapp-testing`

---

## 1. Qué es 8thWall

8thWall es una plataforma de AR web que funciona directamente en el navegador sin instalar ninguna app. Compatible con iPhone (Safari) y Android (Chrome). Presisso lo usa para el Modo 2 de visualización.

**Por qué 8thWall y no WebXR nativo:**

- WebXR tiene soporte limitado en iOS Safari
- 8thWall funciona en el 95%+ de dispositivos móviles modernos
- Integración nativa con Babylon.js
- Usado por IKEA, Wayfair, Shopify

---

## 2. Setup de 8thWall

### 2.1 Crear proyecto en 8thWall

1. Ir a `console.8thwall.com`
2. Crear proyecto "Presisso Studio AR"
3. Obtener API key
4. Agregar dominio autorizado (localhost:3000 y presisso.studio)

### 2.2 Incluir SDK en el frontend

```html
<!-- apps/web/index.html — agregar en <head> -->
<script src="https://apps.8thwall.com/xrweb?appKey=VITE_EIGHTHWALL_API_KEY"></script>
```

O cargar condicionalmente solo en la página AR:

```typescript
// apps/web/src/utils/load-8thwall.ts
export function load8thWall(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).XR8) return resolve();

    const script = document.createElement('script');
    script.src = `https://apps.8thwall.com/xrweb?appKey=${import.meta.env.VITE_EIGHTHWALL_API_KEY}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load 8thWall SDK'));
    document.head.appendChild(script);
  });
}
```

---

## 3. Escena AR con Babylon.js + 8thWall

```typescript
// apps/web/src/scenes/ar-scene.ts
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

declare const XR8: any;
declare const XRExtras: any;

export async function createArScene(canvas: HTMLCanvasElement, modelUrl: string) {
  const engine = new Engine(canvas, true, {
    stencil: true,
    preserveDrawingBuffer: true,
  });
  const scene = new Scene(engine);

  // Cámara AR (controlada por 8thWall)
  const camera = new FreeCamera('arCamera', new Vector3(0, 0, 0), scene);
  camera.minZ = 0.01;
  camera.maxZ = 1000;

  // Iluminación
  const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.6;
  const dirLight = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.5), scene);
  dirLight.intensity = 0.8;

  // Variable para el modelo cargado
  let placedModel: any = null;
  let modelLoaded = false;

  // Pipeline de 8thWall con Babylon.js
  const pipelineModule = {
    name: 'presisso-ar',

    onStart: () => {
      // 8thWall toma control de la cámara
      const xrCamera = XR8.Babylonjs.xrCamera();
      scene.activeCamera = xrCamera;
    },

    onUpdate: () => {
      // Render loop manejado por 8thWall
    },

    onCanvasSizeChange: () => {
      engine.resize();
    },
  };

  // Módulo de colocación por toque
  const touchPlaceModule = {
    name: 'touch-place',

    onAttach: () => {
      // Pre-cargar el modelo GLB
      SceneLoader.ImportMeshAsync('', modelUrl, '', scene).then((result) => {
        placedModel = result.meshes[0];
        placedModel.setEnabled(false); // Ocultar hasta que el usuario toque
        placedModel.normalizeToUnitCube();
        // Escalar a tamaño real (ajustar según las dimensiones del producto)
        placedModel.scaling.setAll(1.0);
        modelLoaded = true;
      });
    },

    onTouch: (event: any) => {
      if (!modelLoaded || !placedModel) return;

      // Obtener posición del toque en el plano del piso detectado
      const touchPoint = event.touches[0];
      const pickResult = scene.pick(touchPoint.clientX, touchPoint.clientY);

      if (pickResult?.hit) {
        // Colocar el modelo en el punto detectado
        placedModel.position = pickResult.pickedPoint!;
        placedModel.setEnabled(true);
      } else {
        // Usar raycasting de 8thWall para surface detection
        const raycaster = XR8.XrController.hitTest(
          touchPoint.clientX / canvas.width,
          touchPoint.clientY / canvas.height,
          ['FEATURE_POINT'],
        );
        if (raycaster && raycaster.length > 0) {
          const hit = raycaster[0];
          placedModel.position = new Vector3(hit.position.x, hit.position.y, hit.position.z);
          placedModel.setEnabled(true);
        }
      }
    },
  };

  // Iniciar 8thWall AR
  XR8.XrController.configure({
    disableWorldTracking: false,
    scale: 'absolute', // Escala real (1 unidad = 1 metro)
    enableLighting: true, // Estimación de iluminación
  });

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Babylonjs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    XRExtras.AlmostThere.pipelineModule(), // UI de "casi listo"
    XRExtras.Loading.pipelineModule(), // Pantalla de carga
    XRExtras.RuntimeError.pipelineModule(), // Manejo de errores
    pipelineModule,
    touchPlaceModule,
  ]);

  XR8.run({ canvas });

  // Controles de interacción
  function rotateModel(degrees: number) {
    if (placedModel) {
      placedModel.rotation.y += (degrees * Math.PI) / 180;
    }
  }

  function scaleModel(factor: number) {
    if (placedModel) {
      const current = placedModel.scaling.x;
      placedModel.scaling.setAll(Math.max(0.3, Math.min(3.0, current * factor)));
    }
  }

  // Capturar foto con el mueble integrado
  async function capturePhoto(): Promise<string> {
    return new Promise((resolve) => {
      engine.onEndFrameObservable.addOnce(() => {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      });
    });
  }

  const dispose = () => {
    XR8.stop();
    scene.dispose();
    engine.dispose();
  };

  return { scene, engine, rotateModel, scaleModel, capturePhoto, dispose };
}
```

---

## 4. Página AR

```tsx
// apps/web/src/pages/ArPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { load8thWall } from '../utils/load-8thwall';
import { createArScene } from '../scenes/ar-scene';
import { ArrowLeft, RotateCw, ZoomIn, ZoomOut, Camera } from 'lucide-react';

export function ArPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [modelUrl] = useState('https://cdn.presisso.studio/models/cocina-minimal-001.glb');

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        await load8thWall();
        if (!mounted || !canvasRef.current) return;
        arRef.current = await createArScene(canvasRef.current, modelUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error inicializando AR:', err);
      }
    }
    init();
    return () => {
      mounted = false;
      arRef.current?.dispose();
    };
  }, [modelUrl]);

  const handleCapture = async () => {
    if (!arRef.current) return;
    const photo = await arRef.current.capturePhoto();
    // Descargar o guardar la foto
    const link = document.createElement('a');
    link.href = photo;
    link.download = `presisso-ar-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-3 border-presisso-red border-t-transparent rounded-full mx-auto mb-4" />
            <p>Cargando experiencia AR...</p>
            <p className="text-sm text-white/60 mt-1">Permití el acceso a la cámara</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/90 rounded-full shadow-lg">
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => arRef.current?.rotateModel(45)}
          className="p-3 bg-white/90 rounded-full shadow-lg"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={() => arRef.current?.scaleModel(1.2)}
          className="p-3 bg-white/90 rounded-full shadow-lg"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => arRef.current?.scaleModel(0.8)}
          className="p-3 bg-white/90 rounded-full shadow-lg"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleCapture}
          className="p-4 bg-presisso-red rounded-full shadow-lg text-white"
        >
          <Camera size={24} />
        </button>
      </div>

      {/* Instruction overlay */}
      {!loading && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
          Tocá el piso para colocar el mueble
        </div>
      )}
    </div>
  );
}
```

---

## 5. Requisitos para Testing AR

- iPhone con iOS 15+ (Safari)
- Android con Chrome 90+
- HTTPS obligatorio (8thWall requiere contexto seguro para cámara)
- En desarrollo: `localhost` funciona sin HTTPS
- Probar en mínimo 3 dispositivos diferentes antes de la expo

---

## Siguiente paso → `12-ASISTENTE-IA-CLAUDE.md`
