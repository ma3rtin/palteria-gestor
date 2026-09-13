export function formatearPeso(monto: number) {
  if (isNaN(monto)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(monto);
}

export function formatearFecha(fecha: Date | string | null | undefined) {
  if (!fecha) return "—";
  try {
    const fechaStr = typeof fecha === "string" ? fecha.split("T")[0] : fecha.toISOString().split("T")[0];
    const d = new Date(fechaStr + "T12:00:00");
    return d.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatearFechaCorta(fecha: Date | string | null | undefined) {
  if (!fecha) return "—";
  try {
    const fechaStr = typeof fecha === "string" ? fecha.split("T")[0] : fecha.toISOString().split("T")[0];
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      const [year, month, day] = partes;
      return `${day}/${month}/${year.slice(-2)}`;
    }
    const d = new Date(fechaStr + "T12:00:00");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return "—";
  }
}

export function formatearHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function hoyISO(): string {
  // en-CA formatea como YYYY-MM-DD; timeZone evita que el servidor UTC devuelva "mañana" después de las 21hs AR
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

// Convierte "2026-05-01" a Date a mediodía para evitar problemas de timezone
export function parseFechaRuta(fechaStr: string): Date {
  return new Date(fechaStr + "T12:00:00");
}

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
  "3PF-1SEMI",
  "5PF-4SEMI",
  "1PF-1SEMI-VERDE",
  "PSV",
];

export const ETIQUETAS_FORMA_PAGO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  PAGO_SEMANAL: "Pago Semanal",
  CAMBIO: "Cambio",
};

export const ETIQUETAS_ESTADO_PAGO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  PARCIAL: "Parcial",
};

export function obtenerFilaExcel(pedido: {
  cliente: { nombre: string; zona: { nombre: string } };
  producto?: { nombre: string; kgPorCaja: number | null } | null;
  items?: Array<{ cajas: number; maduracion: string; producto: { nombre: string } }>;
  cajas: number;
  montoTotal: number;
  maduracion?: string | null;
}): string {
  const cantidadVal = pedido.cajas.toString().replace(".", ",");
  const totalFormateado = `$ ${pedido.montoTotal.toLocaleString("es-AR")}`;
  const nombreProducto = pedido.items && pedido.items.length > 1
    ? pedido.items.map((it) => `${it.cajas} ${it.producto.nombre}`).join(" + ")
    : (pedido.producto?.nombre ?? "—");
  const maduracion = pedido.maduracion ?? "";

  return [
    pedido.cliente.nombre,
    pedido.cliente.zona.nombre,
    cantidadVal,
    nombreProducto,
    maduracion,
    totalFormateado
  ].join("\t");
}
