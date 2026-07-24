import { getClientesConDeuda, getCatalogosCobranza, marcarTodosPagadosCliente } from "@/actions/cobranzas";
import { formatearPeso, formatearFechaCorta } from "@/lib/utils";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { FiltrosCobranza } from "./filtros";
import { BotonSubmit } from "@/components/boton-submit";

interface Props {
  searchParams: Promise<{ zona?: string; repartidor?: string }>;
}

export default async function CobranzasPage({ searchParams }: Props) {
  const { zona, repartidor } = await searchParams;
  const clientesDeuda = await getClientesConDeuda(zona ? Number(zona) : undefined, repartidor ? Number(repartidor) : undefined);
  const catalogos = await getCatalogosCobranza();

  const deudaTotal = clientesDeuda.reduce((s, c) => s + c.deudaTotal, 0);

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f9fafb]">Cobranzas pendientes</h1>
          <p className="text-[#9ca3af] mt-0.5 text-sm">
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
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-12 text-center">
          <p className="text-[#4ade80] font-medium">¡Sin deudas pendientes!</p>
          <p className="text-[#6b7280] text-sm mt-1">Todos los clientes están al día.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clientesDeuda.map(({ cliente, pedidos, deudaTotal: deuda }) => {
            const marcarTodosAction = marcarTodosPagadosCliente.bind(null, cliente.id);
            return (
              <div key={cliente.id} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#22252e]">
                  <div>
                    <span className="font-semibold text-[#f9fafb]">{cliente.nombre}</span>
                    <span className="text-xs text-[#6b7280] ml-2">{cliente.zona.nombre}</span>
                    {cliente.repartidor && (
                      <span className="text-xs text-[#6b7280] ml-2">{cliente.repartidor.nombre}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500">{formatearPeso(deuda)}</span>
                    <form action={marcarTodosAction}>
                      <BotonSubmit
                        className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cobrar todo
                      </BotonSubmit>
                    </form>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {pedidos.map((p) => (
                      <tr key={p.id} className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e]">
                        <td className="px-4 py-2 text-[#9ca3af]">{formatearFechaCorta(p.fecha)}</td>
                        <td className="px-4 py-2">
                          {p.producto.nombre} <span className="text-[#6b7280]">{p.maduracion}</span>
                        </td>
                        <td className="px-4 py-2 text-right">{p.cajas} cajas</td>
                        <td className="px-4 py-2 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                        {p.montoPagado > 0 && (
                          <td className="px-4 py-2 text-right text-[#4ade80]">
                            Pagado: {formatearPeso(p.montoPagado)}
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                        </td>
                        {p.observaciones && (
                          <td className="px-4 py-2 text-[#6b7280] italic">{p.observaciones}</td>
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
