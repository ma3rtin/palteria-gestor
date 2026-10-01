"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta, hoyISO } from "@/lib/utils";

export async function getRepartidores() {
  return prisma.repartidor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getResumenRepartidorFecha(idRepartidor: number, fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  const [pedidos, cobros, enviosSucursales] = await Promise.all([
    prisma.pedido.findMany({
      where: { idRepartidor, fecha, esCobro: false },
      include: {
        cliente: { include: { zona: true } },
        producto: true,
      },
      orderBy: [{ cliente: { zona: { nombre: "asc" } } }, { cliente: { nombre: "asc" } }],
    }),
    prisma.pedido.findMany({
      where: { idRepartidor, fecha, esCobro: true },
      include: { cliente: true },
    }),
    prisma.envioSucursal.findMany({
      where: { idRepartidor, fecha },
      include: {
        sucursal: true,
        items: { include: { producto: true } },
      },
      orderBy: { creadoEn: "desc" },
    }),
  ]);

  const cajasPedidos = pedidos.reduce((s, p) => s + p.cajas, 0);
  const cajasSucursales = enviosSucursales.reduce((s, e) => s + e.cajas, 0);

  return {
    pedidos,
    cobros,
    enviosSucursales,
    totalCajas: cajasPedidos + cajasSucursales,
    totalMonto: pedidos.reduce((s, p) => s + p.montoTotal, 0),
    totalCobrado: pedidos.reduce((s, p) => s + p.montoPagado, 0) +
      cobros.reduce((s, c) => s + c.montoPagado, 0),
  };
}

export async function getResumenTodosRepartidoresHoy() {
  const hoy = parseFechaRuta(hoyISO());

  const [repartidores, grupos, gruposSucursales] = await Promise.all([
    prisma.repartidor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.pedido.groupBy({
      by: ["idRepartidor"],
      where: { fecha: hoy },
      _sum: { cajas: true, montoTotal: true, montoPagado: true },
      _count: { id: true },
    }),
    prisma.envioSucursal.groupBy({
      by: ["idRepartidor"],
      where: { fecha: hoy },
      _sum: { cajas: true },
      _count: { id: true },
    }),
  ]);

  const mapaGrupos = new Map(grupos.map((g) => [g.idRepartidor, g]));
  const mapaSucursales = new Map(gruposSucursales.map((g) => [g.idRepartidor, g]));

  return repartidores.map((r) => {
    const g = mapaGrupos.get(r.id);
    const gs = mapaSucursales.get(r.id);
    const cajasPedidos = g?._sum.cajas ?? 0;
    const cajasSuc = gs?._sum.cajas ?? 0;
    const pedidosCount = (g?._count.id ?? 0) + (gs?._count.id ?? 0);

    return {
      repartidor: r,
      cantPedidos: pedidosCount,
      totalCajas: cajasPedidos + cajasSuc,
      totalMonto: g?._sum.montoTotal ?? 0,
      totalCobrado: g?._sum.montoPagado ?? 0,
    };
  });
}

export async function crearRepartidor(formData: FormData) {
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  const max = await prisma.repartidor.aggregate({ _max: { id: true } });
  const nuevoId = (max._max.id ?? 0) + 1;
  await prisma.repartidor.create({ data: { id: nuevoId, nombre } });
  revalidatePath("/config/repartidores");
}

export async function toggleActivo(formData: FormData) {
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await prisma.repartidor.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/config/repartidores");
}

export async function renombrarRepartidor(formData: FormData) {
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.repartidor.update({ where: { id }, data: { nombre } });
  revalidatePath("/config/repartidores");
}
