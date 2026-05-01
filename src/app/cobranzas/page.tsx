import { getClientesConDeuda, getCatalogosCobranza, marcarTodosPagadosCliente } from "@/actions/cobranzas";
import { formatearPeso, formatearFechaCorta } from "@/lib/utils";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { FiltrosCobranza } from "./filtros";

interface Props {
  searchParams: Promise<{ zona?: string; repartidor?: string }>;
}

export default async function CobranzasPage({ searchParams }: Props) {
  const { zona, repartidor } = await searchParams;
  const [clientesDeuda, catalogos] = await Promise.all([
    getClientesConDeuda(zona ? Number(zona) : undefined, repartidor ? Number(repartidor) : undefined),
    getCatalogosCobranza(),
  ]);

  const deudaTotal = clientesDeuda.reduce((s, c) => s + c.deudaTotal, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2419]">Cobranzas pendientes</h1>
          <p className="text-[#5a6b5c] mt-0.5 text-sm">
            {clientesDeuda.length} clientes · {formatearPeso(deudaTotal)} total
          </p>
        </div>
      </div>

      <FiltrosCobranza
        zonas={catalogos.zonas}
        repartidores={catalogos.repartidores}
        zonaActual={zona}
        repartidorActual={repartidor}
      />

      {clientesDeuda.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#dde6de] p-12 text-center">
          <p className="text-[#16a34a] font-medium">¡Sin deudas pendientes!</p>
          <p className="text-[#9aab9d] text-sm mt-1">Todos los clientes están al día.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clientesDeuda.map(({ cliente, pedidos, deudaTotal: deuda }) => {
            const marcarTodosAction = marcarTodosPagadosCliente.bind(null, cliente.id);
            return (
              <div key={cliente.id} className="bg-white rounded-lg border border-[#dde6de] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f5f2]">
                  <div>
                    <span className="font-semibold text-[#1a2419]">{cliente.nombre}</span>
                    <span className="text-xs text-[#9aab9d] ml-2">{cliente.zona.nombre}</span>
                    {cliente.repartidor && (
                      <span className="text-xs text-[#9aab9d] ml-2">{cliente.repartidor.nombre}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">{formatearPeso(deuda)}</span>
                    <form action={marcarTodosAction}>
                      <button
                        type="submit"
                        className="bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cobrar todo
                      </button>
                    </form>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} className="border-b border-[#f2f5f2] last:border-0 hover:bg-[#f7faf7]">
                        <td className="px-4 py-2 text-[#5a6b5c]">{formatearFechaCorta(p.fecha)}</td>
                        <td className="px-4 py-2">
                          {p.producto.nombre} <span className="text-[#9aab9d]">{p.maduracion}</span>
                        </td>
                        <td className="px-4 py-2 text-right">{p.cajas} cajas</td>
                        <td className="px-4 py-2 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                        {p.montoPagado > 0 && (
                          <td className="px-4 py-2 text-right text-[#16a34a]">
                            Pagado: {formatearPeso(p.montoPagado)}
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                        </td>
                        {p.observaciones && (
                          <td className="px-4 py-2 text-[#9aab9d] italic">{p.observaciones}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
