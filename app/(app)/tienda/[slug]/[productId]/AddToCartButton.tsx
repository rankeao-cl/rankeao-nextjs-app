"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { addCartItem } from "@/lib/api/store";
import { useAuth } from "@/lib/hooks/use-auth";

interface AddToCartButtonProps {
  slug: string;
  productId: string;
  price: number;
  maxStock: number;
}

export default function AddToCartButton({ slug, productId, price, maxStock }: AddToCartButtonProps) {
  const { session } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAdd = async () => {
    if (!session) {
      setMessage({ type: "error", text: "Debes iniciar sesion para agregar al carrito." });
      return;
    }
    setIsPending(true);
    setMessage(null);
    try {
      await addCartItem(slug, productId, quantity);
      setMessage({ type: "success", text: "Producto agregado al carrito." });
    } catch {
      setMessage({ type: "error", text: "No se pudo agregar al carrito." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-[var(--muted)]">Cantidad:</span>
        <div className="flex items-center gap-0 border border-[var(--border)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            -
          </button>
          <span className="px-4 py-2 text-sm font-bold text-[var(--foreground)] min-w-[40px] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
            className="px-3 py-2 text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            +
          </button>
        </div>
        <span className="text-sm font-bold text-[var(--foreground)]">
          ${(price * quantity).toLocaleString("es-CL")}
        </span>
      </div>

      <Button
        variant="primary"
        className="w-full rounded-xl"
        isPending={isPending}
        onPress={handleAdd}
      >
        Agregar al carrito
      </Button>

      {message && (
        <p className={`text-xs mt-2 ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
