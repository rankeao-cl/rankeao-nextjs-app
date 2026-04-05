import Link from "next/link";

export default function RootNotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
            <div className="text-center max-w-md space-y-4">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>La pagina que buscas no existe.</p>
                <Link href="/" className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>Ir al inicio</Link>
            </div>
        </div>
    );
}
