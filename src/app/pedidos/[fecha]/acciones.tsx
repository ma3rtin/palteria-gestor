"use client";

import { useState } from "react";
import Link from "next/link";
import { marcarPagado, registrarCobro, eliminarPedido } from "@/actions/pedidos";
import { BotonSubmit } from "@/components/boton-submit";
import { BotonCopiarEtiqueta } from "@/components/boton-copiar-etiqueta";
import { useToast } from "@/hooks/use-toast";

export function AccionesPedido({ pedido, fecha }: { pedido: any; fecha: string }) {
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleCopied = () => showToast("Etiqueta copiada");

  if (pedido.estadoPago === "PAGADO") {
    return (
      <div className="flex items-center gap-1.5">
        <BotonCopiarEtiqueta pedido={pedido} onCopied={handleCopied} />
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

  const deuda = pedido.montoTotal - pedido.montoPagado;

  return (
    <div className="flex items-center gap-1">
      {mostrarCobro ? (
        <form
          action={registrarCobro.bind(null, pedido.id)}
          onSubmit={() => setMostrarCobro(false)}
          className="flex items-center gap-1"
        >
          <input
            name="monto"
            type="number"
            defaultValue={deuda}
            required
            placeholder="0"
            min={1}
            max={deuda}
            className="w-28 border border-[#2a2d35] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#a3e635]"
          />
          <BotonSubmit
            className="bg-[#16a34a] text-white px-2 py-1 rounded text-xs hover:bg-[#15803d]"
          >
            OK
          </BotonSubmit>
          <button
            type="button"
            onClick={() => setMostrarCobro(false)}
            className="text-[#6b7280] px-1 py-1 text-xs hover:text-[#9ca3af]"
          >
            ✕
          </button>
        </form>
      ) : (
        <>
          <BotonCopiarEtiqueta pedido={pedido} onCopied={handleCopied} />
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
          <button
            onClick={() => setMostrarCobro(true)}
            className="border border-[#2a2d35] text-[#9ca3af] px-2.5 py-1 rounded text-xs hover:border-[#4b5563] transition-colors"
          >
            Parcial
          </button>
          <form action={eliminarAction}>
            <BotonSubmit
              className="text-[#6b7280] hover:text-red-500 px-1 py-1 text-xs transition-colors"
            >
              ✕
            </BotonSubmit>
          </form>
        </>
      )}
      {ToastComponent}
    </div>
  );
}
