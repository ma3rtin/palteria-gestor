import { describe, it, expect } from "vitest";
import { coincideBusquedaZona } from "./selector-zona-buscador";

describe("coincideBusquedaZona (Búsqueda por letras consecutivas / Substring)", () => {
  it("debe coincidir cuando el patrón está vacío o son solo espacios", () => {
    expect(coincideBusquedaZona("", "HAEDO ZO")).toBe(true);
    expect(coincideBusquedaZona("   ", "MORON ZO")).toBe(true);
  });

  it("debe coincidir con códigos de zona como ZO, ZN, ZS", () => {
    expect(coincideBusquedaZona("zo", "HAEDO ZO")).toBe(true);
    expect(coincideBusquedaZona("zo", "MORON ZO")).toBe(true);
    expect(coincideBusquedaZona("zn", "CABA ZN")).toBe(true);
    expect(coincideBusquedaZona("zn", "HAEDO ZO")).toBe(false);
  });

  it("debe coincidir con nombres de localidad completos o parciales consecutivos", () => {
    expect(coincideBusquedaZona("haedo", "HAEDO ZO")).toBe(true);
    expect(coincideBusquedaZona("hae", "HAEDO ZO")).toBe(true);
    expect(coincideBusquedaZona("mor", "MORON ZO")).toBe(true);
    expect(coincideBusquedaZona("caba", "CABA ZN")).toBe(true);
    expect(coincideBusquedaZona("castelar", "CASTELAR ZO")).toBe(true);
  });

  it("debe ser insensible a mayúsculas y minúsculas", () => {
    expect(coincideBusquedaZona("ZO", "haedo zo")).toBe(true);
    expect(coincideBusquedaZona("HaEdO", "HAEDO ZO")).toBe(true);
    expect(coincideBusquedaZona("Caba", "caba zn")).toBe(true);
  });

  it("debe rechazar letras que no estén consecutivas", () => {
    // En búsqueda consecutiva, "cb" NO debe coincidir con "CABA" (porque 'c' y 'b' no están pegadas)
    expect(coincideBusquedaZona("cb", "CABA")).toBe(false);

    // "hd" NO debe coincidir con "HAEDO"
    expect(coincideBusquedaZona("hd", "HAEDO")).toBe(false);

    // "vl" NO debe coincidir con "VILLA LELOIR"
    expect(coincideBusquedaZona("vl", "VILLA LELOIR")).toBe(false);
  });
});
