import Link from "next/link";
import { getResumenTodosRepartidoresHoy } from "@/actions/repartidores";
import { formatearPeso, hoyISO } from "@/lib/utils";

export default async function RepartidoresPage() {
  const resumen = await getResumenTodosRepartidoresHoy();
  const hoy = hoyISO();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1a2419] mb-1">Repartidores</h1>
      <p className="text-[#5a6b5c] text-sm mb-6">Resumen de hoy · {hoy}</p>

      <div className="grid grid-cols-1 gap-3">
        {resumen.map(({ repartidor, cantPedidos, totalCajas, totalMonto, totalCobrado }) => (
          <Link
            key={repartidor.id}
            href={`/repartidores/${repartidor.id}`}
            className="bg-white rounded-lg border border-[#dde6de] hover:border-[#ea580c] px-5 py-4 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1a2419] group-hover:text-[#ea580c]">
                {repartidor.nombre}
              </span>
              {cantPedidos > 0 ? (
                <span className="text-sm font-bold text-[#16a34a]">
                  {formatearPeso(totalCobrado)} cobrado
                </span>
              ) : (
                <span className="text-xs text-[#9aab9d]">Sin actividad hoy</span>
              )}
            </div>
            {cantPedidos > 0 && (
              <div className="flex gap-4 mt-1 text-xs text-[#9aab9d]">
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
