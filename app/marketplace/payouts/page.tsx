"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePayouts, usePayoutDetail } from "@/lib/hooks/use-marketplace";
import { ArrowLeft, CircleCheck, Clock, CircleXmark } from "@gravity-ui/icons";

type ChipColor = "warning" | "success" | "danger" | "default" | "accent";

const PAYOUT_STATUS: Record<string, { label: string; color: ChipColor }> = {
  PENDING: { label: "Pendiente", color: "warning" },
  PROCESSING: { label: "Procesando", color: "accent" },
  COMPLETED: { label: "Completado", color: "success" },
  FAILED: { label: "Fallido", color: "danger" },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function PayoutDetailInline({ payoutId }: { payoutId: string }) {
  const { data, isLoading } = usePayoutDetail(payoutId);
  if (isLoading) return <Spinner size="sm" />;
  if (!data) return <p className="text-xs text-[var(--muted)]">Sin detalles</p>;

  const payout = (data as any)?.data ?? data;
  const items = payout?.items || [];

  return (
    <div className="mt-3 space-y-2">
      {payout.bank_reference && (
        <p className="text-xs text-[var(--muted)]">Referencia: <span className="text-[var(--foreground)]">{payout.bank_reference}</span></p>
      )}
      {payout.failure_reason && (
        <p className="text-xs text-[var(--danger)]">{payout.failure_reason}</p>
      )}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] mb-1">Ordenes incluidas:</p>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-[var(--border)]">
              <span className="text-[var(--muted)]">Orden {item.order_id?.slice(-8)}</span>
              <span className="text-[var(--foreground)] font-semibold">${(item.amount ?? 0).toLocaleString("es-CL")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PayoutsPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";
  const { data, isLoading, isError } = usePayouts();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center">
            <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion</p>
            <p className="text-sm text-[var(--muted)]">Necesitas una cuenta para ver tus pagos.</p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const payouts = Array.isArray(data) ? data : (data as any)?.payouts ?? (data as any)?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/marketplace"
          className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Mis pagos</h1>
          <p className="text-sm text-[var(--muted)]">Historial de pagos recibidos por tus ventas</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {isError && (
        <Card className="surface-card">
          <Card.Content className="py-8 text-center">
            <p className="text-[var(--danger)] font-semibold">Error al cargar pagos</p>
          </Card.Content>
        </Card>
      )}

      {!isLoading && !isError && payouts.length === 0 && (
        <Card className="surface-card">
          <Card.Content className="py-16 text-center">
            <p className="text-3xl mb-3">💰</p>
            <p className="text-[var(--foreground)] font-semibold mb-1">Sin pagos</p>
            <p className="text-sm text-[var(--muted)]">Tus pagos por ventas completadas aparecaran aqui.</p>
          </Card.Content>
        </Card>
      )}

      {payouts.map((payout: any) => {
        const st = PAYOUT_STATUS[payout.status?.toUpperCase()] ?? PAYOUT_STATUS.PENDING;
        const isExpanded = expandedId === payout.id;

        return (
          <Card key={payout.id} className="surface-card rounded-xl">
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip color={st.color} variant="soft" size="sm">{st.label}</Chip>
                    <span className="text-xs text-[var(--muted)]">{formatDate(payout.created_at)}</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--foreground)]">
                    ${(payout.amount ?? 0).toLocaleString("es-CL")}
                    <span className="text-xs font-normal text-[var(--muted)] ml-1">{payout.currency || "CLP"}</span>
                  </p>
                  {payout.order_count > 0 && (
                    <p className="text-xs text-[var(--muted)]">{payout.order_count} {payout.order_count === 1 ? "orden" : "ordenes"}</p>
                  )}
                </div>
                <Button size="sm" variant="tertiary" onPress={() => setExpandedId(isExpanded ? null : payout.id)}>
                  {isExpanded ? "Cerrar" : "Ver detalle"}
                </Button>
              </div>
              {isExpanded && <PayoutDetailInline payoutId={payout.id} />}
            </Card.Content>
          </Card>
        );
      })}
    </div>
  );
}
