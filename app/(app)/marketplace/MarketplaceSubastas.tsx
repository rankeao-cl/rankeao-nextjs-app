"use client";

export default function MarketplaceSubastas() {
  return (
    <div className="mx-4 lg:mx-6 mb-12">
      <div className="flex flex-col items-center py-16">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--surface-solid)" }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p style={{ color: "var(--foreground)", fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 6 }}>
          Subastas - Proximamente
        </p>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, textAlign: "center", maxWidth: 360, lineHeight: "19px" }}>
          Pronto podras subastar y pujar por cartas y accesorios TCG. Publica tus items y deja que la comunidad compita por ellos.
        </p>
      </div>
    </div>
  );
}
