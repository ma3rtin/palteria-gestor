import { getPedido, getCatalogoNuevoPedido, actualizarPedido } from "@/actions/pedidos";
import { ChevronLeft } from "lucide-react";
import { MADURACIONES_SUGERIDAS } from "@/lib/utils";
import { FormEditarPedido } from "./form";
import { BadgeReventa } from "@/components/badge-reventa";

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
        <a href={`/pedidos/${fecha}`} className="text-xs text-[#6b7280] hover:text-[#a3e635] flex items-center gap-1">
          <ChevronLeft size={14} />
          Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Editar pedido</h1>
        <div className="text-[#9ca3af] text-sm flex items-center gap-2 flex-wrap mt-0.5">
          <span>{pedido.cliente.nombre}</span>
          {pedido.cliente.revendedor && (
            <BadgeReventa nombre={pedido.cliente.revendedor.nombre} />
          )}
          <span>·</span>
          <span>{fecha}</span>
          {pedido.usuario?.nombre && (
            <span>
              · Cargado por{" "}
              <strong className="text-[#f9fafb] font-medium">
                {pedido.usuario.nombre.trim().split(" ")[0]}
              </strong>
            </span>
          )}
        </div>
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
