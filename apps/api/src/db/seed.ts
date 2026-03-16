import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '../../.env') });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, products } from './schema';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const connection = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(connection);

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('presisso2026', 12);

  // === USERS ===
  await db.insert(users).values([
    {
      email: 'admin@presisso.com',
      passwordHash,
      name: 'Admin Presisso',
      role: 'admin',
    },
    {
      email: 'vendedor@presisso.com',
      passwordHash,
      name: 'Vendedor Demo',
      role: 'vendor',
    },
    {
      email: 'cliente@demo.com',
      passwordHash,
      name: 'Cliente Demo',
      role: 'client',
    },
  ]);

  // === PRODUCTS ===
  await db.insert(products).values([
    {
      sku: 'PRE-KC-001',
      name: 'Cocina Línea Minimal',
      description:
        'Módulo de cocina bajo mesada en melamina premium. Diseño minimalista con tiradores ocultos.',
      category: 'cabinet',
      roomType: 'kitchen',
      line: 'Minimal',
      widthCm: '180.00',
      heightCm: '85.00',
      depthCm: '60.00',
      priceArs: '850000.00',
      modelUrl: 'https://cdn.presisso.com/models/cocina-minimal-001.glb',
      thumbnailUrl: 'https://cdn.presisso.com/thumbnails/cocina-minimal-001.webp',
      materials: [
        {
          id: 'mat-roble',
          name: 'Roble Natural',
          type: 'wood',
          colorHex: '#8B7355',
          roughness: 0.7,
          metalness: 0,
        },
        {
          id: 'mat-blanco',
          name: 'Laqueado Blanco',
          type: 'lacquer',
          colorHex: '#F5F5F0',
          roughness: 0.3,
          metalness: 0.1,
        },
        {
          id: 'mat-negro',
          name: 'Laqueado Negro',
          type: 'lacquer',
          colorHex: '#1A1A1A',
          roughness: 0.2,
          metalness: 0.15,
        },
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
      modelUrl: 'https://cdn.presisso.com/models/alacena-premium-002.glb',
      thumbnailUrl: 'https://cdn.presisso.com/thumbnails/alacena-premium-002.webp',
      materials: [
        {
          id: 'mat-roble',
          name: 'Roble Natural',
          type: 'wood',
          colorHex: '#8B7355',
          roughness: 0.7,
          metalness: 0,
        },
        {
          id: 'mat-gris',
          name: 'Gris Topo',
          type: 'lacquer',
          colorHex: '#8B8680',
          roughness: 0.4,
          metalness: 0.05,
        },
      ],
      sortOrder: 2,
    },
    {
      sku: 'PRE-CT-001',
      name: 'Mesada Isla Central',
      description:
        'Isla de cocina con mesada de cuarzo. Incluye espacio de almacenamiento y barra de desayuno.',
      category: 'countertop',
      roomType: 'kitchen',
      line: 'Premium',
      widthCm: '200.00',
      heightCm: '90.00',
      depthCm: '80.00',
      priceArs: '1200000.00',
      modelUrl: 'https://cdn.presisso.com/models/isla-central-001.glb',
      thumbnailUrl: 'https://cdn.presisso.com/thumbnails/isla-central-001.webp',
      materials: [
        {
          id: 'mat-cuarzo-bl',
          name: 'Cuarzo Blanco',
          type: 'marble',
          colorHex: '#F0EDE8',
          roughness: 0.15,
          metalness: 0.02,
        },
        {
          id: 'mat-granito',
          name: 'Granito Negro',
          type: 'granite',
          colorHex: '#2C2C2A',
          roughness: 0.25,
          metalness: 0.05,
        },
      ],
      sortOrder: 3,
    },
    {
      sku: 'PRE-LV-001',
      name: 'Mueble TV Living',
      description:
        'Rack de TV con paneles flotantes y cajones soft-close. Capacidad para TV hasta 75".',
      category: 'shelf',
      roomType: 'living',
      line: 'Minimal',
      widthCm: '240.00',
      heightCm: '45.00',
      depthCm: '45.00',
      priceArs: '680000.00',
      modelUrl: 'https://cdn.presisso.com/models/rack-tv-001.glb',
      thumbnailUrl: 'https://cdn.presisso.com/thumbnails/rack-tv-001.webp',
      materials: [
        {
          id: 'mat-roble',
          name: 'Roble Natural',
          type: 'wood',
          colorHex: '#8B7355',
          roughness: 0.7,
          metalness: 0,
        },
        {
          id: 'mat-nogal',
          name: 'Nogal Oscuro',
          type: 'wood',
          colorHex: '#4A3728',
          roughness: 0.65,
          metalness: 0,
        },
      ],
      sortOrder: 4,
    },
    {
      sku: 'PRE-WR-001',
      name: 'Vestidor Walk-in',
      description:
        'Sistema de vestidor modular con barras, estantes y cajones. Iluminación LED con sensor.',
      category: 'wardrobe',
      roomType: 'bedroom',
      line: 'Premium',
      widthCm: '300.00',
      heightCm: '240.00',
      depthCm: '60.00',
      priceArs: '1800000.00',
      modelUrl: 'https://cdn.presisso.com/models/vestidor-001.glb',
      thumbnailUrl: 'https://cdn.presisso.com/thumbnails/vestidor-001.webp',
      materials: [
        {
          id: 'mat-blanco',
          name: 'Laqueado Blanco',
          type: 'lacquer',
          colorHex: '#F5F5F0',
          roughness: 0.3,
          metalness: 0.1,
        },
        {
          id: 'mat-lino',
          name: 'Lino Natural',
          type: 'wood',
          colorHex: '#C4B99A',
          roughness: 0.8,
          metalness: 0,
        },
      ],
      sortOrder: 5,
    },
  ]);

  console.log('Seed completed:');
  console.log('  - Users: admin, vendor, client');
  console.log('  - Products: 5 items');
  await connection.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
