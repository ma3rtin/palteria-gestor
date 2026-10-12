"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, X, Star } from "lucide-react";
import { formatearFechaCorta } from "@/lib/utils";

export interface ProductoItem {
  id: number;
  nombre: string;
  precioReferencia: number;
  kgPorCaja: number | null;
  stockCajas: number;
  fechaIngreso?: Date | string | null;
  maduracion?: string | null;
  prioritario?: boolean;
}

interface Props {
  productos: ProductoItem[];
  idSeleccionado: number | "";
  onSeleccionar: (idProducto: number | "") => void;
  productosExcluidosIds?: number[];
  placeholder?: string;
  required?: boolean;
}

export function SelectorProductoBuscador({
  productos,
  idSeleccionado,
  onSeleccionar,
  productosExcluidosIds = [],
  placeholder = "Buscar o seleccionar producto...",
  required = false,
}: Props) {
  const prodSeleccionado = useMemo(
    () => productos.find((p) => p.id === idSeleccionado),
    [productos, idSeleccionado]
  );

  const getTextoProducto = (p: ProductoItem) =>
    `${p.nombre}${p.maduracion ? ` · ${p.maduracion}` : ""}${p.fechaIngreso ? ` (${formatearFechaCorta(p.fechaIngreso)})` : ""}`;

  const [busqueda, setBusqueda] = useState(
    prodSeleccionado ? getTextoProducto(prodSeleccionado) : ""
  );
  const [mostrarLista, setMostrarLista] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar texto si cambia externamente el producto seleccionado
  useEffect(() => {
    if (prodSeleccionado) {
      setBusqueda(getTextoProducto(prodSeleccionado));
    } else if (idSeleccionado === "") {
      setBusqueda("");
    }
  }, [idSeleccionado, prodSeleccionado]);

  // Filtrar productos excluyendo los seleccionados en otras filas, pero permitiendo el actual
  const productosDisponibles = useMemo(() => {
    return productos.filter((p) => {
      if (idSeleccionado === p.id) return true;
      if (productosExcluidosIds.includes(p.id)) return false;
      return true;
    });
  }, [productos, idSeleccionado, productosExcluidosIds]);

  // Filtrado en memoria según el término de búsqueda ingresado y ordenamiento por prioridad
  const productosFiltrados = useMemo(() => {
    let lista = productosDisponibles;
    if (busqueda && (!prodSeleccionado || busqueda !== getTextoProducto(prodSeleccionado))) {
      const term = busqueda.toLowerCase().trim();
      lista = productosDisponibles.filter((p) => {
        const fechaStr = p.fechaIngreso ? formatearFechaCorta(p.fechaIngreso).toLowerCase() : "";
        const madStr = p.maduracion ? p.maduracion.toLowerCase() : "";
        return (
          p.nombre.toLowerCase().includes(term) ||
          madStr.includes(term) ||
          fechaStr.includes(term) ||
          p.precioReferencia.toString().includes(term)
        );
      });
    }

    return [...lista].sort((a, b) => {
      if (a.prioritario && !b.prioritario) return -1;
      if (!a.prioritario && b.prioritario) return 1;
      return 0;
    });
  }, [busqueda, productosDisponibles, prodSeleccionado]);

  const handleSelect = (id: number) => {
    onSeleccionar(id);
    const prod = productos.find((p) => p.id === id);
    if (prod) {
      setBusqueda(getTextoProducto(prod));
    }
    setMostrarLista(false);
  };

  const handleLimpiar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeleccionar("");
    setBusqueda("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setMostrarLista(false);
      // Restaurar el nombre del seleccionado si no seleccionó una opción válida
      if (prodSeleccionado) {
        setBusqueda(getTextoProducto(prodSeleccionado));
      } else {
        setBusqueda("");
      }
    }, 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className={`absolute left-3 pointer-events-none transition-colors ${
          prodSeleccionado?.prioritario ? "text-amber-400" : "text-[#6b7280]"
        }`}>
          {prodSeleccionado?.prioritario ? <Star size={14} className="fill-amber-400" /> : <Search size={14} />}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={busqueda}
          required={required && idSeleccionado === ""}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setMostrarLista(true);
            if (prodSeleccionado) {
              inputRef.current?.select();
            }
          }}
          onBlur={handleBlur}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarLista(true);
            if (e.target.value === "") {
              onSeleccionar("");
            }
          }}
          className={`w-full pl-9 pr-14 py-2 text-sm bg-[#1c1f26] border rounded-lg placeholder-[#6b7280] focus:outline-none focus:border-[#a3e635] transition-colors ${
            prodSeleccionado?.prioritario
              ? "border-amber-500/40 text-amber-200"
              : "border-[#2a2d35] text-[#f9fafb]"
          }`}
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {idSeleccionado !== "" && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="p-1 text-[#6b7280] hover:text-[#f9fafb] rounded transition-colors cursor-pointer"
              title="Quitar selección"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setMostrarLista((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 text-[#6b7280] hover:text-[#f9fafb] transition-colors cursor-pointer"
          >
            <ChevronDown size={14} className={`transition-transform ${mostrarLista ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {mostrarLista && (
        <ul className="absolute z-30 w-full left-0 mt-1 bg-[#1c1f26] border border-[#2a2d35] rounded-lg max-h-56 overflow-y-auto shadow-2xl divide-y divide-[#22252e]">
          {productosFiltrados.length === 0 ? (
            <li className="px-3 py-3 text-xs text-[#6b7280] text-center">
              {productosDisponibles.length === 0
                ? "Todos los productos ya fueron seleccionados"
                : "No hay productos disponibles con ese criterio"}
            </li>
          ) : (
            productosFiltrados.map((p) => {
              const esElActual = p.id === idSeleccionado;
              return (
                <li
                  key={p.id}
                  onMouseDown={() => handleSelect(p.id)}
                  className={`px-3 py-2 text-xs cursor-pointer flex flex-col gap-1 transition-colors ${
                    esElActual
                      ? "bg-[#a3e635]/10 hover:bg-[#a3e635]/15"
                      : p.prioritario
                      ? "bg-amber-500/[0.07] hover:bg-amber-500/[0.12]"
                      : "hover:bg-[#22252e]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.prioritario && (
                        <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      )}
                      <span className={`font-medium ${p.prioritario ? "text-amber-300" : "text-[#f9fafb]"}`}>{p.nombre}</span>
                      {p.maduracion && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2d35] text-emerald-300 font-semibold uppercase border border-emerald-800/40 shrink-0">
                          {p.maduracion}
                        </span>
                      )}
                      {p.fechaIngreso && (
                        <span className="text-[#9ca3af] font-normal font-sans text-[11px]">
                          ({formatearFechaCorta(p.fechaIngreso)})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[#a3e635] font-semibold shrink-0">
                      ${p.precioReferencia.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                    <span>
                      Stock:{" "}
                      <strong className={p.stockCajas <= 0 ? "text-red-400" : "text-[#d1d5db]"}>
                        {p.stockCajas} cajas
                      </strong>
                      {p.kgPorCaja && <span className="ml-1.5">· {p.kgPorCaja} kg/caja</span>}
                    </span>
                    {esElActual && (
                      <span className="text-[#a3e635] font-medium text-[10px]">Seleccionado</span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
