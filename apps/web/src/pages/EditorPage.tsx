import { useParams } from 'react-router-dom';
import { Box } from 'lucide-react';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-tertiary">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mx-auto">
          <Box className="w-6 h-6 text-presisso-red" />
        </div>
        <h2 className="text-lg font-semibold text-presisso-charcoal">Editor 3D</h2>
        <p className="text-[14px] text-presisso-gray">Proyecto: {projectId ?? 'nuevo'}</p>
        <p className="text-[12px] text-presisso-gray/50">
          En construcción — Babylon.js scene se montará aquí
        </p>
      </div>
    </div>
  );
}
