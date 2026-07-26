import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPedidosPeriodoPaginados, getLiquidacionesPaginadas, getRevendedor, registrarLiquidacion } from "@/actions/revendedores";
import { formatearPeso, formatearFechaCorta, hoyISO, parseFechaRuta } from "@/lib/utils";
import { BotonSubmit } from "@/components/boton-submit";
import SelectorPeriodo from "./selector-periodo";
import { TabsRevendedor } from "@/components/tabs-revendedor";
import { Paginador } from "@/components/paginador";

const FORMAS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

function semanaActualDesde() {
  const hoy = parseFechaRuta(hoyISO());
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return lunes.toLocaleDateString("en-CA");
}

function semanaActualHasta() {
  const hoy = parseFechaRuta(hoyISO());
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  return sabado.toLocaleDateString("en-CA");
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    pagePedidos?: string;
    pagePagos?: string;
  }>;
}

export default async function RevendedorDetallePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const desde = sp.desde ?? semanaActualDesde();
  const hasta = sp.hasta ?? semanaActualHasta();
  const pagePedidos = Number(sp.pagePedidos ?? "0");
  const pagePagos = Number(sp.pagePagos ?? "0");

  const revendedor = await getRevendedor(Number(id));
  if (!revendedor) notFound();

  // Llamadas a Server Actions paginadas
  const { pedidos, total: totalPedidos, montoCalculadoPeriodo, hasMore: hasMorePedidos } = 
    await getPedidosPeriodoPaginados(Number(id), desde, hasta, pagePedidos, 20);

  const { liquidaciones, total: totalLiquidaciones, hasMore: hasMorePagos } = 
    await getLiquidacionesPaginadas(Number(id), pagePagos, 10);

  const periodoLabel = `${formatearFechaCorta(desde)} – ${formatearFechaCorta(hasta)}`;
  const saldoPendiente = revendedor.totalGanado - revendedor.totalPagado;

  // Render para pestaña de Pedidos
  const tabPedidos = (
    <div className="flex flex-col gap-4">
      {pedidos.length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-10 text-center">
          <p className="text-[#6b7280] text-sm">Sin pedidos en el período {periodoLabel}.</p>
        </div>
      ) : (
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Producto</th>
                  <th className="text-right px-4 py-3 font-medium">Cajas</th>
                  <th className="text-right px-4 py-3 font-medium">Total Pedido</th>
                  <th className="text-right px-4 py-3 font-medium">Ganancia</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e] transition-colors">
                    <td className="px-4 py-3 text-[#9ca3af]">
                      <Link
                        href={`/pedidos/${p.fecha.toISOString().split("T")[0]}?pedidoId=${p.id}`}
                        className="hover:text-[#a3e635] underline decoration-dotted transition-colors"
                      >
                        {formatearFechaCorta(p.fecha)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#f9fafb] font-medium">{p.cliente.nombre}</td>
                    <td className="px-4 py-3 text-[#9ca3af]">{p.producto.nombre}</td>
                    <td className="px-4 py-3 text-right text-[#9ca3af] font-mono">{p.cajas}</td>
                    <td className="px-4 py-3 text-right text-[#9ca3af] font-mono">{formatearPeso(p.montoTotal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#4ade80] font-mono">{formatearPeso(p.comisionRevendedor)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/pedidos/${p.fecha.toISOString().split("T")[0]}?pedidoId=${p.id}`}
                        className="text-xs text-[#a3e635] hover:underline"
                      >
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#2a2d35] flex flex-col sm:flex-row justify-between items-center gap-3 text-sm bg-[#17191e]/30">
            <span className="text-[#6b7280]">
              {totalPedidos} pedido{totalPedidos !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold text-[#4ade80]">
              Comisión período total: {formatearPeso(montoCalculadoPeriodo)}
            </span>
          </div>
        </div>
      )}

      {/* Paginación de Pedidos */}
      <Paginador
        pageActual={pagePedidos}
        totalPaginas={Math.ceil(totalPedidos / 20)}
        totalItems={totalPedidos}
        hrefAnterior={`?desde=${desde}&hasta=${hasta}&pagePedidos=${pagePedidos - 1}&pagePagos=${pagePagos}`}
        hrefSiguiente={`?desde=${desde}&hasta=${hasta}&pagePedidos=${pagePedidos + 1}&pagePagos=${pagePagos}`}
        hasMore={hasMorePedidos}
        className="mt-2"
      />
    </div>
  );

  // Render para pestaña de Historial de Pagos
  const tabPagos = (
    <div className="flex flex-col gap-4">
      {liquidaciones.length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-10 text-center">
          <p className="text-[#6b7280] text-sm">No hay pagos registrados para este revendedor.</p>
        </div>
      ) : (
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                  <th className="text-left px-4 py-3 font-medium">Período</th>
                  <th className="text-right px-4 py-3 font-medium">Monto Pagado</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha Pago</th>
                  <th className="text-left px-4 py-3 font-medium">Forma de pago</th>
                  <th className="text-left px-4 py-3 font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e] transition-colors">
                    <td className="px-4 py-3 text-[#9ca3af] whitespace-nowrap">
                      {formatearFechaCorta(l.fechaInicio)} – {formatearFechaCorta(l.fechaFin)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#4ade80] font-mono">{formatearPeso(l.montoPagado)}</td>
                    <td className="px-4 py-3 text-[#9ca3af] text-xs whitespace-nowrap">
                      {l.fechaPago ? formatearFechaCorta(l.fechaPago) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af] text-xs whitespace-nowrap">{l.formaPago ?? "—"}</td>
                    <td className="px-4 py-3 text-[#6b7280] text-xs max-w-xs truncate" title={l.observaciones ?? ""}>
                      {l.observaciones ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación de Pagos */}
      <Paginador
        pageActual={pagePagos}
        totalPaginas={Math.ceil(totalLiquidaciones / 10)}
        totalItems={totalLiquidaciones}
        hrefAnterior={`?desde=${desde}&hasta=${hasta}&pagePedidos=${pagePedidos}&pagePagos=${pagePagos - 1}`}
        hrefSiguiente={`?desde=${desde}&hasta=${hasta}&pagePedidos=${pagePedidos}&pagePagos=${pagePagos + 1}`}
        hasMore={hasMorePagos}
        className="mt-2"
      />
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <a href="/revendedores" className="text-xs text-[#6b7280] hover:text-[#a3e635] flex items-center gap-1">
          <ChevronLeft size={14} />
          Revendedores
        </a>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-[#f9fafb]">{revendedor.nombre}</h1>
          <span className="text-xs bg-[#22252e] text-[#9ca3af] px-2 py-0.5 rounded uppercase tracking-wide">
            Revendedor
          </span>
        </div>
        <p className="text-[#9ca3af] text-sm mt-0.5">
          {revendedor.clientes.length} cliente{revendedor.clientes.length !== 1 ? "s" : ""}:{" "}
          {revendedor.clientes.map((c) => c.nombre).join(", ")}
        </p>
      </div>

      {/* Tarjetas de Balance General en 3 Columnas Horizontales */}
      <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
        Balance General
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#9ca3af]">Saldo Pendiente</span>
            <div className={`text-xl font-bold mt-0.5 font-mono ${saldoPendiente > 0 ? "text-[#ef4444]" : "text-[#4ade80]"}`}>
              {formatearPeso(saldoPendiente)}
            </div>
          </div>
        </div>

        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#9ca3af]">Total Ganado (Histórico)</span>
            <div className="text-lg font-semibold text-[#f9fafb] mt-0.5 font-mono">
              {formatearPeso(revendedor.totalGanado)}
            </div>
          </div>
        </div>

        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#9ca3af]">Total Pagado (Histórico)</span>
            <div className="text-lg font-semibold text-[#f9fafb] mt-0.5 font-mono">
              {formatearPeso(revendedor.totalPagado)}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario Registrar Pago */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
          Registrar Pago / Liquidación
        </h2>
        <form
          action={registrarLiquidacion}
          className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-5 flex flex-col gap-4"
        >
          <input type="hidden" name="idRevendedor" value={revendedor.id} />
          <input type="hidden" name="fechaInicio" value={desde} />
          <input type="hidden" name="fechaFin" value={hasta} />
          <input type="hidden" name="montoCalculado" value={montoCalculadoPeriodo} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Monto a Pagar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] font-semibold">$</span>
                <input
                  name="montoPagado"
                  type="number"
                  step="0.01"
                  defaultValue={saldoPendiente > 0 ? saldoPendiente.toFixed(2) : "0.00"}
                  required
                  placeholder="0.00"
                  className="w-full border border-[#2a2d35] rounded-lg pl-7 pr-3 py-2 text-sm bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Forma de pago</label>
              <select
                name="formaPago"
                className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] h-[38px]"
              >
                <option value="">Sin especificar</option>
                {FORMAS_PAGO.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Observaciones</label>
              <input
                name="observaciones"
                placeholder="Opcional"
                className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] h-[38px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#22252e]">
            <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
              Registrar pago
            </BotonSubmit>
          </div>
        </form>
      </div>

      {/* Selector de Período */}
      <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
        Lista de Pedidos
      </h2>
      <SelectorPeriodo idRevendedor={revendedor.id} desde={desde} hasta={hasta} />

      {/* Tabs de Listado */}
      <TabsRevendedor
        tabPedidos={tabPedidos}
        tabPagos={tabPagos}
        pedidosCount={totalPedidos}
        pagosCount={totalLiquidaciones}
      />
    </div>
  );
}
