// Life Counter session: pantalla completa sin navbar ni padding de AppShell

export default function SessionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "#000",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    );
}
