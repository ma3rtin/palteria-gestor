"use client";

import { Receipt } from "lucide-react";

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
    const texto = `${pedido.cliente.nombre.toUpperCase()}
ZONA: ${pedido.cliente.zona.nombre.toUpperCase()}
PESO POR CAJÓN: ${pedido.producto.kgPorCaja ? `${pedido.producto.kgPorCaja} kg` : "—"}
CAJAS: ${pedido.cajas}
MARCA: ${pedido.producto.nombre.toUpperCase()}
MADURACIÓN: ${pedido.maduracion.toUpperCase()}
TOTAL: $${pedido.montoTotal.toLocaleString("es-AR")}`;

    navigator.clipboard.writeText(texto).then(() => {
      onCopied();
    });
  };

  return (
    <button
      onClick={copiarEtiqueta}
      className="inline-flex items-center gap-1.5 border border-[#2a2d35] hover:border-[#a3e635] text-[#9ca3af] hover:text-[#a3e635] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-[#1c1f26]"
      title="Copiar etiqueta para WhatsApp"
    >
      <Receipt className="w-3.5 h-3.5 text-[#a3e635]" />
      <span>Copiar Etiqueta</span>
    </button>
  );
}
