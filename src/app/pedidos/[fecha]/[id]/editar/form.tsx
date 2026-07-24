"use client";

import { BotonSubmit } from "@/components/boton-submit";
import { useState, useEffect } from "react";

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

interface Pedido {
  id: number;
  idCliente: number;
  idProducto: number;
  maduracion: string;
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
  clientes,
  productos,
  repartidores,
  maduracionesSugeridas,
  actualizarPedido,
}: Props) {
  const [cajas, setCajas] = useState<number | "">(pedido.cajas);
  const [montoManual, setMontoManual] = useState<number | "" | null>(pedido.montoTotal);
  const [formaPago, setFormaPago] = useState(pedido.formaPago);
  const [estadoPago, setEstadoPago] = useState(pedido.estadoPago);
  const [montoPagado, setMontoPagado] = useState<number | "">(pedido.montoPagado);
  const [comisionRevendedor, setComisionRevendedor] = useState<number | "">(pedido.comisionRevendedor);

  const productoSelec = productos.find((p) => p.id === pedido.idProducto);

  // Al editar, recalculamos si no es monto manual o si el usuario cambia cajas
  const montoCalculado = productoSelec ? Math.round(productoSelec.precioReferencia * (cajas === "" ? 0 : cajas)) : "";
  const montoFinal = montoManual ?? montoCalculado;

  // Reactivamente sincronizar el monto pagado según el estado seleccionado y el monto total
  useEffect(() => {
    if (estadoPago === "PAGADO") {
      setMontoPagado(montoFinal === "" ? 0 : Number(montoFinal));
    } else if (estadoPago === "PENDIENTE") {
      setMontoPagado(0);
    } else if (estadoPago === "PARCIAL") {
      if (montoFinal !== "" && typeof montoPagado === "number" && montoPagado > Number(montoFinal)) {
        setMontoPagado(Number(montoFinal));
      }
    }
  }, [estadoPago, montoFinal]);

  const clienteAsociado = clientes.find(c => c.id === pedido.idCliente);

  return (
    <form
      action={actualizarPedido}
      className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5"
    >
      <input type="hidden" name="fecha" value={fecha} />

      <div className="text-sm text-[#9ca3af] mb-2">
        <p>Cliente: <span className="font-medium text-[#f9fafb]">{clientes.find(c => c.id === pedido.idCliente)?.nombre}</span></p>
        <p>Producto: <span className="font-medium text-[#f9fafb]">{productoSelec?.nombre}</span></p>
      </div>

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
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Monto total *</label>
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
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago *</label>
          <select
            name="formaPago"
            required
            value={formaPago}
            disabled={pedido.formaPago === "PAGO_SEMANAL"}
            onChange={(e) => setFormaPago(e.target.value)}
            className={`w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] ${
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
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          >
            <option value="">Sin asignar</option>
            {repartidores.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Estado de pago *</label>
          <select
            name="estadoPago"
            required
            value={estadoPago}
            onChange={(e) => setEstadoPago(e.target.value)}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
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
            readOnly={estadoPago !== "PARCIAL"}
            onChange={(e) => {
              const val = e.target.value;
              let numVal: number | "" = val === "" ? "" : parseFloat(val);
              if (typeof numVal === "number" && !isNaN(numVal) && montoFinal !== "") {
                const maxLimit = Number(montoFinal);
                if (numVal > maxLimit) {
                  numVal = maxLimit;
                }
              }
              setMontoPagado(numVal);
            }}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] read-only:opacity-50 read-only:cursor-not-allowed"
          />
        </div>
      </div>

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
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
        <input
          name="observaciones"
          defaultValue={pedido.observaciones ?? ""}
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>

      <div className="flex gap-4">
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
