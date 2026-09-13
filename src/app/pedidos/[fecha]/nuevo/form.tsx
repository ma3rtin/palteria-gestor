"use client";

import { BotonSubmit } from "@/components/boton-submit";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatearFechaCorta, formatearPeso } from "@/lib/utils";
import { SelectorProductoBuscador } from "@/components/selector-producto-buscador";

interface Cliente {
  id: number;
  nombre: string;
  cuit?: string | null;
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

interface Props {
  fecha: string;
  clientes: Cliente[];
  productos: Producto[];
  repartidores: Repartidor[];
  maduracionesSugeridas: string[];
  crearPedido: (formData: FormData) => Promise<void>;
  clienteInicialId?: number;
}

interface ItemFormRow {
  key: string;
  idProducto: number | "";
  cajas: number | "";
  maduracion: string;
}

const FORMAS_PAGO = [
  { value: "EFECTIVO",      label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "PAGO_SEMANAL",  label: "Pago Semanal" },
  { value: "CAMBIO",        label: "Cambio" },
];

export function FormNuevoPedido({
  fecha,
  clientes,
  productos,
  repartidores,
  maduracionesSugeridas,
  crearPedido,
  clienteInicialId,
}: Props) {
  const initialCliente = clienteInicialId ? clientes.find((c) => c.id === clienteInicialId) : null;

  const [esCobro, setEsCobro] = useState(false);
  const [idClienteSelec, setIdClienteSelec] = useState<number | null>(clienteInicialId ?? null);
  const [items, setItems] = useState<ItemFormRow[]>([
    { key: "item-1", idProducto: "", cajas: 1, maduracion: "" },
  ]);
  const [montoManual, setMontoManual] = useState<number | "" | null>(null);
  const [comisionRevendedor, setComisionRevendedor] = useState<number | "">("");
  const [busqueda, setBusqueda] = useState(initialCliente ? `${initialCliente.nombre} · ${initialCliente.zona.nombre}` : "");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [errorCliente, setErrorCliente] = useState(false);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState(initialCliente?.formaPagoPref ?? "EFECTIVO");
  const [esReposicion, setEsReposicion] = useState(true);
  const [descuentoEfectivo, setDescuentoEfectivo] = useState(false);
  const [descuentoPorCaja, setDescuentoPorCaja] = useState<number | "">(6000);
  const [estadoCobro, setEstadoCobro] = useState<"PAGADO" | "PENDIENTE">("PAGADO");

  const clienteSelec = clientes.find((c) => c.id === idClienteSelec);

  function agregarItem() {
    setItems((prev) => [
      ...prev,
      { key: `item-${Date.now()}-${Math.random()}`, idProducto: "", cajas: 1, maduracion: "" },
    ]);
    setErrorItems(null);
  }

  function eliminarItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setMontoManual(null);
    setErrorItems(null);
  }

  function actualizarItem(index: number, campo: keyof ItemFormRow, valor: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
    setMontoManual(null);
    setErrorItems(null);
  }

  const totalCajas = esCobro
    ? 0
    : items.reduce((sum, it) => sum + (typeof it.cajas === "number" ? it.cajas : 0), 0);

  const esCambio = formaPago === "CAMBIO";
  const valorDescCaja = typeof descuentoPorCaja === "number" ? descuentoPorCaja : 0;
  const descuentoMonto = (!esCobro && descuentoEfectivo && formaPago === "EFECTIVO" && totalCajas > 0)
    ? (totalCajas * valorDescCaja)
    : 0;

  const precioBase = items.reduce((sum, it) => {
    if (!it.idProducto || typeof it.cajas !== "number") return sum;
    const prod = productos.find((p) => p.id === it.idProducto);
    return sum + (prod ? Math.round(prod.precioReferencia * it.cajas) : 0);
  }, 0);

  const montoCalculado = esCobro ? "" : (precioBase > 0 ? Math.max(0, precioBase - descuentoMonto) : "");
  const montoFinal = esCobro ? (montoManual ?? "") : (esCambio && esReposicion ? 0 : (montoManual ?? montoCalculado));
  const pagoHabitual = clienteSelec ? FORMAS_PAGO.find((f) => f.value === clienteSelec.formaPagoPref)?.label : null;

  const clientesFiltrados = busqueda
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.zona.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : clientes;

  const itemsParaEnvio = items
    .filter((it) => it.idProducto !== "" && typeof it.cajas === "number" && it.cajas > 0)
    .map((it) => {
      const prod = productos.find((p) => p.id === it.idProducto);
      const precioUnit = prod?.precioReferencia ?? 0;
      const sub = Math.round(precioUnit * (it.cajas as number));
      return {
        idProducto: Number(it.idProducto),
        cajas: Number(it.cajas),
        maduracion: it.maduracion.trim().toUpperCase(),
        precioUnitario: precioUnit,
        subtotal: sub,
      };
    });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!idClienteSelec) {
      e.preventDefault();
      setErrorCliente(true);
      return;
    }
    if (!esCobro) {
      if (
        items.length === 0 ||
        items.some((it) => !it.idProducto || it.cajas === "" || it.cajas <= 0 || !it.maduracion.trim())
      ) {
        e.preventDefault();
        setErrorItems("Por favor completá los datos de todos los productos (producto, maduración y cantidad mayor a cero).");
        return;
      }
    }
  }

  function seleccionarCliente(c: Cliente) {
    setIdClienteSelec(c.id);
    setBusqueda(c.nombre + " · " + c.zona.nombre);
    setMostrarLista(false);
    setErrorCliente(false);
    setFormaPago(c.formaPagoPref); // Auto-select preferred payment method
  }

  return (
    <form
      action={crearPedido}
      onSubmit={handleSubmit}
      className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5"
    >
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="esCobro" value={esCobro ? "on" : ""} />
      {!esCobro && (
        <>
          <input type="hidden" name="itemsJson" value={JSON.stringify(itemsParaEnvio)} />
          <input type="hidden" name="cajas" value={totalCajas} />
          {items.length > 0 && (
            <>
              <input type="hidden" name="idProducto" value={items[0].idProducto} />
              <input type="hidden" name="maduracion" value={items[0].maduracion} />
            </>
          )}
        </>
      )}

      {/* Selector de Modo: Entrega vs Cobranza */}
      <div className="flex rounded-lg bg-[#17191e] p-1 border border-[#2a2d35]">
        <button
          type="button"
          onClick={() => {
            setEsCobro(false);
            setMontoManual(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            !esCobro
              ? "bg-[#a3e635] text-[#0f1117] shadow"
              : "text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          Entrega
        </button>
        <button
          type="button"
          onClick={() => {
            setEsCobro(true);
            setMontoManual(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            esCobro
              ? "bg-[#a3e635] text-[#0f1117] shadow"
              : "text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          Cobranzas
        </button>
      </div>

      {/* Cliente — combobox */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Cliente *</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o zona..."
            value={busqueda}
            autoComplete="off"
            onFocus={() => setMostrarLista(true)}
            onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setIdClienteSelec(null);
              setMostrarLista(true);
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
              errorCliente
                ? "border-red-500 focus:border-red-500"
                : "border-[#2a2d35] focus:border-[#a3e635]"
            }`}
          />
          <input type="hidden" name="idCliente" value={idClienteSelec ?? ""} />

          {mostrarLista && clientesFiltrados.length > 0 && (
            <ul className="absolute z-20 w-full bg-[#1c1f26] border border-[#2a2d35] border-t-0 rounded-b-lg max-h-52 overflow-y-auto shadow-xl">
              {clientesFiltrados.map((c) => (
                <li
                  key={c.id}
                  onMouseDown={() => seleccionarCliente(c)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-[#22252e] flex justify-between items-center"
                >
                  <span className="text-[#f9fafb]">{c.nombre}</span>
                  <span className="text-[#6b7280] text-xs ml-3 shrink-0">{c.zona.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errorCliente && (
          <p className="text-xs text-red-400 mt-1">Seleccioná un cliente de la lista</p>
        )}
        {clienteSelec && (
          <p className="text-xs text-[#16a34a] mt-1 flex flex-wrap items-center gap-x-2">
            <span>Pago habitual: <strong className="font-medium">{pagoHabitual}</strong></span>
            {clienteSelec.cuit && (
              <span className="text-[#9ca3af]">· CUIT/CUIL: <strong className="font-mono text-[#f9fafb] font-normal">{clienteSelec.cuit}</strong></span>
            )}
          </p>
        )}
      </div>

      {esCobro ? (
        <div className="flex flex-col gap-4">
          <input type="hidden" name="cajas" value="0" />
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Monto a cobrar *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280]">$</span>
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
                className="w-full pl-8 pr-3 py-2 border border-[#2a2d35] rounded-lg text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1.5">Estado del cobro *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEstadoCobro("PAGADO")}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-center ${
                  estadoCobro === "PAGADO"
                    ? "bg-[#16a34a]/20 border-[#16a34a] text-[#4ade80]"
                    : "bg-[#1c1f26] border-[#2a2d35] text-[#9ca3af] hover:text-[#f9fafb]"
                }`}
              >
                Cobrado (dinero ya recibido)
              </button>
              <button
                type="button"
                onClick={() => setEstadoCobro("PENDIENTE")}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-center ${
                  estadoCobro === "PENDIENTE"
                    ? "bg-yellow-950/40 border-yellow-700 text-yellow-400"
                    : "bg-[#1c1f26] border-[#2a2d35] text-[#9ca3af] hover:text-[#f9fafb]"
                }`}
              >
                Pendiente de cobro (a cobrar)
              </button>
            </div>
            <input type="hidden" name="estadoCobro" value={estadoCobro} />
          </div>
        </div>
      ) : (
        <>
          {/* Sección de Productos */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#f9fafb]">
                {items.length > 1 ? "Productos *" : "Producto *"}
              </label>
              <button
                type="button"
                onClick={agregarItem}
                className="inline-flex items-center gap-1.5 text-xs text-[#a3e635] hover:text-[#84cc16] font-medium transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#a3e635]/10"
              >
                <Plus size={14} />
                <span>Agregar otro producto</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, idx) => {
                const prodSelec = productos.find((p) => p.id === item.idProducto);
                const stockInsuficiente = prodSelec && typeof item.cajas === "number" && prodSelec.stockCajas < item.cajas;
                const otrosIdsSeleccionados = items
                  .filter((_, i) => i !== idx)
                  .map((it) => it.idProducto)
                  .filter((id): id is number => typeof id === "number" && id > 0);

                return (
                  <div
                    key={item.key}
                    className="bg-[#17191e] border border-[#2a2d35] rounded-lg p-3.5 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#6b7280]">
                      <span className="font-semibold uppercase tracking-wider text-[#9ca3af]">
                        {items.length > 1 ? `Producto #${idx + 1}` : "Detalle del producto"}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarItem(idx)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Eliminar este producto"
                        >
                          <Trash2 size={13} />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Producto */}
                      <div className="md:col-span-6">
                        <label className="block text-xs font-medium text-[#9ca3af] mb-1">Producto *</label>
                        <SelectorProductoBuscador
                          productos={productos}
                          idSeleccionado={item.idProducto}
                          onSeleccionar={(val) => actualizarItem(idx, "idProducto", val)}
                          productosExcluidosIds={otrosIdsSeleccionados}
                          required={!esCobro}
                        />
                        {prodSelec && (
                          <p className={`text-xs mt-1 ${stockInsuficiente ? "text-red-400" : "text-[#6b7280]"}`}>
                            Stock: <span className="font-medium">{prodSelec.stockCajas} cajas</span>
                            {prodSelec.kgPorCaja && (
                              <span className="ml-2">· {prodSelec.kgPorCaja} kg/caja</span>
                            )}
                            {stockInsuficiente && (
                              <span className="ml-2 font-medium">— insuficiente</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Maduración */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-[#9ca3af] mb-1">Maduración *</label>
                        <input
                          value={item.maduracion}
                          required={!esCobro}
                          list="maduraciones"
                          placeholder="PF-SEMI, VERDE..."
                          onChange={(e) => actualizarItem(idx, "maduracion", e.target.value)}
                          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb]"
                        />
                      </div>

                      {/* Cajas */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-[#9ca3af] mb-1">Cajas *</label>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          required={!esCobro}
                          placeholder="0"
                          value={item.cajas}
                          onChange={(e) => {
                            const val = e.target.value;
                            actualizarItem(idx, "cajas", val === "" ? "" : parseFloat(val));
                          }}
                          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb] font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <datalist id="maduraciones">
              {maduracionesSugeridas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>

            {errorItems && <p className="text-xs text-red-400 mt-1">{errorItems}</p>}

            {/* Resumen de cajas y Monto total */}
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <label className="block text-sm font-medium text-[#f9fafb] mb-1">Total cajas</label>
                <div className="border border-[#2a2d35] bg-[#17191e] rounded-lg px-3 py-2 text-sm font-mono text-[#f9fafb]">
                  {totalCajas} {totalCajas === 1 ? "caja" : "cajas"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#f9fafb] mb-1">
                  {esCambio && !esReposicion ? "Diferencia a cobrar *" : "Monto total *"}
                  {!esCambio && montoManual === null && montoCalculado !== "" && (
                    <span className="text-xs text-[#6b7280] ml-1">(calculado)</span>
                  )}
                  {esCambio && esReposicion && (
                    <span className="text-xs text-[#6b7280] ml-1">(sin cargo)</span>
                  )}
                </label>
                <input
                  name="montoTotal"
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={montoFinal}
                  readOnly={esCambio && esReposicion}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMontoManual(val === "" ? "" : parseInt(val));
                  }}
                  className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb] font-mono read-only:opacity-40 read-only:cursor-not-allowed"
                />
              </div>
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
                {totalCajas > 0 && (
                  <span className="text-xs font-semibold text-[#a3e635] font-mono">
                    Total descuento: -{formatearPeso(totalCajas * valorDescCaja)}
                    {totalCajas > 1 && (
                      <span className="text-[#6b7280] font-normal font-sans ml-1">
                        ({totalCajas} cajas × {formatearPeso(valorDescCaja)})
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Forma de pago + Repartidor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago *</label>
          <select
            name="formaPago"
            required
            value={formaPago}
            onChange={(e) => {
              const val = e.target.value;
              setFormaPago(val);
              if (val !== "EFECTIVO") {
                setDescuentoEfectivo(false);
              }
              if (val === "CAMBIO") setEsReposicion(true);
            }}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          >
            {FORMAS_PAGO.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Repartidor</label>
          <select
            name="idRepartidor"
            defaultValue={clienteSelec?.idRepartidor ?? ""}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          >
            <option value="">Sin asignar</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {clienteSelec?.idRevendedor && (
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">
            Ganancia Revendedor
            <span className="text-xs font-medium text-[#16a34a] ml-1.5 uppercase">
              {clienteSelec.revendedor?.nombre || "Revendedor"}
            </span>
          </label>
          <input
            name="comisionRevendedor"
            type="number"
            min={0}
            placeholder="0"
            value={comisionRevendedor}
            onChange={(e) => setComisionRevendedor(e.target.value === "" ? "" : parseFloat(e.target.value))}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          />
        </div>
      )}

      <input type="hidden" name="esReposicion" value={String(esReposicion)} />

      {esCambio && (
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-2">Tipo de cambio *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEsReposicion(true); setMontoManual(null); }}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                esReposicion
                  ? "bg-[#a3e635] text-[#0f1117] border-[#a3e635] font-medium"
                  : "border-[#2a2d35] text-[#9ca3af] hover:border-[#4b5563]"
              }`}
            >
              Sin cargo (reposición)
            </button>
            <button
              type="button"
              onClick={() => { setEsReposicion(false); setMontoManual(null); }}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                !esReposicion
                  ? "bg-[#a3e635] text-[#0f1117] border-[#a3e635] font-medium"
                  : "border-[#2a2d35] text-[#9ca3af] hover:border-[#4b5563]"
              }`}
            >
              Con diferencia de precio
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
        <input
          name="observaciones"
          placeholder="PAGA $X REVISAR SALDO, coordinar, etc."
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="requiereFactura"
            defaultChecked={clienteSelec?.requiereFactura ?? false}
          />
          <span className="text-sm text-[#f9fafb]">Requiere factura</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#22252e]">
        <BotonSubmit
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {esCobro ? "Guardar cobranza" : "Guardar pedido"}
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
