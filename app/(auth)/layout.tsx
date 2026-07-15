export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="text-brand-red">●</span> Merch Control
        </div>
        {children}
      </div>
    </div>
  );
}
