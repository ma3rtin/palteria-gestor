"use client";

import { useRouter } from "next/navigation";

export function SelectorFecha({ idRepartidor, fechaActual }: { idRepartidor: string; fechaActual: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[#9ca3af]">Fecha:</label>
      <input
        type="date"
        defaultValue={fechaActual}
        onChange={(e) => router.push(`/repartidores/${idRepartidor}?fecha=${e.target.value}`)}
        className="border border-[#2a2d35] rounded px-3 py-1.5 text-sm focus:outline-none"
      />
    </div>
  );
}
