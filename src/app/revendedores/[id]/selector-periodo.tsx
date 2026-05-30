"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hoyISO } from "@/lib/utils";

interface Props {
  idRevendedor: number;
  desde: string;
  hasta: string;
}

function semanaActual() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  return {
    desde: lunes.toLocaleDateString("en-CA"),
    hasta: sabado.toLocaleDateString("en-CA"),
  };
}

function semanaAnterior() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7) - 7);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  return {
    desde: lunes.toLocaleDateString("en-CA"),
    hasta: sabado.toLocaleDateString("en-CA"),
  };
}

const PRESETS = [
  { label: "Esta semana", fn: semanaActual },
  { label: "Semana pasada", fn: semanaAnterior },
];

export default function SelectorPeriodo({ idRevendedor, desde, hasta }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fechaDesde, setFechaDesde] = useState(desde);
  const [fechaHasta, setFechaHasta] = useState(hasta);

  function aplicar(d: string, h: string) {
    setFechaDesde(d);
    setFechaHasta(h);
    startTransition(() => {
      router.push(`/revendedores/${idRevendedor}?desde=${d}&hasta=${h}`);
    });
  }

  const presetActivo = PRESETS.find((p) => {
    const { desde: d, hasta: h } = p.fn();
    return d === fechaDesde && h === fechaHasta;
  });

  return (
    <div className={`flex flex-wrap items-center gap-2 mb-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      {PRESETS.map((p) => (
        <button
          key={p.label}
          disabled={isPending}
          onClick={() => { const { desde: d, hasta: h } = p.fn(); aplicar(d, h); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            presetActivo?.label === p.label
              ? "bg-[#a3e635] text-[#0f1117]"
              : "bg-[#1c1f26] border border-[#2a2d35] text-[#9ca3af] hover:text-white hover:border-[#a3e635]"
          }`}
        >
          {p.label}
        </button>
      ))}

      <div className="w-px h-5 bg-[#2a2d35] mx-1" />

      <input
        type="date"
        value={fechaDesde}
        onChange={(e) => setFechaDesde(e.target.value)}
        className="bg-[#1c1f26] border border-[#2a2d35] text-[#f9fafb] text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#a3e635] text-white"
      />
      <span className="text-[#6b7280] text-xs">→</span>
      <input
        type="date"
        value={fechaHasta}
        onChange={(e) => setFechaHasta(e.target.value)}
        className="bg-[#1c1f26] border border-[#2a2d35] text-[#f9fafb] text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#a3e635] text-white"
      />
      <button
        onClick={() => aplicar(fechaDesde, fechaHasta)}
        disabled={isPending}
        className="px-3 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
      >
        {isPending ? "Buscando..." : "Buscar"}
      </button>
    </div>
  );
}
