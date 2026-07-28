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
| **21 — Fixes y Buscadores (Revendedores, Pedidos, Cobranzas y Pagos)** | ✅ | Tarjetas de Balance, registro de liquidación libre y tabs/historial paginados en revendedores. Redirección y despliegue automático del pedido, selector de fecha interactivo y botón Hoy en pedidos. Paginación y buscador por cliente en cobranzas pendientes. Buscador de cuentas/locales en pagos semanales. Fix de divisor blanco en lista de repartidores hoy. Componetización de Paginador genérico. Rediseño compacto y paginación en listados de clientes, repartidores y pagos semanales. Skeletons de carga interactiva en clientes. Optimización en next.config.ts para compilación segura de memoria. Corrección de actualización e inputs saltarines en lista de productos con useTransition, router.refresh e íconos Save en espacio reservado, alineando exactamente sus cabeceras th y nombrando la columna Acciones. Actualización de formato de Copiar Etiqueta incorporando dirección del cliente y método de pago. |
| **22 — Pagos Parciales, Historial de Cliente y Selector Compacto** | ✅ | Múltiples pagos por pedido mediante desglose en panel interactivo en formulario de edición (Efectivo/Transferencia/etc.), almacenamiento en columna pagosParciales de tipo JSON, soporte en el botón de WhatsApp listando todos los desgloses en líneas independientes. Consolidación de historial unificado de pagos (cobros directos, desgloses y pagos de CC) en detalle de cliente usando componente TabsCliente. Reducción visual a text-[11px] y reemplazo de lápiz ✎ por flecha ▼ en hover en SelectorEstadoFactura. |
| **23 — Cobro Rápido con Método, Estados Reactivos y Favicon Transparente** | ✅ | Solución a bug de repartidor en Prisma. Adición de selector de método de pago en formulario de cobranza rápida de tabla de entregas diaria, que impacta directamente en el JSON pagosParciales. Rediseño reactivo bidireccional en el formulario de edición de pedidos: desglose y botón Agregar Pago siempre activos, cálculo automático de estado de pago según la suma de desgloses, y ajuste inteligente del desglose al modificar manualmente el selector de estado. Incorporación de favicon oficial (icon.png) con fondo transparente y mascota simplificada (palta con corona, sin cara/extremidades) maximizada/centrada al 90% mediante autocrop en script de Jimp a partir de la mascota original. |
| **24 — Limpieza Historial de Pagos de Revendedor** | ✅ | Remoción de la columna "Comisión Calculada" en la tabla de historial de pagos del detalle de revendedor para simplificar la interfaz y evitar confusiones sobre su función. |
| **25 — Limpieza de Pedidos y Fix de Edición de Revendedor** | ✅ | Eliminación de los 14 pedidos de prueba de Pato restaurando stock de cajas. Corrección en la pantalla de edición de pedido para que la información del revendedor se lea directamente desde la relación pedido.cliente (en lugar del catálogo de clientes activos que puede sufrir cache/stale state), previniendo que la comisión de revendedor se guarde accidentalmente como 0 en la base de datos al realizar cambios en otros campos del pedido. Expansión del cálculo del rango de la semana actual en toda la aplicación para que finalice el domingo (+6 días desde lunes) en lugar del sábado (+5), permitiendo que los pedidos ingresados los domingos se muestren en los paneles de control y en el historial de revendedores de manera predeterminada. |
| **26 — Limpieza de peso y ordenación de pedidos por hora** | ✅ | Remoción de la información de peso en etiquetas y portapapeles. Registro de la hora ART de creación en pedidos/cobros, visualización en el desglose de entregas y cobros, y ordenación por defecto de forma descendente (los últimos creados arriba). |
| **27 — Script de reseteo transaccional** | ✅ | Creación de script `prisma/clear-transactions.ts` y comando en `package.json` para limpiar pedidos, pagos y liquidaciones de prueba, y resetear stock a 0, preservando catálogos maestros de clientes, zonas, etc. |

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
