"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AprovarRecusarButtons({
  url,
  aprovarBody,
  recusarBody,
}: {
  url: string;
  aprovarBody: Record<string, unknown>;
  recusarBody: Record<string, unknown>;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState<"aprovar" | "recusar" | null>(
    null
  );
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(acao: "aprovar" | "recusar") {
    setCarregando(acao);
    setErro(null);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acao === "aprovar" ? aprovarBody : recusarBody),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => decidir("aprovar")}
        disabled={carregando !== null}
        className="btn-primary"
      >
        {carregando === "aprovar" ? "..." : "Aprovar"}
      </button>
      <button
        onClick={() => decidir("recusar")}
        disabled={carregando !== null}
        className="btn-danger"
      >
        {carregando === "recusar" ? "..." : "Recusar"}
      </button>
      {erro && <p className="text-xs text-brand-red">{erro}</p>}
    </div>
  );
}
