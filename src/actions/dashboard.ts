"use server";

import { prisma } from "@/lib/prisma";

export async function getStatsHoy() {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const [pedidosHoy, deudaAgregada, clientesConDeudaGrupos] = await Promise.all([
    prisma.pedido.findMany({
      where: { fecha: hoy, esCobro: false },
      include: {
        cliente: { include: { zona: true } },
        producto: true,
        repartidor: true,
      },
      orderBy: [{ cliente: { zona: { nombre: "asc" } } }, { cliente: { nombre: "asc" } }],
    }),
    prisma.pedido.aggregate({
      where: { estadoPago: { not: "PAGADO" }, esCobro: false },
      _sum: { montoTotal: true, montoPagado: true },
    }),
    prisma.pedido.groupBy({
      by: ["idCliente"],
      where: { estadoPago: { not: "PAGADO" }, esCobro: false },
    }),
  ]);

  const totalCajas = pedidosHoy.reduce((s, p) => s + p.cajas, 0);
  const totalMonto = pedidosHoy.reduce((s, p) => s + p.montoTotal, 0);
  const totalCobrado = pedidosHoy.reduce((s, p) => s + p.montoPagado, 0);
  const pedidosPendientes = pedidosHoy.filter((p) => p.estadoPago !== "PAGADO").length;
  const montoDeuda =
    (deudaAgregada._sum.montoTotal ?? 0) - (deudaAgregada._sum.montoPagado ?? 0);

  return {
    totalPedidosHoy: pedidosHoy.length,
    totalCajasHoy: totalCajas,
    totalMontoHoy: totalMonto,
    totalCobradoHoy: totalCobrado,
    pedidosPendientesHoy: pedidosPendientes,
    clientesConDeuda: clientesConDeudaGrupos.length,
    montoTotalDeuda: montoDeuda,
    pedidosHoy,
  };
}

export async function getResumenPorRepartidorHoy() {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const grupos = await prisma.pedido.groupBy({
    by: ["idRepartidor"],
    where: { fecha: hoy, esCobro: false, idRepartidor: { not: null } },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });

  const repartidores = await prisma.repartidor.findMany({
    where: { id: { in: grupos.map((g) => g.idRepartidor!).filter(Boolean) } },
  });

  return grupos.map((g) => ({
    repartidor: repartidores.find((r) => r.id === g.idRepartidor) ?? null,
    totalCajas: g._sum.cajas ?? 0,
    totalMonto: g._sum.montoTotal ?? 0,
    totalCobrado: g._sum.montoPagado ?? 0,
    cantPedidos: g._count.id,
  }));
}
