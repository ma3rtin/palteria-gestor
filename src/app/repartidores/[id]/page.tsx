import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getRepartidores, getResumenRepartidorFecha } from "@/actions/repartidores";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { formatearPeso, hoyISO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";
import { SelectorFecha } from "./selector-fecha";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fecha?: string }>;
}

export default async function DetalleRepartidorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { fecha } = await searchParams;
  const fechaConsulta = fecha ?? hoyISO();

  const todos = await getRepartidores();
  const resumen = await getResumenRepartidorFecha(Number(id), fechaConsulta);

  const repartidor = todos.find((r) => r.id === Number(id));
  if (!repartidor) notFound();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/repartidores" className="text-xs text-[#6b7280] hover:text-[#a3e635] flex items-center gap-1">
            <ChevronLeft size={14} />
            Repartidores
          </Link>
          <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">{repartidor.nombre}</h1>
        </div>
        <SelectorFecha idRepartidor={id} fechaActual={fechaConsulta} />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pedidos", valor: resumen.pedidos.length.toString() },
          { label: "Cajas", valor: resumen.totalCajas.toString() },
          { label: "Facturado", valor: formatearPeso(resumen.totalMonto) },
          { label: "Cobrado", valor: formatearPeso(resumen.totalCobrado) },
        ].map((t) => (
          <div key={t.label} className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-4 py-3">
            <p className="text-xs text-[#6b7280]">{t.label}</p>
            <p className="font-bold text-[#f9fafb] text-lg mt-0.5">{t.valor}</p>
          </div>
        ))}
      </div>

      {resumen.pedidos.length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-8 text-center text-[#6b7280] text-sm">
          Sin pedidos para {fechaConsulta}.
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {resumen.pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[#22252e] last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/clientes/${p.idCliente}`} className="hover:text-[#a3e635]">
                      {p.cliente.nombre}
                    </Link>
                    <span className="text-xs text-[#6b7280] ml-1">{p.cliente.zona.nombre}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[#9ca3af]">
                    {p.producto.nombre} <span className="text-[#6b7280] text-xs">{p.maduracion}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#9ca3af]">{p.cajas}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                  <td className="px-4 py-2.5 text-xs text-[#9ca3af]">{ETIQUETAS_FORMA_PAGO[p.formaPago]}</td>
                  <td className="px-4 py-2.5">
                    <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/pedidos/${fechaConsulta}?pedidoId=${p.id}`}
                      className="border border-[#2a2d35] text-[#9ca3af] px-2 py-1 rounded text-xs hover:border-[#a3e635] hover:text-[#a3e635] transition-colors"
                    >
                      Ver pedido
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
