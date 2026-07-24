"use client";

import Link from "next/link";
import { marcarPagado, eliminarPedido } from "@/actions/pedidos";
import { BotonSubmit } from "@/components/boton-submit";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet } from "lucide-react";

import { obtenerFilaExcel } from "@/lib/utils";

export function AccionesPedido({ pedido, fecha }: { pedido: any; fecha: string }) {
  const { showToast, ToastComponent } = useToast();

  const copiarExcel = () => {
    const fila = obtenerFilaExcel(pedido);
    navigator.clipboard.writeText(fila).then(() => {
      showToast("Pedido copiado");
    });
  };

  if (pedido.estadoPago === "PAGADO") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={copiarExcel}
          className="text-[#9ca3af] hover:text-[#a3e635] p-1.5 transition-colors"
          title="Copiar pedido"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>
        <Link
          href={`/pedidos/${fecha}/${pedido.id}/editar`}
          className="border border-[#2a2d35] text-[#9ca3af] px-2 py-1 rounded text-xs hover:border-[#a3e635] hover:text-[#a3e635] transition-colors"
        >
          Editar
        </Link>
        {ToastComponent}
      </div>
    );
  }

  const marcarPagadoAction = marcarPagado.bind(null, pedido.id);
  const eliminarAction = eliminarPedido.bind(null, pedido.id, fecha);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={copiarExcel}
        className="text-[#9ca3af] hover:text-[#a3e635] p-1.5 transition-colors"
        title="Copiar pedido"
      >
        <FileSpreadsheet className="w-4 h-4" />
      </button>
      <Link
        href={`/pedidos/${fecha}/${pedido.id}/editar`}
        className="border border-[#2a2d35] text-[#9ca3af] px-2 py-1 rounded text-xs hover:border-[#a3e635] hover:text-[#a3e635] transition-colors"
      >
        Editar
      </Link>
      <form action={marcarPagadoAction}>
        <BotonSubmit
          className="bg-[#16a34a] text-white px-2.5 py-1 rounded text-xs hover:bg-[#15803d] transition-colors"
        >
          Pagado
        </BotonSubmit>
      </form>
      <form action={eliminarAction}>
        <BotonSubmit
          className="text-[#6b7280] hover:text-red-500 px-1 py-1 text-xs transition-colors"
        >
          ✕
        </BotonSubmit>
      </form>
      {ToastComponent}
    </div>
  );
}
