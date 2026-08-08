import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  crearPedido,
  actualizarPedido,
  eliminarPedido,
  marcarPagado,
} from "./pedidos";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Mock de prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      pedido: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      producto: {
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

// Mock de next/navigation
vi.mock("next/navigation", () => {
  return {
    redirect: vi.fn(),
  };
});

describe("Server Actions - Pedidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("crearPedido", () => {
    it("debería crear un pedido común (esCobro = false), descontar stock y revalidar rutas", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("idProducto", "5");
      formData.append("maduracion", "pf");
      formData.append("cajas", "20");
      formData.append("montoTotal", "50000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("comisionRevendedor", "500");
      formData.append("idRepartidor", "1");

      await crearPedido(formData);

      expect(prisma.pedido.create).toHaveBeenCalledWith({
        data: {
          fecha: new Date("2026-07-31T12:00:00"),
          idCliente: 10,
          idProducto: 5,
          maduracion: "PF",
          cajas: 20,
          montoTotal: 50000,
          formaPago: "EFECTIVO",
          estadoPago: "PENDIENTE",
          montoPagado: 0,
          idRepartidor: 1,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: false,
          esReposicion: false,
          comisionRevendedor: 500,
          observaciones: null,
          pagosParciales: undefined,
        },
      });

      // Debe descontar stock de cajas del producto
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { decrement: 20 } },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/pedidos/2026-07-31");
      expect(redirect).toHaveBeenCalledWith("/pedidos/2026-07-31");
    });

    it("debería crear una cobranza (esCobro = true) con estado PAGADO, sin descontar stock", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("idProducto", "5");
      formData.append("maduracion", "pf");
      formData.append("cajas", "0");
      formData.append("montoTotal", "30000");
      formData.append("formaPago", "TRANSFERENCIA");
      formData.append("esCobro", "on");

      await crearPedido(formData);

      expect(prisma.pedido.create).toHaveBeenCalledWith({
        data: {
          fecha: new Date("2026-07-31T12:00:00"),
          idCliente: 10,
          idProducto: 5,
          maduracion: "PF",
          cajas: 0,
          montoTotal: 30000,
          formaPago: "TRANSFERENCIA",
          estadoPago: "PAGADO",
          montoPagado: 30000,
          idRepartidor: null,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: true,
          esReposicion: false,
          comisionRevendedor: 0,
          observaciones: null,
          pagosParciales: [
            {
              monto: 30000,
              formaPago: "TRANSFERENCIA",
              fecha: "2026-07-31",
            },
          ],
        },
      });

      // NO debe descontar stock del producto
      expect(prisma.producto.update).not.toHaveBeenCalled();
    });
  });

  describe("actualizarPedido", () => {
    it("debería actualizar un pedido común a cobranza, devolviendo el stock original del pedido", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        cajas: 15,
        esCobro: false,
        estadoFactura: "NO_REQUIERE",
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("montoTotal", "25000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("estadoPago", "PAGADO");
      formData.append("montoPagado", "25000");
      formData.append("esCobro", "on");

      await actualizarPedido(100, formData);

      // Transición Pedido -> Cobranza: Devolver stock anterior
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { increment: 15 } },
      });

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          cajas: 0,
          montoTotal: 25000,
          formaPago: "EFECTIVO",
          estadoPago: "PAGADO",
          montoPagado: 25000,
          repartidor: { disconnect: true },
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: true,
          comisionRevendedor: 0,
          observaciones: null,
          pagosParciales: null,
        },
      });
    });

    it("debería actualizar una cobranza a pedido común, restando el nuevo stock", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        cajas: 0,
        esCobro: true,
        estadoFactura: "NO_REQUIERE",
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("cajas", "10");
      formData.append("montoTotal", "40000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("estadoPago", "PENDIENTE");
      formData.append("montoPagado", "0");

      await actualizarPedido(100, formData);

      // Transición Cobranza -> Pedido: Descontar stock
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { decrement: 10 } },
      });
    });
  });

  describe("eliminarPedido", () => {
    it("debería eliminar un pedido normal y devolver su stock", async () => {
      const pedidoMock = {
        id: 100,
        idProducto: 5,
        cajas: 12,
        esCobro: false,
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      await eliminarPedido(100, "2026-07-31");

      expect(prisma.pedido.delete).toHaveBeenCalledWith({ where: { id: 100 } });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { increment: 12 } },
      });
    });

    it("debería eliminar una cobranza sin afectar el stock de producto", async () => {
      const pedidoMock = {
        id: 100,
        idProducto: 5,
        cajas: 0,
        esCobro: true,
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      await eliminarPedido(100, "2026-07-31");

      expect(prisma.pedido.delete).toHaveBeenCalledWith({ where: { id: 100 } });
      expect(prisma.producto.update).not.toHaveBeenCalled();
    });
  });

  describe("marcarPagado", () => {
    it("debería marcar un pedido como PAGADO con su total y revalidar", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        montoTotal: 18000,
        montoPagado: 0,
        formaPago: "EFECTIVO",
        fecha: new Date("2026-07-31T12:00:00"),
        pagosParciales: null,
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      await marcarPagado(100);

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { 
          estadoPago: "PAGADO", 
          montoPagado: 18000,
          pagosParciales: [
            {
              monto: 18000,
              formaPago: "EFECTIVO",
              fecha: new Date().toLocaleDateString("sv-SE"),
            },
          ],
        },
      });
    });
  });
});
