import { prisma } from "@/lib/prisma";
import { CuentasCorrientesConfigUI } from "./cuentas-corrientes-ui";

export default async function ConfigCuentasCorrientesPage() {
  const cuentas = await prisma.cuentaCorriente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: { clientes: true },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Configuración: Cuentas Corrientes</h1>
        <p className="text-xs text-[#6b7280] mt-1">
          Cuentas y grupos que realizan pagos de forma semanal.
        </p>
      </div>

      <CuentasCorrientesConfigUI initialCuentas={cuentas} />
    </div>
  );
}
