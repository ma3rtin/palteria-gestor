import { notFound } from "next/navigation";
import Link from "next/link";
import { getCliente, getSaldoCliente } from "@/actions/clientes";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { formatearPeso, formatearFechaCorta, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";
import { AccionesCliente } from "./acciones";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleClientePage({ params }: Props) {
  const { id } = await params;
  const [cliente, saldo] = await Promise.all([
    getCliente(Number(id)),
    getSaldoCliente(Number(id)),
  ]);

  if (!cliente) notFound();

  const pedidosPendientes = cliente.pedidos.filter((p) => p.estadoPago !== "PAGADO");
  const pedidosPagados = cliente.pedidos.filter((p) => p.estadoPago === "PAGADO");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/clientes" className="text-xs text-[#6b7280] hover:text-[#a3e635]">
              ← Clientes
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-[#f9fafb]">{cliente.nombre}</h1>
          <p className="text-[#9ca3af] mt-0.5">
            {cliente.zona.nombre}
            {cliente.repartidor && <span> · {cliente.repartidor.nombre}</span>}
            {cliente.cuentaCorriente && <span> · {cliente.cuentaCorriente.nombre}</span>}
          </p>
        </div>
        <AccionesCliente id={cliente.id} activo={cliente.activo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info + saldo */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Datos</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#9ca3af]">Zona</dt>
                <dd className="font-medium">{cliente.zona.nombre}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#9ca3af]">Pago habitual</dt>
                <dd className="font-medium">{ETIQUETAS_FORMA_PAGO[cliente.formaPagoPref]}</dd>
              </div>
              {cliente.repartidor && (
                <div className="flex justify-between">
                  <dt className="text-[#9ca3af]">Repartidor</dt>
                  <dd className="font-medium">{cliente.repartidor.nombre}</dd>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex justify-between">
                  <dt className="text-[#9ca3af]">Teléfono</dt>
                  <dd className="font-medium">{cliente.telefono}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#9ca3af]">Factura</dt>
                <dd className="font-medium">{cliente.requiereFactura ? "Sí requiere" : "No"}</dd>
              </div>
            </dl>
            {cliente.observaciones && (
              <p className="mt-3 pt-3 border-t border-[#22252e] text-xs text-[#9ca3af]">
                {cliente.observaciones}
              </p>
            )}
          </div>

          {/* Saldo */}
          <div className={`rounded-lg border p-5 ${saldo > 0 ? "bg-red-50 border-red-200" : "bg-[#1c1f26] border-[#2a2d35]"}`}>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1">Saldo pendiente</p>
            <p className={`text-2xl font-bold ${saldo > 0 ? "text-red-600" : "text-[#4ade80]"}`}>
              {saldo > 0 ? formatearPeso(saldo) : "Sin deuda"}
            </p>
            {saldo > 0 && (
              <p className="text-xs text-red-500 mt-1">{pedidosPendientes.length} pedido(s) pendientes</p>
            )}
          </div>

          <Link
            href={`/pedidos?cliente=${cliente.id}`}
            className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
          >
            + Nuevo pedido
          </Link>

          {cliente.cuentaCorriente && (
            <Link
              href={`/pagos-semanales/${cliente.cuentaCorriente.id}`}
              className="border border-[#2a2d35] hover:border-[#a3e635] text-[#f9fafb] hover:text-[#a3e635] px-4 py-2.5 rounded-lg text-sm transition-colors text-center"
            >
              Ver cuenta: {cliente.cuentaCorriente.nombre}
            </Link>
          )}
        </div>

        {/* Historial de pedidos */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Historial de pedidos
          </h3>

          {cliente.pedidos.length === 0 ? (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-8 text-center text-[#6b7280] text-sm">
              Sin pedidos registrados.
            </div>
          ) : (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Producto</th>
                    <th className="text-right px-4 py-3 font-medium">Cajas</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.pedidos.map((p) => (
                    <tr key={p.id} className="border-b border-[#22252e] last:border-0">
                      <td className="px-4 py-2.5 text-[#9ca3af]">{formatearFechaCorta(p.fecha)}</td>
                      <td className="px-4 py-2.5">
                        <span>{p.producto.nombre}</span>
                        <span className="text-[#6b7280] ml-1 text-xs">{p.maduracion}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#9ca3af]">{p.cajas}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                      <td className="px-4 py-2.5">
                        <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
