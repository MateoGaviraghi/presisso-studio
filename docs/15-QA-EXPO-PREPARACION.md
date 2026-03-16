# 15 — QA, Testing y Preparación para la Expo

> **Sprint**: 3 (Día 20-28)
> **Dependencias**: Todo lo anterior deployado
> **Resultado**: Sistema testeado, datos de demo cargados, plan de contingencia listo
> **Skills a leer antes de implementar**: `webapp-testing`, `web-design-guidelines`

---

## 1. Matriz de Testing por Flujo

Cada flujo debe pasar **10 veces sin error** antes de considerarse listo.

### Flujo 1: Registro y Login

| #   | Paso                       | Resultado esperado                        | ✅  |
| --- | -------------------------- | ----------------------------------------- | --- |
| 1   | Abrir presisso.studio      | Landing/login carga < 3s                  |     |
| 2   | Registrarse con email      | Usuario creado, redirect a dashboard      |     |
| 3   | Cerrar sesión              | Redirect a login                          |     |
| 4   | Login con email + password | Token recibido, dashboard carga           |     |
| 5   | Login con Google           | OAuth flow completo, redirect a dashboard |     |
| 6   | Token expirado             | Redirect automático a login               |     |

### Flujo 2: Editor 3D + Catálogo

| #   | Paso                          | Resultado esperado                     | ✅  |
| --- | ----------------------------- | -------------------------------------- | --- |
| 1   | Crear nuevo proyecto          | Proyecto creado, editor vacío abre     |     |
| 2   | Abrir catálogo                | Grid de productos carga con thumbnails |     |
| 3   | Filtrar por ambiente "Cocina" | Solo productos de cocina               |     |
| 4   | Agregar producto al editor    | Modelo GLB carga y aparece en escena   |     |
| 5   | Mover mueble (drag)           | Se mueve suavemente en el plano XZ     |     |
| 6   | Rotar mueble (R / botón)      | Rota 45° correctamente                 |     |
| 7   | Escalar mueble (+/-)          | Escala proporcional                    |     |
| 8   | Eliminar mueble (Delete)      | Se elimina de escena y de lista        |     |
| 9   | Agregar 3+ muebles            | Performance fluida (>30 FPS)           |     |
| 10  | Zoom / pan cámara             | Smooth, sin clipping                   |     |

### Flujo 3: Foto del Espacio

| #   | Paso                             | Resultado esperado                 | ✅  |
| --- | -------------------------------- | ---------------------------------- | --- |
| 1   | Click "Subir foto"               | File picker abre                   |     |
| 2   | Subir JPG < 10MB                 | Upload, preview aparece            |     |
| 3   | Foto como fondo del editor       | Imagen se ve detrás de los muebles |     |
| 4   | Ingresar medidas (300×260×400cm) | Grid se ajusta a las medidas       |     |
| 5   | Agregar mueble sobre la foto     | Mueble se superpone correctamente  |     |

### Flujo 4: Realidad Aumentada

| #   | Paso               | Resultado esperado                | ✅  |
| --- | ------------------ | --------------------------------- | --- |
| 1   | Abrir modo AR      | Pide permiso de cámara            |     |
| 2   | Aceptar permiso    | Feed de cámara se ve              |     |
| 3   | Apuntar al piso    | Surface detection funciona        |     |
| 4   | Tocar pantalla     | Mueble aparece en posición tocada |     |
| 5   | Rotar mueble en AR | Rotación funciona                 |     |
| 6   | Capturar foto      | Imagen se guarda con el mueble    |     |
| 7   | **iPhone Safari**  | Todo lo anterior funciona         |     |
| 8   | **Android Chrome** | Todo lo anterior funciona         |     |

### Flujo 5: Asistente IA

| #   | Paso                                    | Resultado esperado                         | ✅  |
| --- | --------------------------------------- | ------------------------------------------ | --- |
| 1   | Abrir chat                              | Panel de chat vacío con mensaje bienvenida |     |
| 2   | "Qué mueble me recomendás para cocina?" | Responde con productos reales del catálogo |     |
| 3   | "En qué materiales viene?"              | Lista materiales del producto sugerido     |     |
| 4   | "Cómo uso el AR?"                       | Explica paso a paso                        |     |
| 5   | Preguntar precio                        | Derivar a vendedor (no dar número)         |     |
| 6   | Streaming de respuesta                  | Tokens aparecen fluidamente                |     |

### Flujo 6: PDF

| #   | Paso                | Resultado esperado                             | ✅  |
| --- | ------------------- | ---------------------------------------------- | --- |
| 1   | Click "Generar PDF" | Loading state                                  |     |
| 2   | PDF se genera       | Descarga o preview del PDF                     |     |
| 3   | Abrir PDF           | Portada branded + screenshot + tabla productos |     |
| 4   | Verificar datos     | Nombre cliente, productos, medidas correctos   |     |

---

## 2. Cross-Browser Testing

| Navegador        | Desktop  | Mobile     | Prioridad             |
| ---------------- | -------- | ---------- | --------------------- |
| Chrome (latest)  | ✅       | ✅ Android | **CRÍTICO**           |
| Safari (latest)  | ✅ macOS | ✅ iPhone  | **CRÍTICO** (para AR) |
| Firefox (latest) | ✅       | —          | Media                 |
| Edge (latest)    | ✅       | —          | Baja                  |

**Dispositivos mínimos para test AR:**

- iPhone 12 o superior (Safari)
- Samsung Galaxy S21 o similar (Chrome Android)
- Un tercer dispositivo diferente (verificar edge cases)

---

## 3. Performance Benchmarks

| Métrica                      | Target           | Cómo medir           |
| ---------------------------- | ---------------- | -------------------- |
| First Contentful Paint       | < 1.5s           | Lighthouse           |
| Carga del editor 3D          | < 3s             | Performance.now()    |
| Carga de modelo GLB          | < 2s por modelo  | Network tab          |
| FPS del editor con 5 modelos | > 30 FPS         | Babylon.js inspector |
| Respuesta Claude API         | < 3s first token | Network tab          |
| Generación PDF               | < 8s             | API response time    |

---

## 4. Script de Seed para Demo

```typescript
// infra/scripts/seed-demo.ts
// Ejecutar: pnpm tsx infra/scripts/seed-demo.ts

import { db } from '../../apps/api/src/db/index.js';
import { users, projects, projectItems } from '../../apps/api/src/db/schema.js';

async function seedDemo() {
  // 1. Crear usuario demo
  const [demoUser] = await db
    .insert(users)
    .values({
      email: 'demo@presisso.com',
      name: 'Visitante Expo',
      role: 'client',
      passwordHash: await hashPassword('expo2026'),
    })
    .returning();

  // 2. Crear proyecto de ejemplo pre-armado
  const [demoProject] = await db
    .insert(projects)
    .values({
      userId: demoUser.id,
      name: 'Cocina Moderna — Demo Expo',
      roomType: 'kitchen',
      roomWidthCm: '350',
      roomHeightCm: '260',
      roomDepthCm: '450',
      backgroundImageUrl: 'https://cdn.presisso.studio/demo/cocina-fondo.jpg',
      status: 'active',
    })
    .returning();

  // 3. Agregar muebles ya posicionados
  // (los productId deben corresponder a los seeds del catálogo)
  console.log('Demo project created:', demoProject.id);
  console.log('Login: demo@presisso.com / expo2026');
}

seedDemo();
```

---

## 5. Datos Pre-cargados para la Expo

### Fotos de ambientes (subir a S3 antes de la expo):

1. `demo/cocina-moderna.jpg` — Cocina real, buena iluminación
2. `demo/living-amplio.jpg` — Living con espacio vacío visible
3. `demo/dormitorio-master.jpg` — Dormitorio con pared libre
4. `demo/comedor-diario.jpg` — Comedor con mesa existente

### Proyecto de ejemplo pre-armado:

- Cocina con 2-3 muebles ya posicionados sobre la foto
- Listo para mostrar sin tener que armar desde cero

---

## 6. Plan de Contingencia

| Escenario                      | Plan B                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| **Internet cae**               | Video grabado del flujo completo (3 min). Tener en el celular y en un pendrive.         |
| **8thWall no funciona**        | Mostrar solo Modo 1 (foto + 3D). "La AR también funciona pero necesitamos mejor señal." |
| **Claude API no responde**     | Respuestas pre-cacheadas en el frontend para las 5 preguntas más comunes.               |
| **Modelo GLB tarda en cargar** | Modelos pre-cacheados en Service Worker.                                                |
| **Navegador crashea**          | Segundo dispositivo listo con la misma sesión abierta.                                  |
| **PDF no se genera**           | PDF de ejemplo ya generado, listo para mostrar.                                         |

### Video de backup:

Grabar pantalla con OBS o Loom mostrando:

1. Login → Dashboard (10s)
2. Crear proyecto → Subir foto → Editor 3D (30s)
3. Agregar muebles → Drag/rotar (30s)
4. Chat con IA (20s)
5. Modo AR en celular (30s)
6. Generar PDF (20s)

**Total: ~2.5 minutos. Grabar en 1080p.**

---

## 7. Checklist Final Pre-Expo (últimas 72 horas)

### D-3 (3 días antes):

- [ ] Congelar código — NO más deploys después de esto
- [ ] Correr todos los flujos de test 1 vez completa
- [ ] Verificar que los modelos GLB están en CDN y cargan
- [ ] Verificar que Claude API key tiene crédito suficiente
- [ ] Verificar plan de 8thWall activo

### D-2 (2 días antes):

- [ ] Seed de datos demo ejecutado en producción
- [ ] Probar login con usuario demo
- [ ] Probar AR en los 3 dispositivos target
- [ ] Grabar video de backup
- [ ] Configurar hotspot 4G/5G

### D-1 (1 día antes):

- [ ] Cargar batería de todos los dispositivos (notebook + 2 celulares)
- [ ] Verificar que el hotspot funciona
- [ ] Ensayar el flujo de demo 3 veces seguidas
- [ ] Preparar tarjetas/QR con link a la app

### D-0 (día de la expo):

- [ ] Llegar 1h antes para setup
- [ ] Verificar internet del venue + activar hotspot backup
- [ ] Abrir la app en todos los dispositivos
- [ ] Cargar el proyecto demo pre-armado
- [ ] Un run completo del flujo antes de que abran las puertas

---

## 8. Guion de Demo (5 minutos max)

**Minuto 0-1:** "Bienvenido a Presisso Studio. Mirá, ya tenemos la foto de esta cocina cargada. ¿Ves? Es un espacio real."

**Minuto 1-2:** "Ahora le agrego este mueble del catálogo..." [drag & drop] "...y lo puedo mover, rotar, ver cómo queda."

**Minuto 2-3:** "Pero lo mejor es esto:" [sacar celular, abrir AR] "Apuntá la cámara acá al piso..." [mueble aparece] "Está ahí, a escala real."

**Minuto 3-4:** "Y si tenés dudas, le preguntás al asistente:" [escribir en chat] "Te sugiere productos, te explica materiales."

**Minuto 4-5:** "Cuando terminás, generás tu propuesta en PDF:" [click] "Te lo llevás con todos los productos que elegiste. ¿Querés probarlo vos?"

---

## Fin de la documentación técnica

Estos 15 documentos cubren el 100% de la implementación técnica de Presisso Studio para la expo. Cada archivo es independiente y puede ser seguido por cualquier desarrollador del equipo.
