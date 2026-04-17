"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Input } from "@heroui/react/input";
import { toast } from "@heroui/react/toast";

import { useRouter } from "next/navigation";
import { useBuyListing } from "@/lib/hooks/use-marketplace";
import type { CheckoutListingPayload, DeliveryMethod, Listing } from "@/lib/types/marketplace";


interface Props {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

const DELIVERY_OPTIONS: Array<{ key: DeliveryMethod; label: string }> = [
  { key: "IN_PERSON", label: "Retiro en persona" },
  { key: "SHIPPING", label: "Envio por courier" },
];

export default function BuyModal({ listing, open, onClose }: Props) {
  const router = useRouter();
  const buy = useBuyListing();
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryMethod>("IN_PERSON");
  const [address, setAddress] = useState({ name: "", address_line_1: "", city: "", region: "", phone: "" });

  const maxQty = listing.quantity ?? 1;
  const unitPrice = listing.price ?? 0;
  const total = unitPrice * quantity;
  const deliveryOptions = useMemo(
    () =>
      DELIVERY_OPTIONS.filter((option) =>
        (option.key === "SHIPPING" && listing.accepts_shipping) ||
        (option.key === "IN_PERSON" && listing.accepts_in_person) ||
        (!listing.accepts_shipping && !listing.accepts_in_person)
      ),
    [listing.accepts_in_person, listing.accepts_shipping]
  );
  const effectiveDelivery: DeliveryMethod =
    deliveryOptions.some((option) => option.key === delivery)
      ? delivery
      : (deliveryOptions[0]?.key || "IN_PERSON");

  if (!open) return null;

  async function handleBuy() {
    if (quantity < 1 || quantity > maxQty) {
      toast.danger("Cantidad invalida");
      return;
    }
    try {
      const payload: CheckoutListingPayload = {
        quantity,
        delivery_method: effectiveDelivery,
      };
      if (effectiveDelivery === "SHIPPING") {
        const fullName = address.name.trim();
        const addressLine1 = address.address_line_1.trim();
        const city = address.city.trim();
        const region = address.region.trim();
        const phone = address.phone.trim();
        if (!fullName || !addressLine1 || !city || !region || !phone) {
          toast.danger("Completa todos los campos de envio");
          return;
        }
        payload.shipping_address = {
          full_name: fullName,
          address_line_1: addressLine1,
          city,
          region,
          phone,
        };
      }
      const checkout = await buy.mutateAsync({ listingId: listing.id, payload });
      const checkoutId = checkout.id;
      toast.success("Compra iniciada");
      onClose();
      if (checkoutId) {
        router.push(`/marketplace/checkout/${checkoutId}`);
      } else {
        router.push("/marketplace/orders");
      }
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al comprar");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Cerrar compra"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <Card className="surface-card w-full max-w-md mx-4 rounded-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Card.Content className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Comprar</h2>

          {/* Item summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-secondary)" }}>
            <div className="w-12 h-16 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "var(--code-bg)" }}>
              {(listing.images?.[0]?.url || listing.card_image_url) ? (
                <Image src={listing.images?.[0]?.url || listing.card_image_url || ""} alt="" width={48} height={64} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl">🃏</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{listing.title}</p>
              <p className="text-xs text-[var(--muted)]">{listing.set_name}</p>
            </div>
          </div>

          {/* Quantity */}
          {maxQty > 1 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider m-0">Cantidad</p>
              <div className="flex items-center gap-2 mt-1">
                <Button size="sm" variant="secondary" isDisabled={quantity <= 1} onPress={() => setQuantity(q => q - 1)}>-</Button>
                <span className="text-sm font-bold text-[var(--foreground)] w-8 text-center">{quantity}</span>
                <Button size="sm" variant="secondary" isDisabled={quantity >= maxQty} onPress={() => setQuantity(q => q + 1)}>+</Button>
                <span className="text-xs text-[var(--muted)] ml-2">({maxQty} disponibles)</span>
              </div>
            </div>
          )}

          {/* Delivery method */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider m-0">Metodo de entrega</p>
            <div className="flex gap-2 mt-1">
              {deliveryOptions.map(o => (
                <Button
                  key={o.key}
                  size="sm"
                  variant={effectiveDelivery === o.key ? "primary" : "secondary"}
                  onPress={() => setDelivery(o.key)}
                >
                  {o.key === "SHIPPING" ? "📦" : "🤝"} {o.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          {effectiveDelivery === "SHIPPING" && (
            <div className="space-y-2">
              <Input aria-label="Nombre completo" placeholder="Nombre completo" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
              <Input aria-label="Direccion" placeholder="Direccion" value={address.address_line_1} onChange={(e) => setAddress({ ...address, address_line_1: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input aria-label="Ciudad" placeholder="Ciudad" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                <Input aria-label="Region" placeholder="Region" value={address.region} onChange={(e) => setAddress({ ...address, region: e.target.value })} />
              </div>
              <Input aria-label="Telefono" placeholder="Telefono" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm text-[var(--muted)]">Total</span>
            <span className="text-xl font-extrabold text-[var(--accent)]">${total.toLocaleString("es-CL")}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="tertiary" className="flex-1" onPress={onClose}>Cancelar</Button>
            <Button variant="primary" className="flex-1 font-semibold" isPending={buy.isPending} onPress={handleBuy}>
              Confirmar compra
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
