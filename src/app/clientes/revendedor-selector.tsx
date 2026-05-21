"use client";

import { useState } from "react";

interface Revendedor {
  id: number;
  nombre: string;
  tipo: string;
}

interface Props {
  revendedores: Revendedor[];
  defaultIdRevendedor?: number | null;
  defaultComision?: number | null;
}

export default function RevendedorSelector({ revendedores, defaultIdRevendedor, defaultComision }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultIdRevendedor?.toString() ?? "");

  const selected = revendedores.find((r) => r.id.toString() === selectedId);
  const esComision = selected?.tipo === "COMISION";

  return (
    <div className="grid grid-cols-2 gap-4">
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

      {esComision && (
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Comisión por caja</label>
          <input
            name="comisionPorCaja"
            type="number"
            step={500}
            defaultValue={defaultComision ?? ""}
            placeholder="Ej: 3000"
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
        </div>
      )}
    </div>
  );
}
