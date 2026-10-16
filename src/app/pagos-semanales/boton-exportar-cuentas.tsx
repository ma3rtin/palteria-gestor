"use client";

import { getTodasCuentasParaExportar } from "@/actions/pagos-semanales";
import { exportarAExcel } from "@/lib/exportar-excel";
import { BotonExportarExcel } from "@/components/boton-exportar-excel";
import { useToast } from "@/hooks/use-toast";

export function BotonExportarCuentas() {
  const { showToast, ToastComponent } = useToast();

  async function handleExportar() {
    const cuentas = await getTodasCuentasParaExportar();
    if (!cuentas || cuentas.length === 0) {
      showToast("No hay cuentas corrientes para exportar");
      return;
    }

    const filas = cuentas.map((cc) => ({
      "Cuenta Corriente": cc.nombre,
      "Locales": cc.cantidadLocales,
      "Día de Cobranza": cc.diaCobranza || "—",
      "Deuda Pendiente ($)": cc.deudaTotal,
      "Estado": cc.deudaTotal > 0 ? "Con deuda" : "Al día",
    }));

    exportarAExcel({
      nombreArchivo: "cuentas-corrientes-pagos-semanales.xlsx",
      hojas: [
        {
          nombreHoja: "Cuentas Corrientes",
          filas,
        },
      ],
    });

    showToast(`Exportadas ${cuentas.length} cuentas a Excel`);
  }

  return (
    <>
      <BotonExportarExcel onExportar={handleExportar} />
      {ToastComponent}
    </>
  );
}
