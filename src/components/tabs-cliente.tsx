"use client";

import { useState } from "react";
import { Receipt, FileText } from "lucide-react";

interface TabsClienteProps {
  tabPedidos: React.ReactNode;
  tabPagos: React.ReactNode;
}

export function TabsCliente({ tabPedidos, tabPagos }: TabsClienteProps) {
  const [activeTab, setActiveTab] = useState<"pedidos" | "pagos">("pedidos");

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de Pestañas */}
      <div className="flex border-b border-[#2a2d35] gap-4">
        <button
          onClick={() => setActiveTab("pedidos")}
          className={`flex items-center gap-2 pb-2.5 px-1 text-sm font-semibold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "pedidos"
              ? "text-[#a3e635] border-[#a3e635]"
              : "text-[#6b7280] border-transparent hover:text-[#9ca3af]"
          }`}
        >
          <FileText size={16} />
          Historial de Pedidos
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={`flex items-center gap-2 pb-2.5 px-1 text-sm font-semibold transition-colors border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "pagos"
              ? "text-[#a3e635] border-[#a3e635]"
              : "text-[#6b7280] border-transparent hover:text-[#9ca3af]"
          }`}
        >
          <Receipt size={16} />
          Historial de Pagos
        </button>
      </div>

      {/* Contenido de la Pestaña */}
      <div>
        {activeTab === "pedidos" ? tabPedidos : tabPagos}
      </div>
    </div>
  );
}
