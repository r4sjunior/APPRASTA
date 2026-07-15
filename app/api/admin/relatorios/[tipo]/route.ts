import { NextRequest, NextResponse } from "next/server";
import { getRows } from "@/lib/db";
import type { Loja, Pedido, Produto, Profile } from "@/lib/types";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const { tipo } = await params;
    let csv: string;
    let filename: string;

    if (tipo === "estoque") {
      const produtos = await getRows<Produto>("produtos");
      csv = toCsv(
        ["nome", "categoria", "preco", "estoque_geral"],
        produtos.map((p) => [p.nome, p.categoria, p.preco, p.estoque_geral])
      );
      filename = "estoque.csv";
    } else if (tipo === "cadastros") {
      const [lojas, profiles] = await Promise.all([
        getRows<Loja>("lojas"),
        getRows<Profile>("profiles"),
      ]);
      const perfilPorLoja = new Map(profiles.map((p) => [p.loja_id, p]));
      csv = toCsv(
        ["nome", "cidade", "telefone", "endereco", "email", "status"],
        lojas.map((l) => {
          const perfil = perfilPorLoja.get(l.id);
          return [
            l.nome,
            l.cidade,
            l.telefone,
            l.endereco,
            perfil?.email ?? "",
            perfil?.status ?? "",
          ];
        })
      );
      filename = "cadastros.csv";
    } else if (tipo === "financeiro") {
      const [pedidos, lojas] = await Promise.all([
        getRows<Pedido>("pedidos"),
        getRows<Loja>("lojas"),
      ]);
      const lojaPorId = new Map(lojas.map((l) => [l.id, l]));
      csv = toCsv(
        [
          "loja",
          "status",
          "forma_pagamento",
          "valor_total",
          "criado_em",
          "decidido_em",
        ],
        pedidos.map((p) => [
          lojaPorId.get(p.loja_id)?.nome ?? "",
          p.status,
          p.forma_pagamento,
          p.valor_total,
          p.created_at,
          p.decidido_em,
        ])
      );
      filename = "financeiro.csv";
    } else {
      return NextResponse.json(
        { error: "Relatório inválido" },
        { status: 400 }
      );
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
