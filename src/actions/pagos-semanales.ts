"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getCuentasCorrientes() {
  const cuentas = await prisma.cuentaCorriente.findMany({
    where: { activo: true },
    include: { clientes: { include: { zona: true } } },
    orderBy: { nombre: "asc" },
  });

  // Para cada cuenta calcular deuda total de sus clientes
  const deudas = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: {
      estadoPago: { not: "PAGADO" },
      esCobro: false,
      cliente: { idCuentaCorriente: { not: null } },
    },
    _sum: { montoTotal: true, montoPagado: true },
  });

  const deudaPorCliente = new Map(
    deudas.map((d) => [d.idCliente, (d._sum.montoTotal ?? 0) - (d._sum.montoPagado ?? 0)])
  );

  return cuentas.map((cc) => {
    const deudaTotal = cc.clientes.reduce(
      (s, c) => s + (deudaPorCliente.get(c.id) ?? 0),
      0
    );
    return { ...cc, deudaTotal };
  });
}

export async function getDetalleCuenta(idCuenta: number) {
  const cuenta = await prisma.cuentaCorriente.findUniqueOrThrow({
    where: { id: idCuenta },
    include: {
      clientes: {
        include: {
          zona: true,
          pedidos: {
            where: { estadoPago: { not: "PAGADO" }, esCobro: false },
            include: { producto: true },
            orderBy: { fecha: "asc" },
          },
        },
      },
      periodos: { orderBy: { fechaInicio: "desc" }, take: 10 },
    },
  });

  const deudaTotal = cuenta.clientes.reduce(
    (s, c) =>
      s +
      c.pedidos.reduce((ps, p) => ps + (p.montoTotal - p.montoPagado), 0),
    0
  );

  return { ...cuenta, deudaTotal };
}

export async function registrarPagoSemanal(formData: FormData) {
  const idCuenta = Number(formData.get("idCuenta"));
  const fechaInicio = formData.get("fechaInicio") as string;
  const fechaFin = formData.get("fechaFin") as string;
  const montoPagado = parseFloat(formData.get("montoPagado") as string);
  const formaPago = formData.get("formaPago") as string;
  const observaciones = formData.get("observaciones") as string | null;

  // Calcular monto total de pedidos pendientes del período
  const pedidos = await prisma.pedido.findMany({
    where: {
      cliente: { idCuentaCorriente: idCuenta },
      fecha: {
        gte: parseFechaRuta(fechaInicio),
        lte: parseFechaRuta(fechaFin),
      },
      esCobro: false,
    },
  });
  const montoTotal = pedidos.reduce((s, p) => s + p.montoTotal, 0);

  await prisma.periodoSemanal.create({
    data: {
      idCuenta,
      fechaInicio: parseFechaRuta(fechaInicio),
      fechaFin: parseFechaRuta(fechaFin),
      montoTotal,
      montoPagado,
      fechaPago: new Date(),
      formaPago: formaPago as never,
      observaciones: observaciones?.trim() || null,
    },
  });

  // Marcar pedidos del período como pagados si montoPagado >= montoTotal
  if (montoPagado >= montoTotal) {
    await prisma.pedido.updateMany({
      where: {
        cliente: { idCuentaCorriente: idCuenta },
        fecha: {
          gte: parseFechaRuta(fechaInicio),
          lte: parseFechaRuta(fechaFin),
        },
        esCobro: false,
        estadoPago: { not: "PAGADO" },
      },
      data: { estadoPago: "PAGADO" },
    });
  }

  revalidatePath("/pagos-semanales");
  revalidatePath(`/pagos-semanales/${idCuenta}`);
  revalidatePath("/cobranzas");
  revalidatePath("/");
}
