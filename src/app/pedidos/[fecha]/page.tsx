import { ComponentProps } from "react";
import Link from "next/link";
import { getPedidosPorFecha, getTotalesDia } from "@/actions/pedidos";
import { getEnviosSucursalesPorFecha } from "@/actions/sucursales";
import { formatearPeso, formatearFecha, formatearHora, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { BadgeReventa } from "@/components/badge-reventa";
import { FiltrosPedidos } from "./filtros";
import { TablaEntregas } from "./tabla-entregas";
import { TablaEnviosSucursales } from "./tabla-envios-sucursales";
import { TabsVistasPedidos } from "./tabs-vistas-pedidos";
import { NavegacionFecha } from "./navegacion-fecha";
import { AccionesPedido } from "./acciones";
import { ChipsRepartidores, ResumenRepartidorItem } from "./chips-repartidores";

interface Props {
  params: Promise<{ fecha: string }>;
  searchParams: Promise<{
    zona?: string;
    repartidor?: string;
    estado?: string;
    q?: string;
    factura?: string;
    formaPago?: string;
    vista?: string;
  }>;
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

export default async function PedidosFechaPage({ params, searchParams }: Props) {
  const { fecha } = await params;
  const { zona, repartidor, estado, q, factura, formaPago, vista } = await searchParams;

  const [pedidos, totales, enviosSucursales] = await Promise.all([
    getPedidosPorFecha(fecha),
    getTotalesDia(fecha),
    getEnviosSucursalesPorFecha(fecha),
  ]);

  // Catálogo para filtros: zonas y repartidores únicos del día (incluyendo traslados a sucursales)
  const zonasUnicas = Array.from(
    new Map(pedidos.map((p) => [p.cliente.zona.id, p.cliente.zona])).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const todosReps = [
    ...pedidos.filter((p) => p.repartidor).map((p) => p.repartidor!),
    ...enviosSucursales.filter((e) => e.repartidor).map((e) => e.repartidor!),
  ];
  const repsUnicos = Array.from(
    new Map(todosReps.map((r) => [r.id, r])).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Cajas y pedidos por repartidor (suma entregas de clientes + traslados a sucursales)
  const repMap = new Map<number, ResumenRepartidorItem>();

  for (const p of pedidos.filter((p) => !p.esCobro)) {
    const idRep = p.idRepartidor ?? null;
    const key = idRep ?? -1;
    const nombre = p.repartidor?.nombre ?? "Sin asignar";
    const entry = repMap.get(key) ?? {
      id: idRep,
      nombre,
      cajas: 0,
      pedidos: 0,
    };
    entry.cajas += p.cajas;
    entry.pedidos += 1;
    repMap.set(key, entry);
  }

  for (const env of enviosSucursales) {
    const idRep = env.idRepartidor ?? null;
    const key = idRep ?? -1;
    const nombre = env.repartidor?.nombre ?? "Sin asignar";
    const entry = repMap.get(key) ?? {
      id: idRep,
      nombre,
      cajas: 0,
      pedidos: 0,
    };
    entry.cajas += env.cajas;
    entry.pedidos += 1;
    repMap.set(key, entry);
  }

  const resumenReps = Array.from(repMap.values()).sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return b.cajas - a.cajas;
  });

  // Filtrar entregas
  let entregados = pedidos.filter((p) => !p.esCobro);
  if (q) {
    const busq = q.trim().toLowerCase();
    entregados = entregados.filter((p) =>
      p.cliente.nombre.toLowerCase().includes(busq) ||
      (p.cliente.direccion && p.cliente.direccion.toLowerCase().includes(busq)) ||
      (p.producto?.nombre && p.producto.nombre.toLowerCase().includes(busq)) ||
      (p.items && p.items.some((it) => it.producto.nombre.toLowerCase().includes(busq)))
    );
  }
  if (zona)       entregados = entregados.filter((p) => p.cliente.idZona === Number(zona));
  if (repartidor) entregados = entregados.filter((p) => p.idRepartidor === Number(repartidor));
  if (estado)     entregados = entregados.filter((p) => p.estadoPago === estado);
  if (formaPago) {
    entregados = entregados.filter((p) =>
      p.formaPago === formaPago ||
      (Array.isArray(p.pagosParciales) && (p.pagosParciales as any[]).some((item) => item.formaPago === formaPago))
    );
  }
  if (factura === "PENDIENTE")        entregados = entregados.filter((p) => p.estadoFactura === "PENDIENTE" || (p.requiereFactura && p.estadoFactura !== "EMITIDA"));
  else if (factura === "REQUIERE")    entregados = entregados.filter((p) => p.requiereFactura || p.estadoFactura !== "NO_REQUIERE");
  else if (factura === "EMITIDA")     entregados = entregados.filter((p) => p.estadoFactura === "EMITIDA");
  else if (factura === "NO_REQUIERE") entregados = entregados.filter((p) => !p.requiereFactura && p.estadoFactura === "NO_REQUIERE");

  // Filtrar cobros
  let cobros = pedidos.filter((p) => p.esCobro);
  if (q) {
    const busq = q.trim().toLowerCase();
    cobros = cobros.filter((p) =>
      p.cliente.nombre.toLowerCase().includes(busq) ||
      (p.observaciones && p.observaciones.toLowerCase().includes(busq))
    );
  }
  if (zona)       cobros = cobros.filter((p) => p.cliente.idZona === Number(zona));
  if (repartidor) cobros = cobros.filter((p) => p.idRepartidor === Number(repartidor));
  if (estado)     cobros = cobros.filter((p) => p.estadoPago === estado);
  if (formaPago) {
    cobros = cobros.filter((p) =>
      p.formaPago === formaPago ||
      (Array.isArray(p.pagosParciales) && (p.pagosParciales as any[]).some((item) => item.formaPago === formaPago))
    );
  }

  // Filtrar envíos a sucursales
  let enviosFiltrados = enviosSucursales;
  if (repartidor) {
    enviosFiltrados = enviosFiltrados.filter((e) => e.idRepartidor === Number(repartidor));
  }
  if (q) {
    const busq = q.trim().toLowerCase();
    enviosFiltrados = enviosFiltrados.filter((e) =>
      e.sucursal.nombre.toLowerCase().includes(busq) ||
      (e.observaciones && e.observaciones.toLowerCase().includes(busq)) ||
      e.items.some((it) => it.producto.nombre.toLowerCase().includes(busq))
    );
  }

  const cajasSucursales = enviosSucursales.reduce((s, e) => s + e.cajas, 0);
  const cajasTotalDia = totales.cajas + cajasSucursales;

  const hayActividad = pedidos.length > 0 || enviosSucursales.length > 0;

  return (
    <div className="p-8 mx-auto">
      {/* Header con navegación de fechas */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <NavegacionFecha
          fechaActual={fecha}
          fechaAnteriorStr={fechaAnterior(fecha)}
          fechaSiguienteStr={fechaSiguiente(fecha)}
          fechaFormateada={formatearFecha(fecha)}
        />
        <Link
          href={`/pedidos/${fecha}/nuevo`}
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar pedido
        </Link>
      </div>

      {/* Totales del día */}
      {hayActividad && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
            <p className="text-xs text-[#6b7280] font-medium">Pedidos</p>
            <p className="text-lg font-bold text-[#f9fafb] mt-0.5">{totales.cantidad.toString()}</p>
          </div>

          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
            <p className="text-xs text-[#6b7280] font-medium">Cajas</p>
            <p className="text-lg font-bold text-[#f9fafb] mt-0.5">{cajasTotalDia.toLocaleString("es-AR")}</p>
            {cajasSucursales > 0 ? (
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Clientes: <span className="text-[#f9fafb] font-medium">{totales.cajas}</span> · Sucursales: <span className="text-[#a3e635] font-medium">{cajasSucursales}</span>
              </p>
            ) : (
              <p className="text-xs text-[#6b7280] mt-0.5">Clientes: {totales.cajas}</p>
            )}
          </div>

          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
            <p className="text-xs text-[#6b7280] font-medium">Facturado</p>
            <p className="text-lg font-bold text-[#f9fafb] mt-0.5">{formatearPeso(totales.monto)}</p>
          </div>

          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
            <p className="text-xs text-[#6b7280] font-medium">Cobrado</p>
            <p className="text-lg font-bold text-[#f9fafb] mt-0.5">{formatearPeso(totales.cobrado)}</p>
            {totales.monto > totales.cobrado && (
              <p className="text-xs text-red-500 mt-0.5">
                Pendiente: {formatearPeso(totales.monto - totales.cobrado)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen interactivo de cajas por repartidor */}
      {hayActividad && resumenReps.length > 0 && (
        <ChipsRepartidores
          fecha={fecha}
          repartidores={resumenReps}
          repartidorActual={repartidor}
        />
      )}

      {!hayActividad ? (
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-12 text-center">
          <p className="text-[#6b7280] text-sm mb-3">No hay pedidos ni envíos a sucursales registrados para este día.</p>
          <Link
            href={`/pedidos/${fecha}/nuevo`}
            className="inline-block bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Registrar primer pedido
          </Link>
        </div>
      ) : (
        <TabsVistasPedidos
          vistaInicial={vista}
          totalEntregas={entregados.length}
          totalPalterias={enviosFiltrados.length}
          totalCobranzas={cobros.length}
          childrenEntregas={
            <div className="flex flex-col gap-4">
              {/* Filtros */}
              <FiltrosPedidos
                fecha={fecha}
                zonas={zonasUnicas}
                repartidores={repsUnicos}
                zonaActual={zona}
                repartidorActual={repartidor}
                estadoActual={estado}
                busquedaActual={q}
                facturaActual={factura}
                formaPagoActual={formaPago}
              />

              {/* Tabla de entregas */}
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
                {entregados.length === 0 ? (
                  <div className="p-8 text-center text-[#6b7280] text-sm">
                    Sin entregas con esos filtros.
                  </div>
                ) : (
                  <TablaEntregas
                    pedidos={entregados as unknown as ComponentProps<typeof TablaEntregas>["pedidos"]}
                    fecha={fecha}
                    totalEntregasDia={pedidos.filter((p) => !p.esCobro).length}
                  />
                )}
              </div>
            </div>
          }
          childrenPalterias={
            <TablaEnviosSucursales
              envios={enviosFiltrados as unknown as ComponentProps<typeof TablaEnviosSucursales>["envios"]}
              fecha={fecha}
            />
          }
          childrenCobranzas={
            cobros.length === 0 ? (
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-10 text-center text-[#6b7280] text-sm">
                Sin cobranzas registradas para este día.
              </div>
            ) : (
              <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2a2d35] bg-[#17191e]/50">
                  <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
                    Cobros / cobranzas ({cobros.length})
                  </h2>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm min-w-max table-auto border-collapse">
                    <thead>
                      <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs whitespace-nowrap">
                        <th className="text-left px-4 py-3 font-medium">Cliente</th>
                        <th className="text-left px-4 py-3 font-medium">Concepto / Observaciones</th>
                        <th className="text-left px-4 py-3 font-medium">Repartidor</th>
                        <th className="text-left px-4 py-3 font-medium">Forma de Pago</th>
                        <th className="text-left px-4 py-3 font-medium">Estado</th>
                        <th className="text-center px-4 py-3 font-medium w-24">Hora</th>
                        <th className="text-right px-4 py-3 font-medium w-32">Monto</th>
                        <th className="text-right px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobros.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[#22252e] hover:bg-[#22252e]/30 whitespace-nowrap transition-colors last:border-0"
                        >
                          <td className="px-4 py-2.5 font-medium text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link href={`/clientes/${p.idCliente}`} className="hover:text-[#a3e635] text-[#f9fafb]">
                                {p.cliente.nombre}
                              </Link>
                              {p.cliente.revendedor && (
                                <BadgeReventa nombre={p.cliente.revendedor.nombre} />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#9ca3af] text-left">
                            {p.observaciones ?? "Cobranza"}
                          </td>
                          <td className="px-4 py-2.5 text-[#9ca3af] text-left">
                            {p.repartidor ? (
                              <span className="text-[#d1d5db] font-medium">{p.repartidor.nombre}</span>
                            ) : (
                              <span className="text-red-400/80 italic text-xs">Sin asignar</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-[#9ca3af] text-left">
                            {ETIQUETAS_FORMA_PAGO[p.formaPago] ?? p.formaPago}
                          </td>
                          <td className="px-4 py-2.5 text-left">
                            <BadgeEstadoPago estado={p.estadoPago} />
                          </td>
                          <td className="px-4 py-2.5 text-[#9ca3af] text-center font-mono text-xs w-24">
                            {formatearHora(p.creadoEn)} hs
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold font-mono w-32">
                            {p.estadoPago === "PAGADO" ? (
                              <span className="text-[#4ade80]">{formatearPeso(p.montoPagado)}</span>
                            ) : (
                              <span className="text-yellow-400">{formatearPeso(p.montoTotal)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <AccionesPedido pedido={p as unknown as ComponentProps<typeof AccionesPedido>["pedido"]} fecha={fecha} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        />
      )}
    </div>
  );
}
