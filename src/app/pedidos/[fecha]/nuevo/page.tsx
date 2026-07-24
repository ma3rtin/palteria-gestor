import { getCatalogoNuevoPedido, crearPedido } from "@/actions/pedidos";
import { ChevronLeft } from "lucide-react";
import { MADURACIONES_SUGERIDAS } from "@/lib/utils";
import { FormNuevoPedido } from "./form";

interface Props {
  params: Promise<{ fecha: string }>;
  searchParams: Promise<{ cliente?: string }>;
}

export default async function NuevoPedidoPage({ params, searchParams }: Props) {
  const { fecha } = await params;
  const { cliente } = await searchParams;
  const { clientes, productos, repartidores } = await getCatalogoNuevoPedido();

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href={`/pedidos/${fecha}`} className="text-xs text-[#6b7280] hover:text-[#a3e635] flex items-center gap-1">
          <ChevronLeft size={14} />
          Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Nuevo pedido</h1>
        <p className="text-[#9ca3af] text-sm">{fecha}</p>
      </div>

      <FormNuevoPedido
        fecha={fecha}
        clientes={clientes}
        productos={productos}
        repartidores={repartidores}
        maduracionesSugeridas={MADURACIONES_SUGERIDAS}
        crearPedido={crearPedido}
        clienteInicialId={cliente ? Number(cliente) : undefined}
      />
    </div>
  );
}
