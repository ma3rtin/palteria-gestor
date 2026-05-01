type EstadoPago = "PENDIENTE" | "PAGADO" | "PARCIAL";
type EstadoFactura = "NO_REQUIERE" | "PENDIENTE" | "EMITIDA";

const coloresPago: Record<EstadoPago, string> = {
  PENDIENTE: "bg-red-950 text-red-400",
  PARCIAL:   "bg-yellow-950 text-yellow-400",
  PAGADO:    "bg-green-950 text-green-400",
};

const etiquetasPago: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADO: "Pagado",
};

const coloresFactura: Record<EstadoFactura, string> = {
  NO_REQUIERE: "bg-[#22252e] text-[#6b7280]",
  PENDIENTE:   "bg-orange-950 text-orange-400",
  EMITIDA:     "bg-blue-950 text-blue-400",
};

const etiquetasFactura: Record<EstadoFactura, string> = {
  NO_REQUIERE: "—",
  PENDIENTE: "Facturar",
  EMITIDA: "Emitida",
};

export function BadgeEstadoPago({ estado }: { estado: EstadoPago }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${coloresPago[estado]}`}>
      {etiquetasPago[estado]}
    </span>
  );
}

export function BadgeEstadoFactura({ estado }: { estado: EstadoFactura }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${coloresFactura[estado]}`}>
      {etiquetasFactura[estado]}
    </span>
  );
}
