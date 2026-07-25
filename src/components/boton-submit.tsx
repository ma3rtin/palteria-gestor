"use client";

import { useFormStatus } from "react-dom";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  pendingText?: string;
}

export function BotonSubmit({ children, className, pendingText, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      className={`${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...rest}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        </span>
      ) : children}
    </button>
  );
}
