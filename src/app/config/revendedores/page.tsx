import { auth } from "@/auth";
import { tienePermiso } from "@/lib/permisos";
import { redirect } from "next/navigation";
import { getRevendedores } from "@/actions/revendedores";
import { RevendedoresConfigUI } from "./revendedores-ui";

export default async function ConfigRevendedoresPage() {
  const session = await auth();
  if (!tienePermiso(session?.user?.rol, "verRevendedores")) {
    redirect("/");
  }

  const revendedores = await getRevendedores();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Revendedores</h1>
      <RevendedoresConfigUI initialRevendedores={revendedores} />
    </div>
  );
}
