# 07 — Editor 3D (Babylon.js)

> **Sprint**: 1-2 (Día 5-11)
> **Dependencias**: `06-FRONTEND-BASE.md`, `05-STORAGE-CDN.md`
> **Resultado**: Scene 3D funcional con carga de modelos GLB, cámara interactiva, iluminación PBR y grid

---

## 1. Instalación de Babylon.js

```bash
cd apps/web
pnpm add @babylonjs/core @babylonjs/loaders @babylonjs/materials @babylonjs/gui @babylonjs/inspector
```

**Módulos de Babylon.js y para qué sirven:**

| Módulo | Uso en Presisso |
|--------|-----------------|
| `@babylonjs/core` | Engine, Scene, Camera, Lights, Mesh |
| `@babylonjs/loaders` | Carga de archivos GLTF/GLB |
| `@babylonjs/materials` | Materiales PBR, GridMaterial |
| `@babylonjs/gui` | UI superpuesta en la escena 3D (labels, botones) |
| `@babylonjs/inspector` | Debug tool (solo en dev) |

---

## 2. Componente React Canvas

```tsx
// apps/web/src/components/editor/SceneCanvas.tsx
import { useEffect, useRef } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { createEditorScene } from '../../scenes/editor-scene';
import { useEditorStore } from '../../stores/editor-store';

interface SceneCanvasProps {
  className?: string;
}

export function SceneCanvas({ className }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crear engine con antialiasing
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,  // Necesario para screenshot → PDF
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    // Crear la escena del editor
    const { scene, dispose } = createEditorScene(engine, canvas);

    // Render loop
    engine.runRenderLoop(() => scene.render());

    // Resize handler
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', outline: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
```

---

## 3. Scene del Editor (módulo principal)

```typescript
// apps/web/src/scenes/editor-scene.ts
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';  // IMPORTANTE: registrar el loader de GLTF

import { useEditorStore } from '../stores/editor-store';

export function createEditorScene(engine: Engine, canvas: HTMLCanvasElement) {
  const scene = new Scene(engine);

  // === BACKGROUND ===
  scene.clearColor = new Color4(0.95, 0.94, 0.92, 1); // Cream de Presisso

  // === CÁMARA ===
  const camera = new ArcRotateCamera(
    'editorCamera',
    -Math.PI / 4,    // alpha (rotación horizontal)
    Math.PI / 3,     // beta (elevación)
    8,               // radius (distancia)
    new Vector3(0, 1, 0), // target (centro de la escena)
    scene,
  );
  camera.lowerBetaLimit = 0.1;           // No dejar que baje debajo del piso
  camera.upperBetaLimit = Math.PI / 2.2; // No invertir
  camera.lowerRadiusLimit = 2;           // Zoom mínimo
  camera.upperRadiusLimit = 20;          // Zoom máximo
  camera.wheelDeltaPercentage = 0.01;    // Velocidad de zoom
  camera.panningSensibility = 100;       // Velocidad de pan
  camera.attachControl(canvas, true);

  // === ILUMINACIÓN PBR ===
  // Luz ambiental (llena sombras suavemente)
  const ambientLight = new HemisphericLight(
    'ambientLight',
    new Vector3(0, 1, 0),
    scene,
  );
  ambientLight.intensity = 0.6;
  ambientLight.groundColor = new Color3(0.8, 0.78, 0.75);

  // Luz direccional principal (sol simulado)
  const dirLight = new DirectionalLight(
    'dirLight',
    new Vector3(-1, -2, -1).normalize(),
    scene,
  );
  dirLight.position = new Vector3(5, 10, 5);
  dirLight.intensity = 0.8;

  // === SOMBRAS ===
  const shadowGen = new ShadowGenerator(1024, dirLight);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;
  shadowGen.setDarkness(0.4);

  // === GRID DEL PISO ===
  const ground = MeshBuilder.CreateGround('ground', {
    width: 20,
    height: 20,
    subdivisions: 1,
  }, scene);
  ground.receiveShadows = true;

  const gridMaterial = new GridMaterial('gridMat', scene);
  gridMaterial.majorUnitFrequency = 1;     // Línea gruesa cada 1m
  gridMaterial.minorUnitVisibility = 0.3;
  gridMaterial.gridRatio = 1;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new Color3(0.85, 0.84, 0.82);
  gridMaterial.lineColor = new Color3(0.7, 0.68, 0.65);
  gridMaterial.opacity = 0.8;
  ground.material = gridMaterial;

  // === ENVIRONMENT TEXTURE (iluminación basada en imagen) ===
  // Esto le da reflejos realistas a los materiales PBR de los modelos
  scene.createDefaultEnvironment({
    createSkybox: false,
    createGround: false,
    environmentTexture: undefined, // Usar la default de Babylon
  });

  // === API PARA CARGAR MODELOS ===
  const loadedMeshes = new Map<string, any>();

  async function loadModel(itemId: string, modelUrl: string, position: Vector3): Promise<void> {
    const result = await SceneLoader.ImportMeshAsync('', modelUrl, '', scene);

    // El root mesh del modelo importado
    const root = result.meshes[0];
    root.name = `item_${itemId}`;
    root.position = position;

    // Habilitar sombras en todos los meshes hijos
    result.meshes.forEach(mesh => {
      if (mesh !== root) {
        shadowGen.addShadowCaster(mesh);
        mesh.receiveShadows = true;
      }
    });

    loadedMeshes.set(itemId, root);
    return;
  }

  function removeModel(itemId: string): void {
    const mesh = loadedMeshes.get(itemId);
    if (mesh) {
      mesh.dispose();
      loadedMeshes.delete(itemId);
    }
  }

  function getModel(itemId: string) {
    return loadedMeshes.get(itemId) || null;
  }

  // === SCREENSHOT para PDF ===
  async function takeScreenshot(width = 1920, height = 1080): Promise<string> {
    return new Promise((resolve) => {
      scene.getEngine().onEndFrameObservable.addOnce(() => {
        const screenshot = scene.getEngine().getRenderingCanvas()?.toDataURL('image/png');
        resolve(screenshot || '');
      });
    });
  }

  // Exponer funciones al store o via ref
  (window as any).__editorScene = {
    scene,
    camera,
    loadModel,
    removeModel,
    getModel,
    takeScreenshot,
    loadedMeshes,
  };

  const dispose = () => {
    loadedMeshes.forEach((mesh) => mesh.dispose());
    loadedMeshes.clear();
    scene.dispose();
    delete (window as any).__editorScene;
  };

  return { scene, dispose };
}
```

---

## 4. Carga de Modelos GLB desde el Catálogo

```typescript
// apps/web/src/hooks/use-editor.ts
import { useCallback } from 'react';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { useEditorStore } from '../stores/editor-store';
import { api } from '../services/api-client';

export function useEditor() {
  const { addItem, removeItem, items, projectId } = useEditorStore();

  const addProductToScene = useCallback(async (product: {
    id: string;
    name: string;
    modelUrl: string;
  }) => {
    const scene = (window as any).__editorScene;
    if (!scene) return;

    const itemId = crypto.randomUUID();
    const position = new Vector3(0, 0, 0); // Centro de la escena

    // Cargar modelo 3D
    await scene.loadModel(itemId, product.modelUrl, position);

    // Agregar al store
    addItem({
      id: itemId,
      productId: product.id,
      productName: product.name,
      modelUrl: product.modelUrl,
      position: { x: 0, y: 0, z: 0 },
      rotationY: 0,
      scale: 1,
    });

    // Persistir en backend
    if (projectId) {
      await api.post(`/projects/${projectId}/items`, {
        productId: product.id,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
      });
    }
  }, [addItem, projectId]);

  const removeProductFromScene = useCallback(async (itemId: string) => {
    const scene = (window as any).__editorScene;
    if (scene) scene.removeModel(itemId);
    removeItem(itemId);

    if (projectId) {
      await api.delete(`/projects/${projectId}/items/${itemId}`);
    }
  }, [removeItem, projectId]);

  return { addProductToScene, removeProductFromScene, items };
}
```

---

## 5. Background Image (foto del espacio)

```typescript
// En editor-scene.ts — agregar función:
function setBackgroundImage(imageUrl: string): void {
  // Crear un plano grande detrás de la escena como fondo
  const bgPlane = MeshBuilder.CreatePlane('backgroundPlane', {
    width: 16,    // Ajustar según aspect ratio de la foto
    height: 9,
  }, scene);
  bgPlane.position = new Vector3(0, 4.5, 10); // Detrás del centro
  bgPlane.isPickable = false;

  const bgMaterial = new StandardMaterial('bgMaterial', scene);
  bgMaterial.diffuseTexture = new Texture(imageUrl, scene);
  bgMaterial.emissiveTexture = new Texture(imageUrl, scene); // Sin afectar por luces
  bgMaterial.disableLighting = true;
  bgMaterial.backFaceCulling = false;
  bgPlane.material = bgMaterial;
}
```

---

## 6. Inspector (solo desarrollo)

```typescript
// En editor-scene.ts, al final del setup:
if (import.meta.env.DEV) {
  import('@babylonjs/inspector').then(() => {
    // Activar con Ctrl+Shift+I
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show({ embedMode: true });
        }
      }
    });
  });
}
```

---

## Siguiente paso → `08-CATALOGO-PRODUCTOS.md`
