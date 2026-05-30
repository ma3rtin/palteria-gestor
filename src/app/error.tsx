"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary:", error);
  }, [error]);

  const isPoolError = error.message?.includes("EMAXCONNSESSION");

  return (
    <div className="p-8 text-center">
      <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-8">
        <h1 className="text-xl font-bold text-[#f9fafb] mb-4">
          {isPoolError ? "Conexión temporal" : "Error"}
        </h1>
        <p className="text-[#9ca3af] mb-6">
          {isPoolError
            ? "La base de datos está bajo carga. Reintentando..."
            : error.message || "Algo salió mal. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
