import { MovimentacaoForm } from "@/components/MovimentacaoForm";

export default function NovaMovimentacaoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nova movimentação</h1>
      <MovimentacaoForm />
    </div>
  );
}
