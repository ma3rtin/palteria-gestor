import { getRevendedores } from "@/actions/revendedores";
import { RevendedoresConfigUI } from "./revendedores-ui";

export default async function ConfigRevendedoresPage() {
  const revendedores = await getRevendedores();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Revendedores</h1>
      <RevendedoresConfigUI initialRevendedores={revendedores} />
    </div>
  );
}
