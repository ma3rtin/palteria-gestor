"use client";

import Link from "next/link";
import { toggleActivoCliente } from "@/actions/clientes";

export function AccionesCliente({ id, activo }: { id: number; activo: boolean }) {
  const toggleAction = toggleActivoCliente.bind(null, id, !activo);

  return (
    <div className="flex gap-2">
      <Link
        href={`/clientes/${id}/editar`}
        className="border border-[#2a2d35] text-[#9ca3af] hover:border-[#4b5563] px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        Editar
      </Link>
      <form action={toggleAction}>
        <button
          type="submit"
          className="border border-[#2a2d35] text-[#9ca3af] hover:border-[#4b5563] px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          {activo ? "Desactivar" : "Activar"}
        </button>
      </form>
    </div>
  );
}
