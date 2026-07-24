"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatearPeso } from "@/lib/utils";
import { retryWithExponentialBackoff } from "@/lib/retry";

interface ClientesListPaginatedProps {
  initialData: {
    clientes: Array<{
      id: number;
      nombre: string;
      zona: { id: number; nombre: string };
      saldoPendiente: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  filters: {
    q?: string;
    zona?: string;
    repartidor?: string;
    inactivos?: string;
  };
}

export function ClientesListPaginated({
  initialData,
  filters,
}: ClientesListPaginatedProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props when initialData changes (e.g. search/filter change)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handlePageChange = async (newPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(newPage),
        pageSize: String(data.pageSize),
        ...(filters.q && { q: filters.q }),
        ...(filters.zona && { zona: filters.zona }),
        ...(filters.repartidor && { repartidor: filters.repartidor }),
        ...(filters.inactivos && { inactivos: filters.inactivos }),
      });

      // Retry on API call
      const response = await retryWithExponentialBackoff(
        () =>
          fetch(`/api/clientes/paginated?${params}`).then((res) => {
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
          }),
        { maxAttempts: 3, baseDelayMs: 800 }
      );

      setData(response);
    } catch (err) {
      console.error("Error loading page:", err);
      setError("No se pudo cargar la página. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / data.pageSize);
  const conDeuda = data.clientes.filter((c) => c.saldoPendiente > 0);
  const sinDeuda = data.clientes.filter((c) => c.saldoPendiente === 0);
  const ordenados = [...conDeuda, ...sinDeuda];

  return (
    <div>
      {/* Cliente list */}
      <div className="space-y-2 mb-6">
        {ordenados.length === 0 ? (
          <div className="text-center text-[#9ca3af] py-8">
            No hay clientes para mostrar
          </div>
        ) : (
          ordenados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="block bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4 hover:border-[#a3e635] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[#f9fafb] font-medium">{cliente.nombre}</div>
                  <div className="text-[#9ca3af] text-xs mt-1">{cliente.zona.nombre}</div>
                </div>
                {cliente.saldoPendiente > 0 && (
                  <div className="text-[#ef4444] text-sm font-medium">
                    {formatearPeso(cliente.saldoPendiente)}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-[#1c1f26] border border-[#ef4444] rounded-lg p-3 text-[#ef4444] text-sm mb-4">
          {error}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <span className="text-[#9ca3af] text-sm">
          Página {data.page + 1} de {totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(data.page - 1)}
            disabled={data.page === 0 || loading}
            className="px-3 py-1 border border-[#2a2d35] rounded-lg text-sm text-[#9ca3af] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635] transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            onClick={() => handlePageChange(data.page + 1)}
            disabled={!data.hasMore || loading}
            className="px-3 py-1 border border-[#2a2d35] rounded-lg text-sm text-[#9ca3af] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635] transition-colors flex items-center gap-1"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-[#9ca3af] text-sm mt-4">
          Cargando página...
        </div>
      )}
    </div>
  );
}
