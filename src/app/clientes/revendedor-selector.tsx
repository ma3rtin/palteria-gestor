"use client";

import { useState } from "react";

interface Revendedor {
  id: number;
  nombre: string;
}

interface Props {
  revendedores: Revendedor[];
  defaultIdRevendedor?: number | null;
  defaultComisionFija?: number | null;
}

export default function RevendedorSelector({ revendedores, defaultIdRevendedor, defaultComisionFija }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultIdRevendedor?.toString() ?? "");
  const [comisionFija, setComisionFija] = useState<string>(
    defaultComisionFija !== undefined && defaultComisionFija !== null ? defaultComisionFija.toString() : ""
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
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

      {selectedId && (
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">
            Comisión revendedor por caja ($)
          </label>
          <input
            name="comisionRevendedorFija"
            type="number"
            step="100"
            value={comisionFija}
            onChange={(e) => setComisionFija(e.target.value)}
            placeholder="0"
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
          />
        </div>
      )}
    </div>
  );
}
