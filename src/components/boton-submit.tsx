"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}

export function BotonSubmit({ children, className, pendingText }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
          {pendingText ?? "Guardando..."}
        </span>
      ) : children}
    </button>
  );
}
