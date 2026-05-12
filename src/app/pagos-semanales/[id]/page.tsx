import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getDetalleCuenta,
  registrarPagoSemanal,
  registrarPagoLocal,
  getRepartidoresActivos,
} from "@/actions/pagos-semanales";
import { formatearPeso, formatearFechaCorta, hoyISO } from "@/lib/utils";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { BotonSubmit } from "@/components/boton-submit";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleCuentaPage({ params }: Props) {
  const { id } = await params;
  const [cuenta, repartidores] = await Promise.all([
    getDetalleCuenta(Number(id)).catch(() => null),
    getRepartidoresActivos(),
  ]);
  if (!cuenta) notFound();

  const hoy = hoyISO();
  const hoyDate = new Date(hoy + "T12:00:00");
  // Monday of current week
  const esteLunes = new Date(hoyDate);
  esteLunes.setDate(hoyDate.getDate() - ((hoyDate.getDay() + 6) % 7));
  // Default to previous complete week (Mon-Sat); on Saturday default to current week (last day)
  const lunes = new Date(esteLunes);
  if (hoyDate.getDay() !== 6) lunes.setDate(esteLunes.getDate() - 7);
  const sabado = new Date(lunes);
  sabado.setDate(sabado.getDate() + 5);
  const lunesStr = lunes.toISOString().split("T")[0];
  const sabadoStr = sabado.toISOString().split("T")[0];

  // Historial plano de todos los pagos registrados (locales + globales)
  const historialPagos = cuenta.periodos
    .flatMap((p) => p.pagosLocales)
    .sort((a, b) => b.fechaPago.getTime() - a.fechaPago.getTime())
    .slice(0, 30);

  return (
    <div className="p-8">
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
        {/* Columna izquierda: deuda + cobro global + historial */}
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-lg border p-5 ${
              cuenta.deudaTotal > 0
                ? "bg-red-50 border-red-200"
                : "bg-[#1c1f26] border-[#2a2d35]"
            }`}
          >
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1">
              Deuda pendiente
            </p>
            <p
              className={`text-2xl font-bold ${
                cuenta.deudaTotal > 0 ? "text-red-600" : "text-[#4ade80]"
              }`}
            >
              {cuenta.deudaTotal > 0 ? formatearPeso(cuenta.deudaTotal) : "Sin deuda ✓"}
            </p>
          </div>

          {cuenta.deudaTotal > 0 && (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
              <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">
                Cobrar cuenta completa
              </h3>
              <form action={registrarPagoSemanal} className="flex flex-col gap-3">
                <input type="hidden" name="idCuenta" value={cuenta.id} />
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Período</label>
                  <div className="flex gap-2 items-center text-xs">
                    <input
                      type="date"
                      name="fechaInicio"
                      defaultValue={lunesStr}
                      className="border border-[#2a2d35] rounded px-2 py-1.5 text-xs focus:outline-none"
                    />
                    <span className="text-[#6b7280]">→</span>
                    <input
                      type="date"
                      name="fechaFin"
                      defaultValue={sabadoStr}
                      className="border border-[#2a2d35] rounded px-2 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1">Monto *</label>
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
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-[#9ca3af] mb-1">Forma de pago</label>
                    <select
                      name="formaPago"
                      className="w-full border border-[#2a2d35] rounded px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#9ca3af] mb-1">Cobró</label>
                    <select
                      name="idRepartidor"
                      className="w-full border border-[#2a2d35] rounded px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none"
                    >
                      <option value="">—</option>
                      {repartidores.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  name="observaciones"
                  placeholder="Observaciones"
                  className="border border-[#2a2d35] rounded px-3 py-2 text-sm focus:outline-none"
                />
                <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Registrar cobro global
                </BotonSubmit>
              </form>
            </div>
          )}

          {/* Historial de cobros */}
          {historialPagos.length > 0 && (
            <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4">
              <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
                Historial de cobros
              </h3>
              <div className="flex flex-col gap-3">
                {historialPagos.map((p) => (
                  <div key={p.id} className="text-xs border-b border-[#22252e] pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <span className="text-[#9ca3af]">{formatearFechaCorta(p.fechaPago)}</span>
                      <span className="font-semibold text-[#f9fafb]">{formatearPeso(p.monto)}</span>
                    </div>
                    <div className="flex gap-2 mt-0.5 text-[#6b7280]">
                      <span>{p.cliente?.nombre ?? "Todos los locales"}</span>
                      {p.repartidor && <span>· {p.repartidor.nombre}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: pedidos pendientes + cobro por local */}
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
                    <div
                      key={c.id}
                      className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden"
                    >
                      {/* Encabezado local */}
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-[#22252e]">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="font-medium text-sm hover:text-[#a3e635]"
                        >
                          {c.nombre}
                        </Link>
                        <span className="font-semibold text-sm text-red-500">
                          {formatearPeso(deudaCliente)}
                        </span>
                      </div>

                      {/* Tabla de pedidos */}
                      <table className="w-full text-xs">
                        <tbody>
                          {c.pedidos.map((p) => (
                            <tr key={p.id} className="border-b border-[#22252e] last:border-0">
                              <td className="px-4 py-2 text-[#9ca3af]">
                                {formatearFechaCorta(p.fecha)}
                              </td>
                              <td className="px-4 py-2">
                                {p.producto.nombre} {p.maduracion}
                              </td>
                              <td className="px-4 py-2 text-right">{p.cajas} caj.</td>
                              <td className="px-4 py-2 text-right font-medium">
                                {formatearPeso(p.montoTotal)}
                              </td>
                              <td className="px-4 py-2">
                                <BadgeEstadoPago
                                  estado={p.estadoPago as "PENDIENTE" | "PAGADO" | "PARCIAL"}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Cobro por local (expandible) */}
                      <details className="border-t border-[#22252e] group">
                        <summary className="px-4 py-2 text-xs text-[#a3e635] cursor-pointer hover:bg-[#22252e] select-none list-none">
                          + Registrar cobro de este local
                        </summary>
                        <form
                          action={registrarPagoLocal}
                          className="px-4 py-3 flex flex-col gap-2 bg-[#161820]"
                        >
                          <input type="hidden" name="idCuenta" value={cuenta.id} />
                          <input type="hidden" name="idCliente" value={c.id} />
                          <input type="hidden" name="fechaInicio" value={lunesStr} />
                          <input type="hidden" name="fechaFin" value={sabadoStr} />
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-[#9ca3af] mb-1">Monto *</label>
                              <input
                                name="monto"
                                type="number"
                                required
                                min={0}
                                step={100}
                                defaultValue={deudaCliente}
                                className="w-full border border-[#2a2d35] rounded px-2 py-1.5 text-xs bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-[#9ca3af] mb-1">Fecha</label>
                              <input
                                name="fechaPago"
                                type="date"
                                defaultValue={hoy}
                                className="w-full border border-[#2a2d35] rounded px-2 py-1.5 text-xs bg-[#1c1f26] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-[#9ca3af] mb-1">Cobró</label>
                            <select
                              name="idRepartidor"
                              className="w-full border border-[#2a2d35] rounded px-2 py-1.5 text-xs bg-[#1c1f26] focus:outline-none"
                            >
                              <option value="">— Sin asignar —</option>
                              {repartidores.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            name="observaciones"
                            placeholder="Obs."
                            className="border border-[#2a2d35] rounded px-2 py-1.5 text-xs bg-[#1c1f26] focus:outline-none"
                          />
                          <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-3 py-1.5 rounded text-xs font-medium transition-colors self-end">
                            Registrar
                          </BotonSubmit>
                        </form>
                      </details>
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
