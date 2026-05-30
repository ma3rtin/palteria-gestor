"use client";

import { useEffect, startTransition } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción, Next.js oculta el mensaje real por seguridad
    // Pero lo loguea en el servidor (Vercel logs)
    console.error("Error boundary caught:", error);
  }, [error]);

  // En producción, si el mensaje es el genérico de Next.js para Server Components,
  // es muy probable que sea un error de base de datos (EMAXCONNSESSION)
  const isProdServerComponentError = error.message?.includes("digest property");
  
  const isPoolError = 
    error.message?.includes("EMAXCONNSESSION") || 
    error.message?.includes("pool") ||
    isProdServerComponentError;

  return (
    <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">
      <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-xl p-10 max-w-md w-full shadow-2xl">
        <div className="w-16 h-16 bg-[#2a2d35] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#a3e635]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Refrescar: M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            {/* Usando un path de alerta/refrescar simple */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-[#f9fafb] mb-3">
          {isPoolError ? "Conexión intermitente" : "Algo salió mal"}
        </h1>
        
        <p className="text-[#9ca3af] mb-8 leading-relaxed">
          {isPoolError
            ? "La base de datos está recibiendo muchas solicitudes en este momento. Intenta reintentar en unos segundos."
            : "Ocurrió un error inesperado al cargar la página."}
        </p>
        
        <button
          onClick={() => {
            // startTransition es clave para resetear Server Components correctamente
            startTransition(() => {
              reset();
            });
          }}
          className="w-full bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] py-3 rounded-lg font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-[#a3e635]/10"
        >
          Reintentar ahora
        </button>
        
        {error.digest && (
          <p className="mt-6 text-[10px] text-[#4b5563] font-mono">
            ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
