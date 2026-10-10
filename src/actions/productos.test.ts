import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  crearProducto,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
  actualizarMaduracion,
  togglePrioridadProducto,
} from "./productos";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RolUsuario } from "@/generated/prisma/enums";

// Mock de auth
vi.mock("@/auth", () => {
  return {
    auth: vi.fn().mockResolvedValue({
      user: {
        id: "1",
        name: "Admin",
        email: "admin@palteria.com",
        rol: "ADMIN",
      },
    }),
  };
});

// Mock de prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      producto: {
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

describe("Server Actions - Productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("crearProducto", () => {
    it("debería crear un producto con fecha de lote válida y revalidar la ruta", async () => {
      const formData = new FormData();
      formData.append("nombre", " peru ");
      formData.append("precioReferencia", "12500");
      formData.append("kgPorCaja", "11");
      formData.append("stockCajas", "50");
      formData.append("costo", "8000");
      formData.append("fechaIngreso", "2026-07-31");

      await crearProducto(formData);

      expect(prisma.producto.create).toHaveBeenCalledWith({
        data: {
          nombre: "PERU",
          precioReferencia: 12500,
          kgPorCaja: 11,
          stockCajas: 50,
          costo: 8000,
          fechaIngreso: new Date("2026-07-31T12:00:00"),
          maduracion: null,
          prioritario: false,
        },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería crear un producto con maduración y prioridad", async () => {
      const formData = new FormData();
      formData.append("nombre", "NEGRITA CAL 26");
      formData.append("precioReferencia", "60000");
      formData.append("costo", "45000");
      formData.append("maduracion", "semi");
      formData.append("prioritario", "on");

      await crearProducto(formData);

      expect(prisma.producto.create).toHaveBeenCalledWith({
        data: {
          nombre: "NEGRITA CAL 26",
          precioReferencia: 60000,
          kgPorCaja: null,
          stockCajas: 0,
          costo: 45000,
          fechaIngreso: null,
          maduracion: "SEMI",
          prioritario: true,
        },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería crear un producto sin fecha de lote (null) si no se especifica y revalidar la ruta", async () => {
      const formData = new FormData();
      formData.append("nombre", "CAT");
      formData.append("precioReferencia", "15000");
      formData.append("costo", "9000");

      await crearProducto(formData);

      expect(prisma.producto.create).toHaveBeenCalledWith({
        data: {
          nombre: "CAT",
          precioReferencia: 15000,
          kgPorCaja: null,
          stockCajas: 0,
          costo: 9000,
          fechaIngreso: null,
          maduracion: null,
          prioritario: false,
        },
      });
    });

    it("debería lanzar un error si el nombre del producto está vacío", async () => {
      const formData = new FormData();
      formData.append("nombre", "   ");
      formData.append("precioReferencia", "15000");
      formData.append("costo", "9000");

      await expect(crearProducto(formData)).rejects.toThrow("El nombre es requerido");
      expect(prisma.producto.create).not.toHaveBeenCalled();
    });

    it("debería lanzar un error si falta el precio de referencia", async () => {
      const formData = new FormData();
      formData.append("nombre", "PERU");
      formData.append("costo", "9000");

      await expect(crearProducto(formData)).rejects.toThrow("El precio de referencia es requerido");
      expect(prisma.producto.create).not.toHaveBeenCalled();
    });
  });

  describe("actualizarPrecio", () => {
    it("debería actualizar el precio de referencia de un producto existente", async () => {
      const formData = new FormData();
      formData.append("id", "5");
      formData.append("precioReferencia", "14200");

      await actualizarPrecio(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { precioReferencia: 14200 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });
  });

  describe("actualizarCosto", () => {
    it("debería actualizar el costo de referencia de un producto existente para ADMIN", async () => {
      const formData = new FormData();
      formData.append("id", "5");
      formData.append("costo", "9500");

      await actualizarCosto(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { costo: 9500 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería lanzar un error si un EMPLEADO intenta actualizar el costo", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValueOnce({
        user: {
          id: "2",
          name: "Empleado",
          email: "empleado@palteria.com",
          rol: RolUsuario.EMPLEADO,
        },
      } as never);

      const formData = new FormData();
      formData.append("id", "5");
      formData.append("costo", "9500");

      await expect(actualizarCosto(formData)).rejects.toThrow("No tienes permisos para modificar costos");
      expect(prisma.producto.update).not.toHaveBeenCalled();
    });
  });

  describe("actualizarKg", () => {
    it("debería actualizar los kilogramos por caja de un producto existente", async () => {
      const formData = new FormData();
      formData.append("id", "5");
      formData.append("kgPorCaja", "10");

      await actualizarKg(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { kgPorCaja: 10 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });
  });

  describe("actualizarStock", () => {
    it("debería actualizar el stock de cajas de un producto existente", async () => {
      const formData = new FormData();
      formData.append("id", "5");
      formData.append("stockCajas", "12.5");

      await actualizarStock(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: 12.5 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });
  });

  describe("toggleProducto", () => {
    it("debería cambiar el estado de activo de un producto a inactivo y viceversa", async () => {
      const formData = new FormData();
      formData.append("id", "8");
      formData.append("activo", "true");

      await toggleProducto(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { activo: false },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });
  });

  describe("actualizarMaduracion", () => {
    it("debería actualizar la maduración a un valor en mayúsculas", async () => {
      const formData = new FormData();
      formData.append("id", "12");
      formData.append("maduracion", "semi-verde");

      await actualizarMaduracion(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { maduracion: "SEMI-VERDE" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería asignar null si la maduración enviada está vacía", async () => {
      const formData = new FormData();
      formData.append("id", "12");
      formData.append("maduracion", "   ");

      await actualizarMaduracion(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { maduracion: null },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería lanzar un error si el id de producto es inválido", async () => {
      const formData = new FormData();
      formData.append("id", "no-es-numero");
      formData.append("maduracion", "PF");

      await expect(actualizarMaduracion(formData)).rejects.toThrow("ID de producto inválido");
      expect(prisma.producto.update).not.toHaveBeenCalled();
    });
  });

  describe("togglePrioridadProducto", () => {
    it("debería cambiar prioritario de false a true", async () => {
      const formData = new FormData();
      formData.append("id", "15");
      formData.append("prioritario", "false");

      await togglePrioridadProducto(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { prioritario: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería cambiar prioritario de true a false", async () => {
      const formData = new FormData();
      formData.append("id", "15");
      formData.append("prioritario", "true");

      await togglePrioridadProducto(formData);

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { prioritario: false },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
    });

    it("debería lanzar un error si el id es inválido", async () => {
      const formData = new FormData();
      formData.append("id", "abc");
      formData.append("prioritario", "false");

      await expect(togglePrioridadProducto(formData)).rejects.toThrow("ID de producto inválido");
      expect(prisma.producto.update).not.toHaveBeenCalled();
    });
  });
});
