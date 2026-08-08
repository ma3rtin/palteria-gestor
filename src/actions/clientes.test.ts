import { vi, describe, it, expect, beforeEach } from "vitest";
import { getClientesConSaldoPaginado } from "./clientes";
import { prisma } from "@/lib/prisma";

// Mock de Prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      cliente: {
        findMany: vi.fn(),
      },
      pedido: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

// Mock de utilidades de fechas
vi.mock("@/lib/utils", () => {
  return {
    hoyISO: () => "2026-08-08",
    parseFechaRuta: (f: string) => new Date(f + "T12:00:00"),
  };
});

describe("Server Actions - Clientes Indicadores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería retornar indicadores de volumen, tendencia e inactividad correctamente", async () => {
    const mockClientes = [
      {
        id: 1,
        nombre: "PANERA ALMAGRO",
        creadoEn: new Date("2026-06-01T12:00:00"),
      },
      {
        id: 2,
        nombre: "CAFÉ CAVIA",
        creadoEn: new Date("2026-08-01T12:00:00"),
      },
    ];

    // Mock findMany de cliente
    vi.mocked(prisma.cliente.findMany).mockResolvedValue(mockClientes as any);

    // Mock groupBy de saldos (sin deuda)
    vi.mocked(prisma.pedido.groupBy).mockResolvedValue([]);

    // Mock de pedidos recientes (últimos 28 días, es decir del 2026-07-11 al 2026-08-08)
    const mockPedidosRecientes = [
      // Cliente 1 (PANERA ALMAGRO)
      { idCliente: 1, fecha: new Date("2026-08-07T12:00:00"), cajas: 15, esCobro: false }, // Periodo A (Últimos 14 días: 2026-07-25 a 2026-08-08)
      { idCliente: 1, fecha: new Date("2026-07-20T12:00:00"), cajas: 5, esCobro: false },  // Periodo B (14 días anteriores: 2026-07-11 a 2026-07-24)
      // Cliente 2 (CAFÉ CAVIA) - Solo cobro, no cajas
      { idCliente: 2, fecha: new Date("2026-08-06T12:00:00"), cajas: 0, esCobro: true },
    ];

    vi.mocked(prisma.pedido.findMany).mockResolvedValue(mockPedidosRecientes as any);

    const result = await getClientesConSaldoPaginado(0, 10, undefined, undefined, undefined, "activos", undefined);

    expect(result.clientes).toHaveLength(2);

    // PANERA ALMAGRO
    const cliente1 = result.clientes.find((c) => c.id === 1);
    expect(cliente1).toBeDefined();
    // Cajas totales en 28 días: 15 + 5 = 20. Semanas transcurridas desde creación: > 4, divisor: 4.
    // Promedio semanal = 20 / 4 = 5 cajas/semana. Rango = "0-10".
    expect(cliente1?.rangoVolumen).toBe("0-10");
    // Periodo A (15 cajas) - Periodo B (5 cajas) = 10 cajas.
    expect(cliente1?.tendenciaCajas).toBe(10);
    // Última actividad: 2026-08-07.
    expect(cliente1?.ultimoPedido).toBe("2026-08-07");
    // Días inactivo desde 2026-08-07 a 2026-08-08 = 1 día (< 14 días, por eso está en activos).
    expect(cliente1?.diasInactivo).toBe(1);

    // CAFÉ CAVIA
    const cliente2 = result.clientes.find((c) => c.id === 2);
    expect(cliente2).toBeDefined();
    expect(cliente2?.rangoVolumen).toBe("0-10");
    expect(cliente2?.ultimoPedido).toBe("2026-08-06");
    // Creado el 2026-08-01, última actividad el 2026-08-06. Inactividad = 2 días.
    expect(cliente2?.diasInactivo).toBe(2);
  });

  it("debería filtrar clientes inactivos (diasInactivo >= 14) al usar tab='inactivos'", async () => {
    const mockClientes = [
      {
        id: 1,
        nombre: "CLIENTE INACTIVO",
        creadoEn: new Date("2026-05-01T12:00:00"),
      },
      {
        id: 2,
        nombre: "CLIENTE ACTIVO",
        creadoEn: new Date("2026-05-01T12:00:00"),
      },
    ];

    vi.mocked(prisma.cliente.findMany).mockResolvedValue(mockClientes as any);
    vi.mocked(prisma.pedido.groupBy).mockResolvedValue([]);

    const mockPedidos = [
      // Cliente 2 tuvo pedido hace 5 días
      { idCliente: 2, fecha: new Date("2026-08-03T12:00:00"), cajas: 10, esCobro: false },
      // Cliente 1 tuvo pedido hace 20 días
      { idCliente: 1, fecha: new Date("2026-07-19T12:00:00"), cajas: 10, esCobro: false },
    ];
    vi.mocked(prisma.pedido.findMany).mockResolvedValue(mockPedidos as any);

    // Consultamos la pestaña inactivos
    const result = await getClientesConSaldoPaginado(0, 10, undefined, undefined, undefined, "inactivos", undefined);

    expect(result.clientes).toHaveLength(1);
    expect(result.clientes[0].id).toBe(1); // CLIENTE INACTIVO
    expect(result.clientes[0].diasInactivo).toBe(20);
  });

  it("debería filtrar clientes por volumen semanal correctamente", async () => {
    const mockClientes = [
      {
        id: 1,
        nombre: "CLIENTE CHICO", // 5 cjs/sem
        creadoEn: new Date("2026-05-01T12:00:00"),
      },
      {
        id: 2,
        nombre: "CLIENTE GRANDE", // 25 cjs/sem
        creadoEn: new Date("2026-05-01T12:00:00"),
      },
    ];

    vi.mocked(prisma.cliente.findMany).mockResolvedValue(mockClientes as any);
    vi.mocked(prisma.pedido.groupBy).mockResolvedValue([]);

    const mockPedidos = [
      // Cliente 1 compró 20 cajas totales en 28 días (20 / 4 = 5 cjs/sem) -> Rango 0-10
      { idCliente: 1, fecha: new Date("2026-08-01T12:00:00"), cajas: 20, esCobro: false },
      // Cliente 2 compró 100 cajas totales en 28 días (100 / 4 = 25 cjs/sem) -> Rango 20-30
      { idCliente: 2, fecha: new Date("2026-08-01T12:00:00"), cajas: 100, esCobro: false },
    ];
    vi.mocked(prisma.pedido.findMany).mockResolvedValue(mockPedidos as any);

    // Filtramos por volumen "20-30"
    const result = await getClientesConSaldoPaginado(0, 10, undefined, undefined, undefined, "activos", "20-30");

    expect(result.clientes).toHaveLength(1);
    expect(result.clientes[0].id).toBe(2);
    expect(result.clientes[0].rangoVolumen).toBe("20-30");
  });
});
