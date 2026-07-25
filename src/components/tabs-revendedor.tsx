"use client";

import { useState } from "react";

interface TabsRevendedorProps {
  tabPedidos: React.ReactNode;
  tabPagos: React.ReactNode;
  pedidosCount: number;
  pagosCount: number;
}

export function TabsRevendedor({
  tabPedidos,
  tabPagos,
  pedidosCount,
  pagosCount,
}: TabsRevendedorProps) {
  const [activeTab, setActiveTab] = useState<"pedidos" | "pagos">("pedidos");

  return (
    <div className="flex flex-col w-full">
      {/* Selector de Tabs */}
      <div className="flex border-b border-[#2a2d35] mb-6">
        <button
          onClick={() => setActiveTab("pedidos")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "pedidos"
              ? "text-[#a3e635] border-[#a3e635]"
              : "text-[#6b7280] border-transparent hover:text-[#9ca3af]"
          }`}
        >
          Pedidos ({pedidosCount})
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "pagos"
              ? "text-[#a3e635] border-[#a3e635]"
              : "text-[#6b7280] border-transparent hover:text-[#9ca3af]"
          }`}
        >
          Historial de pagos ({pagosCount})
        </button>
      </div>

      {/* Contenido de la Tab */}
      <div className="w-full">
        {activeTab === "pedidos" ? tabPedidos : tabPagos}
      </div>
    </div>
  );
}
