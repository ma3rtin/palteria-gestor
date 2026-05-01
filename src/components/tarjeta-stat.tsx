interface TarjetaStatProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  colorValor?: string;
}

export function TarjetaStat({ titulo, valor, subtitulo, colorValor }: TarjetaStatProps) {
  return (
    <div className="bg-white rounded-lg border border-[#dde6de] p-5">
      <p className="text-xs font-medium text-[#9aab9d] uppercase tracking-wide">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${colorValor ?? "text-[#1a2419]"}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-[#5a6b5c] mt-1">{subtitulo}</p>}
    </div>
  );
}
