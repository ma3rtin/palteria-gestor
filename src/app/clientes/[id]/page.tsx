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
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/clientes" className="text-xs text-[#9aab9d] hover:text-[#ea580c]">
              ← Clientes
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2419]">{cliente.nombre}</h1>
          <p className="text-[#5a6b5c] mt-0.5">
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
          <div className="bg-white rounded-lg border border-[#dde6de] p-5">
            <h3 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mb-3">Datos</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#5a6b5c]">Zona</dt>
                <dd className="font-medium">{cliente.zona.nombre}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5a6b5c]">Pago habitual</dt>
                <dd className="font-medium">{ETIQUETAS_FORMA_PAGO[cliente.formaPagoPref]}</dd>
              </div>
              {cliente.repartidor && (
                <div className="flex justify-between">
                  <dt className="text-[#5a6b5c]">Repartidor</dt>
                  <dd className="font-medium">{cliente.repartidor.nombre}</dd>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex justify-between">
                  <dt className="text-[#5a6b5c]">Teléfono</dt>
                  <dd className="font-medium">{cliente.telefono}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#5a6b5c]">Factura</dt>
                <dd className="font-medium">{cliente.requiereFactura ? "Sí requiere" : "No"}</dd>
              </div>
            </dl>
            {cliente.observaciones && (
              <p className="mt-3 pt-3 border-t border-[#f2f5f2] text-xs text-[#5a6b5c]">
                {cliente.observaciones}
              </p>
            )}
          </div>

          {/* Saldo */}
          <div className={`rounded-lg border p-5 ${saldo > 0 ? "bg-red-50 border-red-200" : "bg-white border-[#dde6de]"}`}>
            <p className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mb-1">Saldo pendiente</p>
            <p className={`text-2xl font-bold ${saldo > 0 ? "text-red-600" : "text-[#16a34a]"}`}>
              {saldo > 0 ? formatearPeso(saldo) : "Sin deuda"}
            </p>
            {saldo > 0 && (
              <p className="text-xs text-red-500 mt-1">{pedidosPendientes.length} pedido(s) pendientes</p>
            )}
          </div>

          <Link
            href={`/pedidos?cliente=${cliente.id}`}
            className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
          >
            + Nuevo pedido
          </Link>

          {cliente.cuentaCorriente && (
            <Link
              href={`/pagos-semanales/${cliente.cuentaCorriente.id}`}
              className="border border-[#dde6de] hover:border-[#ea580c] text-[#1a2419] hover:text-[#ea580c] px-4 py-2.5 rounded-lg text-sm transition-colors text-center"
            >
              Ver cuenta: {cliente.cuentaCorriente.nombre}
            </Link>
          )}
        </div>

        {/* Historial de pedidos */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-[#9aab9d] uppercase tracking-widest mb-3">
            Historial de pedidos
          </h3>

          {cliente.pedidos.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#dde6de] p-8 text-center text-[#9aab9d] text-sm">
              Sin pedidos registrados.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#dde6de] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dde6de] text-[#9aab9d] text-xs">
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Producto</th>
                    <th className="text-right px-4 py-3 font-medium">Cajas</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.pedidos.map((p) => (
                    <tr key={p.id} className="border-b border-[#f2f5f2] last:border-0">
                      <td className="px-4 py-2.5 text-[#5a6b5c]">{formatearFechaCorta(p.fecha)}</td>
                      <td className="px-4 py-2.5">
                        <span>{p.producto.nombre}</span>
                        <span className="text-[#9aab9d] ml-1 text-xs">{p.maduracion}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#5a6b5c]">{p.cajas}</td>
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
