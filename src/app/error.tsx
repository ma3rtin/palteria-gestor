"use client";

import { useEffect, useState, startTransition } from "react";
import { AlertTriangle, Home, RefreshCw, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    console.error("Error boundary capturado:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-xl p-8 max-w-lg w-full shadow-2xl text-center">
        {/* Icono */}
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
          <AlertTriangle size={28} />
        </div>

        {/* Título y Mensaje */}
        <h1 className="text-xl font-bold text-[#f9fafb] mb-2">
          Ocurrió un error inesperado
        </h1>
        <p className="text-[#9ca3af] text-sm mb-6 leading-relaxed">
          Hubo un problema al cargar esta sección. Podés regresar al inicio, reintentar la operación o reiniciar tu sesión si el inconveniente persiste.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md shadow-[#a3e635]/10 cursor-pointer"
          >
            <Home size={16} />
            Ir al Inicio
          </button>

          <button
            onClick={() => {
              startTransition(() => {
                reset();
              });
            }}
            className="flex items-center justify-center gap-2 bg-[#22252e] hover:bg-[#2a2d35] text-[#f9fafb] border border-[#2a2d35] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </div>

        {/* Botón Cerrar Sesión de Emergencia */}
        <div className="pt-4 border-t border-[#22252e] flex items-center justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>

          {/* Detalles técnicos colapsables */}
          <button
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors cursor-pointer"
          >
            <span>Detalles técnicos</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${mostrarDetalles ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {mostrarDetalles && (
          <div className="mt-4 p-3 bg-[#13161e] border border-[#22252e] rounded-lg text-left text-xs font-mono text-[#9ca3af] break-all max-h-40 overflow-y-auto">
            {error.message && (
              <p className="text-red-400 mb-1">
                <span className="font-semibold text-red-300">Mensaje:</span> {error.message}
              </p>
            )}
            {error.digest && (
              <p className="text-[#6b7280]">
                <span className="font-semibold text-[#9ca3af]">Digest ID:</span> {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
