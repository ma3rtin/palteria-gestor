import * as XLSX from "xlsx";

export interface HojaExcel {
  nombreHoja?: string;
  filas: Record<string, string | number | boolean | null | undefined>[];
}

export interface OpcionesExportarExcel {
  nombreArchivo: string;
  hojas: HojaExcel[];
}

/**
 * Utilidad centralizada y reusable para exportar conjuntos de datos tabulares a un archivo Excel (.xlsx) nativo.
 * Soporta múltiples hojas y ajuste automático de ancho de columnas.
 */
export function exportarAExcel({ nombreArchivo, hojas }: OpcionesExportarExcel) {
  const wb = XLSX.utils.book_new();

  for (const hoja of hojas) {
    const ws = XLSX.utils.json_to_sheet(hoja.filas);

    // Ajuste automático de ancho de columna para evitar truncamientos
    if (hoja.filas.length > 0) {
      const keys = Object.keys(hoja.filas[0]);
      const colWidths = keys.map((key) => {
        let maxLen = key.length;
        for (const row of hoja.filas) {
          const val = row[key];
          if (val !== null && val !== undefined) {
            const str = String(val);
            if (str.length > maxLen) maxLen = str.length;
          }
        }
        return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
      });
      ws["!cols"] = colWidths;
    }

    const nombreHoja = (hoja.nombreHoja || "Datos").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  }

  const filename = nombreArchivo.endsWith(".xlsx") ? nombreArchivo : `${nombreArchivo}.xlsx`;
  XLSX.writeFile(wb, filename);
}
