"use client";

import { actualizarProductoPedido, actualizarProductoItemPedido } from "@/actions/pedidos";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

interface ProductoItem {
  id: number;
  nombre: string;
}

interface Props {
  idPedido?: number;
  idItemPedido?: number;
  idProductoActual: number | null;
  productos: ProductoItem[];
  tieneMultiplesProductos?: boolean;
  resumenMultiples?: string;
  onUpdated?: () => void;
}

export function SelectorProductoPedido({
  idPedido,
  idItemPedido,
  idProductoActual,
  productos,
  tieneMultiplesProductos = false,
  resumenMultiples,
  onUpdated,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [idProducto, setIdProducto] = useState<number | null>(idProductoActual);

  useEffect(() => {
    setIdProducto(idProductoActual);
  }, [idProductoActual]);

  if (tieneMultiplesProductos) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#2a2d35] text-[#d1d5db]"
        title={resumenMultiples}
      >
        Varios
      </span>
    );
  }

  const existeActual = idProducto ? productos.some((p) => p.id === idProducto) : true;

  return (
    <div className="relative inline-block group">
      <select
        value={idProducto ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (!val) return;
          setIdProducto(val);
          startTransition(async () => {
            if (idItemPedido) {
              await actualizarProductoItemPedido(idItemPedido, val);
            } else if (idPedido) {
              await actualizarProductoPedido(idPedido, val);
            }
            onUpdated?.();
            router.refresh();
          });
        }}
        className={`appearance-none text-[11px] rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#a3e635] transition-colors pr-[18px] bg-[#1c1f26] text-[#d1d5db] border-[#2a2d35] hover:border-[#a3e635] font-medium ${
          isPending ? "opacity-60" : ""
        }`}
        title="Cambiar marca / producto"
      >
        <option value="" disabled>Seleccionar producto</option>
        {!existeActual && idProducto && (
          <option value={idProducto} disabled>
            Producto #{idProducto}
          </option>
        )}
        {productos.map((prod) => (
          <option key={prod.id} value={prod.id}>
            {prod.nombre}
          </option>
        ))}
      </select>
      <span className="absolute right-1 top-[52%] -translate-y-1/2 text-[7px] opacity-0 group-hover:opacity-100 pointer-events-none text-current transition-opacity duration-150">
        ▼
      </span>
    </div>
  );
}
