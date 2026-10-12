"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Star } from "lucide-react";
import { BotonSubmit } from "@/components/boton-submit";
import { formatearFechaCorta, MADURACIONES_SUGERIDAS } from "@/lib/utils";

interface Producto {
  id: number;
  nombre: string;
  precioReferencia: number;
  kgPorCaja: number | null;
  stockCajas: number;
  activo: boolean;
  costo: number;
  fechaIngreso: Date | string | null;
  maduracion?: string | null;
  prioritario?: boolean;
}

interface Props {
  productos: Producto[];
  puedeVerCostos?: boolean;
  puedeEditarCostos?: boolean;
  crearProducto: (formData: FormData) => Promise<void>;
  actualizarPrecio: (formData: FormData) => Promise<void>;
  actualizarCosto: (formData: FormData) => Promise<void>;
  actualizarKg: (formData: FormData) => Promise<void>;
  actualizarStock: (formData: FormData) => Promise<void>;
  toggleProducto: (formData: FormData) => Promise<void>;
  actualizarMaduracion: (formData: FormData) => Promise<void>;
  togglePrioridadProducto: (formData: FormData) => Promise<void>;
}

function FilaProducto({
  p,
  puedeVerCostos = true,
  puedeEditarCostos = true,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
  actualizarMaduracion,
  togglePrioridadProducto,
}: {
  p: Producto;
  puedeVerCostos?: boolean;
  puedeEditarCostos?: boolean;
  actualizarPrecio: Props["actualizarPrecio"];
  actualizarCosto: Props["actualizarCosto"];
  actualizarKg: Props["actualizarKg"];
  actualizarStock: Props["actualizarStock"];
  toggleProducto: Props["toggleProducto"];
  actualizarMaduracion: Props["actualizarMaduracion"];
  togglePrioridadProducto: Props["togglePrioridadProducto"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [prevPrecioReferencia, setPrevPrecioReferencia] = useState(p.precioReferencia);
  const [precio, setPrecio] = useState<number | "">(p.precioReferencia);
  if (p.precioReferencia !== prevPrecioReferencia) {
    setPrevPrecioReferencia(p.precioReferencia);
    setPrecio(p.precioReferencia);
  }

  const [prevCosto, setPrevCosto] = useState(p.costo);
  const [costo, setCosto] = useState<number | "">(p.costo);
  if (p.costo !== prevCosto) {
    setPrevCosto(p.costo);
    setCosto(p.costo);
  }

  const [prevKg, setPrevKg] = useState(p.kgPorCaja);
  const [kg, setKg] = useState<number | "">(p.kgPorCaja ?? "");
  if (p.kgPorCaja !== prevKg) {
    setPrevKg(p.kgPorCaja);
    setKg(p.kgPorCaja ?? "");
  }

  const [prevStock, setPrevStock] = useState(p.stockCajas);
  const [stock, setStock] = useState<number | "">(p.stockCajas);
  if (p.stockCajas !== prevStock) {
    setPrevStock(p.stockCajas);
    setStock(p.stockCajas);
  }

  const [prevMaduracion, setPrevMaduracion] = useState(p.maduracion ?? "");
  const [maduracion, setMaduracion] = useState(p.maduracion ?? "");
  if ((p.maduracion ?? "") !== prevMaduracion) {
    setPrevMaduracion(p.maduracion ?? "");
    setMaduracion(p.maduracion ?? "");
  }

  const precioDirty = precio !== p.precioReferencia;
  const costoDirty = costo !== p.costo;
  const kgDirty = kg !== (p.kgPorCaja ?? "");
  const stockDirty = stock !== p.stockCajas;
  const maduracionDirty = maduracion !== (p.maduracion ?? "");

  const handleTogglePrioridad = () => {
    const fd = new FormData();
    fd.append("id", String(p.id));
    fd.append("prioritario", String(p.prioritario ?? false));
    startTransition(async () => {
      await togglePrioridadProducto(fd);
      router.refresh();
    });
  };

  const handleSubmitMaduracion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await actualizarMaduracion(fd);
      router.refresh();
    });
  };

  const handleSubmitKg = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await actualizarKg(fd);
      router.refresh();
    });
  };

  const handleSubmitStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await actualizarStock(fd);
      router.refresh();
    });
  };

  const handleSubmitCosto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await actualizarCosto(fd);
      router.refresh();
    });
  };

  const handleSubmitPrecio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await actualizarPrecio(fd);
      router.refresh();
    });
  };

  const handleToggle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await toggleProducto(fd);
      router.refresh();
    });
  };

  return (
    <tr className={`border-b border-[#22252e] last:border-0 transition-opacity duration-200 ${p.prioritario ? "bg-amber-500/[0.04]" : ""} ${!p.activo ? "opacity-50" : ""} ${isPending ? "opacity-60" : ""}`}>
      <td className="pl-4 pr-1 py-3 w-10 text-center">
        <button
          type="button"
          onClick={handleTogglePrioridad}
          disabled={isPending}
          title={p.prioritario ? "Quitar estrella de prioridad" : "Marcar con estrella de prioridad"}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            p.prioritario
              ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30"
              : "text-[#4b5563] hover:text-amber-400 hover:bg-[#22252e] border border-transparent"
          }`}
        >
          <Star size={15} className={p.prioritario ? "fill-amber-400" : ""} />
        </button>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${p.prioritario ? "text-amber-300" : "text-[#f9fafb]"}`}>
            {p.nombre}
          </span>
        </div>
        {p.fechaIngreso && (
          <div className="text-[10px] text-[#6b7280] mt-0.5 font-normal">
            Lote: {formatearFechaCorta(p.fechaIngreso)}
          </div>
        )}
      </td>

      <td className="px-3 py-3">
        <form onSubmit={handleSubmitMaduracion} className="flex items-center gap-1">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="maduracion"
            list="maduraciones-sugeridas-lista"
            placeholder="—"
            value={maduracion}
            onChange={(e) => setMaduracion(e.target.value.toUpperCase())}
            className="w-24 border border-[#2a2d35] rounded px-2 py-1 text-xs uppercase bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
          />
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <BotonSubmit
              className={`p-1.5 text-[#a3e635] hover:bg-[#22252e] rounded transition-all duration-200 ${
                maduracionDirty ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
              title="Guardar maduración"
            >
              <Save size={15} />
            </BotonSubmit>
          </div>
        </form>
      </td>

      <td className="px-4 py-3">
        <form onSubmit={handleSubmitKg} className="flex items-center justify-end gap-1">
          <input type="hidden" name="id" value={p.id} />
          <select
            name="kgPorCaja"
            value={kg}
            onChange={(e) => setKg(e.target.value === "" ? "" : parseFloat(e.target.value))}
            className="w-20 border border-[#2a2d35] rounded px-2 py-1 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
          >
            <option value="">—</option>
            <option value="10">10 kg</option>
            <option value="11">11 kg</option>
          </select>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <BotonSubmit
              className={`p-1.5 text-[#a3e635] hover:bg-[#22252e] rounded transition-all duration-200 ${
                kgDirty ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
              title="Guardar cambios"
            >
              <Save size={15} />
            </BotonSubmit>
          </div>
        </form>
      </td>

      <td className="px-4 py-3">
        <form onSubmit={handleSubmitStock} className="flex items-center justify-end gap-1">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="stockCajas"
            type="number"
            step={0.5}
            min={0}
            required
            placeholder="0"
            value={stock}
            onChange={(e) => {
              const val = e.target.value;
              setStock(val === "" ? "" : parseFloat(val));
            }}
            className={`w-24 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white ${
              p.stockCajas <= 0 ? "border-red-800 text-red-400" : "border-[#2a2d35]"
            }`}
          />
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <BotonSubmit
              className={`p-1.5 text-[#a3e635] hover:bg-[#22252e] rounded transition-all duration-200 ${
                stockDirty ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
              title="Guardar cambios"
            >
              <Save size={15} />
            </BotonSubmit>
          </div>
        </form>
      </td>

      {puedeVerCostos && (
        <td className="px-4 py-3">
          <form onSubmit={handleSubmitCosto} className="flex items-center justify-end gap-1">
            <input type="hidden" name="id" value={p.id} />
            <input
              name="costo"
              type="number"
              step={1000}
              required
              placeholder="0"
              value={costo}
              disabled={!puedeEditarCostos}
              onChange={(e) => {
                const val = e.target.value;
                setCosto(val === "" ? "" : parseFloat(val));
              }}
              className={`w-28 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white ${
                !puedeEditarCostos ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            {puedeEditarCostos && (
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <BotonSubmit
                  className={`p-1.5 text-[#a3e635] hover:bg-[#22252e] rounded transition-all duration-200 ${
                    costoDirty ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                  }`}
                  title="Guardar cambios"
                >
                  <Save size={15} />
                </BotonSubmit>
              </div>
            )}
          </form>
        </td>
      )}

      <td className="px-4 py-3">
        <form onSubmit={handleSubmitPrecio} className="flex items-center justify-end gap-1">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="precioReferencia"
            type="number"
            step={1000}
            required
            placeholder="0"
            value={precio}
            onChange={(e) => {
              const val = e.target.value;
              setPrecio(val === "" ? "" : parseFloat(val));
            }}
            className="w-28 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
          />
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <BotonSubmit
              className={`p-1.5 text-[#a3e635] hover:bg-[#22252e] rounded transition-all duration-200 ${
                precioDirty ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
              title="Guardar cambios"
            >
              <Save size={15} />
            </BotonSubmit>
          </div>
        </form>
      </td>

      <td className="px-4 py-3 text-right">
        <form onSubmit={handleToggle}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="activo" value={p.activo.toString()} />
          <BotonSubmit className="text-xs text-[#6b7280] hover:text-[#9ca3af]">
            {p.activo ? "Desactivar" : "Activar"}
          </BotonSubmit>
        </form>
      </td>
    </tr>
  );
}

export function ProductosUI({
  productos,
  puedeVerCostos = true,
  puedeEditarCostos = true,
  crearProducto,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
  actualizarMaduracion,
  togglePrioridadProducto,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [prioritarioCrear, setPrioritarioCrear] = useState(false);

  const filtrados = busqueda
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          (p.maduracion && p.maduracion.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : productos;

  return (
    <div>
      {/* Fila superior: form + buscador */}
      <div className="flex gap-4 items-end mb-6">
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4 flex gap-3 flex-wrap items-end flex-1">
          <div className="flex flex-col gap-1 flex-1 min-w-32">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Nombre *</label>
            <input
              form="form-crear"
              name="nombre"
              required
              placeholder="CAT, WHITE, PERU 60..."
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Fecha Lote</label>
            <input
              form="form-crear"
              name="fechaIngreso"
              type="date"
              defaultValue={new Date().toLocaleDateString("en-CA")}
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Maduración</label>
            <input
              form="form-crear"
              name="maduracion"
              list="maduraciones-sugeridas-lista"
              placeholder="VERDE, SEMI..."
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm uppercase bg-[#1c1f26] text-white focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Kg/caja</label>
            <select
              form="form-crear"
              name="kgPorCaja"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
            >
              <option value="">—</option>
              <option value="10">10 kg</option>
              <option value="11">11 kg</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Stock inicial</label>
            <input
              form="form-crear"
              name="stockCajas"
              type="number"
              step={0.5}
              min={0}
              placeholder="0"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          {puedeVerCostos && (
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Costo/caja</label>
              <input
                form="form-crear"
                name="costo"
                type="number"
                required
                step={1000}
                placeholder="0"
                className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          )}
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Precio/caja *</label>
            <input
              form="form-crear"
              name="precioReferencia"
              type="number"
              required
              step={1000}
              placeholder="0"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex items-center">
            <input
              form="form-crear"
              type="hidden"
              name="prioritario"
              value={String(prioritarioCrear)}
            />
            <button
              type="button"
              onClick={() => setPrioritarioCrear(!prioritarioCrear)}
              title={prioritarioCrear ? "Prioridad activada (clic para quitar)" : "Marcar prioridad"}
              className={`h-[38px] w-[38px] rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                prioritarioCrear
                  ? "text-amber-400 bg-amber-400/20 border-amber-400/40 shadow-sm shadow-amber-500/20"
                  : "text-[#6b7280] hover:text-amber-400 border-[#2a2d35] hover:border-[#4b5563] bg-[#1c1f26]"
              }`}
            >
              <Star size={18} className={prioritarioCrear ? "fill-amber-400" : ""} />
            </button>
          </div>
          <form id="form-crear" action={crearProducto}>
            <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 h-[38px] rounded-lg text-sm font-medium transition-colors">
              Agregar
            </BotonSubmit>
          </form>
        </div>

        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4 self-stretch flex items-center w-64 relative">
          <input
            type="search"
            placeholder="Buscar por nombre o maduración..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] focus:outline-none focus:border-[#a3e635] text-white"
          />
        </div>
      </div>

      {/* Tabla full-width */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="w-10 pl-4 pr-1 py-3 text-center" title="Prioridad de venta">
                <Star size={13} className="inline text-[#6b7280]" />
              </th>
              <th className="text-left px-3 py-3 font-medium">Producto</th>
              <th className="text-left px-3 py-3 font-medium">Maduración</th>
              <th className="text-right pl-4 pr-[52px] py-3 font-medium">Kg/caja</th>
              <th className="text-right pl-4 pr-[52px] py-3 font-medium">Stock (cajas)</th>
              {puedeVerCostos && (
                <th className="text-right pl-4 pr-[52px] py-3 font-medium">Costo ref.</th>
              )}
              <th className="text-right pl-4 pr-[52px] py-3 font-medium">Precio ref.</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={puedeVerCostos ? 8 : 7} className="px-4 py-6 text-center text-[#6b7280] text-sm">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "Sin productos cargados."}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <FilaProducto
                  key={p.id}
                  p={p}
                  puedeVerCostos={puedeVerCostos}
                  puedeEditarCostos={puedeEditarCostos}
                  actualizarPrecio={actualizarPrecio}
                  actualizarCosto={actualizarCosto}
                  actualizarKg={actualizarKg}
                  actualizarStock={actualizarStock}
                  toggleProducto={toggleProducto}
                  actualizarMaduracion={actualizarMaduracion}
                  togglePrioridadProducto={togglePrioridadProducto}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <datalist id="maduraciones-sugeridas-lista">
        {MADURACIONES_SUGERIDAS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}
