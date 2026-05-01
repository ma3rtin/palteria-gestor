"use client";

import { useRouter } from "next/navigation";

export function SelectorFecha({ idRepartidor, fechaActual }: { idRepartidor: string; fechaActual: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[#5a6b5c]">Fecha:</label>
      <input
        type="date"
        defaultValue={fechaActual}
        onChange={(e) => router.push(`/repartidores/${idRepartidor}?fecha=${e.target.value}`)}
        className="border border-[#dde6de] rounded px-3 py-1.5 text-sm focus:outline-none"
      />
    </div>
  );
}
