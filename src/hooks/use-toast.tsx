"use client";

import { useState, useEffect } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setMessage(msg);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const ToastComponent = message ? (
    <div className="fixed bottom-4 right-4 bg-[#1c1f26] border border-[#a3e635] text-[#a3e635] px-4 py-2 rounded-lg shadow-xl text-sm animate-fade-in-out z-50 font-medium">
      {message}
    </div>
  ) : null;

  return { showToast, ToastComponent };
}
