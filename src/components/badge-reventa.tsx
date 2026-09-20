"use client";

interface BadgeReventaProps {
  nombre: string;
  className?: string;
  size?: "sm" | "md";
  mostrarNombreCompleto?: boolean;
}

export function BadgeReventa({
  nombre,
  className = "",
  size = "sm",
  mostrarNombreCompleto = false,
}: BadgeReventaProps) {
  const sizeClasses =
    size === "md"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-[10px] px-1.5 py-0.5 gap-1";

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      title={`Revendedor: ${nombre}`}
      className={`inline-flex items-center rounded font-semibold select-none
        bg-purple-950/40 text-purple-300 border border-purple-800/60
        hover:bg-purple-900/50 hover:border-purple-600/70 hover:text-purple-200
        transition-colors duration-150 cursor-default ${sizeClasses} ${className}`}
    >
      <span>{mostrarNombreCompleto ? `Reventa: ${nombre}` : "Reventa"}</span>
    </span>
  );
}
