interface TarjetaStatProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  colorValor?: string;
  compacta?: boolean;
}

export function TarjetaStat({ titulo, valor, subtitulo, colorValor, compacta }: TarjetaStatProps) {
  return (
    <div className={`bg-[#1c1f26] rounded-lg border border-[#2a2d35] shadow-sm ${compacta ? "p-3" : "p-4"}`}>
      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">{titulo}</p>
      <p className={`font-bold mt-0.5 ${colorValor ?? "text-[#f9fafb]"} ${compacta ? "text-lg" : "text-xl"}`}>{valor}</p>
      {subtitulo && <p className={`text-[#9ca3af] mt-0.5 ${compacta ? "text-[10px]" : "text-[11px]"}`}>{subtitulo}</p>}
    </div>
  );
}
