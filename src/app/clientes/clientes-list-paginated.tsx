"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatearPeso } from "@/lib/utils";
import { retryWithExponentialBackoff } from "@/lib/retry";
import { Paginador } from "@/components/paginador";
import { TrendingUp, TrendingDown, Minus, Package } from "lucide-react";

interface ClientesListPaginatedProps {
  initialData: {
    clientes: Array<{
      id: number;
      nombre: string;
      zona: { id: number; nombre: string };
      saldoPendiente: number;
      ultimoPedido: string | null;
      diasInactivo: number;
      volumenSemanal: number;
      rangoVolumen: string;
      tendenciaCajas: number | null;
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
    tab?: string;
    volumen?: string;
  };
}

function getVolumenBadgeClass(rango: string): string {
  switch (rango) {
    case "0-10":
      // Gris neutro (Volumen muy bajo)
      return "bg-[#22252e] text-[#9ca3af] border-[#2a2d35]";
    case "10-20":
      // Gris verdoso muy atenuado (Volumen bajo)
      return "bg-[#181d19] text-[#8e9890] border-[#202922]";
    case "20-30":
      // Verde oliva apagado (Volumen medio-bajo)
      return "bg-[#19241b] text-[#84cc16]/70 border-[#223625]/40";
    case "30-50":
      // Verde oliva medio (Volumen medio-alto)
      return "bg-lime-950/20 text-lime-500 border-lime-900/30";
    case "50-70":
      // Verde esmeralda atenuado (Volumen alto)
      return "bg-emerald-950/20 text-[#a3e635]/80 border-emerald-900/30";
    case "70+":
      // Mismo color exacto que la tendencia positiva (Volumen VIP / Éxito total)
      return "bg-emerald-950/30 text-[#a3e635] border-emerald-900/40 font-semibold";
    default:
      return "bg-[#22252e] text-[#9ca3af] border-[#2a2d35]";
  }
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
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props when initialData changes (e.g. search/filter change)
  useEffect(() => {
    setData(initialData);
    setLoading(false);
  }, [initialData]);

  const currentTab = filters.tab || "activos";

  const cambiarTab = (nuevoTab: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: "0",
      ...(filters.q && { q: filters.q }),
      ...(filters.zona && { zona: filters.zona }),
      ...(filters.repartidor && { repartidor: filters.repartidor }),
      ...(filters.volumen && { volumen: filters.volumen }),
      tab: nuevoTab,
    });
    router.push(`/clientes?${params.toString()}`);
  };

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
        ...(filters.tab && { tab: filters.tab }),
        ...(filters.volumen && { volumen: filters.volumen }),
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
      {/* Tabs de Selección */}
      <div className="flex border-b border-[#2a2d35] mb-4 gap-2">
        <button
          onClick={() => cambiarTab("activos")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 relative -bottom-[1px] ${
            currentTab === "activos"
              ? "border-[#a3e635] text-[#a3e635]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => cambiarTab("inactivos")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 relative -bottom-[1px] ${
            currentTab === "inactivos"
              ? "border-[#a3e635] text-[#a3e635]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          Inactivos
        </button>
      </div>

      {/* Cliente list */}
      <div className="space-y-2 mb-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ClienteCardSkeleton key={i} />
          ))
        ) : ordenados.length === 0 ? (
          <div className="text-center text-[#9ca3af] py-8">
            No hay clientes {currentTab === "inactivos" ? "inactivos" : "activos"} para mostrar
          </div>
        ) : (
          ordenados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="block bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-4 py-3 hover:border-[#a3e635] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1.5 flex-1">
                  {/* Fila Principal: Nombre del Cliente */}
                  <span className="text-sm font-semibold text-[#f9fafb] tracking-wide">
                    {cliente.nombre}
                  </span>

                  {/* Fila Secundaria: Detalles (Zona, Volumen, Tendencia/Inactividad) */}
                  <div className="flex items-center gap-2 text-xs text-[#9ca3af] flex-wrap">
                    <span className="uppercase text-[9px] bg-[#22252e] text-[#9ca3af] px-1.5 py-0.5 rounded font-medium tracking-wide border border-[#2a2d35]">
                      {cliente.zona.nombre}
                    </span>

                    {/* Volumen Semanal con ícono de caja y colores según volumen */}
                    <div className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${getVolumenBadgeClass(cliente.rangoVolumen)}`}>
                      <Package className="w-3.5 h-3.5 opacity-80" />
                      <span className="font-medium">{cliente.rangoVolumen} cjs/sem</span>
                    </div>

                    {/* Tendencia o Inactividad */}
                    {currentTab === "activos" ? (
                      cliente.tendenciaCajas !== null && (
                        <div className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border font-mono ${
                          cliente.tendenciaCajas > 0
                            ? "bg-emerald-950/30 border-emerald-900/40 text-[#a3e635]"
                            : cliente.tendenciaCajas < 0
                            ? "bg-red-950/30 border-red-900/40 text-[#ef4444]"
                            : "bg-[#22252e] border-[#2a2d35] text-[#9ca3af]"
                        }`}>
                           {cliente.tendenciaCajas > 0 ? (
                            <>
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="font-semibold">+{Math.round(cliente.tendenciaCajas)} cjs</span>
                            </>
                          ) : cliente.tendenciaCajas < 0 ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span className="font-semibold">{Math.round(cliente.tendenciaCajas)} cjs</span>
                            </>
                          ) : (
                            <>
                              <Minus className="w-3.5 h-3.5 text-[#6b7280]" />
                              <span className="text-[#9ca3af]">=</span>
                            </>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="text-[11px] text-amber-500/80 font-medium bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/30">
                        {cliente.ultimoPedido ? (
                          <span>
                            Hace {cliente.diasInactivo} días (
                            {new Date(cliente.ultimoPedido + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                            )
                          </span>
                        ) : (
                          <span>Sin actividad registrada</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Saldo / Estado a la derecha */}
                <div className="flex items-center gap-2 ml-4">
                  {cliente.saldoPendiente > 0 ? (
                    <span className="text-[#ef4444] text-xs font-semibold font-mono bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                      {formatearPeso(cliente.saldoPendiente)}
                    </span>
                  ) : (
                    <span className="text-[#6b7280] text-xs font-medium uppercase tracking-wide">
                      Al día
                    </span>
                  )}
                </div>
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
