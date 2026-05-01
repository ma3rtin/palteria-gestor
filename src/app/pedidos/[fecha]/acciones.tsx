"use client";

import { useState } from "react";
import { marcarPagado, registrarCobro, eliminarPedido } from "@/actions/pedidos";
import { formatearPeso } from "@/lib/utils";

interface Pedido {
  id: number;
  estadoPago: string;
  montoTotal: number;
  montoPagado: number;
  esCobro: boolean;
}

export function AccionesPedido({ pedido, fecha }: { pedido: Pedido; fecha: string }) {
  const [mostrarCobro, setMostrarCobro] = useState(false);

  if (pedido.estadoPago === "PAGADO") {
    return <span className="text-xs text-[#9aab9d]">✓</span>;
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
            min={1}
            max={deuda}
            step={1000}
            className="w-28 border border-[#dde6de] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#16a34a]"
          />
          <button
            type="submit"
            className="bg-[#16a34a] text-white px-2 py-1 rounded text-xs hover:bg-[#15803d]"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setMostrarCobro(false)}
            className="text-[#9aab9d] px-1 py-1 text-xs hover:text-[#5a6b5c]"
          >
            ✕
          </button>
        </form>
      ) : (
        <>
          <form action={marcarPagadoAction}>
            <button
              type="submit"
              title={`Marcar pagado: ${formatearPeso(deuda)}`}
              className="bg-[#16a34a] text-white px-2.5 py-1 rounded text-xs hover:bg-[#15803d] transition-colors"
            >
              Pagado
            </button>
          </form>
          <button
            onClick={() => setMostrarCobro(true)}
            className="border border-[#dde6de] text-[#5a6b5c] px-2.5 py-1 rounded text-xs hover:border-[#9aab9d] transition-colors"
          >
            Parcial
          </button>
          <form action={eliminarAction}>
            <button
              type="submit"
              title="Eliminar pedido"
              className="text-[#9aab9d] hover:text-red-500 px-1 py-1 text-xs transition-colors"
            >
              ✕
            </button>
          </form>
        </>
      )}
    </div>
  );
}
