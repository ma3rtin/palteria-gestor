import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormPerfil } from "./form";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { email: session.user.email },
    select: { id: true, nombre: true, email: true },
  });

  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Mi perfil</h1>
      <FormPerfil nombre={usuario.nombre ?? ""} email={usuario.email} />
    </div>
  );
}
