"use client";

import { Receipt } from "lucide-react";

interface PagoParcialItem {
  monto: number;
  formaPago: string;
  fecha: string;
}

interface Pedido {
  fecha: Date;
  cliente: {
    nombre: string;
    direccion: string | null;
    zona: { nombre: string };
  };
  producto: {
    nombre: string;
    kgPorCaja: number | null;
  };
  cajas: number;
  montoTotal: number;
  formaPago: string;
  montoPagado: number;
  maduracion: string;
  pagosParciales?: any;
}

export function BotonCopiarEtiqueta({ pedido, onCopied }: { pedido: Pedido; onCopied: () => void }) {
  const copiarEtiqueta = () => {
    // Evitar desfase de huso horario leyendo la fecha de forma posicional YYYY-MM-DD
    const fechaStr = pedido.fecha instanceof Date ? pedido.fecha.toISOString() : String(pedido.fecha);
    const partes = fechaStr.split("T")[0].split("-");
    const dia = partes.length === 3 ? partes[2] : "01";
    const mes = partes.length === 3 ? partes[1] : "01";

    const clienteInfo = pedido.cliente.direccion
      ? `${pedido.cliente.nombre.toUpperCase()}\n${pedido.cliente.direccion.toUpperCase()}`
      : pedido.cliente.nombre.toUpperCase();

    // Generar bloque de pagos
    let pagosStr = "";
    if (pedido.pagosParciales && Array.isArray(pedido.pagosParciales) && pedido.pagosParciales.length > 0) {
      pagosStr = (pedido.pagosParciales as PagoParcialItem[])
        .map((p) => `${p.formaPago.toUpperCase()}: $${p.monto.toLocaleString("es-AR")}`)
        .join("\n");
    } else {
      pagosStr = `${pedido.formaPago.toUpperCase()}: $${pedido.montoPagado.toLocaleString("es-AR")}`;
    }

    const texto = `LA PALTERÍA ${dia}/${mes}
${clienteInfo}
ZONA: ${pedido.cliente.zona.nombre.toUpperCase()}
CAJAS: ${pedido.cajas}
MARCA: ${pedido.producto.nombre.toUpperCase()}
MADURACIÓN: ${pedido.maduracion.toUpperCase()}
${pagosStr}
PESO POR CAJÓN: ${pedido.producto.kgPorCaja ? `${pedido.producto.kgPorCaja} kg` : "—"}`;

    navigator.clipboard.writeText(texto).then(() => {
      onCopied();
    });
  };

  return (
    <button
      onClick={copiarEtiqueta}
      className="inline-flex items-center gap-1.5 border border-[#2a2d35] hover:border-[#a3e635] text-[#9ca3af] hover:text-[#a3e635] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-[#1c1f26] cursor-pointer"
      title="Copiar etiqueta para WhatsApp"
    >
      <Receipt className="w-3.5 h-3.5 text-[#a3e635]" />
      <span>Copiar Etiqueta</span>
    </button>
  );
}
