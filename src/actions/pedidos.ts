"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getPedidosPorFecha(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  return prisma.pedido.findMany({
    where: { fecha },
    include: {
      cliente: { include: { zona: true } },
      producto: true,
      repartidor: true,
    },
    orderBy: [
      { cliente: { zona: { nombre: "asc" } } },
      { cliente: { nombre: "asc" } },
    ],
  });
}

export async function getTotalesDia(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  const agg = await prisma.pedido.aggregate({
    where: { fecha, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  return {
    cajas: agg._sum.cajas ?? 0,
    monto: agg._sum.montoTotal ?? 0,
    cobrado: agg._sum.montoPagado ?? 0,
    cantidad: agg._count.id,
  };
}

export async function getCatalogoNuevoPedido() {
  const [clientes, productos, repartidores] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        idZona: true,
        zona: { select: { nombre: true } },
        formaPagoPref: true,
        idRepartidor: true,
        requiereFactura: true,
      },
      orderBy: [{ zona: { nombre: "asc" } }, { nombre: "asc" }],
    }),
    prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, precioReferencia: true, kgPorCaja: true, stockCajas: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.repartidor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return { clientes, productos, repartidores };
}

export async function crearPedido(formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const idCliente = Number(formData.get("idCliente"));
  const idProducto = Number(formData.get("idProducto"));
  const maduracion = formData.get("maduracion") as string;
  const cajas = parseFloat(formData.get("cajas") as string);
  const montoTotal = parseFloat(formData.get("montoTotal") as string) || 0;
  const formaPago = formData.get("formaPago") as string;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const esCobro = formData.get("esCobro") === "on";
  const esReposicion = formData.get("esReposicion") === "true";
  const observaciones = formData.get("observaciones") as string | null;

  // CAMBIO sin cargo ya está saldado (montoTotal = 0); cualquier otro caso queda pendiente
  const estadoPago = formaPago === "CAMBIO" && esReposicion ? "PAGADO" : "PENDIENTE";

  await prisma.pedido.create({
    data: {
      fecha: parseFechaRuta(fecha),
      idCliente,
      idProducto,
      maduracion: maduracion.trim().toUpperCase(),
      cajas,
      montoTotal,
      formaPago: formaPago as never,
      estadoPago: estadoPago as never,
      montoPagado: 0,
      idRepartidor,
      requiereFactura,
      estadoFactura: requiereFactura ? "PENDIENTE" : "NO_REQUIERE",
      esCobro,
      esReposicion,
      observaciones: observaciones?.trim() || null,
    },
  });

  if (!esCobro) {
    await prisma.producto.update({
      where: { id: idProducto },
      data: { stockCajas: { decrement: cajas } },
    });
  }

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/pedidos/${fecha}`);
}

export async function marcarPagado(idPedido: number, _?: FormData) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  await prisma.pedido.update({
    where: { id: idPedido },
    data: { estadoPago: "PAGADO", montoPagado: pedido.montoTotal },
  });
  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/");
  revalidatePath("/cobranzas");
}

export async function registrarCobro(idPedido: number, formData: FormData) {
  const monto = parseFloat(formData.get("monto") as string);
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  const nuevoPagado = Math.min(pedido.montoPagado + monto, pedido.montoTotal);
  const estadoPago = nuevoPagado >= pedido.montoTotal ? "PAGADO" : "PARCIAL";

  await prisma.pedido.update({
    where: { id: idPedido },
    data: { montoPagado: nuevoPagado, estadoPago: estadoPago as never },
  });

  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function eliminarPedido(idPedido: number, fechaStr: string) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  await prisma.pedido.delete({ where: { id: idPedido } });
  if (!pedido.esCobro) {
    await prisma.producto.update({
      where: { id: pedido.idProducto },
      data: { stockCajas: { increment: pedido.cajas } },
    });
  }
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
}
