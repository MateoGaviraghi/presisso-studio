# 13 — PDF Export (Puppeteer + Template Branded)

> **Sprint**: 3 (Día 16-19)
> **Dependencias**: `04-API-BACKEND.md`, `07-EDITOR-3D.md`
> **Resultado**: Propuesta comercial PDF con branding Presisso, screenshot del editor y lista de productos
> **Skills a leer antes de implementar**: `pdf`, `frontend-design`, `webapp-testing`

---

## 1. Instalación de Puppeteer

```bash
cd apps/api
pnpm add puppeteer
```

**Nota para deploy:** En Railway/Docker, Puppeteer necesita Chromium. Usar la imagen `ghcr.io/puppeteer/puppeteer:latest` o instalar dependencias del sistema.

---

## 2. PDF Service

```typescript
// apps/api/src/services/pdf.service.ts
import puppeteer from 'puppeteer';
import { db } from '../db/index.js';
import { projects, projectItems, products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { uploadFile } from './s3.service.js';

export async function generateProjectPdf(
  projectId: string,
  screenshotBase64?: string,
): Promise<string> {
  // 1. Obtener datos del proyecto
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      items: { with: { product: true } },
      user: true,
    },
  });

  if (!project) throw new Error('Proyecto no encontrado');

  // 2. Construir HTML de la propuesta
  const html = buildPdfHtml({
    projectName: project.name,
    clientName: project.user.name,
    clientEmail: project.user.email,
    roomType: project.roomType,
    roomDimensions: {
      width: project.roomWidthCm || '—',
      height: project.roomHeightCm || '—',
      depth: project.roomDepthCm || '—',
    },
    items: project.items.map((item) => ({
      name: item.product.name,
      sku: item.product.sku,
      dimensions: `${item.product.widthCm} × ${item.product.heightCm} × ${item.product.depthCm} cm`,
      material: item.selectedMaterialId
        ? item.product.materials?.find((m: any) => m.id === item.selectedMaterialId)?.name || '—'
        : '—',
      line: item.product.line || '—',
    })),
    screenshotBase64: screenshotBase64 || null,
    generatedAt: new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  });

  // 3. Renderizar con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });

  await browser.close();

  // 4. Subir a S3
  const key = `pdfs/${projectId}/propuesta-${Date.now()}.pdf`;
  const url = await uploadFile(key, Buffer.from(pdfBuffer), 'application/pdf');

  return url;
}

function buildPdfHtml(data: {
  projectName: string;
  clientName: string;
  clientEmail: string;
  roomType: string;
  roomDimensions: { width: string; height: string; depth: string };
  items: Array<{ name: string; sku: string; dimensions: string; material: string; line: string }>;
  screenshotBase64: string | null;
  generatedAt: string;
}): string {
  const roomLabels: Record<string, string> = {
    kitchen: 'Cocina',
    living: 'Living',
    bedroom: 'Dormitorio',
    dining: 'Comedor',
    bathroom: 'Baño',
    office: 'Oficina',
    other: 'Otro',
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #333333; }

    .cover {
      height: 297mm; width: 210mm; background: #1A1A1A;
      display: flex; flex-direction: column; justify-content: center;
      align-items: center; color: white; text-align: center;
      page-break-after: always;
    }
    .cover h1 {
      font-family: 'Playfair Display', serif; font-size: 42px;
      font-weight: 700; letter-spacing: 4px;
    }
    .cover .gold { color: #D42B2B; }
    .cover .subtitle {
      font-size: 16px; color: rgba(255,255,255,0.6);
      margin-top: 16px; letter-spacing: 2px;
    }
    .cover .client-info {
      margin-top: 60px; font-size: 14px; color: rgba(255,255,255,0.5);
    }
    .cover .client-info strong { color: #D42B2B; display: block; font-size: 20px; margin-bottom: 4px; }
    .cover .divider { width: 60px; height: 2px; background: #D42B2B; margin: 40px auto; }

    .page {
      padding: 20mm; min-height: 297mm; position: relative;
      page-break-after: always;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid #D42B2B; padding-bottom: 12px; margin-bottom: 30px;
    }
    .header .brand { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
    .header .brand .gold { color: #D42B2B; }
    .header .date { font-size: 11px; color: #888; }

    h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1A1A1A; }
    h3 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; color: #D42B2B; text-transform: uppercase; letter-spacing: 1px; }

    .screenshot {
      width: 100%; border-radius: 12px; border: 1px solid #E5E5E5;
      margin: 16px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;
    }
    .info-card {
      background: #F5F5F3; border-radius: 8px; padding: 14px;
      border-left: 3px solid #D42B2B;
    }
    .info-card label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .info-card p { font-size: 15px; font-weight: 500; margin-top: 4px; }

    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1A1A1A; color: white; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 10px 14px; border-bottom: 1px solid #E5E5E5; font-size: 13px; }
    tr:nth-child(even) td { background: #FAFAF8; }

    .footer {
      position: absolute; bottom: 15mm; left: 20mm; right: 20mm;
      text-align: center; font-size: 10px; color: #AAA;
      border-top: 1px solid #E5E5E5; padding-top: 10px;
    }
    .footer a { color: #C4A35A; text-decoration: none; }
  </style>
</head>
<body>
  <!-- PORTADA -->
  <div class="cover">
    <h1>PRESISSO <span class="gold">STUDIO</span></h1>
    <p class="subtitle">PROPUESTA COMERCIAL</p>
    <div class="divider"></div>
    <div class="client-info">
      <strong>${data.clientName}</strong>
      ${data.clientEmail}
    </div>
    <p style="margin-top:80px;font-size:12px;color:rgba(255,255,255,0.3);">
      ${data.generatedAt}
    </p>
  </div>

  <!-- CONTENIDO -->
  <div class="page">
    <div class="header">
      <div class="brand">PRESISSO <span class="gold">STUDIO</span></div>
      <div class="date">${data.generatedAt}</div>
    </div>

    <h2>Diseño del ambiente</h2>

    ${data.screenshotBase64 ? `<img src="${data.screenshotBase64}" class="screenshot" alt="Vista del diseño" />` : ''}

    <h3>Datos del espacio</h3>
    <div class="info-grid">
      <div class="info-card">
        <label>Ambiente</label>
        <p>${roomLabels[data.roomType] || data.roomType}</p>
      </div>
      <div class="info-card">
        <label>Medidas</label>
        <p>${data.roomDimensions.width} × ${data.roomDimensions.height} × ${data.roomDimensions.depth} cm</p>
      </div>
      <div class="info-card">
        <label>Cliente</label>
        <p>${data.clientName}</p>
      </div>
      <div class="info-card">
        <label>Productos seleccionados</label>
        <p>${data.items.length} items</p>
      </div>
    </div>

    <h3>Productos incluidos</h3>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>SKU</th>
          <th>Dimensiones</th>
          <th>Material</th>
          <th>Línea</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${item.sku}</td>
          <td>${item.dimensions}</td>
          <td>${item.material}</td>
          <td>${item.line}</td>
        </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <div class="footer">
      <strong>Presisso Muebles</strong> — Amoblamientos Premium<br>
      <a href="https://presisso.studio">presisso.studio</a> — Documento generado automáticamente
    </div>
  </div>
</body>
</html>`;
}
```

---

## 3. PDF Route

```typescript
// apps/api/src/routes/pdf.routes.ts
import { FastifyInstance } from 'fastify';
import { authGuard } from '../middleware/auth.middleware.js';
import { generateProjectPdf } from '../services/pdf.service.js';

export async function pdfRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/generate/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { screenshotBase64 } = (request.body as any) || {};

    const pdfUrl = await generateProjectPdf(projectId, screenshotBase64);
    return { url: pdfUrl };
  });
}
```

---

## Siguiente paso → `14-DEPLOY-PRODUCCION.md`
