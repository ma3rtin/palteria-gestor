"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { getPedidosPeriodo } from "@/actions/revendedores";
import { exportarAExcel } from "@/lib/exportar-excel";
import { BotonExportarExcel } from "@/components/boton-exportar-excel";
import { useToast } from "@/hooks/use-toast";
import { formatearFechaCorta, ETIQUETAS_FORMA_PAGO, ETIQUETAS_ESTADO_PAGO } from "@/lib/utils";

interface Props {
  idRevendedor: number;
  revendedorNombre: string;
  desde: string;
  hasta: string;
}

export function AccionesPedidosRevendedor({
  idRevendedor,
  revendedorNombre,
  desde,
  hasta,
}: Props) {
  const [copiando, setCopiando] = useState(false);
  const { showToast, ToastComponent } = useToast();

  async function handleCopiar() {
    if (copiando) return;
    try {
      setCopiando(true);
      const res = await getPedidosPeriodo(idRevendedor, desde, hasta);
      if (!res.pedidos || res.pedidos.length === 0) {
        showToast("No hay pedidos en este período para copiar");
        return;
      }

      const filas = res.pedidos.map((p) => {
        const prod = p.items && p.items.length > 1
          ? p.items.map((it) => `${it.cajas}x ${it.producto.nombre}`).join(" + ")
          : (p.producto?.nombre ?? "—");
        const fecha = formatearFechaCorta(p.fecha);
        const cajas = p.cajas.toString().replace(".", ",");
        const pago = ETIQUETAS_FORMA_PAGO[p.formaPago] ?? p.formaPago;
        const total = `$ ${p.montoTotal.toLocaleString("es-AR")}`;
        const ganancia = `$ ${p.comisionRevendedor.toLocaleString("es-AR")}`;

        return [fecha, p.cliente.nombre, prod, cajas, pago, total, ganancia].join("\t");
      });

      const cabecera = ["Fecha", "Cliente", "Producto", "Cajas", "Forma de Pago", "Total", "Ganancia"].join("\t");
      const textoCompleto = [cabecera, ...filas].join("\n");

      await navigator.clipboard.writeText(textoCompleto);
      showToast(`Copiados ${res.pedidos.length} pedidos al portapapeles`);
    } catch (e) {
      console.error("Error al copiar pedidos:", e);
      showToast("Error al copiar pedidos");
    } finally {
      setCopiando(false);
    }
  }

  async function handleExportarExcel() {
    const res = await getPedidosPeriodo(idRevendedor, desde, hasta);
    if (!res.pedidos || res.pedidos.length === 0) {
      showToast("No hay pedidos para exportar en este período");
      return;
    }

    const filas = res.pedidos.map((p) => {
      const prod = p.items && p.items.length > 1
        ? p.items.map((it) => `${it.cajas}x ${it.producto.nombre} (${it.maduracion})`).join(" + ")
        : (p.producto?.nombre ?? "—");

      return {
        "Fecha": formatearFechaCorta(p.fecha),
        "Cliente": p.cliente.nombre,
        "Producto": prod,
        "Cajas": p.cajas,
        "Forma de Pago": ETIQUETAS_FORMA_PAGO[p.formaPago] ?? p.formaPago,
        "Total Pedido ($)": p.montoTotal,
        "Ganancia Revendedor ($)": p.comisionRevendedor,
        "Estado de Pago": ETIQUETAS_ESTADO_PAGO[p.estadoPago] ?? p.estadoPago,
      };
    });

    const slugRevendedor = revendedorNombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    exportarAExcel({
      nombreArchivo: `pedidos-${slugRevendedor}-${desde}-a-${hasta}.xlsx`,
      hojas: [
        {
          nombreHoja: "Pedidos",
          filas,
        },
      ],
    });
    showToast(`Excel exportado con éxito (${res.pedidos.length} pedidos)`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopiar}
        disabled={copiando}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#17191e] hover:bg-[#22252e] border border-[#2a2d35] hover:border-[#4b5563] text-xs font-medium text-[#f9fafb] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        title="Copiar pedidos al portapapeles (formato Excel / tabla)"
      >
        {copiando ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a3e635]" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-[#a3e635]" />
        )}
        <span>{copiando ? "Copiando..." : "Copiar pedidos"}</span>
      </button>

      <BotonExportarExcel onExportar={handleExportarExcel} />
      {ToastComponent}
    </div>
  );
}
