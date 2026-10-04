"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, Package, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatearPeso } from "@/lib/utils";
import { IconoCaja } from "@/components/icono-caja";

interface RepartidorItem {
  repartidor: { id: number; nombre: string } | null;
  totalCajas: number;
  totalMonto: number;
  totalCobrado: number;
  cantPedidos: number;
}

interface VariedadStock {
  id: number;
  nombre: string;
  lote: string | null;
  cajasVendidasHoy: number;
  stockDisponible: number;
  kgPorCaja: number | null;
}

interface StockResumen {
  variedades: VariedadStock[];
  totalCajasVendidasHoy: number;
  totalStockDisponible: number;
}

interface Props {
  resumenRepartidores: RepartidorItem[];
  stock: StockResumen;
  fechaHoy: string;
}

export function TabsPanelControl({ resumenRepartidores, stock, fechaHoy }: Props) {
  const [tab, setTab] = useState<"repartidores" | "stock">("repartidores");
  const [mostrarTodosStock, setMostrarTodosStock] = useState(false);

  const totalCajasRepartidores = resumenRepartidores.reduce((s, r) => s + r.totalCajas, 0);

  // Separar productos con interacción hoy de los que no tuvieron ventas
  const variedadesConVentas = stock.variedades.filter((v) => v.cajasVendidasHoy > 0);
  const variedadesSinVentas = stock.variedades.filter((v) => v.cajasVendidasHoy === 0);

  // Si ninguno tuvo ventas hoy, mostrar al menos los que tienen stock físico disponible
  const variedadesIniciales =
    variedadesConVentas.length > 0
      ? variedadesConVentas
      : stock.variedades.filter((v) => v.stockDisponible > 0).slice(0, 8);

  const variedadesRestantes =
    variedadesConVentas.length > 0
      ? variedadesSinVentas
      : stock.variedades.filter((v) => !variedadesIniciales.some((vi) => vi.id === v.id));

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
      {/* Selector de pestañas */}
      <div className="grid grid-cols-2 border-b border-[#2a2d35] bg-[#16181f]">
        <button
          type="button"
          onClick={() => setTab("repartidores")}
          className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            tab === "repartidores"
              ? "border-[#a3e635] text-[#a3e635] bg-[#1c1f26]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          <Truck size={14} />
          <span>Reparto</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono inline-flex items-center gap-1 ${
              tab === "repartidores" ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-[#2a2d35] text-[#9ca3af]"
            }`}
          >
            <IconoCaja size={10} />
            <span>{totalCajasRepartidores}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            tab === "stock"
              ? "border-[#a3e635] text-[#a3e635] bg-[#1c1f26]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          <Package size={14} />
          <span>Stock</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono inline-flex items-center gap-1 ${
              tab === "stock" ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-[#2a2d35] text-[#9ca3af]"
            }`}
          >
            <IconoCaja size={10} />
            <span>{stock.totalStockDisponible}</span>
          </span>
        </button>
      </div>

      {/* Contenido Pestaña Repartidores */}
      {tab === "repartidores" && (
        <div>
          {resumenRepartidores.length === 0 ? (
            <div className="p-6 text-center text-[#6b7280] text-sm">
              Sin actividad de reparto hoy.
            </div>
          ) : (
            <div className="divide-y divide-[#22252e]">
              {resumenRepartidores.map((r, i) => {
                const esSinAsignar = !r.repartidor;
                return (
                  <div key={i} className="px-4 py-3 hover:bg-[#20232c] transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        {esSinAsignar ? (
                          <span className="font-medium text-sm text-red-400 flex items-center gap-1">
                            <AlertTriangle size={13} />
                            Sin asignar
                          </span>
                        ) : (
                          <Link
                            href={`/repartidores/${r.repartidor?.id}`}
                            prefetch={false}
                            className="font-medium text-sm text-[#f9fafb] hover:text-[#a3e635] transition-colors"
                          >
                            {r.repartidor?.nombre}
                          </Link>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[#4ade80]">
                        {formatearPeso(r.totalCobrado)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-[#6b7280]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] font-medium inline-flex items-center gap-1">
                          <IconoCaja size={11} className="text-[#a3e635]" />
                          {r.totalCajas} cajas
                        </span>
                        <span>·</span>
                        <span>{r.cantPedidos} pedidos</span>
                      </div>
                      <span>Fact. {formatearPeso(r.totalMonto)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido Pestaña Stock / Variedades */}
      {tab === "stock" && (
        <div>
          {/* Header de stock */}
          <div className="bg-[#16181f] px-4 py-2.5 border-b border-[#2a2d35] flex items-center justify-between text-xs">
            <span className="text-[#9ca3af] inline-flex items-center">
              Vendidas hoy:
              <strong className="text-[#f9fafb] font-medium inline-flex items-center gap-1 ml-1.5">
                <IconoCaja size={12} className="text-[#a3e635]" />
                {stock.totalCajasVendidasHoy}
              </strong>
            </span>
            <span className="text-[#9ca3af] inline-flex items-center">
              En cámara:
              <strong className="text-[#a3e635] font-medium inline-flex items-center gap-1 ml-1.5">
                <IconoCaja size={12} />
                {stock.totalStockDisponible}
              </strong>
            </span>
          </div>

          {stock.variedades.length === 0 ? (
            <div className="p-6 text-center text-[#6b7280] text-sm">
              No hay productos activos en catálogo.
            </div>
          ) : (
            <div>
              {/* Lista inicial de productos (con ventas hoy) */}
              <div className="divide-y divide-[#22252e]">
                {variedadesIniciales.map((v) => renderFilaVariedad(v))}
              </div>

              {/* Sección desplegable para otros productos sin ventas */}
              {variedadesRestantes.length > 0 && (
                <div className="border-t border-[#2a2d35]">
                  <button
                    type="button"
                    onClick={() => setMostrarTodosStock(!mostrarTodosStock)}
                    className="w-full px-4 py-2 bg-[#16181f] hover:bg-[#20232c] text-xs text-[#9ca3af] hover:text-[#f9fafb] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>
                      {mostrarTodosStock
                        ? `Ocultar otros ${variedadesRestantes.length} productos en cámara`
                        : `+ Ver otros ${variedadesRestantes.length} productos en cámara`}
                    </span>
                    {mostrarTodosStock ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {mostrarTodosStock && (
                    <div className="divide-y divide-[#22252e] bg-[#181a22]">
                      {variedadesRestantes.map((v) => renderFilaVariedad(v))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enlace rápido a productos */}
          <div className="px-4 py-2.5 bg-[#16181f] border-t border-[#2a2d35] text-right">
            <Link
              href="/productos"
              className="text-xs text-[#a3e635] hover:underline inline-flex items-center gap-1 font-medium"
            >
              Gestionar stock y lotes
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  function renderFilaVariedad(v: VariedadStock) {
    const stockBajo = v.stockDisponible <= 10;
    const sinStock = v.stockDisponible <= 0;

    return (
      <div key={v.id} className="px-4 py-2.5 hover:bg-[#20232c] transition-colors">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex items-center flex-wrap">
            <span className="font-medium text-sm text-[#f9fafb] truncate">{v.nombre}</span>
            {v.lote && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#2a2d35] text-[#9ca3af] font-mono border border-[#373a43] shrink-0">
                lote {v.lote}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            {v.cajasVendidasHoy > 0 ? (
              <span className="text-sm font-semibold text-[#a3e635] inline-flex items-center gap-1">
                <IconoCaja size={12} className="text-[#a3e635]" />
                {v.cajasVendidasHoy} hoy
              </span>
            ) : (
              <span className="text-[#6b7280] text-xs">0 hoy</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-[#6b7280]">
            {v.kgPorCaja ? `${v.kgPorCaja} kg/caja` : "Caja estándar"}
          </span>
          <span
            className={`font-medium inline-flex items-center gap-1 ${
              sinStock
                ? "text-red-400"
                : stockBajo
                ? "text-amber-400"
                : "text-[#9ca3af]"
            }`}
          >
            <IconoCaja size={11} />
            {v.stockDisponible} en cámara
          </span>
        </div>
      </div>
    );
  }
}
