import { useParams } from 'react-router-dom';
import { Smartphone } from 'lucide-react';

export function ArPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-tertiary">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mx-auto">
          <Smartphone className="w-6 h-6 text-presisso-red" />
        </div>
        <h2 className="text-lg font-semibold text-presisso-charcoal">Realidad Aumentada</h2>
        <p className="text-[14px] text-presisso-gray">Proyecto: {projectId ?? '—'}</p>
        <p className="text-[12px] text-presisso-gray/50">
          En construcción — 8thWall se integrará aquí
        </p>
      </div>
    </div>
  );
}
