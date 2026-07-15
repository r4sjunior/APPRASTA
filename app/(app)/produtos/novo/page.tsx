import { ProdutoForm } from "@/components/ProdutoForm";

export default function NovoProdutoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Novo produto</h1>
      <ProdutoForm />
    </div>
  );
}
