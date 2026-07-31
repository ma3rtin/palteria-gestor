import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  crearProducto,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
} from "./productos";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    it("debería actualizar el costo de referencia de un producto existente", async () => {
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
});
