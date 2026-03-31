"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createChannel } from "@/lib/api/chat";
import { autocompleteUsers } from "@/lib/api/social";

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
            // Resolve the seller's user_id from their username
            const usersRes = await autocompleteUsers(sellerUsername, session.accessToken) as any;
            const users = usersRes?.data?.users || usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
            const seller = users.find((u: any) => u.username === sellerUsername);

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
            className="flex-1 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            onPress={handleContact}
            isPending={loading}
        >
            Contactar vendedor
        </Button>
    );
}
