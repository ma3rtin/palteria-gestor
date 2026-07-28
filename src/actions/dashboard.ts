"use server";

import { prisma } from "@/lib/prisma";
import { hoyISO, parseFechaRuta } from "@/lib/utils";

export async function getStatsSemana() {
  const hoy = parseFechaRuta(hoyISO());

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const agregado = await prisma.pedido.aggregate({
    where: { fecha: { gte: lunes, lte: domingo }, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  const porProducto = await prisma.pedido.groupBy({
    by: ["idProducto"],
    where: { fecha: { gte: lunes, lte: domingo }, esCobro: false },
    _sum: { cajas: true, montoTotal: true },
    orderBy: { _sum: { cajas: "desc" } },
    take: 6,
  });

  const productos = await prisma.producto.findMany({
    where: { id: { in: porProducto.map((p) => p.idProducto) } },
    select: { id: true, nombre: true },
  });

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

  return {
    totalCajasSemana: agregado._sum.cajas ?? 0,
    totalMontoSemana: agregado._sum.montoTotal ?? 0,
    totalCobradoSemana: agregado._sum.montoPagado ?? 0,
    totalPedidosSemana: agregado._count.id,
    topProductos: porProducto.map((p) => ({
      nombre: productos.find((pr) => pr.id === p.idProducto)?.nombre ?? "?",
      cajas: p._sum.cajas ?? 0,
      monto: p._sum.montoTotal ?? 0,
    })),
    semanaLabel: `${fmt(lunes)} – ${fmt(domingo)}`,
  };
}

export async function getStatsHoy() {
  const hoy = parseFechaRuta(hoyISO());

  const pedidosHoy = await prisma.pedido.findMany({
    where: { fecha: hoy, esCobro: false },
    include: {
      cliente: { include: { zona: true } },
      producto: true,
      repartidor: true,
    },
    orderBy: [
      { creadoEn: "desc" }
    ],
  });
  const deudaAgregada = await prisma.pedido.aggregate({
    where: { estadoPago: { not: "PAGADO" }, esCobro: false },
    _sum: { montoTotal: true, montoPagado: true },
  });
  const clientesConDeudaGrupos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: { estadoPago: { not: "PAGADO" }, esCobro: false },
  });

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
  const hoy = parseFechaRuta(hoyISO());

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
