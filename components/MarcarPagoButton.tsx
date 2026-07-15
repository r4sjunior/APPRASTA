"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarcarPagoButton({ pagamentoId }: { pagamentoId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function marcarPago() {
    setEnviando(true);
    try {
      await fetch(`/api/admin/pagamentos/${pagamentoId}`, {
        method: "PATCH",
      });
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      onClick={marcarPago}
      disabled={enviando}
      className="btn-primary text-xs"
    >
      {enviando ? "..." : "Marcar como pago"}
    </button>
  );
}
