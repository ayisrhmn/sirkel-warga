// The friendly "wrong link" message. Rendered directly (not through
// notFound()) where warga are likely to land with a mistyped link: Next.js
// serves notFound() inside a matched route as an empty shell that only fills
// in once JavaScript has run, which is bad on a slow phone.
export function CommunityNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Komunitas tidak ditemukan</h1>
      <p className="mt-3 text-neutral-600">
        Cek lagi link dari pengurus.
      </p>
    </main>
  );
}
