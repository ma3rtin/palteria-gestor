import { notFound } from "next/navigation";
import Link from "next/link";
import { getDetalleCuenta, registrarPagoSemanal } from "@/actions/pagos-semanales";
import { formatearPeso, formatearFechaCorta, hoyISO } from "@/lib/utils";
import { BadgeEstadoPago } from "@/components/badge-estado";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleCuentaPage({ params }: Props) {
  const { id } = await params;
  const cuenta = await getDetalleCuenta(Number(id)).catch(() => null);
  if (!cuenta) notFound();

  const hoy = hoyISO();
  // Inicio de semana actual (lunes)
  const lunes = new Date(hoy + "T12:00:00");
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  const sabado = new Date(lunes);
  sabado.setDate(sabado.getDate() + 5);
  const lunesStr = lunes.toISOString().split("T")[0];
  const sabadoStr = sabado.toISOString().split("T")[0];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/pagos-semanales" className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Pagos semanales
        </Link>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">{cuenta.nombre}</h1>
        <p className="text-[#9ca3af] text-sm">
          {cuenta.clientes.length} locales
          {cuenta.diaCobranza && <span> · Cobra: {cuenta.diaCobranza}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deuda actual + registrar pago */}
        <div className="flex flex-col gap-4">
          <div className={`rounded-lg border p-5 ${cuenta.deudaTotal > 0 ? "bg-red-50 border-red-200" : "bg-[#1c1f26] border-[#2a2d35]"}`}>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1">
              Deuda pendiente
            </p>
            <p className={`text-2xl font-bold ${cuenta.deudaTotal > 0 ? "text-red-600" : "text-[#4ade80]"}`}>
              {cuenta.deudaTotal > 0 ? formatearPeso(cuenta.deudaTotal) : "Sin deuda ✓"}
            </p>
          </div>

          {cuenta.deudaTotal > 0 && (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
              <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">Registrar pago</h3>
              <form action={registrarPagoSemanal} className="flex flex-col gap-3">
                <input type="hidden" name="idCuenta" value={cuenta.id} />
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Período</label>
                  <div className="flex gap-2 items-center text-xs">
                    <input type="date" name="fechaInicio" defaultValue={lunesStr}
                      className="border border-[#2a2d35] rounded px-2 py-1.5 text-xs focus:outline-none" />
                    <span className="text-[#6b7280]">→</span>
                    <input type="date" name="fechaFin" defaultValue={sabadoStr}
                      className="border border-[#2a2d35] rounded px-2 py-1.5 text-xs focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Monto pagado *</label>
                  <input
                    name="montoPagado"
                    type="number"
                    required
                    min={0}
                    step={1000}
                    defaultValue={cuenta.deudaTotal}
                    className="w-full border border-[#2a2d35] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Forma de pago</label>
                  <select
                    name="formaPago"
                    className="w-full border border-[#2a2d35] rounded px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
                <input name="observaciones" placeholder="Observaciones" className="border border-[#2a2d35] rounded px-3 py-2 text-sm focus:outline-none" />
                <button type="submit" className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Registrar pago
                </button>
              </form>
            </div>
          )}

          {/* Últimos períodos */}
          {cuenta.periodos.length > 0 && (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4">
              <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
                Últimos pagos
              </h3>
              <div className="flex flex-col gap-2">
                {cuenta.periodos.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-[#9ca3af] text-xs">
                      {formatearFechaCorta(p.fechaInicio)} – {formatearFechaCorta(p.fechaFin)}
                    </span>
                    <span className="font-medium">{formatearPeso(p.montoPagado)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pedidos pendientes por local */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Pedidos pendientes por local
          </h3>
          {cuenta.clientes.every((c) => c.pedidos.length === 0) ? (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-8 text-center text-[#6b7280] text-sm">
              Sin pedidos pendientes.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cuenta.clientes
                .filter((c) => c.pedidos.length > 0)
                .map((c) => {
                  const deudaCliente = c.pedidos.reduce(
                    (s, p) => s + (p.montoTotal - p.montoPagado),
                    0
                  );
                  return (
                    <div key={c.id} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-[#22252e]">
                        <Link href={`/clientes/${c.id}`} className="font-medium text-sm hover:text-[#a3e635]">
                          {c.nombre}
                        </Link>
                        <span className="font-semibold text-sm text-red-600">{formatearPeso(deudaCliente)}</span>
                      </div>
                      <table className="w-full text-xs">
                        <tbody>
                          {c.pedidos.map((p) => (
                            <tr key={p.id} className="border-b border-[#22252e] last:border-0">
                              <td className="px-4 py-2 text-[#9ca3af]">{formatearFechaCorta(p.fecha)}</td>
                              <td className="px-4 py-2">{p.producto.nombre} {p.maduracion}</td>
                              <td className="px-4 py-2 text-right">{p.cajas} caj.</td>
                              <td className="px-4 py-2 text-right font-medium">{formatearPeso(p.montoTotal)}</td>
                              <td className="px-4 py-2">
                                <BadgeEstadoPago estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
