export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--surface-solid)" }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--muted)" }}
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill="currentColor" />
        </svg>
      </div>

      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--foreground)" }}
      >
        Sin conexión
      </h1>
      <p
        className="text-sm max-w-xs leading-relaxed mb-8"
        style={{ color: "var(--muted)" }}
      >
        Revisa tu conexión a internet e intenta de nuevo.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
        style={{ background: "var(--accent)" }}
      >
        Reintentar
      </button>
    </div>
  );
}
