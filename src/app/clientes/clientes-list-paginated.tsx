"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatearPeso } from "@/lib/utils";
import { retryWithExponentialBackoff } from "@/lib/retry";
import { Paginador } from "@/components/paginador";

interface ClientesListPaginatedProps {
  initialData: {
    clientes: Array<{
      id: number;
      nombre: string;
      cuit?: string | null;
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

function ClienteCardSkeleton() {
  return (
    <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-4 py-2.5 animate-pulse flex justify-between items-center h-[46px]">
      <div className="flex items-center gap-3">
        <div className="h-4 bg-[#22252e] rounded w-32"></div>
        <div className="h-3.5 bg-[#22252e] rounded w-16"></div>
      </div>
      <div className="h-4 bg-[#22252e] rounded w-12"></div>
    </div>
  );
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
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ClienteCardSkeleton key={i} />
          ))
        ) : ordenados.length === 0 ? (
          <div className="text-center text-[#9ca3af] py-8">
            No hay clientes para mostrar
          </div>
        ) : (
          ordenados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="block bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-4 py-2.5 hover:border-[#a3e635] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#f9fafb]">{cliente.nombre}</span>
                  <span className="text-[10px] text-[#6b7280] bg-[#22252e] px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {cliente.zona.nombre}
                  </span>
                  {cliente.cuit && (
                    <span
                      className="text-[11px] font-mono text-[#9ca3af] bg-[#16181f] border border-[#2a2d35] px-1.5 py-0.5 rounded select-all hover:text-[#a3e635]"
                      title="Click para seleccionar CUIT"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {cliente.cuit}
                    </span>
                  )}
                </div>
                {cliente.saldoPendiente > 0 && (
                  <span className="text-[#ef4444] text-sm font-semibold font-mono">
                    {formatearPeso(cliente.saldoPendiente)}
                  </span>
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
      <Paginador
        pageActual={data.page}
        totalPaginas={totalPages}
        totalItems={data.total}
        onAnterior={() => handlePageChange(data.page - 1)}
        onSiguiente={() => handlePageChange(data.page + 1)}
        hasMore={data.hasMore}
        loading={loading}
        className="mt-6"
      />
    </div>
  );
}
