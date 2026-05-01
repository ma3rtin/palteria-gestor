import Link from "next/link";
import { getPedidosPorFecha, getTotalesDia } from "@/actions/pedidos";
import { BadgeEstadoPago, BadgeEstadoFactura } from "@/components/badge-estado";
import { formatearPeso, formatearFecha, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";
import { AccionesPedido } from "./acciones";

interface Props {
  params: Promise<{ fecha: string }>;
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

export default async function PedidosFechaPage({ params }: Props) {
  const { fecha } = await params;
  const [pedidos, totales] = await Promise.all([
    getPedidosPorFecha(fecha),
    getTotalesDia(fecha),
  ]);

  const entregados = pedidos.filter((p) => !p.esCobro);
  const cobros = pedidos.filter((p) => p.esCobro);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header con navegación de fechas */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/pedidos/${fechaAnterior(fecha)}`}
            className="p-2 border border-[#dde6de] rounded-lg hover:border-[#9aab9d] text-[#5a6b5c] text-sm transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1a2419] capitalize">{formatearFecha(fecha)}</h1>
            <p className="text-xs text-[#9aab9d]">{fecha}</p>
          </div>
          <Link
            href={`/pedidos/${fechaSiguiente(fecha)}`}
            className="p-2 border border-[#dde6de] rounded-lg hover:border-[#9aab9d] text-[#5a6b5c] text-sm transition-colors"
          >
            →
          </Link>
        </div>
        <Link
          href={`/pedidos/${fecha}/nuevo`}
          className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar pedido
        </Link>
      </div>

      {/* Totales del día */}
      {entregados.length > 0 && (
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
            <div key={t.label} className="bg-white rounded-lg border border-[#dde6de] px-4 py-3">
              <p className="text-xs text-[#9aab9d] font-medium">{t.label}</p>
              <p className="text-lg font-bold text-[#1a2419] mt-0.5">{t.valor}</p>
              {t.extra && <p className="text-xs text-red-500 mt-0.5">{t.extra}</p>}
            </div>
          ))}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#dde6de] p-12 text-center">
          <p className="text-[#9aab9d] text-sm mb-3">No hay pedidos registrados para este día.</p>
          <Link
            href={`/pedidos/${fecha}/nuevo`}
            className="inline-block bg-[#ea580c] hover:bg-[#c2410c] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Registrar primer pedido
          </Link>
        </div>
      ) : (
        <>
          {/* Tabla de entregas */}
          <div className="bg-white rounded-lg border border-[#dde6de] overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[#dde6de] flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest">
                Entregas ({entregados.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dde6de] text-[#9aab9d] text-xs">
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Producto · Mad.</th>
                  <th className="text-left px-4 py-3 font-medium">Repartidor</th>
                  <th className="text-right px-4 py-3 font-medium">Cajas</th>
                  <th className="text-right px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Pago</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium">Factura</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {entregados.map((p) => (
                  <tr key={p.id} className="border-b border-[#f2f5f2] last:border-0 hover:bg-[#f7faf7]">
                    <td className="px-4 py-2.5">
                      <Link href={`/clientes/${p.idCliente}`} className="hover:text-[#ea580c]">
                        <span className="font-medium text-[#1a2419]">{p.cliente.nombre}</span>
                      </Link>
                      <span className="text-[#9aab9d] text-xs ml-1">{p.cliente.zona.nombre}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[#5a6b5c]">
                      {p.producto.nombre}
                      <span className="text-[#9aab9d] text-xs ml-1">{p.maduracion}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[#5a6b5c] text-xs">{p.repartidor?.nombre ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-[#5a6b5c]">{p.cajas}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                    <td className="px-4 py-2.5 text-xs text-[#5a6b5c]">{ETIQUETAS_FORMA_PAGO[p.formaPago]}</td>
                    <td className="px-4 py-2.5">
                      <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                    </td>
                    <td className="px-4 py-2.5">
                      <BadgeEstadoFactura estado={p.estadoFactura as "NO_REQUIERE" | "PENDIENTE" | "EMITIDA"} />
                    </td>
                    <td className="px-4 py-2.5">
                      <AccionesPedido pedido={p} fecha={fecha} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cobros del día */}
          {cobros.length > 0 && (
            <div className="bg-white rounded-lg border border-[#dde6de] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#dde6de]">
                <h2 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest">
                  Cobros / cobranzas ({cobros.length})
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {cobros.map((p) => (
                    <tr key={p.id} className="border-b border-[#f2f5f2] last:border-0">
                      <td className="px-4 py-2.5 font-medium">{p.cliente.nombre}</td>
                      <td className="px-4 py-2.5 text-[#5a6b5c]">{p.observaciones ?? "Cobranza"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#16a34a]">
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
