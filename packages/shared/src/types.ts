export type UserRole = 'client' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  roomType: RoomType;
  modelUrl: string;
  thumbnailUrl: string;
  materials: MaterialOption[];
  dimensions: Dimensions;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  editorState?: Record<string, unknown>;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  productId: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  materialOverrides?: Record<string, string>;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface MaterialOption {
  name: string;
  color: string;
  textureUrl?: string;
}

export type ProductCategory =
  | 'cabinet'
  | 'countertop'
  | 'table'
  | 'chair'
  | 'shelf'
  | 'wardrobe'
  | 'accessory';

export type RoomType =
  | 'kitchen'
  | 'living'
  | 'bedroom'
  | 'dining'
  | 'bathroom'
  | 'office'
  | 'other';

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';
