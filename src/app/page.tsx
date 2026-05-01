import Link from "next/link";
import { getStatsHoy, getResumenPorRepartidorHoy } from "@/actions/dashboard";
import { TarjetaStat } from "@/components/tarjeta-stat";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { formatearPeso, formatearFecha, hoyISO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";

export default async function Inicio() {
  const [stats, resumenRepartidores] = await Promise.all([
    getStatsHoy(),
    getResumenPorRepartidorHoy(),
  ]);

  const hoy = hoyISO();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2419]">Panel de control</h1>
          <p className="text-[#5a6b5c] mt-0.5 capitalize">{formatearFecha(hoy)}</p>
        </div>
        <Link
          href={`/pedidos/${hoy}/nuevo`}
          className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo pedido
        </Link>
      </div>

      {/* Stats del día */}
      <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mb-3">
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
          colorValor="text-[#16a34a]"
        />
        <TarjetaStat
          titulo="Deuda total"
          valor={formatearPeso(stats.montoTotalDeuda)}
          subtitulo={`${stats.clientesConDeuda} clientes`}
          colorValor={stats.montoTotalDeuda > 0 ? "text-red-600" : "text-[#1a2419]"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos del día */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest">
              Pedidos de hoy
            </h2>
            <Link href={`/pedidos/${hoy}`} className="text-xs text-[#ea580c] hover:underline">
              Ver todos →
            </Link>
          </div>

          {stats.pedidosHoy.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#dde6de] p-8 text-center">
              <p className="text-[#9aab9d] text-sm">No hay pedidos registrados hoy.</p>
              <Link
                href={`/pedidos/${hoy}/nuevo`}
                className="inline-block mt-3 text-[#ea580c] text-sm hover:underline"
              >
                Registrar el primero
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#dde6de] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde6de] text-[#9aab9d] text-xs">
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
                    <tr key={p.id} className="border-b border-[#f2f5f2] hover:bg-[#f7faf7]">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-[#1a2419]">{p.cliente.nombre}</span>
                        <span className="text-[#9aab9d] ml-1 text-xs">{p.cliente.zona.nombre}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#5a6b5c]">
                        {p.producto.nombre}
                        <span className="text-[#9aab9d] ml-1 text-xs">{p.maduracion}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#5a6b5c]">{p.cajas}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                      <td className="px-4 py-2.5 text-[#5a6b5c] text-xs">{ETIQUETAS_FORMA_PAGO[p.formaPago]}</td>
                      <td className="px-4 py-2.5">
                        <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.pedidosHoy.length > 10 && (
                <div className="px-4 py-2 text-xs text-[#9aab9d] border-t border-[#dde6de]">
                  Mostrando 10 de {stats.pedidosHoy.length}.{" "}
                  <Link href={`/pedidos/${hoy}`} className="text-[#ea580c] hover:underline">
                    Ver todos
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumen repartidores */}
        <div>
          <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mb-3">
            Repartidores hoy
          </h2>
          {resumenRepartidores.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#dde6de] p-6 text-center">
              <p className="text-[#9aab9d] text-sm">Sin actividad registrada.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#dde6de] divide-y divide-[#f2f5f2]">
              {resumenRepartidores.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-[#1a2419]">
                      {r.repartidor?.nombre ?? "Sin asignar"}
                    </span>
                    <span className="text-sm font-semibold text-[#16a34a]">
                      {formatearPeso(r.totalCobrado)}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-[#9aab9d]">
                    <span>{r.cantPedidos} pedidos</span>
                    <span>{r.totalCajas} cajas</span>
                    <span>Fact. {formatearPeso(r.totalMonto)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Accesos rápidos */}
          <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mt-6 mb-3">
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
                className="bg-white border border-[#dde6de] rounded-lg px-4 py-2.5 text-sm text-[#1a2419] hover:border-[#ea580c] hover:text-[#ea580c] transition-colors"
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
