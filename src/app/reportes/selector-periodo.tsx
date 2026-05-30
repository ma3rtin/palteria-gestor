"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hoyISO } from "@/lib/utils";

interface Props {
  desde: string;
  hasta: string;
}

function primerDiaSemana(): string {
  const hoy = new Date();
  const dia = (hoy.getDay() + 6) % 7; // lunes=0
  hoy.setDate(hoy.getDate() - dia);
  return hoy.toLocaleDateString("en-CA");
}

function primerDiaSemanaAnterior(): string {
  const hoy = new Date();
  const dia = (hoy.getDay() + 6) % 7;
  hoy.setDate(hoy.getDate() - dia - 7);
  return hoy.toLocaleDateString("en-CA");
}

function ultimoDiaSemanaAnterior(): string {
  const hoy = new Date();
  const dia = (hoy.getDay() + 6) % 7;
  hoy.setDate(hoy.getDate() - dia - 1);
  return hoy.toLocaleDateString("en-CA");
}

function primerDiaMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toLocaleDateString("en-CA");
}

function primerDiaMesAnterior(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toLocaleDateString("en-CA");
}

function ultimoDiaMesAnterior(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 0).toLocaleDateString("en-CA");
}

const PRESETS = [
  {
    label: "Esta semana",
    desde: () => primerDiaSemana(),
    hasta: () => hoyISO(),
  },
  {
    label: "Semana pasada",
    desde: () => primerDiaSemanaAnterior(),
    hasta: () => ultimoDiaSemanaAnterior(),
  },
  {
    label: "Este mes",
    desde: () => primerDiaMes(),
    hasta: () => hoyISO(),
  },
  {
    label: "Mes anterior",
    desde: () => primerDiaMesAnterior(),
    hasta: () => ultimoDiaMesAnterior(),
  },
];

export default function SelectorPeriodo({ desde, hasta }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fechaDesde, setFechaDesde] = useState(desde);
  const [fechaHasta, setFechaHasta] = useState(hasta);

  function aplicarPreset(preset: (typeof PRESETS)[number]) {
    const d = preset.desde();
    const h = preset.hasta();
    setFechaDesde(d);
    setFechaHasta(h);
    startTransition(() => {
      router.push(`/reportes?desde=${d}&hasta=${h}`);
    });
  }

  function buscar() {
    if (fechaDesde && fechaHasta) {
      startTransition(() => {
        router.push(`/reportes?desde=${fechaDesde}&hasta=${fechaHasta}`);
      });
    }
  }

  const activePreset = PRESETS.find(
    (p) => p.desde() === fechaDesde && p.hasta() === fechaHasta
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 mb-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      {PRESETS.map((p) => (
        <button
          key={p.label}
          disabled={isPending}
          onClick={() => aplicarPreset(p)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activePreset?.label === p.label
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
        onClick={buscar}
        disabled={isPending}
        className="px-3 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
      >
        {isPending ? "Buscando..." : "Buscar"}
      </button>
    </div>
  );
}
