# 02 — Base de Datos (PostgreSQL + Drizzle ORM)

> **Sprint**: 1 (Día 2-3)
> **Dependencias**: `01-SETUP-ENTORNO.md` completado
> **Resultado**: Schema completo con migraciones y seeds funcionando

---

## 1. Configuración de Drizzle ORM

### 1.1 Drizzle Config

```typescript
// apps/api/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### 1.2 Conexión a la base de datos

```typescript
// apps/api/src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';

const connection = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 20 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(connection, { schema, logger: env.NODE_ENV === 'development' });
export type Database = typeof db;
```

---

## 2. Schema Completo

```typescript
// apps/api/src/db/schema.ts
import {
  pgTable, uuid, varchar, text, timestamp, boolean,
  integer, decimal, jsonb, pgEnum, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum('user_role', ['client', 'vendor', 'admin']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active', 'completed', 'archived']);
export const roomTypeEnum = pgEnum('room_type', ['kitchen', 'living', 'bedroom', 'dining', 'bathroom', 'office', 'other']);
export const productCategoryEnum = pgEnum('product_category', ['cabinet', 'countertop', 'table', 'chair', 'shelf', 'wardrobe', 'accessory']);

// ============================================================
// USERS
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }), // null si login con Google
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('client'),
  googleId: varchar('google_id', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  googleIdx: index('users_google_id_idx').on(table.googleId),
  roleIdx: index('users_role_idx').on(table.role),
}));

// ============================================================
// PRODUCTS (Catálogo de muebles Presisso)
// ============================================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: productCategoryEnum('category').notNull(),
  roomType: roomTypeEnum('room_type').notNull(),
  line: varchar('line', { length: 100 }), // Línea de producto (ej: "Minimal", "Premium")

  // Dimensiones en centímetros
  widthCm: decimal('width_cm', { precision: 8, scale: 2 }).notNull(),
  heightCm: decimal('height_cm', { precision: 8, scale: 2 }).notNull(),
  depthCm: decimal('depth_cm', { precision: 8, scale: 2 }).notNull(),

  // Precio de referencia (no es precio final)
  priceArs: decimal('price_ars', { precision: 12, scale: 2 }),
  priceUsd: decimal('price_usd', { precision: 10, scale: 2 }),

  // Assets 3D
  modelUrl: text('model_url').notNull(),        // URL al archivo GLB en S3/CDN
  thumbnailUrl: text('thumbnail_url'),           // Imagen de preview
  modelSizeBytes: integer('model_size_bytes'),   // Tamaño del GLB para lazy loading

  // Materiales disponibles
  materials: jsonb('materials').$type<ProductMaterial[]>().default([]),

  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  skuIdx: uniqueIndex('products_sku_idx').on(table.sku),
  categoryIdx: index('products_category_idx').on(table.category),
  roomTypeIdx: index('products_room_type_idx').on(table.roomType),
  activeIdx: index('products_active_idx').on(table.isActive),
}));

// ============================================================
// PROJECTS (Configuraciones del cliente)
// ============================================================

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').references(() => users.id), // Vendedor asignado (opcional)

  name: varchar('name', { length: 255 }).notNull().default('Mi Proyecto'),
  status: projectStatusEnum('status').notNull().default('draft'),
  roomType: roomTypeEnum('room_type').notNull().default('kitchen'),

  // Medidas del espacio (en cm)
  roomWidthCm: decimal('room_width_cm', { precision: 8, scale: 2 }),
  roomHeightCm: decimal('room_height_cm', { precision: 8, scale: 2 }),
  roomDepthCm: decimal('room_depth_cm', { precision: 8, scale: 2 }),

  // Foto del espacio
  backgroundImageUrl: text('background_image_url'),

  // Estado del editor serializado (posiciones, rotaciones, escala de cada item)
  editorState: jsonb('editor_state').$type<EditorState>(),

  // Notas del vendedor
  vendorNotes: text('vendor_notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('projects_user_id_idx').on(table.userId),
  vendorIdx: index('projects_vendor_id_idx').on(table.vendorId),
  statusIdx: index('projects_status_idx').on(table.status),
}));

// ============================================================
// PROJECT ITEMS (Muebles colocados en un proyecto)
// ============================================================

export const projectItems = pgTable('project_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),

  // Transform 3D (posición en la escena)
  positionX: decimal('position_x', { precision: 10, scale: 4 }).notNull().default('0'),
  positionY: decimal('position_y', { precision: 10, scale: 4 }).notNull().default('0'),
  positionZ: decimal('position_z', { precision: 10, scale: 4 }).notNull().default('0'),
  rotationY: decimal('rotation_y', { precision: 10, scale: 4 }).notNull().default('0'), // Rotación en Y (grados)
  scale: decimal('scale', { precision: 6, scale: 4 }).notNull().default('1'),

  // Material seleccionado
  selectedMaterialId: varchar('selected_material_id', { length: 100 }),

  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('project_items_project_id_idx').on(table.projectId),
}));

// ============================================================
// CHAT MESSAGES (Historial del asistente IA)
// ============================================================

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),

  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),

  // Metadata de la respuesta de Claude
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('chat_messages_project_id_idx').on(table.projectId),
  createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
}));

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  assignedProjects: many(projects, { relationName: 'vendor' }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  projectItems: many(projectItems),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  vendor: one(users, { fields: [projects.vendorId], references: [users.id], relationName: 'vendor' }),
  items: many(projectItems),
  chatMessages: many(chatMessages),
}));

export const projectItemsRelations = relations(projectItems, ({ one }) => ({
  project: one(projects, { fields: [projectItems.projectId], references: [projects.id] }),
  product: one(products, { fields: [projectItems.productId], references: [products.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  project: one(projects, { fields: [chatMessages.projectId], references: [projects.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

// ============================================================
// TYPES (para los campos JSONB)
// ============================================================

export interface ProductMaterial {
  id: string;
  name: string;           // "Roble Natural", "Laqueado Blanco"
  type: string;           // "wood", "lacquer", "marble", "granite"
  colorHex: string;       // "#8B7355"
  textureUrl?: string;    // URL a textura PBR en CDN
  roughness?: number;     // 0-1 para material PBR
  metalness?: number;     // 0-1 para material PBR
  priceModifier?: number; // Multiplicador de precio (1.0 = sin cambio)
}

export interface EditorState {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  backgroundImageUrl?: string;
  perspectiveAdjustment?: {
    vanishingPointX: number;
    vanishingPointY: number;
    fov: number;
  };
  sceneSettings: {
    ambientIntensity: number;
    directionalIntensity: number;
    showGrid: boolean;
    showMeasurements: boolean;
  };
}
```

---

## 3. Migraciones

```bash
# Generar migración desde el schema
cd apps/api
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate
```

```typescript
// apps/api/src/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations completed');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

---

## 4. Seed de Datos Iniciales

```typescript
// apps/api/src/db/seed.ts
import { db } from './index.js';
import { users, products } from './schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  // === USUARIOS ===
  const passwordHash = await bcrypt.hash('presisso2026', 12);

  const [adminUser] = await db.insert(users).values({
    email: 'admin@presisso.com',
    passwordHash,
    name: 'Admin Presisso',
    role: 'admin',
  }).returning();

  const [vendorUser] = await db.insert(users).values({
    email: 'vendedor@presisso.com',
    passwordHash,
    name: 'Vendedor Demo',
    role: 'vendor',
  }).returning();

  const [clientUser] = await db.insert(users).values({
    email: 'cliente@demo.com',
    passwordHash,
    name: 'Cliente Demo',
    role: 'client',
  }).returning();

  // === PRODUCTOS (3-5 para la expo) ===
  // NOTA: Las URLs de modelos GLB se actualizan cuando se suben a S3

  await db.insert(products).values([
    {
      sku: 'PRE-KC-001',
      name: 'Cocina Línea Minimal',
      description: 'Módulo de cocina bajo mesada en melamina premium. Diseño minimalista con tiradores ocultos.',
      category: 'cabinet',
      roomType: 'kitchen',
      line: 'Minimal',
      widthCm: '180.00',
      heightCm: '85.00',
      depthCm: '60.00',
      priceArs: '850000.00',
      modelUrl: 'https://CDN_URL/models/cocina-minimal-001.glb',
      thumbnailUrl: 'https://CDN_URL/thumbnails/cocina-minimal-001.webp',
      materials: [
        { id: 'mat-roble', name: 'Roble Natural', type: 'wood', colorHex: '#8B7355', roughness: 0.7, metalness: 0 },
        { id: 'mat-blanco', name: 'Laqueado Blanco', type: 'lacquer', colorHex: '#F5F5F0', roughness: 0.3, metalness: 0.1 },
        { id: 'mat-negro', name: 'Laqueado Negro', type: 'lacquer', colorHex: '#1A1A1A', roughness: 0.2, metalness: 0.15 },
      ],
      sortOrder: 1,
    },
    {
      sku: 'PRE-KC-002',
      name: 'Alacena Superior Premium',
      description: 'Alacena de pared con apertura push-to-open. Iluminación LED integrada.',
      category: 'cabinet',
      roomType: 'kitchen',
      line: 'Premium',
      widthCm: '120.00',
      heightCm: '70.00',
      depthCm: '35.00',
      priceArs: '520000.00',
      modelUrl: 'https://CDN_URL/models/alacena-premium-002.glb',
      thumbnailUrl: 'https://CDN_URL/thumbnails/alacena-premium-002.webp',
      materials: [
        { id: 'mat-roble', name: 'Roble Natural', type: 'wood', colorHex: '#8B7355', roughness: 0.7, metalness: 0 },
        { id: 'mat-gris', name: 'Gris Topo', type: 'lacquer', colorHex: '#8B8680', roughness: 0.4, metalness: 0.05 },
      ],
      sortOrder: 2,
    },
    {
      sku: 'PRE-CT-001',
      name: 'Mesada Isla Central',
      description: 'Isla de cocina con mesada de cuarzo. Incluye espacio de almacenamiento y barra de desayuno.',
      category: 'countertop',
      roomType: 'kitchen',
      line: 'Premium',
      widthCm: '200.00',
      heightCm: '90.00',
      depthCm: '80.00',
      priceArs: '1200000.00',
      modelUrl: 'https://CDN_URL/models/isla-central-001.glb',
      thumbnailUrl: 'https://CDN_URL/thumbnails/isla-central-001.webp',
      materials: [
        { id: 'mat-cuarzo-bl', name: 'Cuarzo Blanco', type: 'marble', colorHex: '#F0EDE8', roughness: 0.15, metalness: 0.02 },
        { id: 'mat-granito', name: 'Granito Negro', type: 'granite', colorHex: '#2C2C2A', roughness: 0.25, metalness: 0.05 },
      ],
      sortOrder: 3,
    },
    {
      sku: 'PRE-LV-001',
      name: 'Mueble TV Living',
      description: 'Rack de TV con paneles flotantes y cajones soft-close. Capacidad para TV hasta 75".',
      category: 'shelf',
      roomType: 'living',
      line: 'Minimal',
      widthCm: '240.00',
      heightCm: '45.00',
      depthCm: '45.00',
      priceArs: '680000.00',
      modelUrl: 'https://CDN_URL/models/rack-tv-001.glb',
      thumbnailUrl: 'https://CDN_URL/thumbnails/rack-tv-001.webp',
      materials: [
        { id: 'mat-roble', name: 'Roble Natural', type: 'wood', colorHex: '#8B7355', roughness: 0.7, metalness: 0 },
        { id: 'mat-nogal', name: 'Nogal Oscuro', type: 'wood', colorHex: '#4A3728', roughness: 0.65, metalness: 0 },
      ],
      sortOrder: 4,
    },
    {
      sku: 'PRE-WR-001',
      name: 'Vestidor Walk-in',
      description: 'Sistema de vestidor modular con barras, estantes y cajones. Iluminación LED con sensor.',
      category: 'wardrobe',
      roomType: 'bedroom',
      line: 'Premium',
      widthCm: '300.00',
      heightCm: '240.00',
      depthCm: '60.00',
      priceArs: '1800000.00',
      modelUrl: 'https://CDN_URL/models/vestidor-001.glb',
      thumbnailUrl: 'https://CDN_URL/thumbnails/vestidor-001.webp',
      materials: [
        { id: 'mat-blanco', name: 'Laqueado Blanco', type: 'lacquer', colorHex: '#F5F5F0', roughness: 0.3, metalness: 0.1 },
        { id: 'mat-lino', name: 'Lino Natural', type: 'wood', colorHex: '#C4B99A', roughness: 0.8, metalness: 0 },
      ],
      sortOrder: 5,
    },
  ]);

  console.log('Seed completed:');
  console.log(`  - Users: admin, vendor, client`);
  console.log(`  - Products: 5 items`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

---

## 5. Queries Útiles (referencia)

```typescript
// Ejemplo de queries comunes con Drizzle
import { eq, and, desc, ilike } from 'drizzle-orm';

// Obtener productos activos por ambiente
const kitchenProducts = await db.query.products.findMany({
  where: and(eq(products.isActive, true), eq(products.roomType, 'kitchen')),
  orderBy: [products.sortOrder],
});

// Obtener proyecto con items y productos
const project = await db.query.projects.findFirst({
  where: eq(projects.id, projectId),
  with: {
    items: { with: { product: true } },
    user: true,
  },
});

// Buscar productos por nombre
const results = await db.query.products.findMany({
  where: ilike(products.name, `%${search}%`),
});
```

---

## Siguiente paso → `03-AUTENTICACION.md`
