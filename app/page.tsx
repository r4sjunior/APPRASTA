import Link from "next/link";
import { getRows } from "@/lib/db";
import type { Produto, Loja, Movimentacao } from "@/lib/types";

export const dynamic = "force-dynamic";

function calcularSaldos(movimentacoes: Movimentacao[], produtos: Produto[], lojas: Loja[]) {
  const saldoPorChave = new Map<string, number>();

  for (const mov of movimentacoes) {
    const qtd = Number(mov.quantidade) || 0;
    const chave = `${mov.loja_id}::${mov.produto_id}`;
    const atual = saldoPorChave.get(chave) ?? 0;
    const delta =
      mov.tipo === "CONSIGNADO" || mov.tipo === "REPOSICAO"
        ? qtd
        : mov.tipo === "VENDA" || mov.tipo === "DEVOLUCAO"
        ? -qtd
        : 0;
    saldoPorChave.set(chave, atual + delta);
  }

  const produtoMap = new Map(produtos.map((p) => [p.id, p]));
  const lojaMap = new Map(lojas.map((l) => [l.id, l]));

  return Array.from(saldoPorChave.entries())
    .map(([chave, saldo]) => {
      const [lojaId, produtoId] = chave.split("::");
      return {
        loja: lojaMap.get(lojaId)?.nome ?? "?",
        produto: produtoMap.get(produtoId)?.nome ?? "?",
        saldo,
      };
    })
    .filter((s) => s.saldo !== 0)
    .sort((a, b) => b.saldo - a.saldo);
}

export default async function DashboardPage() {
  let produtos: Produto[] = [];
  let lojas: Loja[] = [];
  let movimentacoes: Movimentacao[] = [];
  let erro: string | null = null;

  try {
    [produtos, lojas, movimentacoes] = await Promise.all([
      getRows<Produto>("produtos"),
      getRows<Loja>("lojas"),
      getRows<Movimentacao>("movimentacoes"),
    ]);
  } catch (err) {
    erro = (err as Error).message;
  }

  if (erro) {
    return (
      <div className="card p-6">
        <h1 className="mb-2 text-lg font-bold text-brand-red">
          Erro ao conectar com o banco de dados
        </h1>
        <p className="text-sm text-neutral-600">{erro}</p>
        <p className="mt-4 text-sm text-neutral-500">
          Confira o arquivo <code>.env.local</code> e o README para configurar
          o projeto Supabase.
        </p>
      </div>
    );
  }

  const saldos = calcularSaldos(movimentacoes, produtos, lojas);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/produtos" className="card p-5 hover:shadow-md transition">
          <p className="label">Produtos</p>
          <p className="text-3xl font-bold">{produtos.length}</p>
        </Link>
        <Link href="/lojas" className="card p-5 hover:shadow-md transition">
          <p className="label">Lojas</p>
          <p className="text-3xl font-bold">{lojas.length}</p>
        </Link>
        <Link href="/movimentacoes" className="card p-5 hover:shadow-md transition">
          <p className="label">Movimentações</p>
          <p className="text-3xl font-bold">{movimentacoes.length}</p>
        </Link>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-base font-bold">Saldo consignado por loja</h2>
        {saldos.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum saldo em aberto. Registre movimentações para ver o estoque
            consignado em cada loja.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Loja</th>
                  <th className="py-2 pr-4 font-medium">Produto</th>
                  <th className="py-2 pr-4 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2 pr-4">{s.loja}</td>
                    <td className="py-2 pr-4">{s.produto}</td>
                    <td className="py-2 pr-4 font-semibold">{s.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
