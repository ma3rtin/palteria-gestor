"use server";

import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getResumenPeriodo(desde: string, hasta: string) {
  const fechaDesde = parseFechaRuta(desde);
  const fechaHasta = parseFechaRuta(hasta);

  const agregado = await prisma.pedido.aggregate({
    where: { fecha: { gte: fechaDesde, lte: fechaHasta }, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  const porProducto = await prisma.pedido.groupBy({
    by: ["idProducto"],
    where: { fecha: { gte: fechaDesde, lte: fechaHasta }, esCobro: false },
    _sum: { cajas: true, montoTotal: true },
    orderBy: { _sum: { cajas: "desc" } },
    take: 8,
  });
  const porRepartidor = await prisma.pedido.groupBy({
    by: ["idRepartidor"],
    where: { fecha: { gte: fechaDesde, lte: fechaHasta }, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  const porFormaPago = await prisma.pedido.groupBy({
    by: ["formaPago"],
    where: { fecha: { gte: fechaDesde, lte: fechaHasta }, esCobro: false },
    _sum: { montoTotal: true },
    _count: { id: true },
  });

  const productos = await prisma.producto.findMany({
    where: { id: { in: porProducto.map((p) => p.idProducto) } },
    select: { id: true, nombre: true },
  });
  const repartidores = await prisma.repartidor.findMany({
    where: {
      id: { in: porRepartidor.map((g) => g.idRepartidor!).filter(Boolean) },
    },
    select: { id: true, nombre: true },
  });

  const totalFacturado = agregado._sum.montoTotal ?? 0;
  const totalCobrado = agregado._sum.montoPagado ?? 0;

  return {
    totalPedidos: agregado._count.id,
    totalCajas: agregado._sum.cajas ?? 0,
    totalFacturado,
    totalCobrado,
    pendiente: totalFacturado - totalCobrado,
    topProductos: porProducto.map((p) => ({
      nombre: productos.find((pr) => pr.id === p.idProducto)?.nombre ?? "?",
      cajas: p._sum.cajas ?? 0,
      monto: p._sum.montoTotal ?? 0,
    })),
    porRepartidor: porRepartidor
      .map((g) => ({
        repartidor: g.idRepartidor
          ? (repartidores.find((r) => r.id === g.idRepartidor) ?? null)
          : null,
        cajas: g._sum.cajas ?? 0,
        monto: g._sum.montoTotal ?? 0,
        cobrado: g._sum.montoPagado ?? 0,
        pedidos: g._count.id,
      }))
      .sort((a, b) => b.cajas - a.cajas),
    porFormaPago: porFormaPago
      .map((g) => ({
        formaPago: g.formaPago,
        monto: g._sum.montoTotal ?? 0,
        pedidos: g._count.id,
      }))
      .sort((a, b) => b.monto - a.monto),
  };
}
