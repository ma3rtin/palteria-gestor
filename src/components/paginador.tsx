import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginadorProps {
  pageActual: number;
  totalPaginas: number;
  totalItems?: number;
  // Para enlaces (Server Side / Link)
  hrefAnterior?: string;
  hrefSiguiente?: string;
  hasMore?: boolean;
  // Para acciones (Client Side / Button)
  onAnterior?: () => void;
  onSiguiente?: () => void;
  loading?: boolean;
  className?: string;
}

export function Paginador({
  pageActual,
  totalPaginas,
  totalItems,
  hrefAnterior,
  hrefSiguiente,
  hasMore,
  onAnterior,
  onSiguiente,
  loading = false,
  className = "mt-4",
}: PaginadorProps) {
  if (totalPaginas <= 1) return null;

  const esPrimerPagina = pageActual === 0;
  const esUltimaPagina = hasMore !== undefined ? !hasMore : pageActual >= totalPaginas - 1;

  // Botón Anterior
  const renderBotonAnterior = () => {
    if (hrefAnterior) {
      return (
        <Link
          href={hrefAnterior}
          className={`px-3 py-1.5 border border-[#2a2d35] rounded-lg text-xs text-[#9ca3af] hover:border-[#a3e635] transition-colors flex items-center gap-1 ${
            esPrimerPagina ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <ChevronLeft size={14} />
          Anterior
        </Link>
      );
    }

    return (
      <button
        onClick={onAnterior}
        disabled={esPrimerPagina || loading}
        className="px-3 py-1.5 border border-[#2a2d35] rounded-lg text-xs text-[#9ca3af] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635] transition-colors flex items-center gap-1 cursor-pointer"
      >
        <ChevronLeft size={14} />
        Anterior
      </button>
    );
  };

  // Botón Siguiente
  const renderBotonSiguiente = () => {
    if (hrefSiguiente) {
      return (
        <Link
          href={hrefSiguiente}
          className={`px-3 py-1.5 border border-[#2a2d35] rounded-lg text-xs text-[#9ca3af] hover:border-[#a3e635] transition-colors flex items-center gap-1 ${
            esUltimaPagina ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Siguiente
          <ChevronRight size={14} />
        </Link>
      );
    }

    return (
      <button
        onClick={onSiguiente}
        disabled={esUltimaPagina || loading}
        className="px-3 py-1.5 border border-[#2a2d35] rounded-lg text-xs text-[#9ca3af] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635] transition-colors flex items-center gap-1 cursor-pointer"
      >
        Siguiente
        <ChevronRight size={14} />
      </button>
    );
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <span className="text-[#9ca3af] text-xs">
        Página {pageActual + 1} de {totalPaginas} {totalItems !== undefined && `(${totalItems} total)`}
      </span>
      <div className="flex gap-2">
        {renderBotonAnterior()}
        {renderBotonSiguiente()}
      </div>
    </div>
  );
}
