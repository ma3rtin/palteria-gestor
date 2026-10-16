"use client";

import { exportarAExcel } from "@/lib/exportar-excel";
import { BotonExportarExcel } from "@/components/boton-exportar-excel";
import { useToast } from "@/hooks/use-toast";
import { formatearFechaCorta, ETIQUETAS_FORMA_PAGO, ETIQUETAS_ESTADO_PAGO } from "@/lib/utils";

interface PedidoCuenta {
  id: number;
  fecha: Date;
  cajas: number;
  montoTotal: number;
  montoPagado: number;
  maduracion?: string | null;
  estadoPago: string;
  producto?: { nombre: string } | null;
  repartidor?: { nombre: string } | null;
  items?: Array<{ cajas: number; maduracion?: string | null; producto: { nombre: string } }>;
}

interface LocalCuenta {
  id: number;
  nombre: string;
  zona: { nombre: string };
  pedidos: PedidoCuenta[];
}

interface PagoLocalItem {
  id: number;
  monto: number;
  fechaPago: Date;
  observaciones?: string | null;
  cliente?: { nombre: string } | null;
  repartidor?: { nombre: string } | null;
}

interface PeriodoCuenta {
  id: number;
  fechaInicio: Date;
  fechaFin: Date;
  formaPago?: string | null;
  pagosLocales: PagoLocalItem[];
}

interface Props {
  cuenta: {
    id: number;
    nombre: string;
    clientes: LocalCuenta[];
    periodos: PeriodoCuenta[];
  };
}

export function BotonExportarDetalleCuenta({ cuenta }: Props) {
  const { showToast, ToastComponent } = useToast();

  function handleExportar() {
    // 1. Filas de pedidos pendientes
    const filasPedidos: Record<string, any>[] = [];
    for (const c of cuenta.clientes) {
      for (const p of c.pedidos) {
        const prod = p.items && p.items.length > 1
          ? p.items.map((it) => `${it.cajas}x ${it.producto.nombre}`).join(" + ")
          : (p.producto?.nombre ?? "—");

        filasPedidos.push({
          "Local": c.nombre,
          "Zona": c.zona.nombre,
          "Fecha": formatearFechaCorta(p.fecha),
          "Producto": prod,
          "Maduración": p.maduracion || "—",
          "Cajas": p.cajas,
          "Repartidor": p.repartidor?.nombre ?? "Sin asignar",
          "Total Pedido ($)": p.montoTotal,
          "Pagado ($)": p.montoPagado,
          "Saldo Pendiente ($)": p.montoTotal - p.montoPagado,
          "Estado": ETIQUETAS_ESTADO_PAGO[p.estadoPago] ?? p.estadoPago,
        });
      }
    }

    // 2. Filas de historial de pagos
    const filasPagos: Record<string, any>[] = [];
    for (const per of cuenta.periodos) {
      for (const pl of per.pagosLocales) {
        const formaPagoStr = per.formaPago ? (ETIQUETAS_FORMA_PAGO[per.formaPago] ?? per.formaPago) : "—";
        filasPagos.push({
          "Fecha de Pago": formatearFechaCorta(pl.fechaPago),
          "Período": `${formatearFechaCorta(per.fechaInicio)} – ${formatearFechaCorta(per.fechaFin)}`,
          "Destino": pl.cliente?.nombre ?? "Cobro global cuenta",
          "Monto ($)": pl.monto,
          "Forma de Pago": formaPagoStr,
          "Cobró": pl.repartidor?.nombre ?? "—",
        });
      }
    }

    if (filasPedidos.length === 0 && filasPagos.length === 0) {
      showToast("No hay datos para exportar en esta cuenta");
      return;
    }

    const hojas = [];
    if (filasPedidos.length > 0) {
      hojas.push({ nombreHoja: "Pedidos pendientes", filas: filasPedidos });
    }
    if (filasPagos.length > 0) {
      hojas.push({ nombreHoja: "Historial de pagos", filas: filasPagos });
    }

    const slug = cuenta.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    exportarAExcel({
      nombreArchivo: `cuenta-corriente-${slug}.xlsx`,
      hojas,
    });

    showToast(`Cuenta exportada a Excel con éxito`);
  }

  return (
    <>
      <BotonExportarExcel onExportar={handleExportar} />
      {ToastComponent}
    </>
  );
}
