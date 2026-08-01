"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta, hoyISO } from "@/lib/utils";

export async function getCuentasCorrientesPaginadas(
  busqueda?: string,
  page: number = 0,
  pageSize: number = 20
) {
  const where = {
    activo: true,
    ...(busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" as const } },
            {
              clientes: {
                some: {
                  nombre: { contains: busqueda, mode: "insensitive" as const }
                }
              }
            }
          ]
        }
      : {})
  };

  const skip = page * pageSize;

  const [cuentas, total, aggGlobalDeuda] = await Promise.all([
    prisma.cuentaCorriente.findMany({
      where,
      include: { clientes: { include: { zona: true } } },
      orderBy: { nombre: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.cuentaCorriente.count({ where }),
    prisma.pedido.aggregate({
      where: {
        estadoPago: { not: "PAGADO" as const },
        esCobro: false,
        cliente: {
          idCuentaCorriente: { not: null },
          activo: true,
        }
      },
      _sum: { montoTotal: true, montoPagado: true }
    })
  ]);

  const deudas = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: {
      estadoPago: { not: "PAGADO" as const },
      esCobro: false,
      cliente: { idCuentaCorriente: { not: null } },
    },
    _sum: { montoTotal: true, montoPagado: true },
  });

  const deudaPorCliente = new Map(
    deudas.map((d) => [d.idCliente, (d._sum.montoTotal ?? 0) - (d._sum.montoPagado ?? 0)])
  );

  const cuentasConDeuda = cuentas.map((cc) => {
    const deudaTotal = cc.clientes.reduce(
      (s, c) => s + (deudaPorCliente.get(c.id) ?? 0),
      0
    );
    return { ...cc, deudaTotal };
  });

  const deudaTotalGlobal = (aggGlobalDeuda._sum.montoTotal ?? 0) - (aggGlobalDeuda._sum.montoPagado ?? 0);

  return {
    cuentas: cuentasConDeuda,
    total,
    deudaTotalGlobal,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
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
      periodos: {
        orderBy: { fechaInicio: "desc" },
        take: 10,
        include: {
          pagosLocales: {
            include: {
              cliente: { select: { id: true, nombre: true } },
              repartidor: { select: { id: true, nombre: true } },
            },
            orderBy: { fechaPago: "desc" },
          },
        },
      },
    },
  });

  const deudaTotal = cuenta.clientes.reduce(
    (s, c) =>
      s + c.pedidos.reduce((ps, p) => ps + (p.montoTotal - p.montoPagado), 0),
    0
  );

  return { ...cuenta, deudaTotal };
}

export async function getRepartidoresActivos() {
  return prisma.repartidor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
}

export async function registrarPagoSemanal(formData: FormData) {
  const idCuenta = Number(formData.get("idCuenta"));
  const fechaInicio = formData.get("fechaInicio") as string;
  const fechaFin = formData.get("fechaFin") as string;
  const montoPagado = parseFloat(formData.get("montoPagado") as string);
  const formaPago = formData.get("formaPago") as string;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (isNaN(idCuenta) || idCuenta <= 0) {
    throw new Error("ID de cuenta corriente inválido.");
  }
  if (!fechaInicio || !fechaFin) {
    throw new Error("Las fechas de inicio y fin de período son requeridas.");
  }
  if (isNaN(montoPagado) || montoPagado <= 0) {
    throw new Error("El monto cobrado debe ser un número válido mayor a cero.");
  }

  const pedidosPendientes = await prisma.pedido.findMany({
    where: {
      cliente: { idCuentaCorriente: idCuenta },
      estadoPago: { not: "PAGADO" },
      esCobro: false,
    },
    orderBy: { fecha: "asc" },
  });

  const pedidosPeriodo = pedidosPendientes.filter((p) => {
    const f = p.fecha;
    return f >= parseFechaRuta(fechaInicio) && f <= parseFechaRuta(fechaFin);
  });
  const montoTotal =
    pedidosPeriodo.length > 0
      ? pedidosPeriodo.reduce((s, p) => s + p.montoTotal, 0)
      : pedidosPendientes.reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);

  const periodo = await prisma.periodoSemanal.create({
    data: {
      idCuenta,
      fechaInicio: parseFechaRuta(fechaInicio),
      fechaFin: parseFechaRuta(fechaFin),
      montoTotal,
      montoPagado,
      fechaPago: parseFechaRuta(hoyISO()),
      formaPago: formaPago as never,
      observaciones,
    },
  });

  // Pago global: sin local específico (idCliente = null)
  await prisma.pagoLocal.create({
    data: {
      idPeriodo: periodo.id,
      idCliente: null,
      monto: montoPagado,
      fechaPago: parseFechaRuta(hoyISO()),
      idRepartidor,
      observaciones,
    },
  });

  let saldo = montoPagado;
  for (const p of pedidosPendientes) {
    if (saldo <= 0) break;
    const pendiente = p.montoTotal - p.montoPagado;
    if (pendiente <= 0) continue;
    const abonar = Math.min(saldo, pendiente);
    const nuevoMontoPagado = p.montoPagado + abonar;
    await prisma.pedido.update({
      where: { id: p.id },
      data: {
        montoPagado: nuevoMontoPagado,
        estadoPago: (nuevoMontoPagado >= p.montoTotal ? "PAGADO" : "PARCIAL") as never,
      },
    });
    saldo -= abonar;
  }

  revalidatePath("/pagos-semanales");
  revalidatePath(`/pagos-semanales/${idCuenta}`);
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function registrarPagoLocal(formData: FormData) {
  const idCuenta = Number(formData.get("idCuenta"));
  const idCliente = Number(formData.get("idCliente"));
  const monto = parseFloat(formData.get("monto") as string);
  const fechaPagoStr = formData.get("fechaPago") as string;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;
  const fechaInicio = formData.get("fechaInicio") as string;
  const fechaFin = formData.get("fechaFin") as string;

  if (isNaN(idCuenta) || idCuenta <= 0) {
    throw new Error("ID de cuenta corriente inválido.");
  }
  if (isNaN(idCliente) || idCliente <= 0) {
    throw new Error("ID de cliente inválido.");
  }
  if (isNaN(monto) || monto <= 0) {
    throw new Error("El monto cobrado debe ser un número válido mayor a cero.");
  }
  if (!fechaPagoStr) {
    throw new Error("La fecha de pago es requerida.");
  }

  const fechaInicioDate = parseFechaRuta(fechaInicio);
  const fechaFinDate = parseFechaRuta(fechaFin);

  // Reusar el período de esta semana si ya existe, si no crearlo
  let periodo = await prisma.periodoSemanal.findFirst({
    where: { idCuenta, fechaInicio: fechaInicioDate, fechaFin: fechaFinDate },
  });
  if (!periodo) {
    periodo = await prisma.periodoSemanal.create({
      data: { idCuenta, fechaInicio: fechaInicioDate, fechaFin: fechaFinDate, montoTotal: 0, montoPagado: 0 },
    });
  }

  await prisma.periodoSemanal.update({
    where: { id: periodo.id },
    data: { montoPagado: { increment: monto } },
  });

  await prisma.pagoLocal.create({
    data: {
      idPeriodo: periodo.id,
      idCliente,
      monto,
      fechaPago: parseFechaRuta(fechaPagoStr),
      idRepartidor,
      observaciones,
    },
  });

  // Distribuir el pago contra los pedidos pendientes de este cliente
  const pedidosPendientes = await prisma.pedido.findMany({
    where: { idCliente, estadoPago: { not: "PAGADO" }, esCobro: false },
    orderBy: { fecha: "asc" },
  });

  let saldo = monto;
  for (const p of pedidosPendientes) {
    if (saldo <= 0) break;
    const pendiente = p.montoTotal - p.montoPagado;
    if (pendiente <= 0) continue;
    const abonar = Math.min(saldo, pendiente);
    await prisma.pedido.update({
      where: { id: p.id },
      data: {
        montoPagado: p.montoPagado + abonar,
        estadoPago: (p.montoPagado + abonar >= p.montoTotal ? "PAGADO" : "PARCIAL") as never,
      },
    });
    saldo -= abonar;
  }

  revalidatePath("/pagos-semanales");
  revalidatePath(`/pagos-semanales/${idCuenta}`);
  revalidatePath("/cobranzas");
  revalidatePath("/");
}
