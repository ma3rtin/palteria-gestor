import { getPedido, getCatalogoNuevoPedido, actualizarPedido } from "@/actions/pedidos";
import { MADURACIONES_SUGERIDAS } from "@/lib/utils";
import { FormEditarPedido } from "./form";

interface Props {
  params: Promise<{ fecha: string; id: string }>;
}

export default async function EditarPedidoPage({ params }: Props) {
  const { fecha, id } = await params;
  const idPedido = Number(id);
  const pedido = await getPedido(idPedido);
  const { clientes, productos, repartidores } = await getCatalogoNuevoPedido();

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href={`/pedidos/${fecha}`} className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Editar pedido</h1>
        <p className="text-[#9ca3af] text-sm">{pedido.cliente.nombre} · {fecha}</p>
      </div>

      <FormEditarPedido
        fecha={fecha}
        pedido={pedido}
        clientes={clientes}
        productos={productos}
        repartidores={repartidores}
        maduracionesSugeridas={MADURACIONES_SUGERIDAS}
        actualizarPedido={actualizarPedido.bind(null, idPedido)}
      />
    </div>
  );
}
