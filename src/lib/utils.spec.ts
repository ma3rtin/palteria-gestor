import { describe, it, expect } from "vitest";
import { 
  formatearPeso, 
  parseFechaRuta, 
  formatearFechaCorta, 
  obtenerFilaExcel 
} from "./utils";

describe("Utility Functions tests", () => {
  describe("formatearPeso", () => {
    it("should format numbers to ARS currency correctly without decimals", () => {
      const result = formatearPeso(1500);
      // Depending on Node environment, Intl space might be normal or non-breaking space
      // We check that it contains the currency symbol and the value
      expect(result).toContain("$");
      expect(result).toContain("1.500");
    });

    it("should return double-dash symbol if input is NaN", () => {
      expect(formatearPeso(NaN)).toBe("—");
    });
  });

  describe("parseFechaRuta", () => {
    it("should parse a YYYY-MM-DD string into a Date object at noon (12:00:00)", () => {
      const date = parseFechaRuta("2026-05-15");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(4); // 0-indexed May
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(0);
    });
  });

  describe("formatearFechaCorta", () => {
    it("should format string date or Date object to DD/MM/YY", () => {
      const dateStr = "2026-05-15";
      const formatted = formatearFechaCorta(dateStr);
      expect(formatted).toBe("15/05/26");
    });
  });

  describe("obtenerFilaExcel", () => {
    it("should join order details with tab character", () => {
      const mockPedido = {
        cliente: {
          nombre: "Cervecería 1",
          zona: { nombre: "CABA" }
        },
        producto: {
          nombre: "HASS IMPORTADA",
          kgPorCaja: 10
        },
        cajas: 5.5,
        montoTotal: 25000,
        maduracion: "SEMI"
      };

      const result = obtenerFilaExcel(mockPedido);
      const splitResult = result.split("\t");
      
      expect(splitResult).toHaveLength(7);
      expect(splitResult[0]).toBe("Cervecería 1");
      expect(splitResult[1]).toBe("CABA");
      expect(splitResult[2]).toBe("10 kg");
      expect(splitResult[3]).toBe("5,5");
      expect(splitResult[4]).toBe("HASS IMPORTADA");
      expect(splitResult[5]).toBe("SEMI");
      expect(splitResult[6]).toBe("$ 25.000");
    });
  });
});
