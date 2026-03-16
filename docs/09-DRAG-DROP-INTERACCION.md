# 09 — Drag & Drop, Rotación y Escala (Interacción 3D)

> **Sprint**: 2 (Día 8-11)
> **Dependencias**: `07-EDITOR-3D.md`
> **Resultado**: Muebles movibles, rotables y escalables en la escena 3D con gizmos visuales

---

## 1. PointerDragBehavior (mover muebles)

```typescript
// apps/web/src/scenes/interaction-manager.ts
import { Scene } from '@babylonjs/core/scene';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilityLayerRenderer';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { useEditorStore } from '../stores/editor-store';

export class InteractionManager {
  private scene: Scene;
  private gizmoManager: GizmoManager;
  private highlightLayer: HighlightLayer;
  private selectedMesh: AbstractMesh | null = null;
  private snapDistance = 0.1; // Snap cada 10cm

  constructor(scene: Scene) {
    this.scene = scene;

    // Highlight de selección
    this.highlightLayer = new HighlightLayer('selectionHighlight', scene);
    this.highlightLayer.outerGlow = true;
    this.highlightLayer.innerGlow = false;

    // Gizmo manager para rotación y escala
    this.gizmoManager = new GizmoManager(scene);
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
    this.gizmoManager.boundingBoxGizmoEnabled = false;

    // Click para seleccionar
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === 2) { // PointerUp
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult?.hit && pickResult.pickedMesh) {
          const root = this.findRootMesh(pickResult.pickedMesh);
          if (root?.name.startsWith('item_')) {
            this.selectMesh(root);
          }
        } else {
          this.deselectAll();
        }
      }
    });
  }

  // Encontrar el mesh raíz del modelo (el parent más alto con nombre item_)
  private findRootMesh(mesh: AbstractMesh): AbstractMesh | null {
    let current: AbstractMesh | null = mesh;
    while (current) {
      if (current.name.startsWith('item_')) return current;
      current = current.parent as AbstractMesh | null;
    }
    return null;
  }

  // Seleccionar un mueble
  selectMesh(mesh: AbstractMesh) {
    this.deselectAll();
    this.selectedMesh = mesh;

    // Highlight visual (borde dorado)
    mesh.getChildMeshes().forEach(child => {
      this.highlightLayer.addMesh(child, new Color3(0.77, 0.64, 0.35)); // Gold
    });

    // Activar drag en el piso (solo XZ, mantener Y)
    const dragBehavior = new PointerDragBehavior({
      dragPlaneNormal: new Vector3(0, 1, 0), // Plano horizontal
    });
    dragBehavior.useObjectOrientationForDragging = false;

    // Snapping a grid
    dragBehavior.onDragObservable.add(() => {
      if (this.snapDistance > 0) {
        mesh.position.x = Math.round(mesh.position.x / this.snapDistance) * this.snapDistance;
        mesh.position.z = Math.round(mesh.position.z / this.snapDistance) * this.snapDistance;
      }
    });

    // Persistir posición al soltar
    dragBehavior.onDragEndObservable.add(() => {
      const itemId = mesh.name.replace('item_', '');
      useEditorStore.getState().updateItemTransform(itemId, {
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      });
    });

    mesh.addBehavior(dragBehavior);

    // Notificar al store
    const itemId = mesh.name.replace('item_', '');
    useEditorStore.getState().selectItem(itemId);
  }

  deselectAll() {
    if (this.selectedMesh) {
      this.highlightLayer.removeAllMeshes();
      // Remover drag behaviors
      this.selectedMesh.behaviors
        .filter(b => b instanceof PointerDragBehavior)
        .forEach(b => this.selectedMesh!.removeBehavior(b));
      this.selectedMesh = null;
    }
    this.gizmoManager.attachToMesh(null);
    useEditorStore.getState().selectItem(null);
  }

  // Rotar el mueble seleccionado (en grados)
  rotateSelected(deltaDegreesY: number) {
    if (!this.selectedMesh) return;
    this.selectedMesh.rotation.y += (deltaDegreesY * Math.PI) / 180;
    const itemId = this.selectedMesh.name.replace('item_', '');
    useEditorStore.getState().updateItemTransform(itemId, {
      rotationY: (this.selectedMesh.rotation.y * 180) / Math.PI,
    });
  }

  // Escalar el mueble seleccionado
  scaleSelected(factor: number) {
    if (!this.selectedMesh) return;
    const newScale = Math.max(0.5, Math.min(2.0, this.selectedMesh.scaling.x * factor));
    this.selectedMesh.scaling.setAll(newScale);
    const itemId = this.selectedMesh.name.replace('item_', '');
    useEditorStore.getState().updateItemTransform(itemId, { scale: newScale });
  }

  // Activar modo de gizmo de rotación
  enableRotationGizmo() {
    if (!this.selectedMesh) return;
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = true;
    this.gizmoManager.attachToMesh(this.selectedMesh);
  }

  setSnapDistance(distance: number) {
    this.snapDistance = distance;
  }

  deleteSelected() {
    if (!this.selectedMesh) return;
    const itemId = this.selectedMesh.name.replace('item_', '');
    this.selectedMesh.dispose();
    this.selectedMesh = null;
    useEditorStore.getState().removeItem(itemId);
  }

  dispose() {
    this.highlightLayer.dispose();
    this.gizmoManager.dispose();
  }
}
```

---

## 2. Toolbar del Editor

```tsx
// apps/web/src/components/editor/EditorToolbar.tsx
import { RotateCw, ZoomIn, ZoomOut, Trash2, Grid, RotateCcw, Save } from 'lucide-react';

interface Props {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onScaleUp: () => void;
  onScaleDown: () => void;
  onDelete: () => void;
  onToggleGrid: () => void;
  onSave: () => void;
  hasSelection: boolean;
}

export function EditorToolbar(props: Props) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-1.5 border border-black/5">
      <ToolButton icon={<RotateCcw size={18} />} label="Rotar -45°" onClick={props.onRotateLeft} disabled={!props.hasSelection} />
      <ToolButton icon={<RotateCw size={18} />} label="Rotar +45°" onClick={props.onRotateRight} disabled={!props.hasSelection} />
      <div className="w-px bg-gray-200 mx-1" />
      <ToolButton icon={<ZoomIn size={18} />} label="Agrandar" onClick={props.onScaleUp} disabled={!props.hasSelection} />
      <ToolButton icon={<ZoomOut size={18} />} label="Achicar" onClick={props.onScaleDown} disabled={!props.hasSelection} />
      <div className="w-px bg-gray-200 mx-1" />
      <ToolButton icon={<Trash2 size={18} />} label="Eliminar" onClick={props.onDelete} disabled={!props.hasSelection} danger />
      <div className="w-px bg-gray-200 mx-1" />
      <ToolButton icon={<Grid size={18} />} label="Grid" onClick={props.onToggleGrid} />
      <ToolButton icon={<Save size={18} />} label="Guardar" onClick={props.onSave} />
    </div>
  );
}

function ToolButton({ icon, label, onClick, disabled, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-2.5 rounded-xl transition-all ${
        disabled ? 'opacity-30 cursor-not-allowed' :
        danger ? 'hover:bg-red-50 text-red-500' :
        'hover:bg-surface-tertiary text-presisso-charcoal'
      }`}
    >
      {icon}
    </button>
  );
}
```

---

## 3. Keyboard Shortcuts

```typescript
// En el setup del editor:
document.addEventListener('keydown', (e) => {
  if (!interactionManager) return;
  switch (e.key) {
    case 'Delete':
    case 'Backspace': interactionManager.deleteSelected(); break;
    case 'r': interactionManager.rotateSelected(45); break;
    case 'e': interactionManager.rotateSelected(-45); break;
    case '+': interactionManager.scaleSelected(1.1); break;
    case '-': interactionManager.scaleSelected(0.9); break;
    case 'Escape': interactionManager.deselectAll(); break;
  }
});
```

---

## Siguiente paso → `10-FOTO-ESPACIO.md`
