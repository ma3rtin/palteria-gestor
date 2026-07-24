"use client";

import { useState } from "react";

interface Revendedor {
  id: number;
  nombre: string;
}

interface Props {
  revendedores: Revendedor[];
  defaultIdRevendedor?: number | null;
}

export default function RevendedorSelector({ revendedores, defaultIdRevendedor }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultIdRevendedor?.toString() ?? "");

  return (
    <div className="w-full md:w-1/2">
      <label className="block text-sm font-medium text-[#f9fafb] mb-1">Revendedor</label>
      <select
        name="idRevendedor"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
      >
        <option value="">Ninguno</option>
        {revendedores.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
    </div>
  );
}
