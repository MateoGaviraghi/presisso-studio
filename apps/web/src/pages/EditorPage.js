import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { Box } from 'lucide-react';
export function EditorPage() {
    const { projectId } = useParams();
    return (_jsx("div", { className: "flex-1 flex items-center justify-center bg-surface-tertiary", children: _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-presisso-red-light flex items-center justify-center mx-auto", children: _jsx(Box, { className: "w-6 h-6 text-presisso-red" }) }), _jsx("h2", { className: "text-lg font-semibold text-presisso-charcoal", children: "Editor 3D" }), _jsxs("p", { className: "text-[14px] text-presisso-gray", children: ["Proyecto: ", projectId ?? 'nuevo'] }), _jsx("p", { className: "text-[12px] text-presisso-gray/50", children: "En construcci\u00F3n \u2014 Babylon.js scene se montar\u00E1 aqu\u00ED" })] }) }));
}
