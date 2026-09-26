import { Package } from "lucide-react";

interface IconoCajaProps {
  size?: number;
  className?: string;
}

/**
 * Componente centralizado para el ícono de cajas en toda la aplicación.
 * Utiliza el ícono `Package` de lucide-react de forma consistente.
 */
export function IconoCaja({ size = 13, className = "" }: IconoCajaProps) {
  return <Package size={size} className={`inline-block shrink-0 ${className}`} />;
}

interface CantidadCajasProps {
  cantidad: number | string;
  size?: number;
  className?: string;
  label?: string;
  colorIcono?: string;
}

/**
 * Muestra el ícono de caja junto al número de cajas.
 * Reemplaza abreviaciones como 'cx' por una representación visual limpia y unificada.
 */
export function CantidadCajas({
  cantidad,
  size = 13,
  className = "",
  label = "",
  colorIcono = "text-[#9ca3af]",
}: CantidadCajasProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${className}`}>
      <IconoCaja size={size} className={colorIcono} />
      <span>{cantidad}</span>
      {label && <span className="text-[11px] opacity-75 font-normal ml-0.5">{label}</span>}
    </span>
  );
}
