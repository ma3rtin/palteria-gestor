# Gestor La Paltería — Contexto para Claude

## Cómo usar este archivo

Este archivo es la fuente de verdad para retomar trabajo entre sesiones. Al empezar una sesión:
1. Leer la sección **Estado actual** para saber dónde quedó y qué sigue.
2. Leer **Entidades de base de datos** si vas a tocar schema o actions.
3. Leer **Stack técnico** si vas a escribir código nuevo.
4. Al terminar la sesión: actualizar **Estado actual** con lo que se hizo y qué sigue.

---

## ¿Qué es este proyecto?

Sistema interno de gestión de pedidos y cobranzas para **La Paltería**, distribuidora de paltas (aguacates) en Buenos Aires. Vende a restaurantes, sushis, cafés y comercios del GBA/CABA.

El flujo diario real (antes de este sistema) era un Excel con una hoja por día de la semana donde se registraba cada entrega.

**Este proyecto NO incluye AFIP/facturación electrónica** — eso va en el proyecto hermano `/palteria/facturador` (pausado).

---

## Estado actual (actualizar al final de cada sesión)

| Sesión | Estado | Descripción |
|---|---|---|
| 1 — Setup | ✅ | Proyecto scaffoldeado, schema Prisma, seed con datos del Excel, documentación |
| 2 — Layout + Dashboard | ✅ | Dashboard con stats del día, tarjetas, resumen por repartidor |
| 3 — Clientes CRUD | ✅ | Lista, detalle, nuevo, editar, toggle activo, saldo, búsqueda |
| 4 — Pedidos del día | ✅ | Vista diaria, nuevo pedido, marcar pagado/parcial, eliminar, cobros |
| 5 — Cobranzas | ✅ | Deudas por cliente, filtros zona/repartidor, cobrar todo |
| 6 — Pagos semanales | ✅ | Lista cuentas corrientes, detalle con pedidos por sub-local, registrar pago |
| 7 — Repartidores | ✅ | Lista con stats hoy, detalle con selector de fecha |
| 8 — Reportes | ✅ | /productos, /config/zonas, /config/repartidores |
| 9 — Schema v2 | ✅ | Producto sin @unique + fechaIngreso, Pedido.esReposicion, modelo PagoLocal |
| 10 — Pagos por local | ✅ | UI para PagoLocal: cobro global con repartidor, cobro por local con <details> en cada card, historial plano de pagos |
| 11 — Dashboard v2 | ✅ | Stats semanales (pedidos, cajas, facturado/cobrado) + top 6 productos por cajas |
| 12 — Auth | ✅ | NextAuth v5 credentials, modelo Usuario, middleware, login page, sign out en nav |
| 13 — Seed fix + diaCobranza | ✅ | diaCobranza completado desde Excel real (11 cuentas tenían null); 4 cuentas nuevas (GARDINER, BARRACAS VELEZ, CORRIENTES NUEVO PANERA ROSA, TAPIA DE CRUZ); default pagos-semanales = semana anterior completa |
| 14 — Entrega al cliente | ✅ | Flujo cambios implementado, perfil de usuario, bugs fixes, propuesta enviada al cliente |
| 15 — Reportes | ✅ | Sección /reportes con selector de período (presets + rango libre), tarjetas resumen (pedidos, cajas, cobrado, pendiente), top productos, por repartidor, por forma de pago |
| 16 — Stock | ✅ | kgPorCaja (select 10/11) + stockCajas en Producto; descuento automático al crear pedido, restauración al eliminar; UI /productos rediseñada con form+buscador arriba y tabla full-width |
| 17 — Revendedores | ✅ | Schema (Revendedor, LiquidacionRevendedor, FK en Cliente); actions en revendedores.ts; /revendedores, /revendedores/[id], /config/revendedores; selector de período; liquidación semanal con cálculo por tipo (COMISION/MARGEN/DESCUENTO); historial con forma de pago; aviso si período ya liquidado; RevendedorSelector client component en forms de cliente |

**Infraestructura resuelta:**
- Supabase conectado y funcionando ✅
- Auth funcionando (login con email/password) ✅
- Producción en Vercel ✅ — env vars en Vercel deben tener `$` sin escapar (sin `\$`), Vercel no procesa escapes como dotenv-expand
- `.env` local: password con `\$` para que dotenv-expand lo maneje. En Vercel: valor directo con `$`.
- Script `crear-usuario.ts`: usa `.replace(/\\\$/g, "$")` en DATABASE_URL para des-escapar antes de conectar

**Próximo paso:** Revendedores implementado y funcionando. Juani debe asignar clientes reales a Oscar/Pato/Puesto desde /clientes/[id]/editar. Etiquetas pendiente de confirmación de datos por el cliente.

**Backlog (no iniciado):**

### Pedidos por el cliente (2026-05-13) — prioridad
- **Resúmenes / Reportes**: ✅ implementado.
- **Manejo de stock**: ✅ implementado — kgPorCaja (select 10/11) + stockCajas en Producto. Fix .env: password URL-encodeada en DATABASE_URL y DIRECT_URL (`%24` `%26` `%2C`), DB_PASSWORD sin cambios.
- **Revendedores**: ✅ implementado. Oscar=COMISION (comisionPorCaja en cada cliente), Pato=MARGEN (diferencia montoTotal vs precioReferencia), Puesto=DESCUENTO (cobrado − descuentoPorCaja × cajas). Setup: crear revendedor en /config/revendedores, asignar clientes en /clientes/[id]/editar. Liquidación semanal en /revendedores/[id].
- **Etiquetas para impresión**: generar texto formateado por pedido para que el cliente copie y pegue en una hoja e imprima. No conexión directa con impresora (fuera de scope por precio). Pendiente: que el cliente confirme qué datos necesita en la etiqueta (nombre cliente, dirección, producto, cajas, peso, fecha, repartidor, etc.) y ejemplos de etiquetas actuales si tiene.

### Backlog anterior
- **App repartidores (mobile)**: presupuesto separado, fuera del scope actual.
- **Flujo cambios/reposiciones**: ✅ implementado — toggle "Sin cargo / Con diferencia de precio" en form de nuevo pedido.
- **Export Excel de pedidos**: botón en /pedidos para exportar rango de fechas (default: mes anterior). Columnas: fecha, cliente, zona, producto, cajas, maduración, monto, forma de pago, estado, repartidor. Librería sugerida: `xlsx` (ya instalada globalmente, agregar al proyecto). Server Action que devuelve buffer → descarga en el browser.
- **Export Excel de cobranzas/cuentas corrientes**: similar al anterior pero con saldo por cliente o historial de pagos por cuenta. Útil para auditoría o para compartir con el contador.
- **Historial de precios por producto**: ver cómo varió el precio de cada variedad semana a semana. Útil para el cliente al momento de fijar precios.
- **Resumen mensual automático**: absorbido por el ítem "Resúmenes / Reportes" de arriba.

**Auth — notas de implementación:**
- NextAuth v5 con credentials (email + password con bcrypt)
- Split config: `auth.config.ts` (edge-safe, sin DB) + `auth.ts` (completo, con Prisma)
- Middleware en `src/middleware.ts` usa solo el config liviano
- Modelo `usuarios` en DB, script para crear usuarios: `npm run crear-usuario email nombre password`
- `.env` necesita `AUTH_SECRET` (generar con `openssl rand -base64 32`) y `AUTH_TRUST_HOST=true`

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
- **Transacciones interactivas NO funcionan** con el pooler de Supabase (PgBouncer en transaction mode). Usar dos `await` secuenciales en lugar de `$transaction(async tx => {...})`. El array form `$transaction([...])` tampoco es confiable. Usar operaciones separadas.

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
│   │   ├── clientes.ts
│   │   ├── cobranzas.ts
│   │   ├── dashboard.ts
│   │   ├── pagos-semanales.ts
│   │   ├── pedidos.ts
│   │   ├── reportes.ts
│   │   ├── revendedores.ts
│   │   └── repartidores.ts
│   ├── app/
│   │   ├── globals.css      # Tailwind v4 con @theme inline
│   │   ├── layout.tsx       # Root layout con sidebar
│   │   ├── page.tsx         # Dashboard /
│   │   ├── pedidos/         # /pedidos, /pedidos/[fecha], /pedidos/nuevo
│   │   ├── clientes/        # /clientes, /clientes/[id], /clientes/nuevo, revendedor-selector.tsx
│   │   ├── cobranzas/       # /cobranzas
│   │   ├── pagos-semanales/ # /pagos-semanales, /pagos-semanales/[id]
│   │   ├── repartidores/    # /repartidores, /repartidores/[id]
│   │   ├── reportes/        # /reportes con selector-periodo.tsx
│   │   ├── revendedores/    # /revendedores, /revendedores/[id] con selector-periodo.tsx
│   │   ├── config/          # /config/zonas, /config/repartidores, /config/revendedores
│   │   └── productos/       # /productos con productos-ui.tsx
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
Relaciones: `pedidos[]`, `pagosLocales[]`.

### `productos`
Variedades de palta: WHITE, PERU, PERU 60, PERU 84, PERU 96, PERU 11KG, SHAPO, AVO, BRASIL, CAT 1/2/30/50, DIAR 84, JAGUACY, IGUANA, GUACA PREMIUM.
- `nombre` **NO es unique** — el mismo nombre puede aparecer múltiples veces con distintos precios/semanas.
- `fechaIngreso`: fecha en que ingresó ese lote (nullable). Distingue batches con el mismo nombre.
- `precioReferencia`: precio sugerido por caja — el precio real se registra en el pedido.
- `activo`: marcar false cuando el lote se agota; el nuevo lote entra como nueva fila.

### `clientes`
- `nombre`: nombre del local o dirección (ej: "ROSALES 763", "SUSHI POP TIGRE")
- `formaPagoPref`: EFECTIVO | TRANSFERENCIA | PAGO_SEMANAL | CAMBIO
- `requiereFactura`: si necesita factura electrónica (para cuando se reactive AFIP)
- `idCuentaCorriente`: si pertenece a un grupo de pago semanal (nullable)
- `idRepartidor`: repartidor asignado habitualmente (nullable)
- `idRevendedor`: revendedor al que pertenece este cliente (nullable)
- `comisionPorCaja`: comisión que genera este cliente al revendedor (solo relevante si revendedor.tipo = COMISION)
- Relaciones: `pedidos[]`, `pagosLocales[]`.

### `cuentas_corrientes`
Grupos de clientes que pagan en conjunto al cierre de período.
- `nombre`: CUERVO, CAFÉ BLANCA, SENSUS SUSHI, COFI JAUS, PANERA ROSA, etc. (27 grupos)
- `diaCobranza`: texto libre — "LUNES", "SABADO", "CADA 2 SEMANAS", null
- Tienen múltiples `clientes` (locales individuales) y múltiples `periodos_semanales`.

### `periodos_semanales`
Cierre de cuenta corriente para una semana o período.
- Vincula una `CuentaCorriente` con rango de fechas y totales.
- `montoPagado` / `fechaPago` / `formaPago`: resumen del pago global (legado, se mantiene por compatibilidad).
- `pagosLocales[]`: detalle de pagos por local (nuevo en sesión 9).

### `pagos_locales` (nuevo — sesión 9)
Pago registrado dentro de un período. Permite desglose por local o pago global:
- `idCliente` **nullable**: si tiene valor = pago de ese local; si es null = pago global que cubre toda la cuenta.
- `monto`: monto abonado.
- `fechaPago`: cuándo se cobró.
- `idRepartidor` nullable: quién cobró (puede ser alguien de la oficina, no solo repartidor).
- `observaciones`: texto libre.

### `revendedores`
Intermediarios con clientes propios. Paltería les liquida semanalmente.
- `tipo`: COMISION | MARGEN | DESCUENTO
- `activo`: para activar/desactivar sin borrar
- Relaciones: `clientes[]`, `liquidaciones[]`

### `liquidaciones_revendedor`
Registro de cada pago semanal a un revendedor.
- `fechaInicio` / `fechaFin`: período liquidado
- `montoCalculado`: lo que el sistema calculó según el tipo
- `montoPagado`: lo que se pagó efectivamente (actualmente = montoCalculado)
- `descuentoPorCaja`: solo para tipo DESCUENTO, ingresado en el form
- `formaPago`: EFECTIVO | TRANSFERENCIA (nullable)
- `observaciones`: texto libre

### `pedidos`
Una fila = una entrega a un cliente en una fecha.
- `maduracion`: texto libre — PF, SEMI, VERDE, PF-SEMI, 1PF-1SEMI, PF-SEMI-V, etc.
- `cajas`: puede ser decimal (0.5, 1, 2, 3...)
- `montoTotal`: monto real cobrado (en pesos)
- `formaPago`: EFECTIVO | TRANSFERENCIA | PAGO_SEMANAL | CAMBIO
- `estadoPago`: PENDIENTE | PAGADO | PARCIAL
- `montoPagado`: cuánto se cobró efectivamente (para PARCIAL)
- `esCobro`: true si la fila representa cobranza de deuda anterior (no entrega)
- `esReposicion`: true cuando el cambio no tiene cargo (fruta descartada); false = se cobra diferencia de kg. Solo relevante cuando `formaPago = CAMBIO`.
- `requiereFactura` + `estadoFactura`: para cuando se integre AFIP

---

## Convenciones de código

- **Nombres**: todo en español — variables, funciones, tipos, rutas, labels de UI
- **Rutas Next.js**: `/pedidos`, `/clientes`, `/cobranzas`, `/pagos-semanales`, `/repartidores`, `/productos`, `/reportes`, `/revendedores`, `/config/revendedores`
- **Server Actions**: en `src/actions/` con `"use server"` al tope del archivo
- **Datos**: siempre desde Server Components o Server Actions (no client-side fetch a /api)
- **Comentarios**: solo cuando la lógica no es obvia — no documentar el "qué", solo el "por qué"
- **Sin shadcn/ui**: usar Tailwind puro + lucide-react para iconos
- **Sin historial importado**: el cliente arranca de cero, no hay migración de datos viejos

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

- **Productos**: paltas (aguacates) en cajas de distintas marcas y calibres. Stock semanal rotativo — mismo producto puede tener distintos precios cada semana.
- **Maduración**: el estado de madurez de la fruta al momento de entrega es clave
- **Repartidores**: cada uno tiene una ruta asignada, cobra en efectivo o registra transferencias
- **Cuentas corrientes**: clientes (generalmente cadenas de locales) que no pagan por entrega sino que acumulan la semana y pagan en un día fijo. Pueden pagar el total de todos los locales juntos O cada local por separado.
- **Cambios**: `formaPago = CAMBIO`. Hay dos variantes — `esReposicion = false`: se cobra diferencia de kg; `esReposicion = true`: fruta descartada, sin cargo.
- **Cobranza**: a veces se visita un cliente solo para cobrar deuda anterior (sin entrega) — `esCobro = true`
- **Facturación**: algunos clientes requieren factura B o C. Está pendiente de integración AFIP (ver proyecto `facturador`)
- **Métricas clave para el cliente**: cajas vendidas + recaudación. Costos los manejan "a ojo" fuera del sistema por ahora.
