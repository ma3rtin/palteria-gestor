"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function actualizarPerfil(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.email) return { error: "No autenticado" };

  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
  });
  if (!usuario) return { error: "Usuario no encontrado" };

  const idUsuario = usuario.id;
  const nombre = (formData.get("nombre") as string).trim();
  const contraseniaActual = (formData.get("contraseniaActual") as string) ?? "";
  const nuevaContrasenia = (formData.get("nuevaContrasenia") as string) ?? "";
  const confirmarContrasenia = (formData.get("confirmarContrasenia") as string) ?? "";

  const data: { nombre?: string; passwordHash?: string } = {};

  if (nombre) data.nombre = nombre;

  if (nuevaContrasenia) {
    if (nuevaContrasenia !== confirmarContrasenia)
      return { error: "Las contraseñas nuevas no coinciden" };
    if (nuevaContrasenia.length < 6)
      return { error: "La contraseña nueva debe tener al menos 6 caracteres" };

    const ok = await bcrypt.compare(contraseniaActual, usuario.passwordHash);
    if (!ok) return { error: "Contraseña actual incorrecta" };

    data.passwordHash = await bcrypt.hash(nuevaContrasenia, 12);
  }

  if (Object.keys(data).length === 0) return { error: "No hay cambios para guardar" };

  await prisma.usuario.update({ where: { id: idUsuario }, data });
  revalidatePath("/perfil");
  return { ok: true };
}
