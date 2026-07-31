"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function crearCuentaCorriente(formData: FormData) {
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const diaCobranza = (formData.get("diaCobranza") as string)?.trim().toUpperCase() || null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!nombre) {
    throw new Error("El nombre de la cuenta corriente es requerido");
  }

  await prisma.cuentaCorriente.create({
    data: {
      nombre,
      diaCobranza,
      observaciones,
      activo: true,
    },
  });

  revalidatePath("/config/cuentas-corrientes");
  revalidatePath("/pagos-semanales");
}

export async function actualizarCuentaCorriente(formData: FormData) {
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const diaCobranza = (formData.get("diaCobranza") as string)?.trim().toUpperCase() || null;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!id) {
    throw new Error("El ID de la cuenta corriente es requerido");
  }
  if (!nombre) {
    throw new Error("El nombre de la cuenta corriente es requerido");
  }

  await prisma.cuentaCorriente.update({
    where: { id },
    data: {
      nombre,
      diaCobranza,
      observaciones,
    },
  });

  revalidatePath("/config/cuentas-corrientes");
  revalidatePath("/pagos-semanales");
  revalidatePath(`/pagos-semanales/${id}`);
}

export async function toggleActivoCuentaCorriente(formData: FormData) {
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";

  if (!id) {
    throw new Error("El ID de la cuenta corriente es requerido");
  }

  await prisma.cuentaCorriente.update({
    where: { id },
    data: { activo: !activo },
  });

  revalidatePath("/config/cuentas-corrientes");
  revalidatePath("/pagos-semanales");
}
