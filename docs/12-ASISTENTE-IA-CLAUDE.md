# 12 — Asistente IA (Claude API — Anthropic)

> **Sprint**: 2 (Día 13-16)
> **Dependencias**: `04-API-BACKEND.md`, `06-FRONTEND-BASE.md`
> **Resultado**: Chat inteligente en el configurador que sugiere productos y guía al cliente

---

## 1. Arquitectura del Asistente

```
Frontend (ChatPanel)
  │
  ├─ POST /api/chat { message, projectId }
  │
Backend (chat.routes.ts)
  │
  ├─ Obtener contexto del proyecto (items, medidas, usuario)
  ├─ Obtener catálogo de productos disponibles
  ├─ Construir system prompt dinámico
  ├─ Llamar a Claude API con streaming
  │
  └─ Stream response → Frontend (renderizar token por token)
```

**Regla fundamental: la API key de Claude NUNCA va al frontend.** Todas las llamadas pasan por el backend.

---

## 2. Claude Service (Backend)

```typescript
// apps/api/src/services/claude.service.ts
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { products, projects, projectItems } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// System prompt base del asistente
function buildSystemPrompt(context: {
  catalogProducts: any[];
  projectItems: any[];
  roomDimensions: { width: string; height: string; depth: string } | null;
  roomType: string;
  userName: string;
  userRole: string;
}): string {
  const productList = context.catalogProducts.map(p =>
    `- ${p.name} (SKU: ${p.sku}) | ${p.category} | ${p.widthCm}×${p.heightCm}×${p.depthCm}cm | Materiales: ${p.materials?.map((m: any) => m.name).join(', ') || 'N/A'}`
  ).join('\n');

  const currentItems = context.projectItems.length > 0
    ? context.projectItems.map(item =>
        `- ${item.product.name} (posición: ${item.positionX},${item.positionY},${item.positionZ})`
      ).join('\n')
    : 'Ninguno todavía.';

  const roomInfo = context.roomDimensions
    ? `${context.roomDimensions.width}cm ancho × ${context.roomDimensions.height}cm alto × ${context.roomDimensions.depth}cm profundidad`
    : 'No especificadas todavía.';

  return `Sos "Studio", el asistente de diseño de interiores de Presisso Muebles, una empresa premium de amoblamientos de Argentina.

## Tu personalidad
- Hablás en español argentino (usás "vos" en lugar de "tú", "dale" como confirmación)
- Sos cálido, profesional y conocedor del diseño de interiores
- Sugerís con confianza pero sin ser invasivo
- Si no sabés algo, lo decís honestamente

## Catálogo actual de productos Presisso
${productList}

## Proyecto actual del cliente
- Cliente: ${context.userName}
- Tipo de ambiente: ${context.roomType}
- Medidas del espacio: ${roomInfo}
- Productos ya colocados en el editor:
${currentItems}

## Reglas estrictas
1. SOLO podés recomendar productos que están en el catálogo de arriba. NUNCA inventes productos.
2. Si te preguntan el precio exacto, respondé: "Los precios finales los gestiona tu vendedor de Presisso, pero con gusto te ayudo a elegir."
3. Si te preguntan cómo usar el editor, explicá paso a paso: seleccionar producto → arrastrarlo → rotarlo → ajustar escala.
4. Si te preguntan sobre AR, explicá: "Tocá el botón de AR, permití la cámara y apuntá al piso. Tocá donde quieras colocar el mueble."
5. Cuando sugierás combinaciones, basate en las medidas del espacio y los productos ya colocados.
6. Respondé de forma concisa (máximo 3 párrafos). No seas verborrágico.
7. Si el perfil del usuario es "vendor", podés dar información más técnica sobre materiales y dimensiones.`;
}

// Función principal: chat con streaming
export async function chatWithClaude(params: {
  projectId: string;
  userId: string;
  userRole: string;
  message: string;
}): Promise<AsyncIterable<string>> {
  // 1. Obtener contexto del proyecto
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, params.projectId),
    with: {
      items: { with: { product: true } },
      user: true,
    },
  });

  // 2. Obtener catálogo completo
  const catalogProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
  });

  // 3. Obtener historial de chat (últimos 10 mensajes para contexto)
  const history = await db.query.chatMessages.findMany({
    where: eq(chatMessages.projectId, params.projectId),
    orderBy: [desc(chatMessages.createdAt)],
    limit: 10,
  });

  // 4. Construir system prompt
  const systemPrompt = buildSystemPrompt({
    catalogProducts,
    projectItems: project?.items || [],
    roomDimensions: project ? {
      width: project.roomWidthCm || '0',
      height: project.roomHeightCm || '0',
      depth: project.roomDepthCm || '0',
    } : null,
    roomType: project?.roomType || 'kitchen',
    userName: project?.user?.name || 'Cliente',
    userRole: params.userRole,
  });

  // 5. Construir mensajes (historial + nuevo mensaje)
  const messages = [
    ...history.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: params.message },
  ];

  // 6. Llamar a Claude API con streaming
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return stream;
}
```

---

## 3. Chat Route con Streaming (SSE)

```typescript
// apps/api/src/routes/chat.routes.ts
import { FastifyInstance } from 'fastify';
import { authGuard } from '../middleware/auth.middleware.js';
import { chatWithClaude } from '../services/claude.service.js';
import { db } from '../db/index.js';
import { chatMessages } from '../db/schema.js';

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/chat — Enviar mensaje (streaming SSE)
  app.post('/', async (request, reply) => {
    const { message, projectId } = request.body as { message: string; projectId: string };
    const userId = request.user!.sub;

    // Guardar mensaje del usuario
    await db.insert(chatMessages).values({
      projectId,
      userId,
      role: 'user',
      content: message,
    });

    // Configurar SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      const stream = await chatWithClaude({
        projectId,
        userId,
        userRole: request.user!.role,
        message,
      });

      let fullResponse = '';

      // Iterar sobre el stream de Claude
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          reply.raw.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
        }
      }

      // Guardar respuesta completa
      await db.insert(chatMessages).values({
        projectId,
        userId,
        role: 'assistant',
        content: fullResponse,
        modelUsed: 'claude-sonnet-4-20250514',
      });

      reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      reply.raw.end();
    } catch (error) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', message: 'Error al procesar tu mensaje' })}\n\n`);
      reply.raw.end();
    }
  });

  // GET /api/chat/:projectId/history
  app.get('/:projectId/history', async (request) => {
    const { projectId } = request.params as { projectId: string };
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.projectId, projectId),
      orderBy: [asc(chatMessages.createdAt)],
      limit: 50,
    });
    return { messages };
  });
}
```

---

## 4. Chat UI (Frontend)

```tsx
// apps/web/src/components/chat/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../stores/editor-store';
import { api } from '../../services/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { projectId } = useEditorStore();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !projectId) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Crear placeholder para la respuesta
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ message: input, projectId }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              setMessages(prev =>
                prev.map(m => m.id === assistantId
                  ? { ...m, content: m.content + data.text }
                  : m
                )
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-black/5">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-presisso-gold/10 flex items-center justify-center">
          <Sparkles size={16} className="text-presisso-gold" />
        </div>
        <div>
          <p className="text-sm font-medium">Studio</p>
          <p className="text-xs text-gray-400">Asistente de diseño Presisso</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Sparkles className="mx-auto mb-3" size={32} />
            <p className="text-sm">¡Hola! Soy Studio, tu asistente de diseño.</p>
            <p className="text-xs mt-1">Preguntame sobre productos, materiales o cómo usar el editor.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-presisso-dark text-white' : 'bg-presisso-gold/10 text-presisso-gold'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-presisso-dark text-white rounded-tr-md'
                : 'bg-surface-tertiary text-gray-700 rounded-tl-md'
            }`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Preguntale a Studio..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-presisso-gold outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="p-2.5 bg-presisso-gold text-white rounded-xl disabled:opacity-50 hover:bg-presisso-gold/90"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Siguiente paso → `13-PDF-EXPORT.md`
