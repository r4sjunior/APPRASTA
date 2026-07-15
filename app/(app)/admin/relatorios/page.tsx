const RELATORIOS = [
  {
    tipo: "financeiro",
    titulo: "Financeiro",
    descricao: "Pedidos, status, forma de pagamento e valores.",
  },
  {
    tipo: "estoque",
    titulo: "Estoque",
    descricao: "Produtos, preço e estoque geral atual.",
  },
  {
    tipo: "cadastros",
    titulo: "Cadastros de loja",
    descricao: "Lojas, contato e status da conta.",
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Relatórios</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RELATORIOS.map((r) => (
          <div key={r.tipo} className="card space-y-3 p-5">
            <div>
              <p className="font-semibold">{r.titulo}</p>
              <p className="text-sm text-neutral-500">{r.descricao}</p>
            </div>
            <a
              href={`/api/admin/relatorios/${r.tipo}`}
              className="btn-secondary inline-block"
            >
              Baixar CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
