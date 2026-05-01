interface TarjetaStatProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  colorValor?: string;
}

export function TarjetaStat({ titulo, valor, subtitulo, colorValor }: TarjetaStatProps) {
  return (
    <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
      <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${colorValor ?? "text-[#f9fafb]"}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-[#9ca3af] mt-1">{subtitulo}</p>}
    </div>
  );
}
