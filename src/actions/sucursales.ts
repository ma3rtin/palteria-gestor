"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseFechaRuta } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getSucursales() {
  return prisma.sucursal.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getEnviosSucursalesPorFecha(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  return prisma.envioSucursal.findMany({
    where: { fecha },
    include: {
      sucursal: true,
      repartidor: true,
      usuario: { select: { id: true, nombre: true } },
      items: {
        include: {
          producto: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
}

export async function getEnvioSucursal(idEnvio: number) {
  return prisma.envioSucursal.findUniqueOrThrow({
    where: { id: idEnvio },
    include: {
      sucursal: true,
      repartidor: true,
      usuario: { select: { id: true, nombre: true } },
      items: {
        include: {
          producto: true,
        },
      },
    },
  });
}

export async function crearEnvioSucursal(formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const idSucursal = Number(formData.get("idSucursal"));
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!fecha) {
    throw new Error("La fecha del envío es requerida.");
  }
  if (isNaN(idSucursal) || idSucursal <= 0) {
    throw new Error("Debe seleccionar una sucursal válida.");
  }

  // Parseo de productos/items
  const itemsJsonRaw = formData.get("itemsJson") as string;
  let itemsParsed: Array<{ idProducto: number; cajas: number; maduracion?: string }> = [];

  if (itemsJsonRaw) {
    try {
      const parsed = JSON.parse(itemsJsonRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsParsed = parsed
          .filter((it: any) => it && it.idProducto && !isNaN(Number(it.idProducto)) && Number(it.idProducto) > 0)
          .map((it: any) => ({
            idProducto: Number(it.idProducto),
            cajas: parseFloat(it.cajas) || 0,
            maduracion: String(it.maduracion ?? "").trim().toUpperCase(),
          }));
      }
    } catch (e) {
      console.error("Error al parsear itemsJson en crearEnvioSucursal:", e);
    }
  }

  // Fallback para idProducto individual si no vino JSON (compatibilidad/tests)
  const idProductoLegacy = formData.get("idProducto") ? Number(formData.get("idProducto")) : null;
  const cajasLegacy = parseFloat(formData.get("cajas") as string) || 0;
  const maduracionLegacy = (formData.get("maduracion") as string)?.trim().toUpperCase() || "";

  if (itemsParsed.length === 0 && idProductoLegacy && cajasLegacy > 0) {
    itemsParsed = [{
      idProducto: idProductoLegacy,
      cajas: cajasLegacy,
      maduracion: maduracionLegacy,
    }];
  }

  if (itemsParsed.length === 0) {
    throw new Error("Debe agregar al menos un producto al envío.");
  }

  for (const item of itemsParsed) {
    if (!item.idProducto || item.idProducto <= 0) {
      throw new Error("Debe seleccionar un producto válido.");
    }
    if (isNaN(item.cajas) || item.cajas <= 0) {
      throw new Error("La cantidad de cajas de cada producto debe ser mayor a cero.");
    }
  }

  const totalCajas = itemsParsed.reduce((sum, it) => sum + it.cajas, 0);

  const session = await auth();
  const idUsuario = session?.user?.id ? Number(session.user.id) : null;

  // Creamos el envío con sus ítems (consultas secuenciales sin $transaction interactivo)
  await prisma.envioSucursal.create({
    data: {
      fecha: parseFechaRuta(fecha),
      idSucursal,
      idRepartidor,
      idUsuario,
      cajas: totalCajas,
      observaciones,
      items: {
        create: itemsParsed.map((i) => ({
          idProducto: i.idProducto,
          cajas: i.cajas,
          maduracion: i.maduracion || null,
        })),
      },
    },
  });

  // Descuento secuencial de stock
  for (const it of itemsParsed) {
    if (it.idProducto && it.cajas > 0) {
      await prisma.producto.update({
        where: { id: it.idProducto },
        data: { stockCajas: { decrement: it.cajas } },
      });
    }
  }

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/repartidores");

  redirect(`/pedidos/${fecha}?vista=palterias`);
}

export async function eliminarEnvioSucursal(idEnvio: number, fechaStr: string) {
  if (isNaN(idEnvio) || idEnvio <= 0) {
    throw new Error("ID de envío a sucursal inválido.");
  }

  const envio = await prisma.envioSucursal.findUnique({
    where: { id: idEnvio },
    include: { items: true },
  });

  if (!envio) {
    throw new Error("El envío a sucursal no existe o ya fue eliminado.");
  }

  // Reintegro de stock en cada producto
  if (envio.items && envio.items.length > 0) {
    for (const item of envio.items) {
      if (item.idProducto && item.cajas > 0) {
        await prisma.producto.update({
          where: { id: item.idProducto },
          data: { stockCajas: { increment: item.cajas } },
        });
      }
    }
  }

  // Eliminación del envío (los items se eliminan en cascada por onDelete: Cascade)
  await prisma.envioSucursal.delete({
    where: { id: idEnvio },
  });

  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/repartidores");
}

export async function actualizarEnvioSucursal(idEnvio: number, formData: FormData) {
  if (isNaN(idEnvio) || idEnvio <= 0) {
    throw new Error("ID de envío a sucursal inválido.");
  }

  const fecha = formData.get("fecha") as string;
  const idSucursal = Number(formData.get("idSucursal"));
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!fecha) {
    throw new Error("La fecha del envío es requerida.");
  }
  if (isNaN(idSucursal) || idSucursal <= 0) {
    throw new Error("Debe seleccionar una sucursal válida.");
  }

  const itemsJsonRaw = formData.get("itemsJson") as string;
  let itemsParsed: Array<{ idProducto: number; cajas: number; maduracion?: string }> = [];

  if (itemsJsonRaw) {
    try {
      const parsed = JSON.parse(itemsJsonRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsParsed = parsed
          .filter((it: any) => it && it.idProducto && !isNaN(Number(it.idProducto)) && Number(it.idProducto) > 0)
          .map((it: any) => ({
            idProducto: Number(it.idProducto),
            cajas: parseFloat(it.cajas) || 0,
            maduracion: String(it.maduracion ?? "").trim().toUpperCase(),
          }));
      }
    } catch (e) {
      console.error("Error al parsear itemsJson en actualizarEnvioSucursal:", e);
    }
  }

  if (itemsParsed.length === 0) {
    throw new Error("Debe agregar al menos un producto al envío.");
  }

  for (const item of itemsParsed) {
    if (!item.idProducto || item.idProducto <= 0) {
      throw new Error("Debe seleccionar un producto válido.");
    }
    if (isNaN(item.cajas) || item.cajas <= 0) {
      throw new Error("La cantidad de cajas de cada producto debe ser mayor a cero.");
    }
  }

  const envioActual = await prisma.envioSucursal.findUnique({
    where: { id: idEnvio },
    include: { items: true },
  });

  if (!envioActual) {
    throw new Error("El envío a sucursal no existe o ya fue eliminado.");
  }

  // 1. Reintegro de stock anterior
  if (envioActual.items && envioActual.items.length > 0) {
    for (const oldItem of envioActual.items) {
      if (oldItem.idProducto && oldItem.cajas > 0) {
        await prisma.producto.update({
          where: { id: oldItem.idProducto },
          data: { stockCajas: { increment: oldItem.cajas } },
        });
      }
    }
  }

  // 2. Recreación de ítems y descuento de stock nuevo
  await prisma.itemEnvioSucursal.deleteMany({
    where: { idEnvio },
  });

  for (const newItem of itemsParsed) {
    await prisma.itemEnvioSucursal.create({
      data: {
        idEnvio,
        idProducto: newItem.idProducto,
        cajas: newItem.cajas,
        maduracion: newItem.maduracion || null,
      },
    });
    if (newItem.idProducto && newItem.cajas > 0) {
      await prisma.producto.update({
        where: { id: newItem.idProducto },
        data: { stockCajas: { decrement: newItem.cajas } },
      });
    }
  }

  const totalCajas = itemsParsed.reduce((sum, it) => sum + it.cajas, 0);

  // 3. Actualización de EnvioSucursal
  await prisma.envioSucursal.update({
    where: { id: idEnvio },
    data: {
      idSucursal,
      idRepartidor,
      cajas: totalCajas,
      observaciones,
    },
  });

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/repartidores");

  redirect(`/pedidos/${fecha}?vista=palterias`);
}
