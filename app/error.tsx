"use client";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
            <div className="text-center max-w-md space-y-4">
                <h1 className="text-2xl font-bold">Algo salio mal</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{error.message || "Error inesperado."}</p>
                <div className="flex justify-center gap-3">
                    <button onClick={reset} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Reintentar</button>
                    <a href="/" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--surface-solid)", color: "var(--foreground)" }}>Ir al inicio</a>
                </div>
            </div>
        </div>
    );
}
