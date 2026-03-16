import { z } from 'zod';
import { PRODUCT_CATEGORIES, ROOM_TYPES, USER_ROLES } from './constants.js';

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

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: z.enum(PRODUCT_CATEGORIES),
  roomType: z.enum(ROOM_TYPES),
  modelUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  materials: z.array(
    z.object({
      name: z.string(),
      color: z.string(),
      textureUrl: z.string().url().optional(),
    }),
  ),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  price: z.number().positive(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const addProjectItemSchema = z.object({
  productId: z.string().uuid(),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  materialOverrides: z.record(z.string()).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
});
