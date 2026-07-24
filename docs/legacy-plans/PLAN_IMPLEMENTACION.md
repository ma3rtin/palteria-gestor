# Plan: Últimos Arreglos y Mejoras Operativas

Este documento detalla el plan progresivo para incorporar las mejoras solicitadas al proyecto `gestor`.

---

## Fase 1: Edición y Control de Pedidos
*Objetivo: Flexibilidad operativa y corrección de comportamientos de entrada.*
- [ ] **Tareas:** Editar pedidos (cajas, cantidades, precios), permitir editar `montoTotal`, eliminar autocompletado de ceros, asignar/modificar repartidores post-creación.
- [ ] **Testing:** Crear un pedido, editar todos sus campos, verificar que el stock y los totales se actualicen correctamente en la vista de pedidos y en el resumen diario.
- [ ] **Preguntas para el cliente:**
    1. ¿Al editar un pedido ya entregado, el cambio de cajas debe ajustar automáticamente el stock de productos, o esto genera descuadre contable?
    2. ¿El cambio de repartidor debe quedar registrado en un historial, o solo sobreescribimos el valor actual?

## Fase 2: Gestión Operativa y Facturación
*Objetivo: Control administrativo y agilidad en despacho.*
- [ ] **Tareas:** Agregar estado de facturación editable, función de impresión de etiquetas.
- [ ] **Testing:** Cambiar estado de facturación entre estados definidos; generar vista de impresión de etiqueta y verificar que contenga los datos correctos del pedido.
- [ ] **Preguntas para el cliente:**
    1. ¿El estado de facturación debe tener un log de quién lo cambió y cuándo?
    2. ¿Qué información exacta debe ir en la etiqueta? (Nombre cliente, producto, fecha, repartidor).

## Fase 3: Gestión Financiera Avanzada
*Objetivo: Consolidación de pagos y cobranzas.*
- [ ] **Tareas:** Bloquear modificación de pagos semanales una vez fijados, desarrollar panel de cobranzas.
- [ ] **Testing:** Intentar editar un periodo de pago semanal ya cerrado (debe estar bloqueado). Verificar la vista de cuentas corrientes con deudas pendientes.
- [ ] **Preguntas para el cliente:**
    1. ¿Existe algún caso donde deba editarse un pago semanal ya cerrado (ej. error humano)?
    2. ¿El panel de cobranzas debe permitir exportar las deudas a un formato tipo Excel?

## Fase 4: Stock y Costos
*Objetivo: Visibilidad de rentabilidad.*
- [ ] **Tareas:** Sección de costos de stock.
- [ ] **Testing:** Verificar que la visualización de costos coincida con la suma de los productos registrados en stock.
- [ ] **Preguntas para el cliente:**
    1. ¿Los costos de stock se calculan por precio de referencia o necesitamos un campo nuevo para ingresar el costo real de compra?

---

### Metodología
Desarrollo en ciclos de **Planificación -> Implementación -> Validación (Tests)**.
¿Procedemos con la Fase 1 tras aclarar las preguntas?
