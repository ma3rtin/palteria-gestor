import { redirect } from "next/navigation";
import { hoyISO } from "@/lib/utils";

export default function PedidosPage() {
  redirect(`/pedidos/${hoyISO()}`);
}
