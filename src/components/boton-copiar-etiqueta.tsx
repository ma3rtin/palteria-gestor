"use client";

import { formatearFechaCorta } from "@/lib/utils";

interface Pedido {
  fecha: Date;
  cliente: { nombre: string; zona: { nombre: string } };
  producto: { nombre: string; kgPorCaja: number | null };
  cajas: number;
  montoTotal: number;
  formaPago: string;
  maduracion: string;
}

export function BotonCopiarEtiqueta({ pedido, onCopied }: { pedido: Pedido; onCopied: () => void }) {
  const copiarEtiqueta = () => {
    const fecha = formatearFechaCorta(pedido.fecha).split("/").slice(0, 2).join("/");
    const texto = `LA PALTERÍA   ${fecha}
${pedido.cliente.nombre.toUpperCase()}
ZONA: ${pedido.cliente.zona.nombre.toUpperCase()}
CAJAS: ${pedido.cajas}
MARCA: ${pedido.producto.nombre.toUpperCase()}
MADURACIÓN: ${pedido.maduracion.toUpperCase()}
${pedido.formaPago === "TRANSFERENCIA" ? "TRANSFERENCIA" : "EFECTIVO"}: $${pedido.montoTotal.toLocaleString("es-AR")}
PESO POR CAJÓN: ${pedido.producto.kgPorCaja ?? 0} kg`;

    navigator.clipboard.writeText(texto).then(() => {
      onCopied();
    });
  };

  return (
    <button
      onClick={copiarEtiqueta}
      className="text-[#9ca3af] hover:text-[#a3e635] p-1 transition-colors"
      title="Copiar etiqueta"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
  );
}
