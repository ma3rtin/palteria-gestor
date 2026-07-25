"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hoyISO } from "@/lib/utils";

interface Props {
  fechaActual: string;
  fechaAnteriorStr: string;
  fechaSiguienteStr: string;
  fechaFormateada: string;
}

export function NavegacionFecha({
  fechaActual,
  fechaAnteriorStr,
  fechaSiguienteStr,
  fechaFormateada,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleFechaChange = (nuevaFecha: string) => {
    if (!nuevaFecha) return;
    startTransition(() => {
      router.push(`/pedidos/${nuevaFecha}`);
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      {/* Botón Día Anterior */}
      <Link
        href={`/pedidos/${fechaAnteriorStr}`}
        className="p-2 border border-[#2a2d35] rounded-lg hover:border-[#4b5563] text-[#9ca3af] text-sm transition-colors flex items-center justify-center bg-[#1c1f26]"
      >
        <ChevronLeft size={16} />
      </Link>

      {/* Info Fecha Actual y Selector */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-[#f9fafb] capitalize">{fechaFormateada}</h1>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="date"
            value={fechaActual}
            disabled={isPending}
            onChange={(e) => handleFechaChange(e.target.value)}
            className="border border-[#2a2d35] rounded px-3 py-1 text-xs focus:outline-none bg-[#1c1f26] text-[#9ca3af] font-mono cursor-pointer transition-colors focus:border-[#a3e635]"
          />
          {fechaActual !== hoyISO() && (
            <button
              onClick={() => handleFechaChange(hoyISO())}
              disabled={isPending}
              className="text-[10px] text-[#a3e635] hover:underline bg-[#22252e] px-2 py-1 rounded border border-[#2a2d35] cursor-pointer transition-colors hover:border-[#a3e635]"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Botón Día Siguiente */}
      <Link
        href={`/pedidos/${fechaSiguienteStr}`}
        className="p-2 border border-[#2a2d35] rounded-lg hover:border-[#4b5563] text-[#9ca3af] text-sm transition-colors flex items-center justify-center bg-[#1c1f26]"
      >
        <ChevronRight size={16} />
      </Link>

      {/* Spinner de carga si está pendiente */}
      {isPending && (
        <div className="w-4 h-4 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}
