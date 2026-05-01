import { notFound } from "next/navigation";
import Link from "next/link";
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

  const [todos, resumen] = await Promise.all([
    getRepartidores(),
    getResumenRepartidorFecha(Number(id), fechaConsulta),
  ]);

  const repartidor = todos.find((r) => r.id === Number(id));
  if (!repartidor) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/repartidores" className="text-xs text-[#9aab9d] hover:text-[#ea580c]">
            ← Repartidores
          </Link>
          <h1 className="text-2xl font-bold text-[#1a2419] mt-1">{repartidor.nombre}</h1>
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
          <div key={t.label} className="bg-white border border-[#dde6de] rounded-lg px-4 py-3">
            <p className="text-xs text-[#9aab9d]">{t.label}</p>
            <p className="font-bold text-[#1a2419] text-lg mt-0.5">{t.valor}</p>
          </div>
        ))}
      </div>

      {resumen.pedidos.length === 0 ? (
        <div className="bg-white border border-[#dde6de] rounded-lg p-8 text-center text-[#9aab9d] text-sm">
          Sin pedidos para {fechaConsulta}.
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
              {resumen.pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[#f2f5f2] last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/clientes/${p.idCliente}`} className="hover:text-[#ea580c]">
                      {p.cliente.nombre}
                    </Link>
                    <span className="text-xs text-[#9aab9d] ml-1">{p.cliente.zona.nombre}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[#5a6b5c]">
                    {p.producto.nombre} <span className="text-[#9aab9d] text-xs">{p.maduracion}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#5a6b5c]">{p.cajas}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                  <td className="px-4 py-2.5 text-xs text-[#5a6b5c]">{ETIQUETAS_FORMA_PAGO[p.formaPago]}</td>
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
  );
}
