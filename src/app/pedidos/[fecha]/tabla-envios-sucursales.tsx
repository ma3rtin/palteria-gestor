"use client";

import { useState } from "react";
import Link from "next/link";
import { eliminarEnvioSucursal } from "@/actions/sucursales";
import { useToast } from "@/hooks/use-toast";
import { useModalConfirmacion } from "@/components/modal-confirmacion";
import { formatearHora } from "@/lib/utils";
import { CantidadCajas } from "@/components/icono-caja";
import { Store, Trash2, Pencil } from "lucide-react";

export interface EnvioSucursalItem {
  id: number;
  fecha: Date | string;
  idSucursal: number;
  idRepartidor: number | null;
  idUsuario: number | null;
  cajas: number;
  observaciones: string | null;
  creadoEn: Date | string;
  sucursal: {
    id: number;
    nombre: string;
    direccion: string | null;
  };
  repartidor: {
    id: number;
    nombre: string;
  } | null;
  usuario: {
    id: number;
    nombre: string;
  } | null;
  items: Array<{
    id: number;
    idProducto: number;
    cajas: number;
    maduracion: string | null;
    producto: {
      id: number;
      nombre: string;
      kgPorCaja: number | null;
    };
  }>;
}

interface Props {
  envios: EnvioSucursalItem[];
  fecha: string;
}

export function TablaEnviosSucursales({ envios, fecha }: Props) {
  const { showToast, ToastComponent } = useToast();
  const { solicitarConfirmacion, ModalComponent } = useModalConfirmacion();
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const handleEliminar = (envio: EnvioSucursalItem) => {
    solicitarConfirmacion({
      titulo: "Eliminar envío",
      mensaje: `Vas a eliminar el envío a ${envio.sucursal.nombre} (${envio.cajas} ${envio.cajas === 1 ? "caja" : "cajas"}). Se restablecerá el stock en la cámara.`,
      textoConfirmar: "Eliminar",
      textoCancelar: "Cancelar",
      tipo: "peligro",
      onConfirmar: async () => {
        try {
          setEliminandoId(envio.id);
          await eliminarEnvioSucursal(envio.id, fecha);
          showToast("Envío eliminado y stock restablecido");
        } catch {
          showToast("Error al eliminar");
        } finally {
          setEliminandoId(null);
        }
      },
    });
  };

  if (envios.length === 0) {
    return (
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-10 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#17191e] border border-[#2a2d35] flex items-center justify-center text-[#6b7280]">
          <Store size={22} />
        </div>
        <div>
          <p className="text-[#f9fafb] font-medium text-sm">Sin envíos a sucursales hoy</p>
          <p className="text-[#6b7280] text-xs mt-0.5">
            No se han registrado movimientos hacia sucursales en esta fecha.
          </p>
        </div>
        <Link
          href={`/pedidos/${fecha}/nuevo`}
          className="mt-2 inline-flex items-center gap-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          + Cargar envío
        </Link>
      </div>
    );
  }

  const totalCajasSucursales = envios.reduce((s, e) => s + e.cajas, 0);

  return (
    <>
      {ToastComponent}
      {ModalComponent}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2d35] bg-[#17191e]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-[#a3e635]" />
            <h2 className="text-xs font-semibold text-[#f9fafb] uppercase tracking-wider">
              Palterías ({envios.length})
            </h2>
          </div>
          <div className="text-xs text-[#9ca3af] flex items-center gap-1.5">
            <span>Total:</span>
            <CantidadCajas
              cantidad={totalCajasSucursales}
              size={14}
              className="text-[#a3e635] font-semibold font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-max table-auto border-collapse">
            <thead>
              <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs whitespace-nowrap">
                <th className="text-left px-4 py-3 font-medium">Sucursal</th>
                <th className="text-left px-4 py-3 font-medium">Productos</th>
                <th className="text-center px-4 py-3 font-medium w-28">Cajas</th>
                <th className="text-left px-4 py-3 font-medium">Repartidor</th>
                <th className="text-center px-4 py-3 font-medium w-24">Hora</th>
                <th className="text-left px-4 py-3 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 font-medium">Observaciones</th>
                <th className="text-right px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {envios.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[#22252e] hover:bg-[#22252e]/30 whitespace-nowrap transition-colors last:border-0"
                >
                  {/* Sucursal */}
                  <td className="px-4 py-3 font-medium text-left">
                    <div className="flex flex-col">
                      <span className="text-[#f9fafb] font-semibold flex items-center gap-1.5">
                        <Store size={14} className="text-[#a3e635] shrink-0" />
                        {e.sucursal.nombre}
                      </span>
                      {e.sucursal.direccion && (
                        <span className="text-xs text-[#9ca3af] ml-5">{e.sucursal.direccion}</span>
                      )}
                    </div>
                  </td>

                  {/* Productos y Cajas */}
                  <td className="px-4 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      {e.items.map((it) => (
                        <div key={it.id} className="text-xs flex items-center gap-2">
                          <span className="font-medium text-[#f9fafb]">{it.producto.nombre}</span>
                          {it.producto.kgPorCaja && (
                            <span className="text-[#9ca3af]">({it.producto.kgPorCaja} kg)</span>
                          )}
                          <span className="text-[#a3e635] font-mono font-semibold">
                            {it.cajas} {it.cajas === 1 ? "caja" : "cajas"}
                          </span>
                          {it.maduracion && (
                            <span className="bg-[#2a2d35] text-[#9ca3af] text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {it.maduracion}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Total Cajas */}
                  <td className="px-4 py-3 text-center w-28">
                    <CantidadCajas
                      cantidad={e.cajas}
                      size={14}
                      className="text-[#a3e635] font-semibold font-mono"
                    />
                  </td>

                  {/* Repartidor */}
                  <td className="px-4 py-3 text-left">
                    {e.repartidor ? (
                      <span className="text-[#d1d5db] font-medium">{e.repartidor.nombre}</span>
                    ) : (
                      <span className="text-red-400/80 italic text-xs">Sin asignar</span>
                    )}
                  </td>

                  {/* Hora */}
                  <td className="px-4 py-3 text-center text-xs text-[#9ca3af] font-mono w-24">
                    {formatearHora(e.creadoEn)} hs
                  </td>

                  {/* Autor */}
                  <td className="px-4 py-3 text-left text-xs text-[#9ca3af]">
                    {e.usuario?.nombre ?? "—"}
                  </td>

                  {/* Observaciones */}
                  <td className="px-4 py-3 text-left text-xs text-[#9ca3af]">
                    {e.observaciones ?? "—"}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-right w-24">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/pedidos/${fecha}/sucursales/${e.id}/editar`}
                        prefetch={false}
                        className="text-[#9ca3af] hover:text-[#a3e635] p-1.5 transition-colors cursor-pointer rounded hover:bg-[#2a2d35]/40"
                        title="Editar envío"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleEliminar(e)}
                        disabled={eliminandoId === e.id}
                        className="text-[#6b7280] hover:text-red-400 p-1.5 transition-colors cursor-pointer rounded hover:bg-red-950/30 disabled:opacity-50"
                        title="Eliminar envío"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
