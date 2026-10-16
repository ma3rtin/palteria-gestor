"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

interface Props {
  onExportar: () => void | Promise<void>;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function BotonExportarExcel({
  onExportar,
  label = "Exportar Excel",
  className = "",
  disabled = false,
}: Props) {
  const [cargando, setCargando] = useState(false);

  async function handleClick() {
    if (cargando || disabled) return;
    try {
      setCargando(true);
      await onExportar();
    } catch (e) {
      console.error("Error al exportar a Excel:", e);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || cargando}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#17191e] hover:bg-[#22252e] border border-[#2a2d35] hover:border-[#4b5563] text-xs font-medium text-[#f9fafb] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={label}
    >
      {cargando ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a3e635]" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
      )}
      <span>{cargando ? "Exportando..." : label}</span>
    </button>
  );
}
