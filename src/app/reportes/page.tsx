import { getResumenPeriodo } from "@/actions/reportes";
import { TarjetaStat } from "@/components/tarjeta-stat";
import { formatearPeso, formatearFechaCorta, hoyISO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";
import SelectorPeriodo from "./selector-periodo";

function primerDiaMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toLocaleDateString("en-CA");
}

interface Props {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}

export default async function ReportesPage({ searchParams }: Props) {
  const params = await searchParams;
  const desde = params.desde ?? primerDiaMes();
  const hasta = params.hasta ?? hoyISO();

  const datos = await getResumenPeriodo(desde, hasta);

  const periodoLabel = `${formatearFechaCorta(desde)} – ${formatearFechaCorta(hasta)}`;

  return (
    <div className="p-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Reportes</h1>
        <p className="text-[#9ca3af] mt-0.5">Resumen por período</p>
      </div>

      <SelectorPeriodo desde={desde} hasta={hasta} />

      {datos.totalPedidos === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-12 text-center">
          <p className="text-[#6b7280]">No hay pedidos en el período seleccionado.</p>
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Resumen — {periodoLabel}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <TarjetaStat
              titulo="Pedidos"
              valor={datos.totalPedidos}
            />
            <TarjetaStat
              titulo="Cajas"
              valor={datos.totalCajas.toLocaleString("es-AR")}
            />
            <TarjetaStat
              titulo="Cobrado"
              valor={formatearPeso(datos.totalCobrado)}
              colorValor="text-[#4ade80]"
            />
            <TarjetaStat
              titulo="Pendiente"
              valor={formatearPeso(datos.pendiente)}
              colorValor={datos.pendiente > 0 ? "text-red-500" : "text-[#f9fafb]"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top productos */}
            <div>
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
                Top productos
              </h2>
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
                {datos.topProductos.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#6b7280] w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-[#f9fafb]">{p.nombre}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-[#4ade80]">
                        {p.cajas.toLocaleString("es-AR")} caj.
                      </span>
                      <span className="text-xs text-[#6b7280] ml-2">
                        {formatearPeso(p.monto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Por repartidor */}
            <div>
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
                Por repartidor
              </h2>
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
                {datos.porRepartidor.map((r, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#f9fafb]">
                        {r.repartidor?.nombre ?? "Sin asignar"}
                      </span>
                      <span className="text-sm font-semibold text-[#4ade80]">
                        {r.cajas.toLocaleString("es-AR")} caj.
                      </span>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-[#6b7280]">
                      <span>{r.pedidos} pedidos</span>
                      <span>Fact. {formatearPeso(r.monto)}</span>
                      <span>Cobr. {formatearPeso(r.cobrado)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Por forma de pago */}
            <div>
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
                Por forma de pago
              </h2>
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
                {datos.porFormaPago.map((f, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-[#f9fafb]">
                      {ETIQUETAS_FORMA_PAGO[f.formaPago] ?? f.formaPago}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#4ade80]">
                        {formatearPeso(f.monto)}
                      </span>
                      <span className="text-xs text-[#6b7280] ml-2">
                        {f.pedidos} ped.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
