import Link from "next/link";
import { getResumenTodosRepartidoresHoy } from "@/actions/repartidores";
import { formatearPeso, hoyISO } from "@/lib/utils";

export default async function RepartidoresPage() {
  const resumen = await getResumenTodosRepartidoresHoy();
  const hoy = hoyISO();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-1">Repartidores</h1>
      <p className="text-[#9ca3af] text-sm mb-6">Resumen de hoy · {hoy}</p>

      <div className="grid grid-cols-1 gap-3">
        {resumen.map(({ repartidor, cantPedidos, totalCajas, totalMonto, totalCobrado }) => (
          <Link
            key={repartidor.id}
            href={`/repartidores/${repartidor.id}`}
            className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] hover:border-[#a3e635] px-5 py-4 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#f9fafb] group-hover:text-[#a3e635]">
                {repartidor.nombre}
              </span>
              {cantPedidos > 0 ? (
                <span className="text-sm font-bold text-[#4ade80]">
                  {formatearPeso(totalCobrado)} cobrado
                </span>
              ) : (
                <span className="text-xs text-[#6b7280]">Sin actividad hoy</span>
              )}
            </div>
            {cantPedidos > 0 && (
              <div className="flex gap-4 mt-1 text-xs text-[#6b7280]">
                <span>{cantPedidos} pedidos</span>
                <span>{totalCajas} cajas</span>
                <span>Facturado: {formatearPeso(totalMonto)}</span>
                {totalMonto > totalCobrado && (
                  <span className="text-red-500">
                    Pendiente: {formatearPeso(totalMonto - totalCobrado)}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
