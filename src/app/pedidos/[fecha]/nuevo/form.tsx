"use client";

import { BotonSubmit } from "@/components/boton-submit";
import { useState } from "react";

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

  const [idClienteSelec, setIdClienteSelec] = useState<number | null>(clienteInicialId ?? null);
  const [idProductoSelec, setIdProductoSelec] = useState<number | null>(null);
  const [cajas, setCajas] = useState<number | "">(1);
  const [montoManual, setMontoManual] = useState<number | "" | null>(null);
  const [comisionRevendedor, setComisionRevendedor] = useState<number | "">("");
  const [busqueda, setBusqueda] = useState(initialCliente ? `${initialCliente.nombre} · ${initialCliente.zona.nombre}` : "");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [errorCliente, setErrorCliente] = useState(false);
  const [formaPago, setFormaPago] = useState(initialCliente?.formaPagoPref ?? "EFECTIVO");
  const [esReposicion, setEsReposicion] = useState(true);

  const clienteSelec = clientes.find((c) => c.id === idClienteSelec);
  const productoSelec = productos.find((p) => p.id === idProductoSelec);

  const esCambio = formaPago === "CAMBIO";
  const montoCalculado = productoSelec ? Math.round(productoSelec.precioReferencia * (cajas === "" ? 0 : cajas)) : "";
  const montoFinal = esCambio && esReposicion ? 0 : (montoManual ?? montoCalculado);
  const pagoHabitual = clienteSelec ? FORMAS_PAGO.find((f) => f.value === clienteSelec.formaPagoPref)?.label : null;

  const clientesFiltrados = busqueda
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.zona.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : clientes;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!idClienteSelec) {
      e.preventDefault();
      setErrorCliente(true);
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
          <p className="text-xs text-[#16a34a] mt-1">
            Pago habitual: <span className="font-medium">{pagoHabitual}</span>
          </p>
        )}
      </div>

      {/* Producto + Maduración */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Producto *</label>
          <select
            name="idProducto"
            required
            value={idProductoSelec ?? ""}
            onChange={(e) => {
              setIdProductoSelec(Number(e.target.value));
              setMontoManual(null);
            }}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          >
            <option value="">Seleccionar...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {productoSelec && (
            <p className={`text-xs mt-1 ${productoSelec.stockCajas < (cajas === "" ? 0 : cajas) ? "text-red-400" : "text-[#6b7280]"}`}>
              Stock: <span className="font-medium">{productoSelec.stockCajas} cajas</span>
              {productoSelec.kgPorCaja && (
                <span className="ml-2">· {productoSelec.kgPorCaja} kg/caja</span>
              )}
              {productoSelec.stockCajas < (cajas === "" ? 0 : cajas) && (
                <span className="ml-2 font-medium">— insuficiente</span>
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
            placeholder="PF-SEMI, VERDE..."
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
          <datalist id="maduraciones">
            {maduracionesSugeridas.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Cajas + Monto */}
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
              setMontoManual(null);
            }}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">
            {esCambio && !esReposicion ? "Diferencia a cobrar *" : "Monto total *"}
            {!esCambio && productoSelec && montoManual === null && (
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
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] read-only:opacity-40 read-only:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Forma de pago + Repartidor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago *</label>
          <select
            name="formaPago"
            required
            value={formaPago}
            disabled={formaPago === "PAGO_SEMANAL"}
            onChange={(e) => {
              setFormaPago(e.target.value);
              if (e.target.value === "CAMBIO") setEsReposicion(true);
              setMontoManual(null);
            }}
            className={`w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] ${
              formaPago === "PAGO_SEMANAL" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {FORMAS_PAGO.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          {formaPago === "PAGO_SEMANAL" && (
            <input type="hidden" name="formaPago" value="PAGO_SEMANAL" />
          )}
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
            Ganancia Revendedor * 
            <span className="text-xs font-medium text-[#16a34a] ml-1.5 uppercase">
              {clienteSelec.revendedor?.nombre || "Revendedor"}
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="esCobro" />
          <span className="text-sm text-[#f9fafb]">Es cobranza (no entrega)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#22252e]">
        <BotonSubmit
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Guardar pedido
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
