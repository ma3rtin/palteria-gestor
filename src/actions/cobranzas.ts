"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getClientesConDeuda(idZona?: number, idRepartidor?: number) {
  const pedidos = await prisma.pedido.findMany({
    where: {
      estadoPago: { not: "PAGADO" },
      esCobro: false,
      cliente: {
        ...(idZona ? { idZona } : {}),
        ...(idRepartidor ? { idRepartidor } : {}),
        activo: true,
      },
    },
    include: {
      cliente: { include: { zona: true, repartidor: true } },
      producto: true,
    },
    orderBy: { fecha: "asc" },
  });

  // Agrupar por cliente
  const mapaClientes = new Map<
    number,
    {
      cliente: (typeof pedidos)[0]["cliente"];
      pedidos: typeof pedidos;
      deudaTotal: number;
    }
  >();

  for (const p of pedidos) {
    const deuda = p.montoTotal - p.montoPagado;
    if (!mapaClientes.has(p.idCliente)) {
      mapaClientes.set(p.idCliente, { cliente: p.cliente, pedidos: [], deudaTotal: 0 });
    }
    const entry = mapaClientes.get(p.idCliente)!;
    entry.pedidos.push(p);
    entry.deudaTotal += deuda;
  }

  return Array.from(mapaClientes.values()).sort((a, b) => b.deudaTotal - a.deudaTotal);
}

export async function getCatalogosCobranza() {
  const [zonas, repartidores] = await Promise.all([
    prisma.zona.findMany({ orderBy: { nombre: "asc" } }),
    prisma.repartidor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);
  return { zonas, repartidores };
}

export async function marcarPedidoPagado(idPedido: number, _?: FormData) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  await prisma.pedido.update({
    where: { id: idPedido },
    data: { estadoPago: "PAGADO", montoPagado: pedido.montoTotal },
  });
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function marcarTodosPagadosCliente(idCliente: number, _?: FormData) {
  const pedidosDeudor = await prisma.pedido.findMany({
    where: { idCliente, estadoPago: { not: "PAGADO" }, esCobro: false },
  });
  await prisma.pedido.updateMany({
    where: { idCliente, estadoPago: { not: "PAGADO" }, esCobro: false },
    data: { estadoPago: "PAGADO" },
  });
  // Actualizar montoPagado individualmente
  for (const p of pedidosDeudor) {
    await prisma.pedido.update({
      where: { id: p.id },
      data: { montoPagado: p.montoTotal },
    });
  }
  revalidatePath("/cobranzas");
  revalidatePath("/");
}
