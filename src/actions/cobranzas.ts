"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { marcarPagado } from "./pedidos";

export async function getClientesConDeudaPaginado(
  page: number = 0,
  pageSize: number = 20,
  idZona?: number,
  idRepartidor?: number,
  busqueda?: string
) {
  const where = {
    activo: true,
    ...(idZona ? { idZona } : {}),
    ...(idRepartidor ? { idRepartidor } : {}),
    ...(busqueda ? { nombre: { contains: busqueda, mode: "insensitive" as const } } : {}),
    pedidos: {
      some: {
        estadoPago: { not: "PAGADO" as const },
        esCobro: false,
      }
    }
  };

  const skip = page * pageSize;

  const [clientes, total, aggGlobal] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        zona: true,
        repartidor: true,
        pedidos: {
          where: {
            estadoPago: { not: "PAGADO" as const },
            esCobro: false,
          },
          include: { producto: true },
          orderBy: { fecha: "asc" },
        }
      },
      orderBy: { nombre: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.cliente.count({ where }),
    prisma.pedido.aggregate({
      where: {
        estadoPago: { not: "PAGADO" as const },
        esCobro: false,
        cliente: {
          activo: true,
          ...(idZona ? { idZona } : {}),
          ...(idRepartidor ? { idRepartidor } : {}),
          ...(busqueda ? { nombre: { contains: busqueda, mode: "insensitive" as const } } : {}),
        }
      },
      _sum: {
        montoTotal: true,
        montoPagado: true,
      }
    })
  ]);

  const clientesDeuda = clientes.map((c) => {
    const deudaTotal = c.pedidos.reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);
    return {
      cliente: {
        id: c.id,
        nombre: c.nombre,
        direccion: c.direccion,
        telefono: c.telefono,
        idZona: c.idZona,
        idRepartidor: c.idRepartidor,
        formaPagoPref: c.formaPagoPref,
        requiereFactura: c.requiereFactura,
        idCuentaCorriente: c.idCuentaCorriente,
        idRevendedor: c.idRevendedor,
        activo: c.activo,
        observaciones: c.observaciones,
        creadoEn: c.creadoEn,
        actualizadoEn: c.actualizadoEn,
        zona: c.zona,
        repartidor: c.repartidor,
      },
      pedidos: c.pedidos,
      deudaTotal,
    };
  });

  const deudaTotalGlobal = (aggGlobal._sum.montoTotal ?? 0) - (aggGlobal._sum.montoPagado ?? 0);

  return {
    clientesDeuda,
    total,
    deudaTotalGlobal,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function getCatalogosCobranza() {
  const zonas = await prisma.zona.findMany({ orderBy: { nombre: "asc" } });
  const repartidores = await prisma.repartidor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  return { zonas, repartidores };
}

export async function marcarPedidoPagado(idPedido: number, _?: FormData) {
  await marcarPagado(idPedido);
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function marcarTodosPagadosCliente(idCliente: number, _?: FormData) {
  const pedidosDeudor = await prisma.pedido.findMany({
    where: { idCliente, estadoPago: { not: "PAGADO" }, esCobro: false },
  });

  // Ejecutamos marcarPagado secuencialmente para que registre los pagos en pagosParciales con la fecha de hoy
  for (const p of pedidosDeudor) {
    await marcarPagado(p.id);
  }

  revalidatePath("/cobranzas");
  revalidatePath("/");
  revalidatePath(`/clientes/${idCliente}`);
}
