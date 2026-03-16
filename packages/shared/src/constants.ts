export const PRODUCT_CATEGORIES = [
  'cabinet',
  'countertop',
  'table',
  'chair',
  'shelf',
  'wardrobe',
  'accessory',
] as const;

export const ROOM_TYPES = [
  'kitchen',
  'living',
  'bedroom',
  'dining',
  'bathroom',
  'office',
  'other',
] as const;

export const USER_ROLES = ['client', 'vendor', 'admin'] as const;

export const PROJECT_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;

export const BRAND_COLORS = {
  red: '#D42B2B',
  redHover: '#B82424',
  redLight: '#FDF2F2',
  black: '#1A1A1A',
  charcoal: '#333333',
  gray: '#6B6B6B',
  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#FAFAF9',
  surfaceTertiary: '#F5F5F3',
  border: '#E5E5E5',
} as const;
