"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

export type TipoModalConfirmacion = "peligro" | "advertencia" | "info";

export interface ModalConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void | Promise<void>;
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: TipoModalConfirmacion;
  cargando?: boolean;
}

export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  tipo = "peligro",
  cargando = false,
}: ModalConfirmacionProps) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cargando) {
        onCerrar();
      }
    };

    document.addEventListener("keydown", manejarKeyDown);
    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", manejarKeyDown);
      document.body.style.overflow = scrollOriginal;
    };
  }, [abierto, cargando, onCerrar]);

  if (!abierto || !montado) return null;

  const iconYEstilo = {
    peligro: {
      icono: <Trash2 className="w-5 h-5 text-red-400" />,
      contenedorIcono: "bg-red-500/10 border-red-500/20",
      botonConfirmar: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    },
    advertencia: {
      icono: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      contenedorIcono: "bg-amber-500/10 border-amber-500/20",
      botonConfirmar: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    info: {
      icono: <Info className="w-5 h-5 text-[#a3e635]" />,
      contenedorIcono: "bg-[#a3e635]/10 border-[#a3e635]/20",
      botonConfirmar: "bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] font-semibold focus:ring-[#a3e635]",
    },
  }[tipo];

  const contenido = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacion-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargando) {
          onCerrar();
        }
      }}
    >
      <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-xl max-w-md w-full p-6 shadow-2xl relative text-left animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCerrar}
          disabled={cargando}
          className="absolute top-4 right-4 text-[#6b7280] hover:text-[#9ca3af] p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${iconYEstilo.contenedorIcono}`}
          >
            {iconYEstilo.icono}
          </div>
          <div className="flex-1 pr-4">
            <h3
              id="modal-confirmacion-titulo"
              className="text-base font-semibold text-[#f9fafb]"
            >
              {titulo}
            </h3>
            <div className="mt-2 text-sm text-[#9ca3af] leading-relaxed">
              {mensaje}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#2a2d35] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="px-4 py-2 text-sm font-medium text-[#9ca3af] hover:text-[#f9fafb] border border-[#2a2d35] hover:border-[#374151] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirmar();
            }}
            disabled={cargando}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 ${iconYEstilo.botonConfirmar}`}
          >
            {cargando ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                <span>Procesando...</span>
              </>
            ) : (
              textoConfirmar
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
}

export interface SolicitarConfirmacionOpciones {
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: TipoModalConfirmacion;
  onConfirmar: () => void | Promise<void>;
}

export function useModalConfirmacion() {
  const [estado, setEstado] = useState<SolicitarConfirmacionOpciones & { abierto: boolean }>({
    abierto: false,
    titulo: "",
    mensaje: "",
    onConfirmar: () => {},
  });
  const [cargando, setCargando] = useState(false);

  const solicitarConfirmacion = (opciones: SolicitarConfirmacionOpciones) => {
    setEstado({
      ...opciones,
      abierto: true,
    });
  };

  const cerrar = () => {
    if (cargando) return;
    setEstado((prev) => ({ ...prev, abierto: false }));
  };

  const confirmar = async () => {
    try {
      setCargando(true);
      await estado.onConfirmar();
      cerrar();
    } finally {
      setCargando(false);
    }
  };

  const ModalComponent = estado.abierto ? (
    <ModalConfirmacion
      abierto={estado.abierto}
      onCerrar={cerrar}
      onConfirmar={confirmar}
      titulo={estado.titulo}
      mensaje={estado.mensaje}
      textoConfirmar={estado.textoConfirmar}
      textoCancelar={estado.textoCancelar}
      tipo={estado.tipo}
      cargando={cargando}
    />
  ) : null;

  return {
    solicitarConfirmacion,
    cerrar,
    cargando,
    ModalComponent,
  };
}
