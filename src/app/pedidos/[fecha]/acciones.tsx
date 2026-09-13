"use client";

import Link from "next/link";
import { marcarPagado, eliminarPedido } from "@/actions/pedidos";
import { BotonSubmit } from "@/components/boton-submit";
import { useToast } from "@/hooks/use-toast";
import { useModalConfirmacion } from "@/components/modal-confirmacion";
import { FileSpreadsheet } from "lucide-react";

import { obtenerFilaExcel } from "@/lib/utils";

export function AccionesPedido({ pedido, fecha }: { pedido: any; fecha: string }) {
  const { showToast, ToastComponent } = useToast();
  const { solicitarConfirmacion, ModalComponent } = useModalConfirmacion();

  const copiarExcel = () => {
    const fila = obtenerFilaExcel(pedido);
    navigator.clipboard.writeText(fila).then(() => {
      showToast("Pedido copiado");
    });
  };

  const marcarPagadoAction = marcarPagado.bind(null, pedido.id);

  const handleEliminarClick = () => {
    const esCobro = Boolean(pedido.esCobro);
    const nombreCliente = pedido.cliente?.nombre ?? "este cliente";

    solicitarConfirmacion({
      titulo: esCobro ? "Eliminar cobranza" : "Eliminar pedido",
      mensaje: esCobro
        ? `Vas a eliminar este registro de cobranza de ${nombreCliente}. Esta acción no se puede deshacer.`
        : `Vas a eliminar el pedido de ${nombreCliente}. Esta acción no se puede deshacer y se restablecerá el stock de cajas correspondiente.`,
      textoConfirmar: esCobro ? "Eliminar cobranza" : "Eliminar pedido",
      textoCancelar: "Cancelar",
      tipo: "peligro",
      onConfirmar: async () => {
        try {
          await eliminarPedido(pedido.id, fecha);
          showToast(esCobro ? "Cobranza eliminada" : "Pedido eliminado");
        } catch {
          showToast("Error al eliminar");
        }
      },
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5 w-full">
      {!pedido.esCobro && (
        <button
          onClick={copiarExcel}
          className="text-[#9ca3af] hover:text-[#a3e635] p-1.5 transition-colors cursor-pointer"
          title="Copiar pedido"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>
      )}
      <Link
        href={`/pedidos/${fecha}/${pedido.id}/editar`}
        className="border border-[#2a2d35] text-[#9ca3af] px-2 py-1 rounded text-xs hover:border-[#a3e635] hover:text-[#a3e635] transition-colors"
      >
        Editar
      </Link>
      {pedido.estadoPago !== "PAGADO" && (
        <form action={marcarPagadoAction}>
          <BotonSubmit
            className="bg-[#16a34a] text-white px-2.5 py-1 rounded text-xs hover:bg-[#15803d] transition-colors cursor-pointer"
          >
            {pedido.esCobro ? "Cobrado" : "Pagado"}
          </BotonSubmit>
        </form>
      )}
      <button
        type="button"
        onClick={handleEliminarClick}
        className="text-[#6b7280] hover:text-red-500 px-1 py-1 text-xs transition-colors cursor-pointer"
        title={pedido.esCobro ? "Eliminar cobranza" : "Eliminar pedido"}
      >
        ✕
      </button>
      {ModalComponent}
      {ToastComponent}
    </div>
  );
}
