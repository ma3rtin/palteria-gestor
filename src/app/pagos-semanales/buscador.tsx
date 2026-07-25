"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

interface Props {
  qActual?: string;
}

export function BuscadorPagosSemanales({ qActual }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(qActual ?? "");
  const [isManualUpdate, setIsManualUpdate] = useState(false);

  function actualizar(val: string) {
    const sp = new URLSearchParams();
    if (val) sp.set("q", val);

    startTransition(() => {
      router.push(`/pagos-semanales${sp.size ? "?" + sp.toString() : ""}`);
      setIsManualUpdate(false);
    });
  }

  // Debounce search input
  useEffect(() => {
    if (searchValue === (qActual ?? "")) {
      setIsManualUpdate(false);
      return;
    }

    const timer = setTimeout(() => {
      actualizar(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sincronizar searchValue si cambia externamente (no manual)
  useEffect(() => {
    if (!isManualUpdate && !isPending) {
      setSearchValue(qActual ?? "");
    }
  }, [qActual, isPending, isManualUpdate]);

  return (
    <div className={`relative w-full mb-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      <input
        type="search"
        placeholder="Buscar por cuenta o local..."
        value={searchValue}
        onChange={(e) => {
          setIsManualUpdate(true);
          setSearchValue(e.target.value);
        }}
        className="w-full border border-[#2a2d35] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
      />
      {isPending && (
        <div className="absolute right-3 top-2.5">
          <div className="w-4 h-4 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
