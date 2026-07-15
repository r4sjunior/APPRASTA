import { getSession } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      <Nav role={session?.role ?? "admin"} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
