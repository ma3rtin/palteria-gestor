import { prisma } from "@/lib/prisma";
import { RepartidoresConfigUI } from "./repartidores-ui";

export default async function ConfigRepartidoresPage() {
  const repartidores = await prisma.repartidor.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { pedidos: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Repartidores</h1>
      </div>

      <RepartidoresConfigUI initialRepartidores={repartidores} />
    </div>
  );
}
