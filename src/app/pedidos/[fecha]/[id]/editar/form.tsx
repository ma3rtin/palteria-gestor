"use client";

import { BotonSubmit } from "@/components/boton-submit";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatearFechaCorta } from "@/lib/utils";

interface Cliente {
  id: number;
  nombre: string;
  zona: { nombre: string };
  formaPagoPref: string;
  idRepartidor: number | null;
  requiereFactura: boolean;
  idRevendedor: number | null;
  revendedor?: { nombre: string } | null;
}

interface Producto {
  id: number;
  nombre: string;
  precioReferencia: number;
  kgPorCaja: number | null;
  stockCajas: number;
  fechaIngreso?: Date | string | null;
}

interface Repartidor {
  id: number;
  nombre: string;
}

interface PagoParcialItem {
  monto: number;
  formaPago: "EFECTIVO" | "TRANSFERENCIA" | "PAGO_SEMANAL" | "CAMBIO";
  fecha: string;
}

interface Pedido {
  id: number;
  idCliente: number;
  idProducto: number | null;
  fecha: Date;
  maduracion: string | null;
  cajas: number;
  montoTotal: number;
  formaPago: string;
  estadoPago: string;
  montoPagado: number;
  comisionRevendedor: number;
  idRepartidor: number | null;
  requiereFactura: boolean;
  esCobro: boolean;
  observaciones: string | null;
  pagosParciales: unknown;
  cliente: {
    nombre: string;
    idRevendedor?: number | null;
    revendedor?: { nombre: string } | null;
  };
  producto: Producto | null;
}

interface Props {
  fecha: string;
  pedido: Pedido;
  clientes: Cliente[];
  productos: Producto[];
  repartidores: Repartidor[];
  maduracionesSugeridas: string[];
  actualizarPedido: (formData: FormData) => Promise<void>;
}

const FORMAS_PAGO = [
  { value: "EFECTIVO",      label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "PAGO_SEMANAL",  label: "Pago Semanal" },
  { value: "CAMBIO",        label: "Cambio" },
];

export function FormEditarPedido({
  fecha,
  pedido,
  productos,
  repartidores,
  maduracionesSugeridas,
  actualizarPedido,
}: Props) {
  const [idProductoSelec, setIdProductoSelec] = useState<number | null>(pedido.idProducto);
  const [maduracion, setMaduracion] = useState<string>(pedido.maduracion ?? "");
  const [cajas, setCajas] = useState<number | "">(pedido.cajas);
  const [montoManual, setMontoManual] = useState<number | "" | null>(pedido.montoTotal);
  const [formaPago, setFormaPago] = useState(pedido.formaPago);
  const [estadoPago, setEstadoPago] = useState(pedido.estadoPago);
  const [comisionRevendedor, setComisionRevendedor] = useState<number | "">(pedido.comisionRevendedor);
  const [esCobro, setEsCobro] = useState(pedido.esCobro);
  const [descuentoEfectivo, setDescuentoEfectivo] = useState(
    Boolean(pedido.observaciones?.includes("[Desc. efectivo"))
  );
  const [descuentoPorCaja, setDescuentoPorCaja] = useState<number | "">(() => {
    if (pedido.observaciones) {
      const match = pedido.observaciones.match(/\[Desc\. efectivo:\s*-\$([0-9.]+)(?:\s*\/\s*caja)?\]/);
      if (match && pedido.cajas > 0) {
        const montoTotalDesc = Number(match[1].replace(/\./g, ""));
        if (!isNaN(montoTotalDesc) && montoTotalDesc > 0) {
          return Math.round(montoTotalDesc / pedido.cajas);
        }
      }
    }
    return 6000;
  });

  // Inicializar pagosList
  const [pagosList, setPagosList] = useState<PagoParcialItem[]>(() => {
    if (pedido.pagosParciales && Array.isArray(pedido.pagosParciales)) {
      return pedido.pagosParciales as PagoParcialItem[];
    }
    if (pedido.montoPagado > 0) {
      return [
        {
          monto: pedido.montoPagado,
          formaPago: pedido.formaPago as PagoParcialItem["formaPago"],
          fecha: new Date(pedido.fecha).toISOString().split("T")[0],
        },
      ];
    }
    return [];
  });

  const valorDescCaja = descuentoPorCaja === "" ? 0 : Number(descuentoPorCaja);
  const productoSelec = productos.find((p) => p.id === idProductoSelec);
  const descuentoMonto = (descuentoEfectivo && formaPago === "EFECTIVO" && !esCobro && cajas !== "") ? (Number(cajas) * valorDescCaja) : 0;
  const precioBase = productoSelec ? Math.round(productoSelec.precioReferencia * (cajas === "" ? 0 : cajas)) : 0;
  const montoCalculado = productoSelec ? Math.max(0, precioBase - descuentoMonto) : "";
  const montoFinal = montoManual ?? montoCalculado;
  const totalReq = montoFinal === "" ? 0 : Number(montoFinal);

  const totalPagosList = pagosList.reduce((acc, curr) => acc + curr.monto, 0);
  const montoPagado = esCobro ? totalReq : totalPagosList;

  // Recalcular estado de pago según la lista de pagos
  const actualizarEstadoSegunSuma = (nuevaLista: PagoParcialItem[]) => {
    const suma = nuevaLista.reduce((acc, curr) => acc + curr.monto, 0);
    if (suma === 0) {
      setEstadoPago("PENDIENTE");
    } else if (suma >= totalReq) {
      setEstadoPago("PAGADO");
    } else {
      setEstadoPago("PARCIAL");
    }
  };

  const agregarPago = () => {
    const resto = totalReq - totalPagosList;
    const montoNuevo = resto > 0 ? resto : 0;
    const nuevaLista: PagoParcialItem[] = [
      ...pagosList,
      {
        monto: montoNuevo,
        formaPago: formaPago as PagoParcialItem["formaPago"],
        fecha: new Date().toLocaleDateString("sv-SE"),
      },
    ];
    setPagosList(nuevaLista);
    actualizarEstadoSegunSuma(nuevaLista);
  };

  const eliminarPago = (idx: number) => {
    const nuevaLista = pagosList.filter((_, i) => i !== idx);
    setPagosList(nuevaLista);
    actualizarEstadoSegunSuma(nuevaLista);
  };

  const cambiarPago = <K extends keyof PagoParcialItem>(idx: number, key: K, val: PagoParcialItem[K]) => {
    const nuevaLista = pagosList.map((p, i) => (i === idx ? { ...p, [key]: val } : p));
    setPagosList(nuevaLista);
    actualizarEstadoSegunSuma(nuevaLista);
  };

  // Manejar el cambio manual del selector del estado de pago
  const handleEstadoPagoChange = (nuevoEstado: string) => {
    setEstadoPago(nuevoEstado);
    const hoyStr = new Date().toLocaleDateString("sv-SE");

    if (nuevoEstado === "PENDIENTE") {
      setPagosList([]);
    } else if (nuevoEstado === "PAGADO") {
      if (totalPagosList < totalReq) {
        const diferencia = totalReq - totalPagosList;
        if (pagosList.length > 0) {
          const nuevaLista = [...pagosList];
          nuevaLista[nuevaLista.length - 1].monto += diferencia;
          setPagosList(nuevaLista);
        } else {
          setPagosList([
            {
              monto: totalReq,
              formaPago: formaPago as PagoParcialItem["formaPago"],
              fecha: hoyStr,
            },
          ]);
        }
      }
    } else if (nuevoEstado === "PARCIAL") {
      if (totalPagosList === 0 || totalPagosList >= totalReq) {
        const montoSugerido = Math.round(totalReq / 2);
        setPagosList([
          {
            monto: montoSugerido,
            formaPago: formaPago as PagoParcialItem["formaPago"],
            fecha: hoyStr,
          },
        ]);
      }
    }
  };

  const clienteAsociado = pedido.cliente;

  return (
    <form
      action={actualizarPedido}
      className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5"
    >
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="pagosParcialesJson" value={JSON.stringify(pagosList)} />

      <div className="text-sm text-[#9ca3af] mb-1">
        <p>Cliente: <span className="font-medium text-[#f9fafb]">{pedido.cliente.nombre}</span></p>
      </div>

      {!esCobro && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Producto / Lote *</label>
            <select
              name="idProducto"
              required
              value={idProductoSelec ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setIdProductoSelec(val);
                setMontoManual(null);
              }}
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
            >
              <option value="">Seleccionar...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.fechaIngreso ? `(${formatearFechaCorta(p.fechaIngreso)})` : ""}
                </option>
              ))}
            </select>
            {productoSelec && (
              <p className="text-xs text-[#6b7280] mt-1">
                Stock actual: <span className="font-medium text-[#f9fafb]">{productoSelec.stockCajas} cajas</span>
                {productoSelec.id === pedido.idProducto && (
                  <span className="text-[#a3e635] ml-1.5 font-medium">(producto original)</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Maduración *</label>
            <input
              name="maduracion"
              required
              list="maduraciones"
              value={maduracion}
              onChange={(e) => setMaduracion(e.target.value)}
              placeholder="PF-SEMI, VERDE..."
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
            />
            <datalist id="maduraciones">
              {maduracionesSugeridas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>
      )}

      {esCobro ? (
        <div className="flex flex-col gap-4">
          <input type="hidden" name="cajas" value={0} />
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Monto cobrado *</label>
            <input
              name="montoTotal"
              type="number"
              required
              min={1}
              placeholder="0"
              value={montoFinal}
              onChange={(e) => {
                const val = e.target.value;
                setMontoManual(val === "" ? "" : parseInt(val));
              }}
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#f9fafb] mb-1">Cajas *</label>
              <input
                name="cajas"
                type="number"
                required
                min={0.5}
                step={0.5}
                placeholder="0"
                value={cajas}
                onChange={(e) => {
                  const val = e.target.value;
                  setCajas(val === "" ? "" : parseFloat(val));
                  setMontoManual(null); // Resetear a calculado si cambia cantidad
                }}
                className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#f9fafb] mb-1">
                Monto total *
                {productoSelec && montoManual === null && (
                  <span className="text-xs text-[#6b7280] ml-1">(calculado)</span>
                )}
              </label>
              <input
                name="montoTotal"
                type="number"
                required
                min={0}
                placeholder="0"
                value={montoFinal}
                onChange={(e) => {
                  const val = e.target.value;
                  setMontoManual(val === "" ? "" : parseInt(val));
                }}
                className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
              />
            </div>
          </div>

          {/* Descuento por pago en efectivo */}
          <div className="bg-[#17191e]/60 border border-[#2a2d35] rounded-lg p-3 flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#a3e635] select-none">
              <input
                type="checkbox"
                name="descuentoEfectivo"
                checked={descuentoEfectivo}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDescuentoEfectivo(checked);
                  if (checked) {
                    setFormaPago("EFECTIVO");
                  }
                  setMontoManual(null);
                }}
                className="rounded border-[#2a2d35] bg-[#1c1f26] text-[#a3e635] focus:ring-0 cursor-pointer"
              />
              <span className="font-medium">
                Descuento por pago en efectivo
              </span>
            </label>

            {descuentoEfectivo && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2a2d35]/60 pl-6">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#9ca3af] whitespace-nowrap">Descuento por caja:</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]">$</span>
                    <input
                      type="number"
                      name="descuentoPorCaja"
                      min={0}
                      step={500}
                      value={descuentoPorCaja}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDescuentoPorCaja(val === "" ? "" : parseFloat(val));
                        setMontoManual(null);
                      }}
                      className="w-28 pl-6 pr-2.5 py-1 text-xs border border-[#2a2d35] rounded-md focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb] font-mono"
                      placeholder="6000"
                    />
                  </div>
                </div>
                {cajas !== "" && Number(cajas) > 0 && (
                  <span className="text-xs font-semibold text-[#a3e635] font-mono">
                    Total descuento: -{formatearPeso(Number(cajas) * valorDescCaja)}
                    {Number(cajas) > 1 && (
                      <span className="text-[#6b7280] font-normal font-sans ml-1">
                        ({cajas} cajas × {formatearPeso(valorDescCaja)})
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago *</label>
          <select
            name="formaPago"
            required
            value={formaPago}
            disabled={pedido.formaPago === "PAGO_SEMANAL" && !descuentoEfectivo}
            onChange={(e) => {
              const val = e.target.value;
              setFormaPago(val);
              if (val !== "EFECTIVO") {
                setDescuentoEfectivo(false);
              }
            }}
            className={`w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white ${
              pedido.formaPago === "PAGO_SEMANAL" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {FORMAS_PAGO.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          {pedido.formaPago === "PAGO_SEMANAL" && (
            <p className="text-xs text-[#6b7280] mt-1">No se puede cambiar un Pago Semanal.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Repartidor</label>
          <select
            name="idRepartidor"
            defaultValue={pedido.idRepartidor ?? ""}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
          >
            <option value="">Sin asignar</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {esCobro ? (
        <>
          <input type="hidden" name="estadoPago" value="PAGADO" />
          <input type="hidden" name="montoPagado" value={montoFinal} />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Estado de pago *</label>
            <select
              name="estadoPago"
              required
              value={estadoPago}
              onChange={(e) => handleEstadoPagoChange(e.target.value)}
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">
              Monto pagado *
              {estadoPago === "PAGADO" && <span className="text-xs text-[#6b7280] ml-1">(total)</span>}
              {estadoPago === "PENDIENTE" && <span className="text-xs text-[#6b7280] ml-1">(cero)</span>}
            </label>
            <input
              name="montoPagado"
              type="number"
              required
              min={0}
              max={montoFinal === "" ? undefined : Number(montoFinal)}
              value={montoPagado}
              readOnly={true}
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] opacity-60 cursor-not-allowed text-white font-mono"
            />
          </div>
        </div>
      )}

      {/* Desglose de pagos parciales - Siempre visible */}
      {esCobro ? (
        <input
          type="hidden"
          name="pagosParcialesJson"
          value={JSON.stringify([
            {
              monto: Number(montoFinal) || 0,
              formaPago: formaPago,
              fecha: fecha,
            },
          ])}
        />
      ) : (
        <div className="border border-[#2a2d35] bg-[#17191e]/50 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#2a2d35]">
            <div>
              <span className="text-sm font-semibold text-[#f9fafb]">Desglose de Pagos Registrados</span>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Total cobrado: <span className="font-mono font-bold text-[#4ade80]">{formatearPeso(totalPagosList)}</span> de <span className="font-mono">{formatearPeso(totalReq)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={agregarPago}
              className="inline-flex items-center gap-1 border border-[#2a2d35] hover:border-[#a3e635] text-[#9ca3af] hover:text-[#a3e635] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-[#1c1f26] cursor-pointer"
            >
              <Plus size={14} />
              Agregar pago
            </button>
          </div>

          {pagosList.length === 0 ? (
            <p className="text-xs text-[#6b7280] py-2 italic text-center">No hay pagos registrados para este pedido.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pagosList.map((pago, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={pago.formaPago}
                    onChange={(e) => cambiarPago(index, "formaPago", e.target.value as PagoParcialItem["formaPago"])}
                    className="border border-[#2a2d35] rounded-lg px-2.5 py-1.5 text-xs bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] flex-1 cursor-pointer"
                  >
                    {FORMAS_PAGO.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Monto"
                    value={pago.monto}
                    onChange={(e) => cambiarPago(index, "monto", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    className="border border-[#2a2d35] rounded-lg px-2.5 py-1.5 text-xs bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] w-28 font-mono text-right"
                  />
                  <input
                    type="date"
                    required
                    value={pago.fecha}
                    onChange={(e) => cambiarPago(index, "fecha", e.target.value)}
                    className="border border-[#2a2d35] rounded-lg px-2.5 py-1.5 text-xs bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635] w-32 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarPago(index)}
                    className="text-red-500 hover:text-red-400 p-2 border border-transparent hover:border-[#2a2d35] hover:bg-[#22252e] rounded-lg transition-colors cursor-pointer"
                    title="Eliminar pago"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {clienteAsociado?.idRevendedor && (
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">
            Ganancia Revendedor * 
            <span className="text-xs font-medium text-[#16a34a] ml-1.5 uppercase">
              {clienteAsociado.revendedor?.nombre || "Revendedor"}
            </span>
          </label>
          <input
            name="comisionRevendedor"
            type="number"
            required
            min={0}
            placeholder="Monto a pagar al revendedor..."
            value={comisionRevendedor}
            onChange={(e) => setComisionRevendedor(e.target.value === "" ? "" : parseFloat(e.target.value))}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
        <input
          name="observaciones"
          defaultValue={pedido.observaciones ?? ""}
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="esCobro"
            checked={esCobro}
            onChange={(e) => {
              const checked = e.target.checked;
              setEsCobro(checked);
              if (checked) {
                setCajas(0);
                setEstadoPago("PAGADO");
              } else {
                setCajas(pedido.cajas > 0 ? pedido.cajas : 1);
                setEstadoPago(pedido.estadoPago);
              }
            }}
          />
          <span className="text-sm text-[#f9fafb]">Es cobranza (no entrega)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="requiereFactura"
            defaultChecked={pedido.requiereFactura}
          />
          <span className="text-sm text-[#f9fafb]">Requiere factura</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#22252e]">
        <BotonSubmit
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Guardar cambios
        </BotonSubmit>
        <a
          href={`/pedidos/${fecha}`}
          className="px-6 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-[#f9fafb] border border-[#2a2d35] hover:border-[#4b5563] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

// Utilidad local para formatear pesos
function formatearPeso(num: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
