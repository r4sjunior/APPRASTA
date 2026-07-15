import { getRows } from "@/lib/db";
import type { Loja, Profile } from "@/lib/types";
import { AprovarRecusarButtons } from "@/components/AprovarRecusarButtons";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const [profiles, lojas] = await Promise.all([
    getRows<Profile>("profiles"),
    getRows<Loja>("lojas"),
  ]);
  const lojaPorId = new Map(lojas.map((l) => [l.id, l]));
  const pendentes = profiles.filter(
    (p) => p.role === "loja" && p.status === "pendente"
  );
  const decididos = profiles.filter(
    (p) => p.role === "loja" && p.status !== "pendente"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-bold">
          Cadastros pendentes ({pendentes.length})
        </h1>
        {pendentes.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum cadastro aguardando aprovação.
          </p>
        ) : (
          <div className="card divide-y divide-neutral-100">
            {pendentes.map((p) => {
              const loja = lojaPorId.get(p.loja_id);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">{loja?.nome ?? "?"}</p>
                    <p className="text-sm text-neutral-500">{p.email}</p>
                    <p className="text-sm text-neutral-500">
                      {loja?.cidade} · {loja?.telefone}
                    </p>
                  </div>
                  <AprovarRecusarButtons
                    url={`/api/admin/usuarios/${p.id}`}
                    aprovarBody={{ status: "aprovado" }}
                    recusarBody={{ status: "recusado" }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-base font-bold">Cadastros já decididos</h2>
        {decididos.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum registro ainda.</p>
        ) : (
          <div className="card divide-y divide-neutral-100">
            {decididos.map((p) => {
              const loja = lojaPorId.get(p.loja_id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">{loja?.nome ?? "?"}</p>
                    <p className="text-sm text-neutral-500">{p.email}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      p.status === "aprovado"
                        ? "text-brand-green"
                        : "text-brand-red"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
