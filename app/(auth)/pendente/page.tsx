import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function PendentePage() {
  const session = await getSession();
  const recusado = session?.status === "recusado";

  return (
    <div className="card space-y-4 p-6 text-center">
      <p className="text-4xl">{recusado ? "🚫" : "⏳"}</p>
      {recusado ? (
        <>
          <h1 className="text-lg font-bold text-brand-red">
            Cadastro recusado
          </h1>
          <p className="text-sm text-neutral-600">
            O administrador recusou o cadastro desta loja. Entre em contato
            para mais informações.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-bold">Cadastro em análise</h1>
          <p className="text-sm text-neutral-600">
            Sua conta foi criada e está aguardando aprovação do
            administrador. Assim que for aprovada, você terá acesso ao
            estoque e poderá fazer pedidos.
          </p>
        </>
      )}
      <LogoutButton className="btn-secondary" />
    </div>
  );
}
