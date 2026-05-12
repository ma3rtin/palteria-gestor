import Link from "next/link";
import { getStatsHoy, getResumenPorRepartidorHoy, getStatsSemana } from "@/actions/dashboard";
import { TarjetaStat } from "@/components/tarjeta-stat";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { formatearPeso, formatearFecha, hoyISO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";

export default async function Inicio() {
  const [stats, resumenRepartidores, statsSemana] = await Promise.all([
    getStatsHoy(),
    getResumenPorRepartidorHoy(),
    getStatsSemana(),
  ]);

  const hoy = hoyISO();

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f9fafb]">Panel de control</h1>
          <p className="text-[#9ca3af] mt-0.5 capitalize">{formatearFecha(hoy)}</p>
        </div>
        <Link
          href={`/pedidos/${hoy}/nuevo`}
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo pedido
        </Link>
      </div>

      {/* Stats del día */}
      <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
        Hoy
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <TarjetaStat
          titulo="Pedidos"
          valor={stats.totalPedidosHoy}
          subtitulo={`${stats.pedidosPendientesHoy} pendientes de cobro`}
        />
        <TarjetaStat
          titulo="Cajas"
          valor={stats.totalCajasHoy.toLocaleString("es-AR")}
        />
        <TarjetaStat
          titulo="Facturado hoy"
          valor={formatearPeso(stats.totalMontoHoy)}
          subtitulo={`Cobrado: ${formatearPeso(stats.totalCobradoHoy)}`}
          colorValor="text-[#4ade80]"
        />
        <TarjetaStat
          titulo="Deuda total"
          valor={formatearPeso(stats.montoTotalDeuda)}
          subtitulo={`${stats.clientesConDeuda} clientes`}
          colorValor={stats.montoTotalDeuda > 0 ? "text-red-600" : "text-[#f9fafb]"}
        />
      </div>

      {/* Stats de la semana */}
      <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
        Esta semana <span className="font-normal normal-case ml-1">({statsSemana.semanaLabel})</span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <TarjetaStat
          titulo="Pedidos"
          valor={statsSemana.totalPedidosSemana}
        />
        <TarjetaStat
          titulo="Cajas vendidas"
          valor={statsSemana.totalCajasSemana.toLocaleString("es-AR")}
        />
        <TarjetaStat
          titulo="Facturado"
          valor={formatearPeso(statsSemana.totalMontoSemana)}
          subtitulo={`Cobrado: ${formatearPeso(statsSemana.totalCobradoSemana)}`}
          colorValor="text-[#4ade80]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos del día */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
              Pedidos de hoy
            </h2>
            <Link href={`/pedidos/${hoy}`} className="text-xs text-[#a3e635] hover:underline">
              Ver todos →
            </Link>
          </div>

          {stats.pedidosHoy.length === 0 ? (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-8 text-center">
              <p className="text-[#6b7280] text-sm">No hay pedidos registrados hoy.</p>
              <Link
                href={`/pedidos/${hoy}/nuevo`}
                className="inline-block mt-3 text-[#a3e635] text-sm hover:underline"
              >
                Registrar el primero
              </Link>
            </div>
          ) : (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                    <th className="text-left px-4 py-3 font-medium">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium">Producto</th>
                    <th className="text-right px-4 py-3 font-medium">Cajas</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 font-medium">Pago</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pedidosHoy.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b border-[#22252e] hover:bg-[#22252e]">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-[#f9fafb]">{p.cliente.nombre}</span>
                        <span className="text-[#6b7280] ml-1 text-xs">{p.cliente.zona.nombre}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#9ca3af]">
                        {p.producto.nombre}
                        <span className="text-[#6b7280] ml-1 text-xs">{p.maduracion}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#9ca3af]">{p.cajas}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                      <td className="px-4 py-2.5 text-[#9ca3af] text-xs">{ETIQUETAS_FORMA_PAGO[p.formaPago]}</td>
                      <td className="px-4 py-2.5">
                        <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.pedidosHoy.length > 10 && (
                <div className="px-4 py-2 text-xs text-[#6b7280] border-t border-[#2a2d35]">
                  Mostrando 10 de {stats.pedidosHoy.length}.{" "}
                  <Link href={`/pedidos/${hoy}`} className="text-[#a3e635] hover:underline">
                    Ver todos
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumen repartidores */}
        <div>
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Repartidores hoy
          </h2>
          {resumenRepartidores.length === 0 ? (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 text-center">
              <p className="text-[#6b7280] text-sm">Sin actividad registrada.</p>
            </div>
          ) : (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#f2f5f2]">
              {resumenRepartidores.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-[#f9fafb]">
                      {r.repartidor?.nombre ?? "Sin asignar"}
                    </span>
                    <span className="text-sm font-semibold text-[#4ade80]">
                      {formatearPeso(r.totalCobrado)}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-[#6b7280]">
                    <span>{r.cantPedidos} pedidos</span>
                    <span>{r.totalCajas} cajas</span>
                    <span>Fact. {formatearPeso(r.totalMonto)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top productos de la semana */}
          {statsSemana.topProductos.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mt-6 mb-3">
                Top productos — semana
              </h2>
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e] mb-6">
                {statsSemana.topProductos.map((p, i) => (
                  <div key={p.nombre + i} className="px-4 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6b7280] w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-[#f9fafb]">{p.nombre}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-[#4ade80]">{p.cajas} caj.</span>
                      <span className="text-xs text-[#6b7280] ml-2">{formatearPeso(p.monto)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Accesos rápidos */}
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest m-3">
            Accesos rápidos
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { href: `/pedidos/${hoy}`, label: "Ver pedidos de hoy" },
              { href: "/cobranzas", label: "Cobranzas pendientes" },
              { href: "/pagos-semanales", label: "Pagos semanales" },
              { href: "/clientes/nuevo", label: "Agregar cliente" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-4 py-2.5 text-sm text-[#f9fafb] hover:border-[#a3e635] hover:text-[#a3e635] transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
