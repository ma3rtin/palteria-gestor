"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function crearZona(formData: FormData) {
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.zona.create({ data: { nombre } });
  revalidatePath("/config/zonas");
}

export async function renombrarZona(formData: FormData) {
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.zona.update({ where: { id }, data: { nombre } });
  revalidatePath("/config/zonas");
}
