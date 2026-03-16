# 05 — Storage y CDN (AWS S3 + CloudFront + Pipeline 3D)

> **Sprint**: 1 (Día 3-5)
> **Dependencias**: `01-SETUP-ENTORNO.md`
> **Resultado**: S3 bucket configurado, CDN activo, pipeline de modelos 3D funcional

---

## 1. Configuración AWS S3

### 1.1 Crear bucket

```bash
# Via AWS CLI
aws s3 mb s3://presisso-studio-assets --region us-east-1
```

### 1.2 Estructura del bucket

```
presisso-studio-assets/
├── models/              ← Modelos GLB/GLTF optimizados
│   ├── cocina-minimal-001.glb
│   ├── alacena-premium-002.glb
│   └── ...
├── thumbnails/          ← Previews de productos (webp)
│   ├── cocina-minimal-001.webp
│   └── ...
├── textures/            ← Texturas PBR para materiales
│   ├── roble-natural-albedo.webp
│   ├── roble-natural-roughness.webp
│   └── ...
├── uploads/             ← Fotos subidas por clientes
│   ├── {userId}/{projectId}/
│   │   └── background.jpg
│   └── ...
└── pdfs/                ← PDFs generados
    └── {projectId}/
        └── propuesta-{timestamp}.pdf
```

### 1.3 CORS policy del bucket

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://presisso.studio"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 2. S3 Service en el Backend

```typescript
// apps/api/src/services/s3.service.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.AWS_S3_BUCKET;

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // 1 año (assets inmutables)
  }));

  return `${env.AWS_CLOUDFRONT_URL}/${key}`;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

---

## 3. Upload Routes

```typescript
// apps/api/src/routes/upload.routes.ts
import { FastifyInstance } from 'fastify';
import { authGuard, requireRole } from '../middleware/auth.middleware.js';
import { uploadFile, getPresignedUploadUrl } from '../services/s3.service.js';
import { randomUUID } from 'crypto';

export async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/upload/image — Subir foto del espacio (multipart)
  app.post('/image', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No se envió archivo' });

    const ext = data.filename.split('.').pop() || 'jpg';
    const key = `uploads/${request.user!.sub}/${randomUUID()}.${ext}`;
    const buffer = await data.toBuffer();
    const url = await uploadFile(key, buffer, data.mimetype);

    return { url, key };
  });

  // POST /api/upload/model — Subir modelo GLB (solo admin)
  app.post('/model', { preHandler: [requireRole('admin')] }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No se envió archivo' });

    const key = `models/${data.filename}`;
    const buffer = await data.toBuffer();
    const url = await uploadFile(key, buffer, 'model/gltf-binary');

    return { url, key, sizeBytes: buffer.length };
  });

  // GET /api/upload/presigned — Obtener URL de subida directa (para archivos grandes)
  app.get('/presigned', async (request) => {
    const { filename, contentType } = request.query as { filename: string; contentType: string };
    const key = `uploads/${request.user!.sub}/${randomUUID()}-${filename}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    return { uploadUrl, key, cdnUrl: `${process.env.AWS_CLOUDFRONT_URL}/${key}` };
  });
}
```

---

## 4. CloudFront CDN

### Configuración recomendada:

- **Origin**: bucket S3 `presisso-studio-assets`
- **Cache Policy**: CachingOptimized (TTL 86400s mínimo)
- **Price Class**: PriceClass_100 (solo NA y EU para costos bajos)
- **Compress objects**: Sí (gzip/brotli)
- **Custom domain**: `cdn.presisso.studio` (con SSL Certificate Manager)

---

## 5. Pipeline de Conversión de Modelos 3D

### SKP (SketchUp) → GLB optimizado

```bash
#!/bin/bash
# infra/scripts/convert-models.sh
# Requiere: Blender 4.x instalado

INPUT_DIR="./raw-models"
OUTPUT_DIR="./optimized-models"
mkdir -p $OUTPUT_DIR

for skp_file in $INPUT_DIR/*.skp; do
  filename=$(basename "$skp_file" .skp)
  echo "Converting: $filename"

  # 1. Importar SKP en Blender y exportar como GLB
  blender --background --python-expr "
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.skp(filepath='${skp_file}')
bpy.ops.export_scene.gltf(
    filepath='${OUTPUT_DIR}/${filename}.glb',
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply_modifiers=True,
    export_image_format='WEBP',
)
"
  echo "Done: ${filename}.glb"
done

# 2. Optimizar con gltf-transform (post-Blender)
npx gltf-transform optimize $OUTPUT_DIR/*.glb --compress draco --texture-compress webp
```

### Optimización adicional con gltf-transform

```bash
# Instalar globalmente
npm install -g @gltf-transform/cli

# Comandos de optimización
gltf-transform optimize input.glb output.glb \
  --compress draco \
  --texture-compress webp \
  --texture-resize 1024

# Verificar tamaño final (target: < 5MB por modelo)
ls -lh output.glb
```

**Targets de tamaño por modelo:**
- Mueble simple (silla, estante): < 2MB
- Mueble mediano (cocina, rack): < 5MB
- Mueble complejo (vestidor, isla): < 8MB

---

## Siguiente paso → `06-FRONTEND-BASE.md`
