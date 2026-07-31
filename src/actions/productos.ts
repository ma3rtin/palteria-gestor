"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "../lib/utils";

// Crear un nuevo producto (con soporte opcional para lote/fecha de ingreso)
export async function crearProducto(formData: FormData) {
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const precio = parseFloat(formData.get("precioReferencia") as string);
  const kg = parseFloat(formData.get("kgPorCaja") as string);
  const stock = parseFloat(formData.get("stockCajas") as string);
  const costo = parseFloat(formData.get("costo") as string);
  const fechaIngresoStr = formData.get("fechaIngreso") as string;
  const fechaIngreso = fechaIngresoStr ? parseFechaRuta(fechaIngresoStr) : null;

  if (!nombre) {
    throw new Error("El nombre es requerido");
  }
  if (isNaN(precio)) {
    throw new Error("El precio de referencia es requerido y debe ser un número");
  }
  if (isNaN(costo)) {
    throw new Error("El costo es requerido y debe ser un número");
  }

  await prisma.producto.create({
    data: {
      nombre,
      precioReferencia: precio,
      kgPorCaja: isNaN(kg) ? null : kg,
      stockCajas: isNaN(stock) ? 0 : stock,
      costo,
      fechaIngreso,
    },
  });

  revalidatePath("/productos");
}

// Actualizar precio de referencia
export async function actualizarPrecio(formData: FormData) {
  const id = Number(formData.get("id"));
  const precio = parseFloat(formData.get("precioReferencia") as string);

  if (isNaN(id)) {
    throw new Error("ID de producto inválido");
  }
  if (isNaN(precio)) {
    throw new Error("El precio de referencia debe ser un número válido");
  }

  await prisma.producto.update({
    where: { id },
    data: { precioReferencia: precio },
  });

  revalidatePath("/productos");
}

// Actualizar costo de referencia
export async function actualizarCosto(formData: FormData) {
  const id = Number(formData.get("id"));
  const costo = parseFloat(formData.get("costo") as string);

  if (isNaN(id)) {
    throw new Error("ID de producto inválido");
  }
  if (isNaN(costo)) {
    throw new Error("El costo debe ser un número válido");
  }

  await prisma.producto.update({
    where: { id },
    data: { costo },
  });

  revalidatePath("/productos");
}

// Actualizar kilogramos por caja
export async function actualizarKg(formData: FormData) {
  const id = Number(formData.get("id"));
  const kg = parseFloat(formData.get("kgPorCaja") as string);

  if (isNaN(id)) {
    throw new Error("ID de producto inválido");
  }

  await prisma.producto.update({
    where: { id },
    data: { kgPorCaja: isNaN(kg) ? null : kg },
  });

  revalidatePath("/productos");
}

// Actualizar stock de cajas
export async function actualizarStock(formData: FormData) {
  const id = Number(formData.get("id"));
  const stock = parseFloat(formData.get("stockCajas") as string);

  if (isNaN(id)) {
    throw new Error("ID de producto inválido");
  }

  await prisma.producto.update({
    where: { id },
    data: { stockCajas: isNaN(stock) ? 0 : stock },
  });

  revalidatePath("/productos");
}

// Alternar estado activo del producto
export async function toggleProducto(formData: FormData) {
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";

  if (isNaN(id)) {
    throw new Error("ID de producto inválido");
  }

  await prisma.producto.update({
    where: { id },
    data: { activo: !activo },
  });

  revalidatePath("/productos");
}
