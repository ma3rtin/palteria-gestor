"use client";

import { useState, useEffect, ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Truck, Store, CircleDollarSign } from "lucide-react";

export type VistaPedido = "entregas" | "palterias" | "cobranzas";

interface Props {
  vistaInicial?: string;
  totalEntregas: number;
  totalPalterias: number;
  totalCobranzas: number;
  childrenEntregas: ReactNode;
  childrenPalterias: ReactNode;
  childrenCobranzas: ReactNode;
}

export function TabsVistasPedidos({
  vistaInicial,
  totalEntregas,
  totalPalterias,
  totalCobranzas,
  childrenEntregas,
  childrenPalterias,
  childrenCobranzas,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getVistaValida = (v?: string | null): VistaPedido => {
    if (v === "palterias") return "palterias";
    if (v === "cobranzas") return "cobranzas";
    return "entregas";
  };

  const [vista, setVista] = useState<VistaPedido>(() =>
    getVistaValida(searchParams.get("vista") || vistaInicial)
  );

  useEffect(() => {
    const v = searchParams.get("vista");
    if (v) {
      setVista(getVistaValida(v));
    }
  }, [searchParams]);

  const cambiarVista = (nuevaVista: VistaPedido) => {
    setVista(nuevaVista);
    const params = new URLSearchParams(searchParams.toString());
    if (nuevaVista === "entregas") {
      params.delete("vista");
    } else {
      params.set("vista", nuevaVista);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de pestañas superior */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-[#2a2d35] overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => cambiarVista("entregas")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
            vista === "entregas"
              ? "border-[#a3e635] text-[#f9fafb]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          <Truck size={15} className={vista === "entregas" ? "text-[#a3e635]" : "text-[#9ca3af]"} />
          <span>Entregas a Clientes</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
              vista === "entregas"
                ? "bg-[#a3e635]/20 text-[#a3e635] font-semibold"
                : "bg-[#2a2d35] text-[#9ca3af]"
            }`}
          >
            {totalEntregas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => cambiarVista("palterias")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
            vista === "palterias"
              ? "border-[#a3e635] text-[#f9fafb]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          <Store size={15} className={vista === "palterias" ? "text-[#a3e635]" : "text-[#9ca3af]"} />
          <span>Palterías</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
              vista === "palterias"
                ? "bg-[#a3e635]/20 text-[#a3e635] font-semibold"
                : "bg-[#2a2d35] text-[#9ca3af]"
            }`}
          >
            {totalPalterias}
          </span>
        </button>

        <button
          type="button"
          onClick={() => cambiarVista("cobranzas")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
            vista === "cobranzas"
              ? "border-[#a3e635] text-[#f9fafb]"
              : "border-transparent text-[#9ca3af] hover:text-[#f9fafb]"
          }`}
        >
          <CircleDollarSign size={15} className={vista === "cobranzas" ? "text-[#a3e635]" : "text-[#9ca3af]"} />
          <span>Cobranzas</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
              vista === "cobranzas"
                ? "bg-[#a3e635]/20 text-[#a3e635] font-semibold"
                : "bg-[#2a2d35] text-[#9ca3af]"
            }`}
          >
            {totalCobranzas}
          </span>
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div>
        {vista === "entregas" && childrenEntregas}
        {vista === "palterias" && childrenPalterias}
        {vista === "cobranzas" && childrenCobranzas}
      </div>
    </div>
  );
}
