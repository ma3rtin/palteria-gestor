"use client";

import { actualizarEstadoFactura } from "@/actions/pedidos";
import { useState } from "react";

export function SelectorEstadoFactura({ idPedido, estadoActual }: { idPedido: number; estadoActual: "NO_REQUIERE" | "PENDIENTE" | "EMITIDA" }) {
  const [estado, setEstado] = useState(estadoActual);

  const getStyle = (est: string) => {
    switch (est) {
      case "EMITIDA": return "bg-green-900/30 text-green-400 border-green-700";
      case "PENDIENTE": return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      default: return "bg-[#2a2d35] text-[#9ca3af] border-[#4b5563]";
    }
  };

  return (
    <div className="relative inline-block group">
      <select
        value={estado}
        onChange={async (e) => {
          const nuevoEstado = e.target.value as any;
          setEstado(nuevoEstado);
          await actualizarEstadoFactura(idPedido, nuevoEstado);
        }}
        className={`appearance-none text-[11px] rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#a3e635] ${getStyle(estado)} pr-[18px]`}
      >
        <option value="NO_REQUIERE">Sin facturar</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="EMITIDA">Emitida</option>
      </select>
      <span className="absolute right-1 top-[52%] -translate-y-1/2 text-[7px] opacity-0 group-hover:opacity-100 pointer-events-none text-current transition-opacity duration-150">
        ▼
      </span>
    </div>
  );
}
