# Gestor La Paltería — Contexto para Claude

## ¿Qué es este proyecto?

Sistema interno de gestión de pedidos y cobranzas para **La Paltería**, distribuidora de paltas (aguacates) en Buenos Aires. Vende a restaurantes, sushis, cafés y comercios del GBA/CABA.

El flujo diario real (antes de este sistema) era un Excel con una hoja por día de la semana donde se registraba cada entrega.

**Este proyecto NO incluye AFIP/facturación electrónica** — eso va en el proyecto hermano `/palteria/facturador` (pausado).

---

## Stack técnico — LEER ANTES DE ESCRIBIR CÓDIGO

| Tecnología | Versión | Notas críticas |
|---|---|---|
| Next.js | 16.2.4 | App Router, Server Actions (`"use server"`), React 19 |
| Prisma | 7.x | Breaking changes vs versiones anteriores — ver sección Prisma 7 |
| PostgreSQL | Neon serverless | `DATABASE_URL` para app, `DIRECT_URL` para migraciones |
| Tailwind CSS | v4 | Sintaxis `@import "tailwindcss"` + `@theme inline {}` |
| TypeScript | 5.x | strict mode activo |
| lucide-react | latest | Iconos — no usar emojis en UI |

### Prisma 7 — gotchas críticos

- **`prisma.config.ts`** (raíz): la `url` de DB va acá, NO en `schema.prisma`. El datasource en schema solo tiene `provider = "postgresql"`.
- **Generator**: `provider = "prisma-client"` (no `prisma-client-js`). Output: `../src/generated/prisma`.
- **Imports**: `PrismaClient` desde `"../generated/prisma/client"`, enums desde `"@/generated/prisma/enums"`.
- **Driver adapter obligatorio**: `@prisma/adapter-pg` + `pg`. Sin esto falla con `accelerateUrl is missing`.
- **Constructor**: `new PrismaClient({ adapter } as never)` — el cast `as never` es intencional.
- **`prisma migrate reset`**: requiere env var `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="si, confirmo"`.

### Paleta de colores (CSS vars en globals.css)

```
--bg:          #f2f5f2   (fondo página)
--bg-card:     #ffffff   (cards)
--bg-hover:    #f7faf7
--border:      #dde6de
--verde:       #16a34a   (acento principal)
--naranja:     #ea580c   (botones primarios, nav activo)
--texto:       #1a2419   (texto principal)
--texto-dim:   #5a6b5c   (texto secundario)
--texto-muted: #9aab9d   (texto terciario)
--sidebar-bg:  #1a3d2b   (verde oscuro)
```

---

## Estructura del proyecto

```
gestor/
├── prisma/
│   ├── schema.prisma        # Entidades en español, sin url (Prisma 7)
│   ├── seed.ts              # Seed con datos del Excel inicial
│   └── migrations/          # Auto-generado por prisma migrate
├── prisma.config.ts         # URL de DB, path migraciones (Prisma 7)
├── src/
│   ├── actions/             # Server Actions ("use server")
│   ├── app/
│   │   ├── globals.css      # Tailwind v4 con @theme inline
│   │   ├── layout.tsx       # Root layout con sidebar
│   │   ├── page.tsx         # Dashboard /
│   │   ├── pedidos/         # /pedidos, /pedidos/[fecha], /pedidos/nuevo
│   │   ├── clientes/        # /clientes, /clientes/[id], /clientes/nuevo
│   │   ├── cobranzas/       # /cobranzas
│   │   ├── pagos-semanales/ # /pagos-semanales
│   │   ├── repartidores/    # /repartidores
│   │   └── productos/       # /productos
│   ├── components/
│   │   └── nav.tsx          # Sidebar de navegación
│   ├── generated/prisma/    # Auto-generado — NO editar
│   └── lib/
│       └── prisma.ts        # Singleton PrismaClient con adapter pg
├── .env                     # DATABASE_URL + DIRECT_URL (gitignored)
└── .env.example
```

---

## Entidades de base de datos

Todas las tablas y columnas están en **español snake_case** con `@@map` y `@map`.

### `zonas`
Zonas geográficas de entrega: HAEDO, MORON, PALOMAR, CABA, NORTE, CASTELAR, RAMOS MEJIA, VILLA LELOIR, HURLINGHAM, SAN MARTIN, MERLO, PADUA, VILLA SARMIENTO, VILLA UDAONDO, VILLA LUZURIAGA, ITUZAINGO, PUESTO PALTA, SENSU, OSCAR, LUJAN, SUR, SIN ASIGNAR.

### `repartidores`
Conductores: OSCAR, LAUCHA, BRUNO, ROLDU, MONCHI, CHRI, PIPI, NAVA, TITO 1RA, TITO 2DA, RAFA, GALIA, VANE, GABY, CREMONA, ABEL, JOSE, DINA, CHRISTIAN, LUCIA, NAFTA.

### `productos`
Variedades de palta: WHITE, PERU, PERU 60, PERU 84, PERU 96, PERU 11KG, SHAPO, AVO, BRASIL, CAT 1/2/30/50, DIAR 84, JAGUACY, IGUANA, GUACA PREMIUM. `precioReferencia` es precio sugerido por caja — el precio real se registra por pedido.

### `clientes`
- `nombre`: nombre del local o dirección (ej: "ROSALES 763", "SUSHI POP TIGRE")
- `formaPagoPref`: EFECTIVO | TRANSFERENCIA | PAGO_SEMANAL | CAMBIO
- `requiereFactura`: si necesita factura electrónica (para cuando se reactive AFIP)
- `idCuentaCorriente`: si pertenece a un grupo de pago semanal (nullable)
- `idRepartidor`: repartidor asignado habitualmente (nullable)

### `cuentas_corrientes`
Grupos de clientes que pagan en conjunto al cierre de período.
- `nombre`: CUERVO, CAFÉ BLANCA, SENSUS SUSHI, COFI JAUS, PANERA ROSA, etc. (27 grupos)
- `diaCobranza`: texto libre — "LUNES", "SABADO", "CADA 2 SEMANAS", null
- Tienen múltiples `clientes` (locales individuales) y múltiples `periodos_semanales`

### `pedidos`
Una fila = una entrega a un cliente en una fecha.
- `maduracion`: texto libre — PF, SEMI, VERDE, PF-SEMI, 1PF-1SEMI, PF-SEMI-V, etc.
- `cajas`: puede ser decimal (0.5, 1, 2, 3...)
- `montoTotal`: monto real cobrado (en pesos)
- `formaPago`: EFECTIVO | TRANSFERENCIA | PAGO_SEMANAL | CAMBIO
- `estadoPago`: PENDIENTE | PAGADO | PARCIAL
- `montoPagado`: cuánto se cobró efectivamente (para PARCIAL)
- `esCobro`: true si la fila representa cobranza de deuda anterior (no entrega)
- `requiereFactura` + `estadoFactura`: para cuando se integre AFIP

### `periodos_semanales`
Cierre de cuenta corriente para una semana o período.
- Vincula una `CuentaCorriente` con rango de fechas y totales

---

## Convenciones de código

- **Nombres**: todo en español — variables, funciones, tipos, rutas, labels de UI
- **Rutas Next.js**: `/pedidos`, `/clientes`, `/cobranzas`, `/pagos-semanales`, `/repartidores`, `/productos`
- **Server Actions**: en `src/actions/` con `"use server"` al tope del archivo
- **Datos**: siempre desde Server Components o Server Actions (no client-side fetch a /api)
- **Comentarios**: solo cuando la lógica no es obvia — no documentar el "qué", solo el "por qué"
- **Sin shadcn/ui**: usar Tailwind puro + lucide-react para iconos

### Maduración — texto libre con sugerencias
Las maduraciones NO son un enum porque hay demasiadas combinaciones reales del negocio. Los valores más comunes son:
`PF`, `SEMI`, `VERDE`, `PF-SEMI`, `PF-SEMI-V`, `PF-SEMI-VERDE`, `SEMI-VERDE`, `1PF-1SEMI`, `1SEMI-1VERDE`, `2PF-2SEMI`, `5PF-4SEMI`

En formularios, mostrar un `<datalist>` con estas sugerencias pero permitir texto libre.

---

## Variables de entorno

```env
DATABASE_URL="postgresql://..."   # Neon pooled (para la app)
DIRECT_URL="postgresql://..."     # Neon direct (para migraciones)
```

---

## Flujo de setup (nueva máquina / nuevo desarrollador)

```bash
cd gestor
npm install
cp .env.example .env
# Editar .env con las credenciales de Neon
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Para reset completo de DB:
```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="si, confirmo" npx prisma migrate reset
```

---

## Contexto del negocio

- **Productos**: paltas (aguacates) en cajas de distintas marcas y calibres
- **Maduración**: el estado de madurez de la fruta al momento de entrega es clave
- **Repartidores**: cada uno tiene una ruta asignada, cobra en efectivo o registra transferencias
- **Cuentas corrientes**: clientes (generalmente cadenas de locales) que no pagan por entrega sino que acumulan la semana y pagan en un día fijo
- **Cobranza**: a veces se visita un cliente solo para cobrar deuda anterior (sin entrega) — `esCobro = true`
- **Facturación**: algunos clientes requieren factura B o C. Está pendiente de integración AFIP (ver proyecto `facturador`)
