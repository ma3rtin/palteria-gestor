"use server";

import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getRepartidores() {
  return prisma.repartidor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getResumenRepartidorFecha(idRepartidor: number, fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  const pedidos = await prisma.pedido.findMany({
    where: { idRepartidor, fecha, esCobro: false },
    include: {
      cliente: { include: { zona: true } },
      producto: true,
    },
    orderBy: [{ cliente: { zona: { nombre: "asc" } } }, { cliente: { nombre: "asc" } }],
  });

  const cobros = await prisma.pedido.findMany({
    where: { idRepartidor, fecha, esCobro: true },
    include: { cliente: true },
  });

  return {
    pedidos,
    cobros,
    totalCajas: pedidos.reduce((s, p) => s + p.cajas, 0),
    totalMonto: pedidos.reduce((s, p) => s + p.montoTotal, 0),
    totalCobrado: pedidos.reduce((s, p) => s + p.montoPagado, 0) +
      cobros.reduce((s, c) => s + c.montoPagado, 0),
  };
}

export async function getResumenTodosRepartidoresHoy() {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const repartidores = await prisma.repartidor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  const grupos = await prisma.pedido.groupBy({
    by: ["idRepartidor"],
    where: { fecha: hoy },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });

  const mapaGrupos = new Map(grupos.map((g) => [g.idRepartidor, g]));

  return repartidores.map((r) => {
    const g = mapaGrupos.get(r.id);
    return {
      repartidor: r,
      cantPedidos: g?._count.id ?? 0,
      totalCajas: g?._sum.cajas ?? 0,
      totalMonto: g?._sum.montoTotal ?? 0,
      totalCobrado: g?._sum.montoPagado ?? 0,
    };
  });
}
