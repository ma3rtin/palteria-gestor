import Link from "next/link";
import { getPedidosPorFecha, getTotalesDia } from "@/actions/pedidos";
import { formatearPeso, formatearFecha, formatearHora } from "@/lib/utils";
import { FiltrosPedidos } from "./filtros";
import { TablaEntregas } from "./tabla-entregas";
import { NavegacionFecha } from "./navegacion-fecha";

interface Props {
  params: Promise<{ fecha: string }>;
  searchParams: Promise<{ zona?: string; repartidor?: string; estado?: string; q?: string }>;
}

function fechaAnterior(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function fechaSiguiente(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default async function PedidosFechaPage({ params, searchParams }: Props) {
  const { fecha } = await params;
  const { zona, repartidor, estado, q } = await searchParams;

  const pedidos = await getPedidosPorFecha(fecha);
  const totales = await getTotalesDia(fecha);

  // Catálogo para filtros: zonas y repartidores únicos del día
  const zonasUnicas = Array.from(
    new Map(pedidos.map((p) => [p.cliente.zona.id, p.cliente.zona])).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const repsUnicos = Array.from(
    new Map(
      pedidos.filter((p) => p.repartidor).map((p) => [p.repartidor!.id, p.repartidor!])
    ).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Filtrar entregas
  let entregados = pedidos.filter((p) => !p.esCobro);
  if (zona)       entregados = entregados.filter((p) => p.cliente.idZona === Number(zona));
  if (repartidor) entregados = entregados.filter((p) => p.idRepartidor === Number(repartidor));
  if (estado)     entregados = entregados.filter((p) => p.estadoPago === estado);
  if (q)          entregados = entregados.filter((p) => p.cliente.nombre.toLowerCase().includes(q.toLowerCase()));

  const cobros = pedidos.filter((p) => p.esCobro);

  return (
    <div className="p-8 mx-auto">
      {/* Header con navegación de fechas */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <NavegacionFecha
          fechaActual={fecha}
          fechaAnteriorStr={fechaAnterior(fecha)}
          fechaSiguienteStr={fechaSiguiente(fecha)}
          fechaFormateada={formatearFecha(fecha)}
        />
        <Link
          href={`/pedidos/${fecha}/nuevo`}
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar pedido
        </Link>
      </div>

      {/* Totales del día */}
      {pedidos.filter((p) => !p.esCobro).length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pedidos", valor: totales.cantidad.toString() },
            { label: "Cajas", valor: totales.cajas.toLocaleString("es-AR") },
            { label: "Facturado", valor: formatearPeso(totales.monto) },
            {
              label: "Cobrado",
              valor: formatearPeso(totales.cobrado),
              extra: totales.monto > totales.cobrado
                ? `Pendiente: ${formatearPeso(totales.monto - totales.cobrado)}`
                : undefined,
            },
          ].map((t) => (
            <div key={t.label} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
              <p className="text-xs text-[#6b7280] font-medium">{t.label}</p>
              <p className="text-lg font-bold text-[#f9fafb] mt-0.5">{t.valor}</p>
              {t.extra && <p className="text-xs text-red-500 mt-0.5">{t.extra}</p>}
            </div>
          ))}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-12 text-center">
          <p className="text-[#6b7280] text-sm mb-3">No hay pedidos registrados para este día.</p>
          <Link
            href={`/pedidos/${fecha}/nuevo`}
            className="inline-block bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Registrar primer pedido
          </Link>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <FiltrosPedidos
            fecha={fecha}
            zonas={zonasUnicas}
            repartidores={repsUnicos}
            zonaActual={zona}
            repartidorActual={repartidor}
            estadoActual={estado}
            busquedaActual={q}
          />

          {/* Tabla de entregas */}
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden mb-4">
            {entregados.length === 0 ? (
              <>
                <div className="px-4 py-3 border-b border-[#2a2d35] flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
                    Entregas (0)
                  </h2>
                </div>
                <div className="p-6 text-center text-[#6b7280] text-sm">Sin entregas con esos filtros.</div>
              </>
            ) : (
              <TablaEntregas
                pedidos={entregados as any}
                fecha={fecha}
                totalEntregasDia={pedidos.filter((p) => !p.esCobro).length}
              />
            )}
          </div>

          {/* Cobros del día */}
          {cobros.length > 0 && (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d35]">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
                  Cobros / cobranzas ({cobros.length})
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {cobros.map((p) => (
                    <tr key={p.id} className="border-b border-[#22252e] last:border-0">
                      <td className="px-4 py-2.5 font-medium">{p.cliente.nombre}</td>
                      <td className="px-4 py-2.5 text-[#9ca3af]">{p.observaciones ?? "Cobranza"}</td>
                      <td className="px-4 py-2.5 text-xs text-[#9ca3af]">{formatearHora(p.creadoEn)} hs</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#4ade80]">
                        {formatearPeso(p.montoPagado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
