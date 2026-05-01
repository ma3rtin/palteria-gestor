# Plan de desarrollo — Gestor La Paltería

## Objetivo del proyecto

Reemplazar el Excel semanal de pedidos con un sistema web que permita:
- Registrar entregas diarias por cliente
- Saber quién pagó, quién debe, cuánto
- Ver resúmenes por repartidor
- Gestionar cuentas corrientes (pagos semanales)

**No incluye AFIP** — eso va en el proyecto hermano `facturador` (pausado).

---

## Estado actual

| Fase | Estado | Descripción |
|---|---|---|
| Sesión 1 — Setup | ✅ Completo | Proyecto scaffoldeado, schema Prisma, seed con datos del Excel, documentación |
| Sesión 2 — Layout + Dashboard | ✅ Completo | Dashboard con stats del día, tarjetas, resumen por repartidor |
| Sesión 3 — Clientes CRUD | ✅ Completo | Lista, detalle, nuevo, editar, toggle activo, saldo, búsqueda |
| Sesión 4 — Pedidos del día | ✅ Completo | Vista diaria, nuevo pedido, marcar pagado/parcial, eliminar, cobros |
| Sesión 5 — Cobranzas | ✅ Completo | Deudas por cliente, filtros zona/repartidor, cobrar todo |
| Sesión 6 — Pagos semanales | ✅ Completo | Lista cuentas corrientes, detalle con pedidos por sub-local, registrar pago |
| Sesión 7 — Repartidores | ✅ Completo | Lista con stats hoy, detalle con selector de fecha |
| Sesión 8 — Reportes | ✅ Completo | /productos, /config/zonas, /config/repartidores |

**Pendiente:**
- **Setup en DB real** — aún no fue probado contra Neon (ver instrucciones abajo)

---

## Sesión 1 — Setup ✅

**Completado:**
- `package.json`, `tsconfig.json`, configs Next/Tailwind/ESLint
- `prisma/schema.prisma` con todas las entidades en español
- `prisma.config.ts` (Prisma 7)
- `prisma/seed.ts` con datos del Excel: 22 zonas, 21 repartidores, 17 productos, 27 cuentas corrientes, ~140 clientes
- `src/lib/prisma.ts` — singleton con adapter pg
- `src/app/globals.css` — paleta de colores
- `src/app/layout.tsx` + `src/components/nav.tsx`
- `CLAUDE.md` — contexto completo del proyecto
- `PLAN.md` — este archivo

**Pendiente para hacer antes de sesión 2:**
```bash
npm install
cp .env.example .env   # completar con credenciales Neon
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## Sesión 2 — Layout + Dashboard

**Objetivo:** App funcionando con datos reales, dashboard con métricas del día.

**Tareas:**
1. Verificar que migración y seed funcionan contra la DB real
2. `src/actions/dashboard.ts` — Server Action con stats: pedidos hoy, monto total hoy, pendientes de cobro, clientes con deuda
3. `src/app/page.tsx` — Dashboard completo con tarjetas de métricas
4. Ajustar `nav.tsx` si hay feedback visual

**Componentes a crear:**
- `<TarjetaStat>` — tarjeta reutilizable para métricas (número grande + label + variación)

**Criterio de éxito:** Se ve el dashboard con datos reales al entrar a `/`.

---

## Sesión 3 — Clientes

**Objetivo:** CRUD completo de clientes con sus relaciones.

**Tareas:**
1. `src/actions/clientes.ts` — `getClientes`, `getCliente`, `crearCliente`, `actualizarCliente`, `toggleActivo`
2. `src/app/clientes/page.tsx` — Lista con búsqueda, zona, saldo pendiente
3. `src/app/clientes/nuevo/page.tsx` — Formulario alta
4. `src/app/clientes/[id]/page.tsx` — Detalle: datos, historial pedidos, saldo

**Consideraciones:**
- El formulario de cliente necesita selects para: Zona, Repartidor, FormaPago, CuentaCorriente
- Mostrar saldo pendiente en la lista (suma de pedidos PENDIENTE/PARCIAL)
- El detalle debe mostrar los pedidos de las últimas 4 semanas

**Criterio de éxito:** Se puede crear un cliente nuevo, verlo en la lista y en su detalle con historial.

---

## Sesión 4 — Pedidos del día (flujo principal)

**Objetivo:** Registrar y gestionar las entregas del día. Es el flujo más usado del sistema.

**Tareas:**
1. `src/actions/pedidos.ts` — `getPedidosPorFecha`, `crearPedido`, `actualizarEstadoPago`, `eliminarPedido`
2. `src/app/pedidos/page.tsx` — Redirige a `/pedidos/[hoy]`
3. `src/app/pedidos/[fecha]/page.tsx` — Vista del día: lista de entregas con estado de pago inline
4. `src/app/pedidos/[fecha]/nuevo/page.tsx` — Formulario nuevo pedido

**Formulario de nuevo pedido — campos:**
- Cliente (autocomplete/select con búsqueda)
- Producto (select)
- Maduración (input text con `<datalist>` de sugerencias)
- Cajas (número, step 0.5)
- Monto total (número)
- Forma de pago
- Repartidor
- ¿Requiere factura? (checkbox)
- Observaciones (textarea)

**Vista del día:**
- Tabla con columnas: Cliente, Zona, Cajas, Producto, Maduración, Monto, Forma Pago, Estado Pago, Acciones
- Botón "Marcar pagado" inline por fila
- Totales al pie: total cajas, total monto, total cobrado

**Criterio de éxito:** Se puede registrar el día completo de entregas, marcar pagos, ver totales.

---

## Sesión 5 — Cobranzas

**Objetivo:** Vista de deudas pendientes, marcar cobros.

**Tareas:**
1. `src/actions/cobranzas.ts` — `getClientesConDeuda`, `registrarCobro`, `getHistorialCobros`
2. `src/app/cobranzas/page.tsx` — Lista de clientes con deuda, filtro por zona/repartidor
3. Botón "Registrar cobro" → modal o página inline para registrar el pago

**Lógica de deuda:**
- Suma de `pedidos.montoTotal - pedidos.montoPagado` donde `estadoPago != PAGADO`
- Mostrar deuda por cliente, ordenada de mayor a menor
- Permitir cobro parcial (actualiza `montoPagado` y `estadoPago = PARCIAL`)
- Cobro total → `estadoPago = PAGADO`, `montoPagado = montoTotal`

**Criterio de éxito:** Se ve quién debe cuánto, se puede registrar un cobro.

---

## Sesión 6 — Pagos Semanales (Cuentas Corrientes)

**Objetivo:** Gestionar los grupos de clientes que pagan en conjunto al cierre de semana.

**Tareas:**
1. `src/actions/pagosSemanal.ts` — `getCuentasCorrientes`, `abrirPeriodo`, `cerrarPeriodo`, `registrarPagoSemanal`
2. `src/app/pagos-semanales/page.tsx` — Lista de cuentas corrientes con estado del período actual
3. `src/app/pagos-semanales/[id]/page.tsx` — Detalle de cuenta: sub-locales, pedidos de la semana, total, estado

**Lógica del período:**
- Al inicio de semana, el sistema agrupa automáticamente los pedidos de clientes con `formaPagoPref = PAGO_SEMANAL` por su `CuentaCorriente`
- El total del período = suma de `pedidos.montoTotal` en el rango de fechas
- Al registrar el pago, se crea/actualiza el `PeriodoSemanal` con `montoPagado` y `fechaPago`

**Criterio de éxito:** Se puede ver el resumen semanal de cada cuenta y registrar el cobro.

---

## Sesión 7 — Repartidores

**Objetivo:** Vista por repartidor con resumen del día y de la semana.

**Tareas:**
1. `src/actions/repartidores.ts` — `getRepartidores`, `getResumenRepartidor`
2. `src/app/repartidores/page.tsx` — Lista con stats de hoy (cajas, monto)
3. `src/app/repartidores/[id]/page.tsx` — Detalle: pedidos asignados hoy, recaudación, clientes

**Criterio de éxito:** Se puede ver cuántas cajas entregó cada repartidor hoy y cuánto cobró.

---

## Sesión 8 — Reportes y Catálogos

**Objetivo:** Completar el CRUD de catálogos y agregar reportes básicos.

**Tareas:**
1. `src/app/productos/page.tsx` — Lista + edición de precios de referencia
2. `/config/zonas` — ABM de zonas
3. `/config/repartidores` — ABM de repartidores
4. Reporte semanal: total cajas por producto, total recaudado por forma de pago, ranking clientes
5. Exportar a CSV (opcional)

---

## Consideraciones técnicas transversales

### Server Actions pattern
```typescript
// src/actions/pedidos.ts
"use server";
import { prisma } from "@/lib/prisma";

export async function getPedidosPorFecha(fecha: Date) {
  return prisma.pedido.findMany({
    where: { fecha },
    include: { cliente: { include: { zona: true } }, producto: true, repartidor: true },
    orderBy: [{ cliente: { zona: { nombre: "asc" } } }, { cliente: { nombre: "asc" } }],
  });
}
```

### Manejo de fechas
- Siempre usar `@db.Date` en Prisma para fechas sin hora
- En el cliente, `new Date().toISOString().split("T")[0]` para la fecha de hoy
- Las rutas `/pedidos/[fecha]` usan formato `YYYY-MM-DD`

### Formateo de montos
```typescript
// Reutilizar en toda la app
export function formatearPeso(monto: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(monto);
}
```

### Sugerencias de maduración (para datalist)
```typescript
export const MADURACIONES_SUGERIDAS = [
  "PF",
  "SEMI",
  "VERDE",
  "PF-SEMI",
  "PF-SEMI-V",
  "PF-SEMI-VERDE",
  "SEMI-VERDE",
  "1PF-1SEMI",
  "1SEMI-1VERDE",
  "2PF-1SEMI",
  "2PF-2SEMI",
  "5PF-4SEMI",
  "1PF-1SEMI-VERDE",
  "PSV",
];
```

---

## Relación con el proyecto facturador

- `facturador/` — sistema de facturación electrónica (AFIP), **pausado**
- `gestor/` — este proyecto, activo
- **DB separadas** — no comparten nada a nivel base de datos
- En el futuro, `requiereFactura` y `estadoFactura` en `pedidos` serán el punto de integración
- La columna `FACTURAS` del Excel (FACTURAR, COORDINA, LA FACTU B) mapea a `requiereFactura = true` + `observaciones`
