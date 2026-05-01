type EstadoPago = "PENDIENTE" | "PAGADO" | "PARCIAL";
type EstadoFactura = "NO_REQUIERE" | "PENDIENTE" | "EMITIDA";

const coloresPago: Record<EstadoPago, string> = {
  PENDIENTE: "bg-red-100 text-red-700",
  PARCIAL: "bg-yellow-100 text-yellow-700",
  PAGADO: "bg-green-100 text-green-700",
};

const etiquetasPago: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADO: "Pagado",
};

const coloresFactura: Record<EstadoFactura, string> = {
  NO_REQUIERE: "bg-gray-100 text-gray-500",
  PENDIENTE: "bg-orange-100 text-orange-700",
  EMITIDA: "bg-blue-100 text-blue-700",
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
