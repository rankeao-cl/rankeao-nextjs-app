"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner, Input, toast } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useDispute,
  useAddDisputeEvidence,
  useSendDisputeMessage,
} from "@/lib/hooks/use-marketplace";
import {
  ArrowLeft,
  TriangleExclamation,
  CircleCheck,
  Clock,
  Magnifier,
  Comment,
  FileText,
  ArrowShapeRight,
} from "@gravity-ui/icons";

// ── Types ──

interface DisputeEvidence {
  id: string;
  type: string;
  url: string;
  description: string;
  submitted_by: string;
  created_at: string;
}

interface DisputeMessage {
  id: string;
  sender_username: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface Dispute {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  description: string;
  desired_outcome: string;
  evidence_deadline: string;
  resolution: string;
  resolution_notes: string;
  refund_amount: number;
  resolved_at: string;
  order_number: string;
  opener_username: string;
  against_username: string;
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  created_at: string;
}

// ── Status helpers ──

type ChipColor = "warning" | "accent" | "success" | "danger" | "default";

const DISPUTE_STATUS_CONFIG: Record<
  string,
  { label: string; chipColor: ChipColor }
> = {
  OPEN:      { label: "Abierta",     chipColor: "warning" },
  EVIDENCE:  { label: "Evidencia",   chipColor: "accent" },
  REVIEWING: { label: "En revision", chipColor: "accent" },
  RESOLVED:  { label: "Resuelta",    chipColor: "success" },
};

function getStatusConfig(status: string) {
  return DISPUTE_STATUS_CONFIG[status.toUpperCase()] ?? DISPUTE_STATUS_CONFIG.OPEN;
}

const TIMELINE_STEPS = ["OPEN", "EVIDENCE", "REVIEWING", "RESOLVED"];

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status.toUpperCase());
  return idx >= 0 ? idx : 0;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  IMAGE: "Imagen",
  SCREENSHOT: "Captura",
  DOCUMENT: "Documento",
  TRACKING: "Seguimiento",
  TEXT: "Texto",
};

const EVIDENCE_TYPE_COLORS: Record<string, ChipColor> = {
  IMAGE: "accent",
  SCREENSHOT: "accent",
  DOCUMENT: "warning",
  TRACKING: "success",
  TEXT: "default",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Section Card ──

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="glass-sm border border-[var(--border)] mb-4">
      <Card.Header className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{title}</p>
      </Card.Header>
      <Card.Content className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        {children}
      </Card.Content>
    </Card>
  );
}

// ── Evidence Form ──

function EvidenceForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (type: string, url: string, description: string) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState("IMAGE");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!url.trim()) {
      toast.danger("Ingresa una URL o enlace");
      return;
    }
    onSubmit(type, url.trim(), description.trim());
    setUrl("");
    setDescription("");
  }

  return (
    <SectionCard title="Agregar evidencia">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Tipo</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="IMAGE">Imagen</option>
            <option value="SCREENSHOT">Captura de pantalla</option>
            <option value="DOCUMENT">Documento</option>
            <option value="TRACKING">Seguimiento de envio</option>
            <option value="TEXT">Texto</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">URL / Enlace</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Descripcion (opcional)</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] min-h-[60px] resize-none"
            placeholder="Describe brevemente la evidencia..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <Button
          variant="primary"
          className="w-full"
          isPending={isPending}
          onPress={handleSubmit}
        >
          Agregar evidencia
        </Button>
      </div>
    </SectionCard>
  );
}

// ── Message Form ──

function MessageForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (content: string) => void;
  isPending: boolean;
}) {
  const [content, setContent] = useState("");

  function handleSubmit() {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
        placeholder="Escribe un mensaje..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        variant="primary"
        size="sm"
        isPending={isPending}
        onPress={handleSubmit}
        className="shrink-0"
      >
        <ArrowShapeRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Main Page ──

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeId = params?.id as string;
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const { data, isLoading, isError, refetch } = useDispute(disputeId);

  const addEvidence = useAddDisputeEvidence();
  const sendMessage = useSendDisputeMessage();

  const dispute: Dispute | null = (() => {
    if (!data) return null;
    const raw = (data as any)?.data ?? (data as any)?.dispute ?? data;
    return raw as Dispute;
  })();

  async function handleAddEvidence(type: string, url: string, description: string) {
    try {
      await addEvidence.mutateAsync({
        disputeId,
        payload: { type, url, description },
      });
      toast.success("Evidencia agregada");
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al agregar evidencia");
    }
  }

  async function handleSendMessage(content: string) {
    try {
      await sendMessage.mutateAsync({
        disputeId,
        payload: { content },
      });
      toast.success("Mensaje enviado");
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al enviar mensaje");
    }
  }

  // ── Auth guard ──

  if (!isAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Inicia sesion para ver esta disputa
            </p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para acceder a los detalles de la disputa.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error / Not found ──

  if (isError || !dispute) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">Disputa no encontrada</p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Es posible que haya sido eliminada o el enlace sea incorrecto.
            </p>
            <Link href="/marketplace/orders">
              <Button variant="outline">Volver a ordenes</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const cfg = getStatusConfig(dispute.status);
  const status = dispute.status.toUpperCase();
  const timelineIdx = getTimelineIndex(dispute.status);
  const isResolved = status === "RESOLVED";

  // Filter out internal messages
  const visibleMessages = (dispute.messages ?? []).filter((m) => !m.is_internal);

  return (
    <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-12">
      {/* Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/marketplace/orders"
              className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
            </Link>
            <Chip color={cfg.chipColor} variant="soft" size="sm">
              {cfg.label}
            </Chip>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
            Disputa #{dispute.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Abierta el {formatDate(dispute.created_at)}
          </p>
        </div>
      </section>

      <div className="px-4 lg:px-6">
        {/* Status Timeline */}
        <SectionCard title="Progreso">
          <div className="flex flex-col gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const stepCfg = DISPUTE_STATUS_CONFIG[step] ?? DISPUTE_STATUS_CONFIG.OPEN;
              const isActive = i <= timelineIdx;
              const isCurrent = i === timelineIdx;
              return (
                <div key={step} className="flex items-start gap-3 min-h-[36px]">
                  <div className="flex flex-col items-center w-4">
                    <div
                      className={`w-3 h-3 rounded-full mt-0.5 ${
                        isActive
                          ? isCurrent
                            ? "ring-2 ring-[var(--accent)] bg-[var(--accent)]"
                            : "bg-green-500"
                          : "bg-[var(--border)]"
                      }`}
                    />
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`flex-1 w-0.5 my-0.5 ${
                          isActive && i < timelineIdx ? "bg-green-500" : "bg-[var(--border)]"
                        }`}
                        style={{ minHeight: 16 }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                    } ${isCurrent ? "font-bold" : ""}`}
                  >
                    {stepCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Dispute Info */}
        <SectionCard title="Informacion de la disputa">
          <div className="space-y-2">
            {[
              { label: "Motivo", value: dispute.reason },
              { label: "Descripcion", value: dispute.description },
              { label: "Resultado deseado", value: dispute.desired_outcome },
              { label: "Orden", value: dispute.order_number || dispute.order_id?.slice(-8).toUpperCase() },
              { label: "Abierta por", value: dispute.opener_username },
              { label: "Contra", value: dispute.against_username },
            ]
              .filter((row) => row.value)
              .map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <span className="text-sm text-[var(--muted)] shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-[var(--foreground)] text-right max-w-[60%] break-words">
                    {row.value}
                  </span>
                </div>
              ))}
          </div>
        </SectionCard>

        {/* Resolution (if resolved) */}
        {isResolved && dispute.resolution && (
          <SectionCard title="Resolucion">
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--surface-secondary)]">
                <CircleCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{dispute.resolution}</p>
                  {dispute.resolution_notes && (
                    <p className="text-xs text-[var(--muted)] mt-1">{dispute.resolution_notes}</p>
                  )}
                  {dispute.refund_amount > 0 && (
                    <p className="text-xs text-[var(--success)] mt-1">
                      Reembolso: ${dispute.refund_amount.toLocaleString("es-CL")}
                    </p>
                  )}
                  {dispute.resolved_at && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Resuelto el {formatDate(dispute.resolved_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Evidence deadline */}
        {dispute.evidence_deadline && !isResolved && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
            <Clock className="w-4 h-4 text-[var(--warning)] shrink-0" />
            <p className="text-xs text-[var(--muted)]">
              Plazo para evidencia: <span className="text-[var(--foreground)] font-semibold">{formatDate(dispute.evidence_deadline)}</span>
            </p>
          </div>
        )}

        {/* Evidence List */}
        <SectionCard title="Evidencia">
          {(dispute.evidence ?? []).length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted)]">No hay evidencia adjunta aun</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dispute.evidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-secondary)]"
                >
                  <div className="shrink-0 mt-0.5">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={EVIDENCE_TYPE_COLORS[item.type] ?? "default"}
                    >
                      {EVIDENCE_TYPE_LABELS[item.type] ?? item.type}
                    </Chip>
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--accent)] underline break-all"
                      >
                        {item.url}
                      </a>
                    )}
                    {item.description && (
                      <p className="text-xs text-[var(--muted)] mt-1">{item.description}</p>
                    )}
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {item.submitted_by} &middot; {formatShortDate(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Add Evidence (if not resolved) */}
        {!isResolved && (
          <EvidenceForm
            onSubmit={handleAddEvidence}
            isPending={addEvidence.isPending}
          />
        )}

        {/* Messages */}
        <SectionCard title="Mensajes">
          {visibleMessages.length === 0 ? (
            <div className="text-center py-6">
              <Comment className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted)]">No hay mensajes aun</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {visibleMessages.map((msg) => {
                const isOwn = msg.sender_username === session?.username;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? "bg-[var(--accent)] text-white rounded-br-sm"
                          : "bg-[var(--surface-secondary)] text-[var(--foreground)] rounded-bl-sm"
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-0.5 opacity-70">
                          {msg.sender_username}
                        </p>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-white/60" : "text-[var(--muted)]"
                        }`}
                      >
                        {formatShortDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Send Message (if not resolved) */}
          {!isResolved && (
            <MessageForm
              onSubmit={handleSendMessage}
              isPending={sendMessage.isPending}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
