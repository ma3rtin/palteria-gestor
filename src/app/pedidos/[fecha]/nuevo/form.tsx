"use client";

import { useState } from "react";

interface Cliente {
  id: number;
  nombre: string;
  zona: { nombre: string };
  formaPagoPref: string;
  idRepartidor: number | null;
  requiereFactura: boolean;
}

interface Producto {
  id: number;
  nombre: string;
  precioReferencia: number;
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
}

const FORMAS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "PAGO_SEMANAL", label: "Pago Semanal" },
  { value: "CAMBIO", label: "Cambio" },
];

export function FormNuevoPedido({
  fecha,
  clientes,
  productos,
  repartidores,
  maduracionesSugeridas,
  crearPedido,
}: Props) {
  const [idClienteSelec, setIdClienteSelec] = useState<number | null>(null);
  const [idProductoSelec, setIdProductoSelec] = useState<number | null>(null);
  const [cajas, setCajas] = useState<number>(1);
  const [montoManual, setMontoManual] = useState<number | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const clienteSelec = clientes.find((c) => c.id === idClienteSelec);
  const productoSelec = productos.find((p) => p.id === idProductoSelec);

  const montoCalculado = productoSelec
    ? Math.round(productoSelec.precioReferencia * cajas)
    : 0;
  const montoFinal = montoManual ?? montoCalculado;

  const clientesFiltrados = busquedaCliente
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
          c.zona.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
      )
    : clientes;

  return (
    <form action={crearPedido} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5">
      <input type="hidden" name="fecha" value={fecha} />

      {/* Cliente con búsqueda */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Cliente *</label>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
          className="w-full border border-[#2a2d35] rounded-t-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
        <select
          name="idCliente"
          required
          size={5}
          value={idClienteSelec ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            setIdClienteSelec(id);
            setBusquedaCliente(clientes.find((c) => c.id === id)?.nombre ?? "");
          }}
          className="w-full border border-x border-b border-[#2a2d35] rounded-b-lg px-3 py-1 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
        >
          {clientesFiltrados.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} · {c.zona.nombre}
            </option>
          ))}
        </select>
        {clienteSelec && (
          <p className="text-xs text-[#4ade80] mt-1">
            ✓ {clienteSelec.nombre} — Pago habitual: {clienteSelec.formaPagoPref}
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
            value={cajas}
            onChange={(e) => {
              setCajas(parseFloat(e.target.value) || 0);
              setMontoManual(null);
            }}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
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
            step={1000}
            value={montoFinal}
            onChange={(e) => setMontoManual(parseInt(e.target.value) || 0)}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
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
            defaultValue={clienteSelec?.formaPagoPref ?? "EFECTIVO"}
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
        <button
          type="submit"
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Guardar pedido
        </button>
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
