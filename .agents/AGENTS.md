# Reglas del Espacio de Trabajo - Gestor La Paltería

Este archivo contiene las directrices, el contexto de negocio y técnico, y los protocolos operativos específicos para el desarrollo del **Gestor La Paltería** usando **Gemini (Antigravity)**.

---

## 1. Protocolo de Sesión (Inicio y Fin)

### Al iniciar una sesión (Inicialización)
1. **Revisar Estado**: Leer `SESSION_STATE.md` para entender cuál es el estado actual, qué se hizo en la última sesión y cuál es el backlog prioritario.
2. **Revisar Cambios de Git**: Ejecutar `git status` y/o `git diff` si corresponde para verificar que no haya archivos modificados de forma imprevista.
3. **Reportar**: Hacer un breve saludo al usuario indicando que leíste el estado y detallando los siguientes pasos de la sesión.

### Al finalizar una sesión (Cierre)
1. **Validación de Código**: Verificar que no existan errores de compilación (`npm run build` o similar).
2. **Actualizar el Estado**: Agregar una fila al historial de sesiones en `SESSION_STATE.md` con el número de sesión, estado (✅/⚠️), y resumen de lo implementado.
3. **Limpieza**: Eliminar archivos de scratch, planes locales o temporales que no sumen al repositorio.

---

## 2. Contexto General y Estructura de Directorios

El proyecto **gestor** se encuentra dentro de un directorio raíz que agrupa todo el contexto del negocio:

```
/palteria/
├── 20-04 a 25-04.xlsx         # Planilla Excel inicial con la lógica del negocio
├── PROPUESTA_SERVICIO.pdf     # Propuesta de servicio original
├── RESUMEN_APP.md             # Resumen ejecutivo de la aplicación
├── explicacion_revendedores.txt # Guía explicativa de comisiones/márgenes de revendedores
├── facturador/                # Proyecto hermano para facturación AFIP (Pausado)
└── gestor/                    # [Este Proyecto] Sistema web de gestión
```

> [!IMPORTANT]
> El proyecto `facturador/` está pausado. El `gestor` no realiza facturación electrónica de forma directa aún, pero la base de datos está preparada con los campos `requiereFactura` y `estadoFactura` en la tabla `pedidos`.

---

## 3. Modelo de Negocio (La Paltería)

### Entidades y Flujo
- **Clientes**: Padrón de locales/direcciones que compran paltas. Tienen una forma de pago preferida (efectivo, transferencia, pago semanal, cambio).
- **Zonas**: Zonas geográficas de entrega (ej: HAEDO, MORON, CABA).
- **Repartidores**: Conductores asignados a las rutas diarias. Cobran en efectivo/transferencia y entregan cajas.
- **Productos y Lotes**: Las paltas se manejan por lotes. El mismo producto (ej: PERU) puede ingresar en distintos lotes con precios de referencia y fechas de ingreso diferentes.
  - Cuando un lote se agota, se marca como `activo = false` en lugar de borrarlo.
  - Al crear un pedido se descuenta automáticamente el stock en cajas (`stockCajas`).
- **Cuentas Corrientes (Pagos Semanales)**: Clientes agrupados (cadenas de locales) que acumulan deudas y pagan en un día fijo.
  - Pueden registrar un **pago global** (`idCliente = null` en pagos_locales, cubre a todo el grupo) o **pagos individuales** por local.
- **Revendedores**: Intermediarios con clientes propios. Se les liquida semanalmente en base a tres esquemas:
  1. **COMISIÓN**: Gana un monto fijo en pesos por caja vendida, configurable por cliente.
  2. **MARGEN**: Gana la diferencia entre el precio cobrado al cliente y el precio de referencia del producto.
  3. **DESCUENTO**: Gana un monto fijo por caja total vendida en la semana (definido al liquidar).
- **Cambios y Reposiciones**: Entregas con `formaPago = CAMBIO`.
  - Si es reposición sin cargo (`esReposicion = true`), el costo es 0 y el pedido se marca pagado.
  - Si es con diferencia (`esReposicion = false`), se cobra la diferencia de kilos/precio.
- **Cobranzas**: Registro de cobro sobre deudas de pedidos anteriores sin que implique una entrega nueva (`esCobro = true`). No descuenta stock de producto.

---

## 4. Stack Técnico y Directrices Críticas

### Prisma 7 (Gotchas Obligatorios)
- **Configuración**: La URL de la base de datos va exclusivamente en `prisma.config.ts`, no en `schema.prisma`.
- **Generator**: Provider es `prisma-client` (genera en `../src/generated/prisma`).
- **Imports**: Importar `PrismaClient` desde `../generated/prisma/client` y los enums desde `@/generated/prisma/enums`.
- **Driver Adapter**: Es obligatorio usar `@prisma/adapter-pg` y instanciar el cliente con `new PrismaClient({ adapter } as never)`.
- **Transacciones en Supabase (PgBouncer)**: Las transacciones interactivas (`$transaction(async tx => ...)`) **no funcionan** de manera confiable con el pooler en modo transacción de Supabase.
  > [!CAUTION]
  > Se deben ejecutar las queries de forma secuencial con `await` normales y manejar consistencia manualmente. No usar `$transaction`.

### Convenciones de Código
- **Idioma**: Todo en español (nombres de variables, funciones, tipos, base de datos, rutas de UI).
- **Server Actions**: Alojar en `src/actions/` con `"use server"` al inicio.
- **Consumo de datos**: Siempre obtener datos desde Server Components o Server Actions. No usar client-side fetches directos a endpoints de API a menos que sea estrictamente necesario (ej: paginación dinámica).
- **Estilos**: Usar Tailwind CSS v4 puro. No usar shadcn/ui.
- **Iconos**: Usar `lucide-react`. No usar emojis en la UI.
- **Comentarios**: Documentar el "por qué" de las decisiones de negocio no evidentes.

---

## 5. Base de Datos (Mapeos Clave)

Todas las tablas utilizan nomenclatura en español y `snake_case` mediante `@@map` y `@map`:
- `zonas`
- `repartidores`
- `productos` (sin `@unique` en nombre, diferenciados por fecha de ingreso / lote)
- `clientes` (incluye relaciones con zona, repartidor habitual, revendedor, cuenta corriente)
- `cuentas_corrientes` (grupos de facturación semanal, ej: PANERA ROSA)
- `periodos_semanales` (cierres de cuentas corrientes)
- `pagos_locales` (pagos dentro del período semanal)
- `revendedores` y `liquidaciones_revendedor`
- `pedidos` (cada entrega diaria o cobro)
