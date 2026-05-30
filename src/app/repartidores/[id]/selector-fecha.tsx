"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SelectorFecha({ idRepartidor, fechaActual }: { idRepartidor: string; fechaActual: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`flex items-center gap-2 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      <label className="text-xs text-[#9ca3af]">Fecha:</label>
      <input
        type="date"
        defaultValue={fechaActual}
        disabled={isPending}
        onChange={(e) => {
          const val = e.target.value;
          startTransition(() => {
            router.push(`/repartidores/${idRepartidor}?fecha=${val}`);
          });
        }}
        className="border border-[#2a2d35] rounded px-3 py-1.5 text-sm focus:outline-none bg-[#1c1f26] text-white"
      />
      {isPending && (
        <div className="w-4 h-4 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}
