import Link from "next/link";
import { getClientesConSaldoPaginado, getCatalogoFormulario } from "@/actions/clientes";
import { retryWithExponentialBackoff } from "@/lib/retry";
import { FiltrosClientes } from "./buscador";
import { ClientesListPaginated } from "./clientes-list-paginated";

interface Props {
  searchParams: Promise<{ q?: string; zona?: string; repartidor?: string; inactivos?: string; page?: string }>;
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q, zona, repartidor, inactivos, page = "0" } = await searchParams;

  const initialData = await retryWithExponentialBackoff(
    () =>
      getClientesConSaldoPaginado(
        Number(page),
        20,
        zona ? Number(zona) : undefined,
        repartidor ? Number(repartidor) : undefined,
        !!inactivos
      ),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );

  const catalogo = await retryWithExponentialBackoff(
    () => getCatalogoFormulario(),
    { maxAttempts: 3, baseDelayMs: 800 }
  );

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <FiltrosClientes
        zonas={catalogo.zonas}
        repartidores={catalogo.repartidores}
        q={q}
        zona={zona}
        repartidor={repartidor}
        inactivos={inactivos}
      />

      <ClientesListPaginated
        initialData={initialData}
        filters={{ q, zona, repartidor, inactivos }}
      />
    </div>
  );
}

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <FiltrosClientes
        zonas={catalogo.zonas}
        repartidores={catalogo.repartidores}
        q={q}
        zona={zona}
        repartidor={repartidor}
        inactivos={inactivos}
      />

      <ClientesListPaginated
        initialData={initialData}
        filters={{ q, zona, repartidor, inactivos }}
      />
    </div>
  );
}
