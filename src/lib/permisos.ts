import { RolUsuario } from "@/generated/prisma/enums";

export interface PermisosRol {
  verCostos: boolean;
  editarCostos: boolean;
  verRevendedores: boolean;
  gestionarRevendedores: boolean;
}

export const PERMISOS: Record<RolUsuario, PermisosRol> = {
  [RolUsuario.ADMIN]: {
    verCostos: true,
    editarCostos: true,
    verRevendedores: true,
    gestionarRevendedores: true,
  },
  [RolUsuario.EMPLEADO]: {
    verCostos: false,
    editarCostos: false,
    verRevendedores: false,
    gestionarRevendedores: false,
  },
};

/**
 * Evalúa si un rol tiene habilitado un permiso específico.
 * Centraliza la lógica de RBAC para facilitar la adición de nuevos roles (ej. REPARTIDOR, ENCARGADO).
 */
export function tienePermiso(
  rol: RolUsuario | string | undefined | null,
  permiso: keyof PermisosRol
): boolean {
  if (!rol) return false;
  const config = PERMISOS[rol as RolUsuario];
  if (!config) return false;
  return Boolean(config[permiso]);
}
