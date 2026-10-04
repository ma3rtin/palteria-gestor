"use client";

import { actualizarRepartidorPedido } from "@/actions/pedidos";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

interface RepartidorItem {
  id: number;
  nombre: string;
}

interface Props {
  idPedido: number;
  idRepartidorActual: number | null;
  repartidores: RepartidorItem[];
  onUpdated?: () => void;
}

export function SelectorRepartidorPedido({ idPedido, idRepartidorActual, repartidores, onUpdated }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [idRepartidor, setIdRepartidor] = useState<number | null>(idRepartidorActual);

  useEffect(() => {
    setIdRepartidor(idRepartidorActual);
  }, [idRepartidorActual]);

  const esSinAsignar = idRepartidor === null;

  return (
    <div className="relative inline-block group">
      <select
        value={idRepartidor ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const val = e.target.value === "" ? null : Number(e.target.value);
          setIdRepartidor(val);
          startTransition(async () => {
            await actualizarRepartidorPedido(idPedido, val);
            onUpdated?.();
            router.refresh();
          });
        }}
        className={`appearance-none text-[11px] rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#a3e635] transition-colors pr-[18px] ${
          esSinAsignar
            ? "bg-red-500/10 text-red-400 border-red-500/30 font-semibold"
            : "bg-[#1c1f26] text-[#d1d5db] border-[#2a2d35] hover:border-[#a3e635] font-medium"
        } ${isPending ? "opacity-60" : ""}`}
        title="Cambiar repartidor"
      >
        <option value="">Sin asignar</option>
        {repartidores.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>
      <span className="absolute right-1 top-[52%] -translate-y-1/2 text-[7px] opacity-0 group-hover:opacity-100 pointer-events-none text-current transition-opacity duration-150">
        ▼
      </span>
    </div>
  );
}
