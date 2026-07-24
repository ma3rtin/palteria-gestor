export function formatearPeso(monto: number) {
  if (isNaN(monto)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(monto);
}

export function formatearFecha(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha + "T12:00:00") : fecha;
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearFechaCorta(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha + "T12:00:00") : fecha;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
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
  producto: { nombre: string; kgPorCaja: number | null };
  cajas: number;
  montoTotal: number;
  maduracion: string;
}): string {
  const cajaVal = pedido.producto.kgPorCaja ? `${pedido.producto.kgPorCaja} kg` : "—";
  const cantidadVal = pedido.cajas.toString().replace(".", ",");
  const totalFormateado = `$ ${pedido.montoTotal.toLocaleString("es-AR")}`;

  return [
    pedido.cliente.nombre,
    pedido.cliente.zona.nombre,
    cajaVal,
    cantidadVal,
    pedido.producto.nombre,
    pedido.maduracion,
    totalFormateado
  ].join("\t");
}
