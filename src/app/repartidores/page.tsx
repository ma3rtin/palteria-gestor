import { getResumenTodosRepartidoresHoy } from "@/actions/repartidores";
import { hoyISO } from "@/lib/utils";
import { FiltroRepartidores } from "./filtro-repartidores";

export default async function RepartidoresPage() {
  const resumen = await getResumenTodosRepartidoresHoy();
  const hoy = hoyISO();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-1">Repartidores</h1>
      <p className="text-[#9ca3af] text-sm mb-6">Resumen de hoy · {hoy}</p>
      <FiltroRepartidores resumen={resumen} />
    </div>
  );
}
