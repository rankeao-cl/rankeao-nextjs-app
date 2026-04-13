"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";

import { useAuth } from "@/lib/hooks/use-auth";
import { createChannel } from "@/lib/api/chat";
import { autocompleteUsers } from "@/lib/api/social";

interface Props {
    sellerUsername: string;
    listingTitle: string;
    listingId: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function ContactSellerButton({ sellerUsername, listingId, className, style }: Props) {
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
            // Resolve the seller's user_id from their username
            const usersRes = await autocompleteUsers(sellerUsername, session.accessToken) as
                { data?: { users?: { id: string; username: string }[] }; users?: { id: string; username: string }[] };
            const users = usersRes?.data?.users || usersRes?.users || [];
            const seller = users.find((u) => u.username === sellerUsername);

            if (!seller?.id) {
                toast.danger("No se encontro al vendedor.");
                return;
            }

            const res = await createChannel(
                {
                    type: "DM",
                    user_ids: [seller.id],
                },
                session.accessToken
            );

            const channelId = res?.data?.channel?.id ?? res?.channel?.id;

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
            className={className ?? "flex-1 font-semibold"}
            style={style ?? { background: "var(--accent)", color: "var(--accent-foreground)" }}
            onPress={handleContact}
            isPending={loading}
        >
            Contactar vendedor
        </Button>
    );
}
