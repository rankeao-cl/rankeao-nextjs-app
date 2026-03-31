"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createChannel } from "@/lib/api/chat";

interface Props {
    listingId: string;
    sellerUsername: string;
}

export default function SaleCardActions({ listingId, sellerUsername }: Props) {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleContact = async () => {
        if (status !== "authenticated" || !session?.accessToken) {
            router.push("/login");
            return;
        }

        if (session.username === sellerUsername) {
            toast.warning("Es tu propia publicacion");
            return;
        }

        setLoading(true);
        try {
            const res = await createChannel(
                { type: "DM", name: sellerUsername, user_ids: [sellerUsername] },
                session.accessToken
            );
            const channelId = res?.data?.channel?.id ?? res?.channel?.id;
            router.push(channelId ? `/chat?channel=${channelId}&ref=listing&listing=${listingId}` : "/chat");
        } catch {
            toast.danger("Error al iniciar chat");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                type="button"
                size="sm"
                className="flex-1 font-medium"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                onPress={handleContact}
                isPending={loading}
            >
                Contactar
            </Button>
            <Button
                type="button"
                size="sm"
                variant="tertiary"
                className="font-medium"
                onPress={() => router.push(`/marketplace/${listingId}`)}
            >
                Detalle
            </Button>
        </div>
    );
}
