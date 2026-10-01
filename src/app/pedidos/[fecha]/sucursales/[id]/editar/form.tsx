"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BotonSubmit } from "@/components/boton-submit";
import { SelectorProductoBuscador } from "@/components/selector-producto-buscador";

interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string | null;
  activo: boolean;
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

interface ItemFormRow {
  key: string;
  idProducto: number | "";
  cajas: number | "";
  maduracion: string;
}

interface Props {
  fecha: string;
  idEnvio: number;
  envio: {
    id: number;
    idSucursal: number;
    idRepartidor: number | null;
    observaciones: string | null;
    items: Array<{
      id: number;
      idProducto: number;
      cajas: number;
      maduracion: string | null;
    }>;
  };
  sucursales: Sucursal[];
  productos: Producto[];
  repartidores: Repartidor[];
  maduracionesSugeridas: string[];
  actualizarEnvioSucursal: (formData: FormData) => Promise<void>;
}

export function FormEditarEnvioSucursal({
  fecha,
  idEnvio,
  envio,
  sucursales,
  productos,
  repartidores,
  maduracionesSugeridas,
  actualizarEnvioSucursal,
}: Props) {
  const [idSucursalSelec, setIdSucursalSelec] = useState<number | null>(envio.idSucursal);
  const [errorSucursal, setErrorSucursal] = useState(false);
  const [errorItems, setErrorItems] = useState<string | null>(null);

  const [items, setItems] = useState<ItemFormRow[]>(() => {
    if (envio.items && envio.items.length > 0) {
      return envio.items.map((it) => ({
        key: `item-${it.id}`,
        idProducto: it.idProducto,
        cajas: it.cajas,
        maduracion: it.maduracion ?? "",
      }));
    }
    return [{ key: "item-1", idProducto: "", cajas: 1, maduracion: "" }];
  });

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
    setErrorItems(null);
  }

  function actualizarItem(index: number, campo: keyof ItemFormRow, valor: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
    setErrorItems(null);
  }

  const totalCajas = items.reduce(
    (sum, it) => sum + (typeof it.cajas === "number" ? it.cajas : 0),
    0
  );

  const itemsParaEnvio = items
    .filter((it) => it.idProducto !== "" && typeof it.cajas === "number" && it.cajas > 0)
    .map((it) => ({
      idProducto: Number(it.idProducto),
      cajas: Number(it.cajas),
      maduracion: it.maduracion.trim().toUpperCase(),
    }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!idSucursalSelec) {
      e.preventDefault();
      setErrorSucursal(true);
      return;
    }
    if (
      items.length === 0 ||
      items.some((it) => !it.idProducto || it.cajas === "" || it.cajas <= 0)
    ) {
      e.preventDefault();
      setErrorItems("Por favor completá los datos de todos los productos (producto y cantidad mayor a cero).");
      return;
    }
  }

  return (
    <form
      action={actualizarEnvioSucursal}
      onSubmit={handleSubmit}
      className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5"
    >
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="idSucursal" value={idSucursalSelec ?? ""} />
      <input type="hidden" name="itemsJson" value={JSON.stringify(itemsParaEnvio)} />
      <input type="hidden" name="cajas" value={totalCajas} />

      {/* Selector de Sucursal */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-2">
          Sucursal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sucursales.map((s) => {
            const isSelected = idSucursalSelec === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setIdSucursalSelec(s.id);
                  setErrorSucursal(false);
                }}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  isSelected
                    ? "bg-[#1f291e] border-[#a3e635] text-[#f9fafb] ring-1 ring-[#a3e635]"
                    : "bg-[#17191e] border-[#2a2d35] text-[#9ca3af] hover:border-[#4b5563]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#f9fafb]">{s.nombre}</span>
                  {isSelected && (
                    <span className="text-[10px] bg-[#a3e635] text-[#0f1117] font-bold px-1.5 py-0.5 rounded">
                      SELECCIONADA
                    </span>
                  )}
                </div>
                {s.direccion && (
                  <span className="text-xs text-[#9ca3af] mt-1">{s.direccion}</span>
                )}
              </button>
            );
          })}
        </div>
        {errorSucursal && (
          <p className="text-red-400 text-xs mt-1.5">Debe seleccionar una sucursal.</p>
        )}
      </div>

      {/* Repartidor */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">
          Repartidor
        </label>
        <select
          name="idRepartidor"
          defaultValue={envio.idRepartidor ?? ""}
          className="w-full bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm text-[#f9fafb] focus:outline-none focus:border-[#a3e635]"
        >
          <option value="">Sin asignar</option>
          {repartidores.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Productos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#f9fafb]">
            {items.length > 1 ? "Productos" : "Producto"}
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
                      required={true}
                    />
                    {prodSelec && (
                      <p className="text-xs mt-1 text-[#6b7280]">
                        Stock en cámara: <span className="font-medium">{prodSelec.stockCajas} cajas</span>
                        {prodSelec.kgPorCaja && (
                          <span className="ml-2">· {prodSelec.kgPorCaja} kg/caja</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Maduración */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1">Maduración</label>
                    <input
                      value={item.maduracion}
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
                      required={true}
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

        {/* Resumen de cajas */}
        <div className="mt-1">
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Total cajas</label>
          <div className="border border-[#2a2d35] bg-[#17191e] rounded-lg px-3 py-2 text-sm font-mono text-[#f9fafb]">
            {totalCajas} {totalCajas === 1 ? "caja" : "cajas"}
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
        <input
          name="observaciones"
          defaultValue={envio.observaciones ?? ""}
          placeholder="Ej: Traslado de la mañana, reposición sucursal..."
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-[#f9fafb]"
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#22252e]">
        <BotonSubmit
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Confirmar
        </BotonSubmit>
        <a
          href={`/pedidos/${fecha}?vista=palterias`}
          className="px-6 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-[#f9fafb] border border-[#2a2d35] hover:border-[#4b5563] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
