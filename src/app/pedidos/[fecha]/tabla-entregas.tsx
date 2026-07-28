"use client";

import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BadgeEstadoPago } from "@/components/badge-estado";
import { SelectorEstadoFactura } from "@/components/selector-estado-factura";
import { AccionesPedido } from "./acciones";
import { registrarCobro } from "@/actions/pedidos";
import { BotonSubmit } from "@/components/boton-submit";
import { BotonCopiarEtiqueta } from "@/components/boton-copiar-etiqueta";
import { useToast } from "@/hooks/use-toast";
import { formatearPeso, ETIQUETAS_FORMA_PAGO, obtenerFilaExcel, formatearHora } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";

interface Pedido {
  id: number;
  idCliente: number;
  idProducto: number;
  cajas: number;
  montoTotal: number;
  formaPago: string;
  estadoPago: string;
  montoPagado: number;
  maduracion: string;
  estadoFactura: "PENDIENTE" | "NO_REQUIERE" | "EMITIDA";
  esReposicion: boolean;
  esCobro: boolean;
  idRepartidor: number | null;
  observaciones: string | null;
  fecha: Date;
  creadoEn: Date;
  cliente: {
    id: number;
    nombre: string;
    direccion: string | null;
    zona: { id: number; nombre: string };
  };
  producto: {
    id: number;
    nombre: string;
    kgPorCaja: number | null;
    precioReferencia: number;
  };
  repartidor: {
    id: number;
    nombre: string;
  } | null;
  pagosParciales?: any;
}

interface Props {
  pedidos: Pedido[];
  fecha: string;
  totalEntregasDia: number;
}

export function TablaEntregas({ pedidos, fecha, totalEntregasDia }: Props) {
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const pId = searchParams.get("pedidoId");
    if (pId) {
      setExpandedId(Number(pId));
    }
  }, [searchParams]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copiarTodoExcel = () => {
    const text = pedidos.map(p => obtenerFilaExcel(p as any)).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      showToast("Pedidos copiados");
    });
  };

  return (
    <div className="flex flex-col">
      {/* Cabecera de la sección Entregas */}
      <div className="px-4 py-3 border-b border-[#2a2d35] flex items-center justify-between bg-[#17191e]/50">
        <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">
          Entregas ({pedidos.length}{pedidos.length !== totalEntregasDia ? ` de ${totalEntregasDia}` : ""})
        </h2>
        <button
          onClick={copiarTodoExcel}
          className="inline-flex items-center gap-1.5 text-xs text-[#a3e635] hover:text-[#84cc16] font-semibold transition-colors"
          title="Copia toda la lista de pedidos al portapapeles formateada para pegar en Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Copiar pedidos</span>
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-max table-auto border-collapse">
        <thead>
          <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs whitespace-nowrap">
            <th className="w-10"></th>
            <th className="text-left px-4 py-3 font-medium">Dirección</th>
            <th className="text-left px-4 py-3 font-medium">Zona</th>
            <th className="text-right px-4 py-3 font-medium">Cantidad</th>
            <th className="text-left px-4 py-3 font-medium">Marca</th>
            <th className="text-right px-4 py-3 font-medium">Total</th>
            <th className="text-left px-4 py-3 font-medium">Estado</th>
            <th className="text-left px-4 py-3 font-medium">Factura</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <Fragment key={p.id}>
                {/* Fila Principal */}
                <tr
                  className={`border-b border-[#22252e] hover:bg-[#22252e] whitespace-nowrap transition-colors ${
                    isExpanded ? "bg-[#22252e]/40 border-b-0" : "last:border-0"
                  }`}
                >
                  {/* Flecha Toggle */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="text-[#6b7280] hover:text-[#a3e635] p-1 rounded transition-colors inline-flex items-center justify-center"
                      title={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Dirección */}
                  <td className="px-4 py-2.5 text-left">
                    <Link href={`/clientes/${p.idCliente}`} className="hover:text-[#a3e635]">
                      <span className="font-medium text-[#f9fafb]">{p.cliente.nombre}</span>
                    </Link>
                  </td>

                  {/* Zona */}
                  <td className="px-4 py-2.5 text-left text-[#9ca3af]">
                    {p.cliente.zona.nombre}
                  </td>

                  {/* Cantidad (Cajas) */}
                  <td className="px-4 py-2.5 text-right text-[#9ca3af] font-mono">
                    {p.cajas}
                  </td>

                  {/* Marca (Variedad) */}
                  <td className="px-4 py-2.5 text-left text-[#9ca3af]">
                    {p.producto.nombre}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-medium text-[#f9fafb] font-mono">{formatearPeso(p.montoTotal)}</span>
                    {p.estadoPago === "PARCIAL" && (
                      <div className="text-[10px] mt-0.5 space-x-1 font-mono">
                        <span className="text-[#4ade80]">P. {formatearPeso(p.montoPagado)}</span>
                        <span className="text-[#6b7280]">·</span>
                        <span className="text-red-400">D. {formatearPeso(p.montoTotal - p.montoPagado)}</span>
                      </div>
                    )}
                  </td>

                  {/* Estado Pago */}
                  <td className="px-4 py-2.5 text-left">
                    <BadgeEstadoPago estado={p.estadoPago as any} />
                  </td>

                  {/* Factura */}
                  <td className="px-4 py-2.5 text-left">
                    <SelectorEstadoFactura idPedido={p.id} estadoActual={p.estadoFactura} />
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-2.5 text-right">
                    <AccionesPedido pedido={p} fecha={fecha} />
                  </td>
                </tr>

                {/* Detalles Desplegables */}
                {isExpanded && (
                  <tr key={`${p.id}-details`} className="bg-[#13151c]/90 border-b border-[#22252e]">
                    <td colSpan={9} className="px-10 py-4 text-left">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Caja (Peso)</span>
                          <span className="text-[#f9fafb]">
                            {p.producto.kgPorCaja ? `${p.producto.kgPorCaja} kg / caja` : "Sin especificar"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Maduración</span>
                          <span className="text-[#f9fafb]">{p.maduracion || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Repartidor</span>
                          <span className="text-[#f9fafb]">{p.repartidor?.nombre || "Sin asignar"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Forma de Pago</span>
                          <span className="text-[#f9fafb]">{ETIQUETAS_FORMA_PAGO[p.formaPago] || p.formaPago}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Hora de Carga</span>
                          <span className="text-[#f9fafb]">{formatearHora(p.creadoEn)} hs</span>
                        </div>
                      </div>

                      {/* Barra de Acciones del Detalle */}
                      <div className="mt-4 pt-3 border-t border-[#22252e]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Izquierda: Cobro Parcial (si no está pagado) */}
                        {p.estadoPago !== "PAGADO" ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Registrar cobro parcial</span>
                              <span className="text-xs text-[#9ca3af]">
                                Deuda restante: <span className="font-semibold text-[#f87171]">{formatearPeso(p.montoTotal - p.montoPagado)}</span>
                              </span>
                            </div>
                             <form action={registrarCobro.bind(null, p.id)} className="flex items-center gap-2">
                               <select
                                 name="formaPago"
                                 defaultValue={p.formaPago}
                                 className="text-xs border border-[#2a2d35] rounded-md px-2 py-1 bg-[#1c1f26] text-[#f9fafb] focus:outline-none focus:border-[#a3e635] cursor-pointer"
                               >
                                 <option value="EFECTIVO">Efectivo</option>
                                 <option value="TRANSFERENCIA">Transferencia</option>
                                 <option value="PAGO_SEMANAL">Pago Semanal</option>
                                 <option value="CAMBIO">Cambio</option>
                               </select>
                               <div className="relative">
                                 <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]">$</span>
                                 <input
                                   name="monto"
                                   type="number"
                                   defaultValue={p.montoTotal - p.montoPagado}
                                   required
                                   placeholder="0"
                                   min={1}
                                   max={p.montoTotal - p.montoPagado}
                                   className="w-24 pl-6 pr-2.5 py-1 text-xs border border-[#2a2d35] rounded-md focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb]"
                                 />
                               </div>
                               <BotonSubmit className="bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1 rounded-md text-xs font-semibold transition-colors">
                                 Cobrar Parcial
                               </BotonSubmit>
                             </form>
                          </div>
                        ) : (
                          <div className="text-xs text-[#6b7280]">
                            Pedido pagado en su totalidad.
                          </div>
                        )}

                        <div>
                          <BotonCopiarEtiqueta
                            pedido={{
                              fecha: p.fecha,
                              cliente: p.cliente,
                              producto: p.producto,
                              cajas: p.cajas,
                              montoTotal: p.montoTotal,
                              montoPagado: p.montoPagado,
                              formaPago: p.formaPago,
                              maduracion: p.maduracion,
                              pagosParciales: p.pagosParciales
                            }}
                            onCopied={() => showToast("Etiqueta copiada")}
                          />
                        </div>
                      </div>

                      {p.observaciones && (
                        <div className="col-span-4 flex flex-col gap-1 mt-4 pt-3 border-t border-[#22252e]/50">
                          <span className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold">Observaciones</span>
                          <span className="text-[#f9fafb] italic">"{p.observaciones}"</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
      {ToastComponent}
    </div>
  );
}
