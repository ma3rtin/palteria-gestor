import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  crearCuentaCorriente,
  actualizarCuentaCorriente,
  toggleActivoCuentaCorriente,
} from "./cuentas-corrientes";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Mock de prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      cuentaCorriente: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

// Mock de next/cache
vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
  };
});

describe("Server Actions - Cuentas Corrientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("crearCuentaCorriente", () => {
    it("debería crear una cuenta corriente con valores válidos y revalidar las rutas", async () => {
      const formData = new FormData();
      formData.append("nombre", " panera rosa ");
      formData.append("diaCobranza", " lunes ");
      formData.append("observaciones", "Paga con transferencia");

      await crearCuentaCorriente(formData);

      expect(prisma.cuentaCorriente.create).toHaveBeenCalledWith({
        data: {
          nombre: "PANERA ROSA",
          diaCobranza: "LUNES",
          observaciones: "Paga con transferencia",
          activo: true,
        },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/config/cuentas-corrientes");
      expect(revalidatePath).toHaveBeenCalledWith("/pagos-semanales");
    });

    it("debería lanzar un error si el nombre está vacío", async () => {
      const formData = new FormData();
      formData.append("nombre", "   ");

      await expect(crearCuentaCorriente(formData)).rejects.toThrow(
        "El nombre de la cuenta corriente es requerido"
      );

      expect(prisma.cuentaCorriente.create).not.toHaveBeenCalled();
    });
  });

  describe("actualizarCuentaCorriente", () => {
    it("debería actualizar los valores de una cuenta existente y revalidar", async () => {
      const formData = new FormData();
      formData.append("id", "42");
      formData.append("nombre", "suteki sushi");
      formData.append("diaCobranza", "sabado");
      formData.append("observaciones", "Cambio de dia de cobro");

      await actualizarCuentaCorriente(formData);

      expect(prisma.cuentaCorriente.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: {
          nombre: "SUTEKI SUSHI",
          diaCobranza: "SABADO",
          observaciones: "Cambio de dia de cobro",
        },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/config/cuentas-corrientes");
      expect(revalidatePath).toHaveBeenCalledWith("/pagos-semanales");
      expect(revalidatePath).toHaveBeenCalledWith("/pagos-semanales/42");
    });

    it("debería lanzar error si falta el ID o el nombre", async () => {
      const formData = new FormData();
      formData.append("nombre", "SUTEKI");

      await expect(actualizarCuentaCorriente(formData)).rejects.toThrow(
        "El ID de la cuenta corriente es requerido"
      );

      const formData2 = new FormData();
      formData2.append("id", "12");
      formData2.append("nombre", "  ");

      await expect(actualizarCuentaCorriente(formData2)).rejects.toThrow(
        "El nombre de la cuenta corriente es requerido"
      );
    });
  });

  describe("toggleActivoCuentaCorriente", () => {
    it("debería cambiar el estado de activo invirtiendo el valor provisto", async () => {
      const formData = new FormData();
      formData.append("id", "10");
      formData.append("activo", "true");

      await toggleActivoCuentaCorriente(formData);

      expect(prisma.cuentaCorriente.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { activo: false },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/config/cuentas-corrientes");
      expect(revalidatePath).toHaveBeenCalledWith("/pagos-semanales");
    });

    it("debería activar si el valor actual provisto es false", async () => {
      const formData = new FormData();
      formData.append("id", "10");
      formData.append("activo", "false");

      await toggleActivoCuentaCorriente(formData);

      expect(prisma.cuentaCorriente.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { activo: true },
      });
    });
  });
});
