"use client";

import { BotonSubmit } from "@/components/boton-submit";

interface Props {
  action: (formData: FormData) => Promise<void> | void;
  placeholder: string;
  inputId: string;
}

export function CreadorConfig({ action, placeholder, inputId }: Props) {
  return (
    <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4">
      <form
        action={async (formData) => {
          await action(formData);
          const input = document.getElementById(inputId) as HTMLInputElement;
          if (input) input.value = "";
        }}
        className="flex gap-3"
      >
        <input
          id={inputId}
          name="nombre"
          required
          placeholder={placeholder}
          className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635]"
        />
        <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Agregar
        </BotonSubmit>
      </form>
    </div>
  );
}
