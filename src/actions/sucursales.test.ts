import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getSucursales,
  getEnviosSucursalesPorFecha,
  crearEnvioSucursal,
  eliminarEnvioSucursal,
  actualizarEnvioSucursal,
} from "./sucursales";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Mock de auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "1",
      name: "Admin",
      email: "admin@palteria.com",
      rol: "ADMIN",
    },
  }),
}));

// Mock de prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    sucursal: {
      findMany: vi.fn(),
    },
    envioSucursal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemEnvioSucursal: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    producto: {
      update: vi.fn(),
    },
  },
}));

// Mock de next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Server Actions - Sucursales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSucursales", () => {
    it("debería listar sucursales activas ordenadas por nombre", async () => {
      const mockData = [
        { id: 2, nombre: "PALTERIA CASTELAR", activo: true },
        { id: 1, nombre: "PALTERIA HAEDO", activo: true },
      ];
      vi.mocked(prisma.sucursal.findMany).mockResolvedValue(mockData as any);

      const res = await getSucursales();
      expect(prisma.sucursal.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      });
      expect(res).toEqual(mockData);
    });
  });

  describe("getEnviosSucursalesPorFecha", () => {
    it("debería consultar envíos filtrando por fecha e incluyendo relaciones", async () => {
      vi.mocked(prisma.envioSucursal.findMany).mockResolvedValue([]);

      await getEnviosSucursalesPorFecha("2026-10-01");
      expect(prisma.envioSucursal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { fecha: expect.any(Date) },
          include: {
            sucursal: true,
            repartidor: true,
            usuario: { select: { id: true, nombre: true } },
            items: {
              include: {
                producto: true,
              },
            },
          },
        })
      );
    });
  });

  describe("crearEnvioSucursal", () => {
    it("debería lanzar error si falta la fecha", async () => {
      const fd = new FormData();
      fd.append("idSucursal", "1");
      await expect(crearEnvioSucursal(fd)).rejects.toThrow("La fecha del envío es requerida.");
    });

    it("debería lanzar error si la sucursal es inválida", async () => {
      const fd = new FormData();
      fd.append("fecha", "2026-10-01");
      fd.append("idSucursal", "0");
      await expect(crearEnvioSucursal(fd)).rejects.toThrow("Debe seleccionar una sucursal válida.");
    });

    it("debería lanzar error si no tiene productos", async () => {
      const fd = new FormData();
      fd.append("fecha", "2026-10-01");
      fd.append("idSucursal", "1");
      fd.append("itemsJson", "[]");
      await expect(crearEnvioSucursal(fd)).rejects.toThrow("Debe agregar al menos un producto al envío.");
    });

    it("debería crear el envío, descontar stock de cada producto y redirigir", async () => {
      const fd = new FormData();
      fd.append("fecha", "2026-10-01");
      fd.append("idSucursal", "1");
      fd.append("idRepartidor", "3");
      fd.append("observaciones", "Envío matutino");
      fd.append(
        "itemsJson",
        JSON.stringify([
          { idProducto: 10, cajas: 15, maduracion: "SEMI" },
          { idProducto: 11, cajas: 5, maduracion: "VERDE" },
        ])
      );

      vi.mocked(prisma.envioSucursal.create).mockResolvedValue({ id: 99 } as any);
      vi.mocked(prisma.producto.update).mockResolvedValue({} as any);

      await crearEnvioSucursal(fd);

      // Verificamos creación de envío
      expect(prisma.envioSucursal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            idSucursal: 1,
            idRepartidor: 3,
            cajas: 20,
            observaciones: "Envío matutino",
            items: {
              create: [
                { idProducto: 10, cajas: 15, maduracion: "SEMI" },
                { idProducto: 11, cajas: 5, maduracion: "VERDE" },
              ],
            },
          }),
        })
      );

      // Verificamos descuento de stock
      expect(prisma.producto.update).toHaveBeenCalledTimes(2);
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stockCajas: { decrement: 15 } },
      });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: { stockCajas: { decrement: 5 } },
      });

      // Verificamos revalidaciones y redirección
      expect(revalidatePath).toHaveBeenCalledWith("/pedidos/2026-10-01");
      expect(revalidatePath).toHaveBeenCalledWith("/productos");
      expect(redirect).toHaveBeenCalledWith("/pedidos/2026-10-01?vista=palterias");
    });
  });

  describe("eliminarEnvioSucursal", () => {
    it("debería lanzar error si el ID es inválido", async () => {
      await expect(eliminarEnvioSucursal(0, "2026-10-01")).rejects.toThrow("ID de envío a sucursal inválido.");
    });

    it("debería lanzar error si el envío no existe", async () => {
      vi.mocked(prisma.envioSucursal.findUnique).mockResolvedValue(null);
      await expect(eliminarEnvioSucursal(1, "2026-10-01")).rejects.toThrow("El envío a sucursal no existe o ya fue eliminado.");
    });

    it("debería reintegrar stock y eliminar el envío", async () => {
      vi.mocked(prisma.envioSucursal.findUnique).mockResolvedValue({
        id: 50,
        items: [
          { idProducto: 10, cajas: 12 },
          { idProducto: 11, cajas: 8 },
        ],
      } as any);
      vi.mocked(prisma.producto.update).mockResolvedValue({} as any);
      vi.mocked(prisma.envioSucursal.delete).mockResolvedValue({} as any);

      await eliminarEnvioSucursal(50, "2026-10-01");

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stockCajas: { increment: 12 } },
      });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: { stockCajas: { increment: 8 } },
      });
      expect(prisma.envioSucursal.delete).toHaveBeenCalledWith({
        where: { id: 50 },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/pedidos/2026-10-01");
    });
  });

  describe("actualizarEnvioSucursal", () => {
    it("debería lanzar error si el ID es inválido", async () => {
      const fd = new FormData();
      await expect(actualizarEnvioSucursal(0, fd)).rejects.toThrow("ID de envío a sucursal inválido.");
    });

    it("debería revertir stock anterior, recrear items con nuevo stock y actualizar envío", async () => {
      const fd = new FormData();
      fd.append("fecha", "2026-10-01");
      fd.append("idSucursal", "2");
      fd.append("idRepartidor", "4");
      fd.append("observaciones", "Ajuste de tarde");
      fd.append(
        "itemsJson",
        JSON.stringify([
          { idProducto: 10, cajas: 10, maduracion: "PF" },
        ])
      );

      vi.mocked(prisma.envioSucursal.findUnique).mockResolvedValue({
        id: 50,
        items: [
          { idProducto: 10, cajas: 5 },
          { idProducto: 12, cajas: 3 },
        ],
      } as any);
      vi.mocked(prisma.producto.update).mockResolvedValue({} as any);
      vi.mocked(prisma.itemEnvioSucursal.deleteMany).mockResolvedValue({} as any);
      vi.mocked(prisma.itemEnvioSucursal.create).mockResolvedValue({} as any);
      vi.mocked(prisma.envioSucursal.update).mockResolvedValue({} as any);

      await actualizarEnvioSucursal(50, fd);

      // Verificamos reintegro de stock anterior
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stockCajas: { increment: 5 } },
      });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { stockCajas: { increment: 3 } },
      });

      // Verificamos eliminación de items anteriores
      expect(prisma.itemEnvioSucursal.deleteMany).toHaveBeenCalledWith({
        where: { idEnvio: 50 },
      });

      // Verificamos creación de nuevo item y descuento de stock
      expect(prisma.itemEnvioSucursal.create).toHaveBeenCalledWith({
        data: {
          idEnvio: 50,
          idProducto: 10,
          cajas: 10,
          maduracion: "PF",
        },
      });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stockCajas: { decrement: 10 } },
      });

      // Verificamos actualización de envio
      expect(prisma.envioSucursal.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: {
          idSucursal: 2,
          idRepartidor: 4,
          cajas: 10,
          observaciones: "Ajuste de tarde",
        },
      });

      expect(redirect).toHaveBeenCalledWith("/pedidos/2026-10-01?vista=palterias");
    });
  });
});
