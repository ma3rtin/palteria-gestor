"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, X } from "lucide-react";

interface Zona {
  id: number;
  nombre: string;
}

interface Props {
  zonas: Zona[];
  zonaActual?: string;
  onChange: (idZona: string) => void;
  className?: string;
}

/**
 * Coincidencia por letras consecutivas (substring):
 * Busca que el texto contenga el patrón ingresado de forma continua.
 * Ej: "zo" coincide con "HAEDO ZO", "mor" con "MORON ZO".
 */
export function coincideBusquedaZona(patron: string, texto: string): boolean {
  if (!patron || !patron.trim()) return true;
  return texto.toLowerCase().includes(patron.toLowerCase().trim());
}

// Alias para compatibilidad
export const coincideSubsecuencia = coincideBusquedaZona;

export function SelectorZonaBuscador({ zonas, zonaActual, onChange, className = "" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const zonaSeleccionada = zonas.find((z) => String(z.id) === (zonaActual ?? ""));

  // Filtrar zonas por letras consecutivas
  const zonasFiltradas = zonas.filter((z) => coincideBusquedaZona(busqueda, z.nombre));

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function manejarClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda("");
      }
    }

    function manejarKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && abierto) {
        setAbierto(false);
        setBusqueda("");
      }
    }

    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("keydown", manejarKeyDown);
    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("keydown", manejarKeyDown);
    };
  }, [abierto]);

  // Enfocar input al abrir
  useEffect(() => {
    if (abierto) {
      inputRef.current?.focus();
    }
  }, [abierto]);

  function seleccionar(idZona: string) {
    onChange(idZona);
    setAbierto(false);
    setBusqueda("");
  }

  function limpiar(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setBusqueda("");
  }

  return (
    <div ref={contenedorRef} className={`relative inline-block ${className}`}>
      {/* Botón selector principal */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center justify-between gap-2 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] hover:border-[#3f4350] focus:outline-none focus:border-[#a3e635] text-white min-w-44 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={13} className="text-[#9ca3af] shrink-0" />
          <span className="truncate">
            {zonaSeleccionada ? zonaSeleccionada.nombre : "Todas las zonas"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {zonaSeleccionada && (
            <span
              onClick={limpiar}
              title="Quitar filtro de zona"
              className="p-0.5 rounded hover:bg-[#2a2d35] text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#6b7280] transition-transform duration-150 ${abierto ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Menú desplegable con buscador */}
      {abierto && (
        <div className="absolute left-0 mt-1 w-56 bg-[#1c1f26] border border-[#2a2d35] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
          {/* Input de búsqueda por subsecuencia */}
          <div className="p-2 border-b border-[#2a2d35] bg-[#16181f]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar zona..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#1c1f26] border border-[#2a2d35] rounded px-2.5 py-1 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Lista de opciones */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[#22252e]">
            {/* Opción todas */}
            <button
              type="button"
              onClick={() => seleccionar("")}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#20232c] transition-colors cursor-pointer ${
                !zonaActual ? "text-[#a3e635] font-medium bg-[#a3e635]/10" : "text-[#9ca3af]"
              }`}
            >
              <span>Todas las zonas</span>
              {!zonaActual && <Check size={12} />}
            </button>

            {zonasFiltradas.length === 0 ? (
              <div className="px-3 py-3 text-xs text-[#6b7280] text-center italic">
                Sin coincidencias para &quot;{busqueda}&quot;
              </div>
            ) : (
              zonasFiltradas.map((z) => {
                const esSeleccionada = String(z.id) === (zonaActual ?? "");
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => seleccionar(String(z.id))}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#20232c] transition-colors cursor-pointer ${
                      esSeleccionada
                        ? "text-[#a3e635] font-medium bg-[#a3e635]/10"
                        : "text-[#f9fafb]"
                    }`}
                  >
                    <span>{z.nombre}</span>
                    {esSeleccionada && <Check size={12} className="text-[#a3e635]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
