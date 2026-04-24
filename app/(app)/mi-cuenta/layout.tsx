import type { Metadata } from "next";
import AccountSidebar from "./AccountSidebar";

export const metadata: Metadata = {
    title: "Mi cuenta",
    description: "Gestiona tus compras, ventas, billetera y perfil en Rankeao.",
    robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <AccountSidebar />
                <section className="flex-1 min-w-0">{children}</section>
            </div>
        </div>
    );
}
