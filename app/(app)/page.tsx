import Link from "next/link";
import { getRows } from "@/lib/db";
import type {
  Produto,
  Loja,
  Movimentacao,
  Pedido,
  PedidoItem,
  Pagamento,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularIndicadores(
  pedidos: Pedido[],
  itens: PedidoItem[],
  pagamentos: Pagamento[]
) {
  const aprovados = pedidos.filter((p) => p.status === "aprovado");
  const idsAprovados = new Set(aprovados.map((p) => p.id));
  const itensAprovados = itens.filter((i) => idsAprovados.has(i.pedido_id));

  const valorVendido = aprovados.reduce(
    (soma, p) => soma + (Number(p.valor_total) || 0),
    0
  );
  const totalItens = itensAprovados.reduce(
    (soma, i) => soma + (Number(i.quantidade) || 0),
    0
  );

  const agora = new Date();
  const valorMensal = aprovados.reduce((soma, p) => {
    const data = new Date(p.created_at);
    if (
      data.getFullYear() === agora.getFullYear() &&
      data.getMonth() === agora.getMonth()
    ) {
      return soma + (Number(p.valor_total) || 0);
    }
    return soma;
  }, 0);

  const valorAReceber = pagamentos
    .filter((p) => p.status === "pendente")
    .reduce((soma, p) => soma + (Number(p.valor) || 0), 0);
  const valorRecebido = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + (Number(p.valor) || 0), 0);

  return {
    ticketMedio: aprovados.length ? valorVendido / aprovados.length : 0,
    pa: aprovados.length ? totalItens / aprovados.length : 0,
    valorMensal,
    valorAReceber,
    valorRecebido,
  };
}

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
  let pedidos: Pedido[] = [];
  let pedidoItens: PedidoItem[] = [];
  let pagamentos: Pagamento[] = [];
  let erro: string | null = null;

  try {
    [produtos, lojas, movimentacoes, pedidos, pedidoItens, pagamentos] =
      await Promise.all([
        getRows<Produto>("produtos"),
        getRows<Loja>("lojas"),
        getRows<Movimentacao>("movimentacoes"),
        getRows<Pedido>("pedidos"),
        getRows<PedidoItem>("pedido_itens"),
        getRows<Pagamento>("pagamentos"),
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
  const indicadores = calcularIndicadores(pedidos, pedidoItens, pagamentos);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="card p-5">
          <p className="label">Ticket médio</p>
          <p className="text-2xl font-bold">
            {formatarMoeda(indicadores.ticketMedio)}
          </p>
        </div>
        <div className="card p-5">
          <p className="label">PA (peças/atendimento)</p>
          <p className="text-2xl font-bold">{indicadores.pa.toFixed(1)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Vendido no mês</p>
          <p className="text-2xl font-bold">
            {formatarMoeda(indicadores.valorMensal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="label">A receber</p>
          <p className="text-2xl font-bold">
            {formatarMoeda(indicadores.valorAReceber)}
          </p>
        </div>
        <div className="card p-5">
          <p className="label">Já recebido</p>
          <p className="text-2xl font-bold">
            {formatarMoeda(indicadores.valorRecebido)}
          </p>
        </div>
      </div>

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
