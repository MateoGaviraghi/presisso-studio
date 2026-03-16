# Tarea: Actualizar paleta de colores y logo de Presisso Studio

## Contexto
Estamos armando Presisso Studio y necesito que actualices TODOS los colores del proyecto para que coincidan con la identidad real de la marca Presisso (presisso.com.ar).

El logo está en: `apps/web/public/logo-presisso.png`
Usalo en el sidebar, login page, PDF templates y donde corresponda.

## Paleta de colores REAL de Presisso (extraída del sitio presisso.com.ar)

```
COLORES PRINCIPALES:
- Rojo Presisso (logo/acento):   #D42B2B  (el rojo del logotipo "presisso.")
- Negro/Charcoal (fondos dark):  #1A1A1A  (secciones oscuras del sitio)
- Blanco (fondos claros):        #FFFFFF
- Gris claro (fondo general):    #F5F5F3  (background del body)
- Gris medio (textos sec.):      #6B6B6B
- Gris oscuro (texto principal):  #333333

COLORES SECUNDARIOS:
- Rojo hover:                    #B82424  (rojo más oscuro para hover states)
- Rojo suave (badges/bg):        #FDF2F2  (fondo rosado muy sutil para highlights)
- Borde sutil:                   #E5E5E5  (bordes de cards y separadores)
- Fondo surface:                 #FAFAF9  (cards y superficies elevadas)

MARCA EXTENDIDA:
- Prestone by Presisso:          se usa tipografía espaciada en mayúsculas
- Bagno by Presisso:             sub-marca de baños (script font)
```

## Qué actualizar

### 1. Tailwind Config (`apps/web/tailwind.config.ts`)

Reemplazá TODA la sección de colores custom por:

```typescript
colors: {
  presisso: {
    red: '#D42B2B',        // Logo, CTAs, acentos
    'red-hover': '#B82424', // Hover states
    'red-light': '#FDF2F2', // Background sutil
    black: '#1A1A1A',       // Sidebar, headers dark
    charcoal: '#333333',    // Texto principal
    gray: '#6B6B6B',        // Texto secundario
  },
  surface: {
    primary: '#FFFFFF',     // Cards, modals
    secondary: '#FAFAF9',   // Background de secciones
    tertiary: '#F5F5F3',    // Background del body
    border: '#E5E5E5',      // Bordes sutiles
  },
},
```

### 2. CSS globals (`apps/web/src/styles/globals.css`)

Actualizar las clases de componentes:

```css
@layer components {
  .btn-primary {
    @apply bg-presisso-red text-white px-6 py-3 rounded-xl font-medium
           hover:bg-presisso-red-hover transition-all duration-200
           active:scale-[0.98];
  }
  .btn-dark {
    @apply bg-presisso-black text-white px-6 py-3 rounded-xl font-medium
           hover:bg-presisso-black/90 transition-all duration-200;
  }
  .btn-outline {
    @apply border border-surface-border text-presisso-charcoal px-6 py-3 rounded-xl
           font-medium hover:bg-surface-tertiary transition-all duration-200;
  }
  .card {
    @apply bg-white rounded-2xl border border-surface-border shadow-sm;
  }
}
```

### 3. Layout/Sidebar (`MainLayout.tsx` o equivalente)

- Sidebar: fondo `bg-presisso-black` (#1A1A1A) — negro puro, no navy
- Logo: usar `<img src="/logo-presisso.png" />` en vez de texto
- Links activos: texto `text-presisso-red` en vez de dorado
- Links hover: `hover:bg-white/5 hover:text-white`
- El texto "STUDIO" al lado del logo en `text-white font-light tracking-[0.3em]`

### 4. Login Page

- Fondo: blanco o gris claro (#F5F5F3)
- Logo Presisso grande centrado arriba
- Card de login con borde sutil
- Botón principal: rojo Presisso (#D42B2B)
- Link "Continuar con Google": estilo outline

### 5. Editor / UI general

- Toolbar: fondo `bg-white/90 backdrop-blur` con borde sutil
- Selección de mueble en editor: highlight rojo (#D42B2B) en vez de dorado
- Chat: avatar del bot con fondo `bg-presisso-red-light` y icono `text-presisso-red`
- Badges de categoría: fondo `bg-presisso-black` texto blanco

### 6. PDF Template (`packages/pdf/src/templates/`)

- Portada: fondo `#1A1A1A` con logo PNG de Presisso centrado
- Acento: líneas y detalles en `#D42B2B` (rojo)
- Headers de tabla: `background: #1A1A1A`
- NO usar dorado en ningún lado. Todo rojo Presisso + negro + blanco.

### 7. Buscar y reemplazar en TODO el proyecto

Buscá y reemplazá estos valores que ya no van:

| Valor viejo | Valor nuevo | Motivo |
|-------------|-------------|--------|
| `#1A1A2E` (navy) | `#1A1A1A` (negro real) | El sitio usa negro, no navy |
| `#C4A35A` (gold) | `#D42B2B` (rojo Presisso) | El acento es rojo, no dorado |
| `#FAF8F4` (cream) | `#F5F5F3` (gris claro) | Background real del sitio |
| `#2C2C2A` (charcoal viejo) | `#333333` (charcoal real) | Texto principal |
| `presisso-gold` | `presisso-red` | En todo el código |
| `presisso-dark` | `presisso-black` | En todo el código |
| `presisso-cream` | `surface-tertiary` | Background general |
| `text-presisso-gold` | `text-presisso-red` | Acentos de texto |
| `bg-presisso-gold` | `bg-presisso-red` | Botones y badges |
| `border-presisso-gold` | `border-presisso-red` | Bordes de acento |
| `Playfair Display` | Mantener solo para títulos display | OK |

### 8. También actualizar en `copilot-instructions.md` y en los docs

En `.github/copilot-instructions.md`, actualizar la sección "Paleta de marca Presisso" con los colores nuevos.

## Tipografía (se mantiene)

- **Inter**: body text, UI, botones, labels
- **Playfair Display**: solo para títulos hero grandes (login, portada PDF)
- El sitio de Presisso usa tipografía sans-serif limpia, todo lowercase en el logo

## Estilo general

El sitio real de Presisso es:
- Limpio, mucho espacio blanco
- Fotos grandes de producto de alta calidad
- Secciones oscuras (#1A1A1A) alternadas con blancas
- Rojo solo como acento (logo, links, CTAs) — NO inundar de rojo
- Tipografía fina, elegante, sin exceso de bold
- Cards con bordes muy sutiles, casi sin sombra

Aplicá este mismo criterio a Presisso Studio.
