import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportarAExcel } from "./exportar-excel";
import * as XLSX from "xlsx";

vi.mock("xlsx", () => {
  const json_to_sheet = vi.fn().mockReturnValue({});
  const book_new = vi.fn().mockReturnValue({});
  const book_append_sheet = vi.fn();
  const writeFile = vi.fn();
  return {
    utils: {
      json_to_sheet,
      book_new,
      book_append_sheet,
    },
    writeFile,
  };
});

describe("exportarAExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería crear el libro de Excel y llamar a writeFile con el nombre de archivo correcto", () => {
    exportarAExcel({
      nombreArchivo: "reporte-pedidos",
      hojas: [
        {
          nombreHoja: "Pedidos",
          filas: [
            { Fecha: "10/10/2026", Cliente: "Panera Rosa", Cajas: 5, Total: 150000 },
          ],
        },
      ],
    });

    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      { Fecha: "10/10/2026", Cliente: "Panera Rosa", Cajas: 5, Total: 150000 },
    ]);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "reporte-pedidos.xlsx");
  });

  it("no debería duplicar la extensión .xlsx si ya viene incluida", () => {
    exportarAExcel({
      nombreArchivo: "reporte-semanal.xlsx",
      hojas: [
        {
          filas: [{ Cuenta: "Panera Rosa", Deuda: 50000 }],
        },
      ],
    });

    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "reporte-semanal.xlsx");
  });

  it("debería soportar múltiples hojas en el mismo archivo", () => {
    exportarAExcel({
      nombreArchivo: "cuenta-completa",
      hojas: [
        { nombreHoja: "Pedidos pendientes", filas: [{ Local: "Palermo", Cajas: 2 }] },
        { nombreHoja: "Historial de pagos", filas: [{ Fecha: "10/10/2026", Monto: 60000 }] },
      ],
    });

    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "cuenta-completa.xlsx");
  });
});
