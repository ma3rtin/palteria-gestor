import { describe, it, expect } from "vitest";
import { tienePermiso, PERMISOS } from "./permisos";
import { RolUsuario } from "@/generated/prisma/enums";

describe("RBAC - Helper de Permisos", () => {
  it("debería permitir acceso a costos y revendedores para ADMIN", () => {
    expect(tienePermiso(RolUsuario.ADMIN, "verCostos")).toBe(true);
    expect(tienePermiso(RolUsuario.ADMIN, "editarCostos")).toBe(true);
    expect(tienePermiso(RolUsuario.ADMIN, "verRevendedores")).toBe(true);
    expect(tienePermiso(RolUsuario.ADMIN, "gestionarRevendedores")).toBe(true);
  });

  it("debería denegar costos y revendedores para EMPLEADO", () => {
    expect(tienePermiso(RolUsuario.EMPLEADO, "verCostos")).toBe(false);
    expect(tienePermiso(RolUsuario.EMPLEADO, "editarCostos")).toBe(false);
    expect(tienePermiso(RolUsuario.EMPLEADO, "verRevendedores")).toBe(false);
    expect(tienePermiso(RolUsuario.EMPLEADO, "gestionarRevendedores")).toBe(false);
  });

  it("debería retornar false para roles no definidos, nulos o inválidos", () => {
    expect(tienePermiso(undefined, "verCostos")).toBe(false);
    expect(tienePermiso(null, "verRevendedores")).toBe(false);
    expect(tienePermiso("ROL_INEXISTENTE" as never, "verCostos")).toBe(false);
  });

  it("debería mantener la consistencia entre la matriz de PERMISOS y RolUsuario", () => {
    Object.values(RolUsuario).forEach((rol) => {
      expect(PERMISOS[rol]).toBeDefined();
    });
  });
});
