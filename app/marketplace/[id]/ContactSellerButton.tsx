"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { createChannel } from "@/lib/api/chat";

interface Props {
    sellerUsername: string;
    listingTitle: string;
    listingId: string;
}

export default function ContactSellerButton({ sellerUsername, listingTitle, listingId }: Props) {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleContact = async () => {
        if (status !== "authenticated" || !session?.accessToken) {
            router.push("/login");
            return;
        }

        if (session.username === sellerUsername) {
            toast.warning("No puedes contactarte contigo mismo");
            return;
        }

        setLoading(true);
        try {
            const res = await createChannel(
                {
                    type: "DM",
                    name: sellerUsername,
                    user_ids: [sellerUsername],
                },
                session.accessToken
            );

            const channelId = res?.data?.id ?? res?.id;

            if (channelId) {
                router.push(`/chat?channel=${channelId}&ref=listing&listing=${listingId}`);
            } else {
                router.push("/chat");
            }
        } catch {
            toast.danger("No se pudo iniciar la conversacion. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            className="flex-1 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            onPress={handleContact}
            isPending={loading}
        >
            Contactar vendedor
        </Button>
    );
}
