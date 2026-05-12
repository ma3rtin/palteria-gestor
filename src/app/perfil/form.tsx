"use client";

import { useActionState } from "react";
import { actualizarPerfil } from "@/actions/usuario";
import { BotonSubmit } from "@/components/boton-submit";

interface Props {
  nombre: string;
  email: string;
}

export function FormPerfil({ nombre, email }: Props) {
  const [state, action] = useActionState(actualizarPerfil, {});

  return (
    <form action={action} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5">
      {/* Datos básicos */}
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Nombre</label>
        <input
          name="nombre"
          defaultValue={nombre}
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Email</label>
        <input
          value={email}
          readOnly
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm text-[#6b7280] read-only:cursor-not-allowed"
        />
        <p className="text-xs text-[#4b5563] mt-1">El email no se puede cambiar.</p>
      </div>

      <hr className="border-[#2a2d35]" />
      <p className="text-sm font-semibold text-[#f9fafb]">Cambiar contraseña</p>
      <p className="text-xs text-[#6b7280] -mt-3">Dejá los campos en blanco si no querés cambiarla.</p>

      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Contraseña actual</label>
        <input
          name="contraseniaActual"
          type="password"
          autoComplete="current-password"
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Nueva contraseña</label>
        <input
          name="nuevaContrasenia"
          type="password"
          autoComplete="new-password"
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#f9fafb] mb-1">Confirmar nueva contraseña</label>
        <input
          name="confirmarContrasenia"
          type="password"
          autoComplete="new-password"
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-[#4ade80] bg-green-950/30 border border-green-900/40 rounded-lg px-3 py-2">
          Cambios guardados correctamente.
        </p>
      )}

      <div className="flex gap-3 pt-2 border-t border-[#22252e]">
        <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors">
          Guardar cambios
        </BotonSubmit>
      </div>
    </form>
  );
}
