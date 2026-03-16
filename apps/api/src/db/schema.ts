import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum('user_role', ['client', 'vendor', 'admin']);
export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'active',
  'completed',
  'archived',
]);
export const roomTypeEnum = pgEnum('room_type', [
  'kitchen',
  'living',
  'bedroom',
  'dining',
  'bathroom',
  'office',
  'other',
]);
export const productCategoryEnum = pgEnum('product_category', [
  'cabinet',
  'countertop',
  'table',
  'chair',
  'shelf',
  'wardrobe',
  'accessory',
]);

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('client'),
    googleId: varchar('google_id', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    googleIdx: index('users_google_id_idx').on(table.googleId),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

// ============================================================
// PRODUCTS
// ============================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: productCategoryEnum('category').notNull(),
    roomType: roomTypeEnum('room_type').notNull(),
    line: varchar('line', { length: 100 }),

    widthCm: decimal('width_cm', { precision: 8, scale: 2 }).notNull(),
    heightCm: decimal('height_cm', { precision: 8, scale: 2 }).notNull(),
    depthCm: decimal('depth_cm', { precision: 8, scale: 2 }).notNull(),

    priceArs: decimal('price_ars', { precision: 12, scale: 2 }),
    priceUsd: decimal('price_usd', { precision: 10, scale: 2 }),

    modelUrl: text('model_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    modelSizeBytes: integer('model_size_bytes'),

    materials: jsonb('materials').$type<ProductMaterial[]>().default([]),

    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    skuIdx: uniqueIndex('products_sku_idx').on(table.sku),
    categoryIdx: index('products_category_idx').on(table.category),
    roomTypeIdx: index('products_room_type_idx').on(table.roomType),
    activeIdx: index('products_active_idx').on(table.isActive),
  }),
);

// ============================================================
// PROJECTS
// ============================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').references(() => users.id),

    name: varchar('name', { length: 255 }).notNull().default('Mi Proyecto'),
    status: projectStatusEnum('status').notNull().default('draft'),
    roomType: roomTypeEnum('room_type').notNull().default('kitchen'),

    roomWidthCm: decimal('room_width_cm', { precision: 8, scale: 2 }),
    roomHeightCm: decimal('room_height_cm', { precision: 8, scale: 2 }),
    roomDepthCm: decimal('room_depth_cm', { precision: 8, scale: 2 }),

    backgroundImageUrl: text('background_image_url'),
    editorState: jsonb('editor_state').$type<EditorState>(),
    vendorNotes: text('vendor_notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('projects_user_id_idx').on(table.userId),
    vendorIdx: index('projects_vendor_id_idx').on(table.vendorId),
    statusIdx: index('projects_status_idx').on(table.status),
  }),
);

// ============================================================
// PROJECT ITEMS
// ============================================================

export const projectItems = pgTable(
  'project_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    positionX: decimal('position_x', { precision: 10, scale: 4 }).notNull().default('0'),
    positionY: decimal('position_y', { precision: 10, scale: 4 }).notNull().default('0'),
    positionZ: decimal('position_z', { precision: 10, scale: 4 }).notNull().default('0'),
    rotationY: decimal('rotation_y', { precision: 10, scale: 4 }).notNull().default('0'),
    scale: decimal('scale', { precision: 6, scale: 4 }).notNull().default('1'),

    selectedMaterialId: varchar('selected_material_id', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('project_items_project_id_idx').on(table.projectId),
  }),
);

// ============================================================
// CHAT MESSAGES
// ============================================================

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),

    modelUsed: varchar('model_used', { length: 100 }),
    tokensUsed: integer('tokens_used'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('chat_messages_project_id_idx').on(table.projectId),
    createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
  }),
);

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
  vendor: one(users, {
    fields: [projects.vendorId],
    references: [users.id],
    relationName: 'vendor',
  }),
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
// JSONB TYPES
// ============================================================

export interface ProductMaterial {
  id: string;
  name: string;
  type: string;
  colorHex: string;
  textureUrl?: string;
  roughness?: number;
  metalness?: number;
  priceModifier?: number;
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
