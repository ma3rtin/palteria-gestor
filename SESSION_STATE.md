# Estado de Sesión y Backlog - Gestor La Paltería

Este archivo registra el historial de desarrollo por sesiones y las tareas pendientes (backlog) de la aplicación. Es la fuente de verdad al retomar el trabajo en cada sesión.

---

## 1. Historial de Sesiones

| Sesión | Estado | Descripción |
| :--- | :---: | :--- |
| **1 — Setup** | ✅ | Proyecto scaffoldeado, schema Prisma, seed con datos del Excel, documentación básica. |
| **2 — Layout + Dashboard** | ✅ | Dashboard con stats del día, tarjetas, resumen por repartidor. |
| **3 — Clientes CRUD** | ✅ | Lista, detalle, nuevo, editar, toggle activo, saldo, búsqueda. |
| **4 — Pedidos del día** | ✅ | Vista diaria, nuevo pedido, marcar pagado/parcial, eliminar, cobros. |
| **5 — Cobranzas** | ✅ | Deudas por cliente, filtros zona/repartidor, cobrar todo. |
| **6 — Pagos semanales** | ✅ | Lista cuentas corrientes, detalle con pedidos por sub-local, registrar pago. |
| **7 — Repartidores** | ✅ | Lista con stats hoy, detalle con selector de fecha. |
| **8 — Reportes** | ✅ | `/productos`, `/config/zonas`, `/config/repartidores`. |
| **9 — Schema v2** | ✅ | Producto sin `@unique` + `fechaIngreso`, `Pedido.esReposicion`, modelo `PagoLocal`. |
| **10 — Pagos por local** | ✅ | UI para `PagoLocal`: cobro global con repartidor, cobro por local con `<details>` en cada card, historial plano de pagos. |
| **11 — Dashboard v2** | ✅ | Stats semanales (pedidos, cajas, facturado/cobrado) + top 6 productos por cajas. |
| **12 — Auth** | ✅ | NextAuth v5 credentials, modelo Usuario, middleware, login page, sign out en nav. |
| **13 — Seed fix + diaCobranza** | ✅ | `diaCobranza` completado desde Excel real (11 cuentas con null); 4 cuentas nuevas (GARDINER, BARRACAS VELEZ, CORRIENTES NUEVO PANERA ROSA, TAPIA DE CRUZ); default pagos-semanales = semana anterior completa. |
| **14 — Entrega al cliente** | ✅ | Flujo cambios implementado, perfil de usuario, bugs fixes, propuesta enviada al cliente. |
| **15 — Reportes** | ✅ | Sección `/reportes` con selector de período (presets + rango libre), tarjetas resumen, top productos, por repartidor, por forma de pago. |
| **16 — Stock** | ✅ | `kgPorCaja` (select 10/11) + `stockCajas` en Producto; descuento automático al crear pedido, restauración al eliminar; UI `/productos` rediseñada. |
| **17 — Revendedores** | ✅ | Schema (Revendedor, LiquidacionRevendedor); actions; `/revendedores`, `/revendedores/[id]`, `/config/revendedores`; liquidación semanal por tipo (COMISION/MARGEN/DESCUENTO); historial. |
| **18 — Optimización Gemini** | ✅ | Transición total a Gemini. Creación de reglas de espacio de trabajo en `.agents/AGENTS.md`, reemplazo de `CLAUDE.md` por `SESSION_STATE.md` y limpieza de planes heredados obsoletos. |
| **19 — Revendedores, Costos, Tabla y Bug de Pago** | ✅ | Simplificación de revendedores. Costos de stock. Tabla compacta. Sincronización de pagos. Copiado Excel/ticket. Historial cliente. Spinner puro. Nombre de revendedor en verde oscuro (font-medium) en labels de formularios y sin checkmark. |
| **20 — Sidebar interactivo y Configuración unificada** | ✅ | Sidebar de configuración colapsable y animado. Rediseño y unificación de configuración de Repartidores, Zonas y Revendedores en 2 Cards por pantalla (creador inline compacto arriba y barra de búsqueda + listado unificados abajo). Incluye buscador y filtros/ordenamiento select inline en memoria client-side (sin requests adicionales a Supabase). |

---

## 2. Backlog Activo

### Prioritario / Próximos Pasos
- **Etiquetas para impresión**: Generar texto formateado por pedido para que el cliente copie y pegue en una hoja e imprima.
  - *Pendiente*: Que el cliente confirme qué datos exactos necesita en la etiqueta.
- **Exportar Excel de Pedidos**: Botón en `/pedidos` para exportar rango de fechas (default: mes anterior). Columnas: fecha, cliente, zona, producto, cajas, maduración, monto, forma de pago, estado, repartidor. Librería recomendada: `xlsx`.
- **Exportar Excel de Cobranzas/Cuentas Corrientes**: Exportar saldos pendientes por cliente o historial de pagos por cuenta. Útil para auditoría y contador.

### Backlog Secundario / Mejoras
- **Componetización y Desduplicación Gradual**: Refactorizar y modularizar código repetido de manera progresiva a través de toda la aplicación, chequeando consistencia en cada cambio.
- **Cobertura de Tests**: Agregar pruebas automatizadas (tests unitarios y de integración) por toda la aplicación.
- **Historial de Precios por Producto**: Panel para ver la variación de precios de cada variedad de producto semana a semana, útil al fijar precios de venta.
- **App Repartidores (Mobile)**: Presupuestada por separado. La arquitectura actual está lista para consumirse mediante una API o vistas optimizadas en mobile.
