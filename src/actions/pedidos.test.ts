import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  crearPedido,
  actualizarPedido,
  eliminarPedido,
  marcarPagado,
  actualizarEstadoFactura,
  registrarCobro,
} from "./pedidos";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      pedido: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      producto: {
        update: vi.fn(),
      },
      itemPedido: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
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
          idUsuario: 1,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: false,
          esReposicion: false,
          comisionRevendedor: 500,
          observaciones: null,
          pagosParciales: undefined,
          items: {
            create: [
              {
                idProducto: 5,
                cajas: 20,
                maduracion: "PF",
                precioUnitario: undefined,
                subtotal: 50000,
              },
            ],
          },
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

    it("debería aplicar descuento por efectivo con monto por caja personalizado si se especifica", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("idProducto", "5");
      formData.append("maduracion", "PF");
      formData.append("cajas", "3");
      formData.append("montoTotal", "75000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("descuentoEfectivo", "on");
      formData.append("descuentoPorCaja", "5000");

      await crearPedido(formData);

      // 3 cajas * $5.000 = $15.000
      expect(prisma.pedido.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            observaciones: "[Desc. efectivo: -$15.000]",
          }),
        })
      );
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
          idProducto: null,
          maduracion: null,
          cajas: 0,
          montoTotal: 30000,
          formaPago: "TRANSFERENCIA",
          estadoPago: "PAGADO",
          montoPagado: 30000,
          idRepartidor: null,
          idUsuario: 1,
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

    it("debería crear una cobranza pura sin producto ni cajas ni maduración con estado PAGADO", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("montoTotal", "45000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("esCobro", "on");

      await crearPedido(formData);

      expect(prisma.pedido.create).toHaveBeenCalledWith({
        data: {
          fecha: new Date("2026-07-31T12:00:00"),
          idCliente: 10,
          idProducto: null,
          maduracion: null,
          cajas: 0,
          montoTotal: 45000,
          formaPago: "EFECTIVO",
          estadoPago: "PAGADO",
          montoPagado: 45000,
          idRepartidor: null,
          idUsuario: 1,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: true,
          esReposicion: false,
          comisionRevendedor: 0,
          observaciones: null,
          pagosParciales: [
            {
              monto: 45000,
              formaPago: "EFECTIVO",
              fecha: "2026-07-31",
            },
          ],
        },
      });

      expect(prisma.producto.update).not.toHaveBeenCalled();
    });

    it("debería crear una cobranza con estado PENDIENTE cuando se especifica estadoCobro = PENDIENTE", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("montoTotal", "60000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("esCobro", "on");
      formData.append("estadoCobro", "PENDIENTE");

      await crearPedido(formData);

      expect(prisma.pedido.create).toHaveBeenCalledWith({
        data: {
          fecha: new Date("2026-07-31T12:00:00"),
          idCliente: 10,
          idProducto: null,
          maduracion: null,
          cajas: 0,
          montoTotal: 60000,
          formaPago: "EFECTIVO",
          estadoPago: "PENDIENTE",
          montoPagado: 0,
          idRepartidor: null,
          idUsuario: 1,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: true,
          esReposicion: false,
          comisionRevendedor: 0,
          observaciones: null,
          pagosParciales: undefined,
        },
      });

      expect(prisma.producto.update).not.toHaveBeenCalled();
    });

    it("debería crear un pedido con múltiples productos y descontar el stock de cada uno", async () => {
      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idCliente", "10");
      formData.append("montoTotal", "75000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("itemsJson", JSON.stringify([
        { idProducto: 5, cajas: 2, maduracion: "SEMI", subtotal: 50000 },
        { idProducto: 8, cajas: 1, maduracion: "VERDE", subtotal: 25000 },
      ]));

      await crearPedido(formData);

      expect(prisma.pedido.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cajas: 3,
            idProducto: 5,
            maduracion: "2 SEMI + 1 VERDE",
            montoTotal: 75000,
            items: {
              create: [
                { idProducto: 5, cajas: 2, maduracion: "SEMI", precioUnitario: undefined, subtotal: 50000 },
                { idProducto: 8, cajas: 1, maduracion: "VERDE", precioUnitario: undefined, subtotal: 25000 },
              ],
            },
          }),
        })
      );

      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { decrement: 2 } },
      });
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { stockCajas: { decrement: 1 } },
      });
    });
  });

  describe("actualizarPedido", () => {
    it("debería actualizar un pedido común a cobranza, devolviendo el stock original del pedido", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        maduracion: "PF",
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
          idProducto: null,
          maduracion: null,
          cajas: 0,
          montoTotal: 25000,
          formaPago: "EFECTIVO",
          estadoPago: "PAGADO",
          montoPagado: 25000,
          idRepartidor: null,
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
        idProducto: null,
        maduracion: null,
        cajas: 0,
        esCobro: true,
        estadoFactura: "NO_REQUIERE",
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idProducto", "5");
      formData.append("maduracion", "PF");
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

    it("debería actualizar un pedido cambiando el producto, reintegrando al viejo y descontando al nuevo", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        maduracion: "PF",
        cajas: 8,
        esCobro: false,
        estadoFactura: "NO_REQUIERE",
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idProducto", "8");
      formData.append("maduracion", "VERDE");
      formData.append("cajas", "12");
      formData.append("montoTotal", "60000");
      formData.append("formaPago", "TRANSFERENCIA");
      formData.append("estadoPago", "PENDIENTE");
      formData.append("montoPagado", "0");

      await actualizarPedido(100, formData);

      // Reintegrar al producto 5
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockCajas: { increment: 8 } },
      });
      // Descontar del nuevo producto 8
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { stockCajas: { decrement: 12 } },
      });

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          idProducto: 8,
          maduracion: "VERDE",
          cajas: 12,
          montoTotal: 60000,
          formaPago: "TRANSFERENCIA",
          estadoPago: "PENDIENTE",
          montoPagado: 0,
          idRepartidor: null,
          requiereFactura: false,
          estadoFactura: "NO_REQUIERE",
          esCobro: false,
          comisionRevendedor: 0,
          observaciones: null,
          pagosParciales: null,
        },
      });
    });

    it("debería actualizar nota de descuento por efectivo al editar pedido con descuentoPorCaja", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        maduracion: "PF",
        cajas: 2,
        esCobro: false,
        estadoFactura: "NO_REQUIERE",
        observaciones: "[Desc. efectivo: -$12.000]",
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idProducto", "5");
      formData.append("maduracion", "PF");
      formData.append("cajas", "2");
      formData.append("montoTotal", "86000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("descuentoEfectivo", "on");
      formData.append("descuentoPorCaja", "7000");

      await actualizarPedido(100, formData);

      // 2 cajas * $7.000 = $14.000
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({
          observaciones: "[Desc. efectivo: -$14.000]",
        }),
      });
    });

    it("debería actualizar un pedido con PAGO_SEMANAL asignándole repartidor aunque formaPago no esté en formData", async () => {
      const pedidoMock = {
        id: 100,
        idCliente: 10,
        idProducto: 5,
        maduracion: "PF",
        cajas: 2,
        formaPago: "PAGO_SEMANAL",
        estadoPago: "PENDIENTE",
        montoTotal: 60000,
        montoPagado: 0,
        idRepartidor: null,
        esCobro: false,
        estadoFactura: "NO_REQUIERE",
        observaciones: null,
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("fecha", "2026-07-31");
      formData.append("idProducto", "5");
      formData.append("maduracion", "PF");
      formData.append("cajas", "2");
      formData.append("montoTotal", "60000");
      // formaPago omitido a propósito
      formData.append("idRepartidor", "1");

      await actualizarPedido(100, formData);

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({
          idRepartidor: 1,
          formaPago: "PAGO_SEMANAL",
        }),
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
        fecha: new Date("2026-07-31T12:00:00"),
        formaPago: "EFECTIVO",
        montoTotal: 18000,
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
              fecha: "2026-07-31",
            },
          ],
        },
      });
    });
  });

  describe("registrarCobro", () => {
    it("debería registrar cobro en efectivo aplicando descuento de $6.000 por caja", async () => {
      const pedidoMock = {
        id: 100,
        cajas: 2,
        montoTotal: 100000,
        montoPagado: 0,
        observaciones: null,
        pagosParciales: null,
        fecha: new Date("2026-07-31T12:00:00Z"),
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("monto", "88000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("aplicarDescuentoEfectivo", "on");

      await registrarCobro(100, formData);

      // Descuento: 2 cajas * $6.000 = $12.000 -> nuevo total: $88.000
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          montoTotal: 88000,
          montoPagado: 88000,
          estadoPago: "PAGADO",
          observaciones: "[Desc. efectivo: -$12.000]",
          pagosParciales: [
            {
              monto: 88000,
              formaPago: "EFECTIVO",
              fecha: expect.any(String),
            },
          ],
        },
      });
    });

    it("debería registrar cobro con descuento por caja personalizado", async () => {
      const pedidoMock = {
        id: 100,
        montoTotal: 100000,
        montoPagado: 0,
        cajas: 3,
        formaPago: "EFECTIVO",
        observaciones: null,
        pagosParciales: null,
        fecha: new Date("2026-07-31T12:00:00Z"),
      };
      vi.mocked(prisma.pedido.findUniqueOrThrow).mockResolvedValue(pedidoMock as never);

      const formData = new FormData();
      formData.append("monto", "85000");
      formData.append("formaPago", "EFECTIVO");
      formData.append("aplicarDescuentoEfectivo", "on");
      formData.append("descuentoPorCaja", "5000");

      await registrarCobro(100, formData);

      // Descuento: 3 cajas * $5.000 = $15.000 -> nuevo total: $85.000
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({
          montoTotal: 85000,
          montoPagado: 85000,
          estadoPago: "PAGADO",
          observaciones: "[Desc. efectivo: -$15.000]",
        }),
      });
    });
  });

  describe("actualizarEstadoFactura", () => {
    it("debería actualizar estadoFactura a PENDIENTE y sincronizar requiereFactura a true", async () => {
      vi.mocked(prisma.pedido.update).mockResolvedValue({
        id: 100,
        fecha: new Date("2026-07-31T12:00:00Z"),
      } as never);

      await actualizarEstadoFactura(100, "PENDIENTE");

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          estadoFactura: "PENDIENTE",
          requiereFactura: true,
        },
        select: { fecha: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/pedidos/2026-07-31");
    });

    it("debería actualizar estadoFactura a NO_REQUIERE y sincronizar requiereFactura a false", async () => {
      vi.mocked(prisma.pedido.update).mockResolvedValue({
        id: 100,
        fecha: new Date("2026-07-31T12:00:00Z"),
      } as never);

      await actualizarEstadoFactura(100, "NO_REQUIERE");

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          estadoFactura: "NO_REQUIERE",
          requiereFactura: false,
        },
        select: { fecha: true },
      });
    });
  });
});
