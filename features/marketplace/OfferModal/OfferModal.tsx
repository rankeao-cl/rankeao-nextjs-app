"use client";

import { useState } from "react";
import { Button, Card, Input } from "@heroui/react";
import { useCreateOffer } from "@/lib/hooks/use-marketplace";
import type { Listing } from "@/lib/types/marketplace";
import { toast } from "@heroui/react";

interface Props {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

export default function OfferModal({ listing, open, onClose }: Props) {
  const createOffer = useCreateOffer();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleSubmit() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      toast.danger("Ingresa un monto valido");
      return;
    }
    try {
      await createOffer.mutateAsync({
        listingId: listing.id,
        payload: { amount: numAmount, message: message || undefined },
      });
      toast.success("Oferta enviada");
      setAmount("");
      setMessage("");
      onClose();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al enviar oferta");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="surface-card w-full max-w-sm mx-4 rounded-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Card.Content className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Hacer oferta</h2>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-secondary)" }}>
            <div className="w-10 h-14 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "var(--code-bg)" }}>
              {(listing.images?.[0]?.url || listing.card_image_url) ? (
                <img src={listing.images?.[0]?.url || listing.card_image_url} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🃏</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{listing.title}</p>
              <p className="text-xs text-[var(--muted)]">
                Precio: ${(listing.price ?? 0).toLocaleString("es-CL")} CLP
              </p>
            </div>
          </div>

          <Input
            aria-label="Monto de tu oferta (CLP)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto de tu oferta (CLP) Ej: 5000"
          />

          <Input
            aria-label="Mensaje (opcional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensaje (opcional) Hola, me interesa..."
          />

          <div className="flex gap-3 pt-2">
            <Button variant="tertiary" className="flex-1" onPress={onClose}>Cancelar</Button>
            <Button variant="primary" className="flex-1 font-semibold" isPending={createOffer.isPending} onPress={handleSubmit}>
              Enviar oferta
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
