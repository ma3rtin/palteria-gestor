"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarCajasPedido, actualizarCajasItemPedido } from "@/actions/pedidos";
import { Minus, Plus } from "lucide-react";

interface Props {
  cajasActuales: number;
  idPedido?: number;
  idItemPedido?: number;
  onUpdated?: () => void;
  className?: string;
}

export function EditorCantidadPedido({
  cajasActuales,
  idPedido,
  idItemPedido,
  onUpdated,
  className = "",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cajas, setCajas] = useState<number | string>(cajasActuales);

  useEffect(() => {
    setCajas(cajasActuales);
  }, [cajasActuales]);

  const handleGuardar = (nuevoValor: number) => {
    if (isNaN(nuevoValor) || nuevoValor <= 0) {
      setCajas(cajasActuales);
      return;
    }
    if (nuevoValor === cajasActuales) return;

    startTransition(async () => {
      try {
        if (idItemPedido) {
          await actualizarCajasItemPedido(idItemPedido, nuevoValor);
        } else if (idPedido) {
          await actualizarCajasPedido(idPedido, nuevoValor);
        }
        onUpdated?.();
        router.refresh();
      } catch (err) {
        console.error("Error al actualizar cajas:", err);
        setCajas(cajasActuales);
      }
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${isPending ? "opacity-60 pointer-events-none" : ""} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isPending || Number(cajas) <= 0.5}
        onClick={(e) => {
          e.stopPropagation();
          const val = Math.max(0.5, Math.round((Number(cajas) - 1) * 10) / 10);
          setCajas(val);
          handleGuardar(val);
        }}
        className="w-5 h-5 rounded bg-[#2a2d35] hover:bg-[#373b45] text-[#d1d5db] hover:text-[#f9fafb] flex items-center justify-center text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Restar 1 caja"
      >
        <Minus className="w-3 h-3" />
      </button>

      <input
        type="number"
        step="0.5"
        min="0.5"
        value={cajas}
        onChange={(e) => setCajas(e.target.value)}
        onBlur={() => {
          const num = parseFloat(String(cajas));
          if (!isNaN(num) && num > 0) {
            handleGuardar(num);
          } else {
            setCajas(cajasActuales);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-12 text-center text-xs font-mono font-semibold text-[#a3e635] bg-[#1c1f26] border border-[#2a2d35] hover:border-[#a3e635] focus:border-[#a3e635] rounded px-1 py-0.5 focus:outline-none transition-colors"
        title="Editar cantidad de cajas"
      />

      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          const val = Math.round((Number(cajas) + 1) * 10) / 10;
          setCajas(val);
          handleGuardar(val);
        }}
        className="w-5 h-5 rounded bg-[#2a2d35] hover:bg-[#373b45] text-[#d1d5db] hover:text-[#f9fafb] flex items-center justify-center text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Sumar 1 caja"
      >
        <Plus className="w-3 h-3" />
      </button>

      <span className="text-[11px] text-[#9ca3af] select-none">
        {Number(cajas) === 1 ? "caja" : "cajas"}
      </span>
    </div>
  );
}
