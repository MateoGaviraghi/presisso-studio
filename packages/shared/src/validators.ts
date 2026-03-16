import { z } from 'zod';
import { PRODUCT_CATEGORIES, ROOM_TYPES, USER_ROLES, PROJECT_STATUSES } from './constants.js';

// ── Auth ────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(USER_ROLES).default('client'),
});

// ── Products ────────────────────────────────────

const materialSchema = z.object({
  id: z.string().default(() => `mat-${Date.now()}`),
  name: z.string(),
  type: z.string(),
  colorHex: z.string(),
  textureUrl: z.string().url().optional(),
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  priceModifier: z.number().optional(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  roomType: z.enum(ROOM_TYPES),
  line: z.string().max(100).optional(),
  widthCm: z.string().or(z.number()).transform(String),
  heightCm: z.string().or(z.number()).transform(String),
  depthCm: z.string().or(z.number()).transform(String),
  priceArs: z.string().or(z.number()).transform(String).optional(),
  priceUsd: z.string().or(z.number()).transform(String).optional(),
  modelUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  modelSizeBytes: z.number().int().positive().optional(),
  materials: z.array(materialSchema).default([]),
  sortOrder: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  line: z.string().optional(),
  search: z.string().max(200).optional(),
});

// ── Projects ────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).default('Mi Proyecto'),
  roomType: z.enum(ROOM_TYPES).default('kitchen'),
  roomWidthCm: z.string().or(z.number()).transform(String).optional(),
  roomHeightCm: z.string().or(z.number()).transform(String).optional(),
  roomDepthCm: z.string().or(z.number()).transform(String).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  roomWidthCm: z.string().or(z.number()).transform(String).optional(),
  roomHeightCm: z.string().or(z.number()).transform(String).optional(),
  roomDepthCm: z.string().or(z.number()).transform(String).optional(),
  backgroundImageUrl: z.string().url().optional(),
  vendorNotes: z.string().max(5000).optional(),
});

export const editorStateSchema = z.object({
  cameraPosition: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  cameraTarget: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  backgroundImageUrl: z.string().url().optional(),
  perspectiveAdjustment: z
    .object({
      vanishingPointX: z.number(),
      vanishingPointY: z.number(),
      fov: z.number(),
    })
    .optional(),
  sceneSettings: z.object({
    ambientIntensity: z.number(),
    directionalIntensity: z.number(),
    showGrid: z.boolean(),
    showMeasurements: z.boolean(),
  }),
});

// ── Project Items ───────────────────────────────

export const addProjectItemSchema = z.object({
  productId: z.string().uuid(),
  positionX: z.string().or(z.number()).transform(String).default('0'),
  positionY: z.string().or(z.number()).transform(String).default('0'),
  positionZ: z.string().or(z.number()).transform(String).default('0'),
  rotationY: z.string().or(z.number()).transform(String).default('0'),
  scale: z.string().or(z.number()).transform(String).default('1'),
  selectedMaterialId: z.string().max(100).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateProjectItemSchema = z.object({
  positionX: z.string().or(z.number()).transform(String).optional(),
  positionY: z.string().or(z.number()).transform(String).optional(),
  positionZ: z.string().or(z.number()).transform(String).optional(),
  rotationY: z.string().or(z.number()).transform(String).optional(),
  scale: z.string().or(z.number()).transform(String).optional(),
  selectedMaterialId: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

// ── Chat ────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
});

// ── Params ──────────────────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const projectItemParamsSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
