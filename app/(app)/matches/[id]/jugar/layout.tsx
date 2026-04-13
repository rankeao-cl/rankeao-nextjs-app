// Pantalla completa sin navbar ni padding — igual que duels/session
export default function JugarLayout({ children }: { children: React.ReactNode }) {
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
