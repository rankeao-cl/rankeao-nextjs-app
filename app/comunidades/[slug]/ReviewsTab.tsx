"use client";

import { useState } from "react";
import { useTenantReviews, useCreateTenantReview } from "@/lib/hooks/use-tenants";
import { Avatar, Button, Modal, Input } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import type { TenantReview } from "@/lib/types/tenant";

interface Props {
    tenantSlug: string;
    tenantName: string;
}

function StarRating({
    value,
    onChange,
    readonly = false,
    size = "md",
}: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}) {
    const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
    return (
        <div className={`flex gap-0.5 ${sizeClass}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
                        star <= value ? "text-[var(--warning)]" : "text-[var(--border)]"
                    }`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

function RatingBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right text-[var(--muted)] font-medium">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: "var(--warning)" }}
                />
            </div>
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "hace instantes";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

export default function ReviewsTab({ tenantSlug, tenantName }: Props) {
    const { session, status } = useAuth();
    const isAuth = status === "authenticated" && Boolean(session?.email);
    const { data, isLoading } = useTenantReviews(tenantSlug);
    const createReview = useCreateTenantReview();

    const [showModal, setShowModal] = useState(false);
    const [formRating, setFormRating] = useState(5);
    const [formComment, setFormComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reviews: TenantReview[] = data?.reviews ?? [];
    const stats = data?.stats;

    const avgRating = stats?.average_rating ?? (reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
        : 0);
    const totalCount = stats?.total_count ?? reviews.length;
    const distribution = stats?.distribution ?? {};

    const handleSubmit = async () => {
        if (!isAuth || !formComment.trim()) return;
        setSubmitting(true);
        try {
            await createReview.mutateAsync({
                slug: tenantSlug,
                data: {
                    overall_rating: formRating,
                    comment: formComment.trim(),
                },
            });
            setShowModal(false);
            setFormComment("");
            setFormRating(5);
        } catch {
            // silent
        }
        setSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Opiniones de Clientes</h2>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Opiniones de Clientes</h2>
                {isAuth && (
                    <Button
                        size="sm"
                        variant="primary"
                        className="font-semibold bg-[var(--accent)] text-[var(--accent-foreground)]"
                        onPress={() => setShowModal(true)}
                    >
                        Escribir reseña
                    </Button>
                )}
            </div>

            {/* Average Rating Summary */}
            {reviews.length > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex flex-col items-center gap-1 min-w-[120px]">
                        <span className="text-4xl font-extrabold text-[var(--foreground)]">
                            {avgRating.toFixed(1)}
                        </span>
                        <StarRating value={Math.round(avgRating)} readonly size="md" />
                        <span className="text-xs text-[var(--muted)]">{totalCount} reseña{totalCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 w-full max-w-xs">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <RatingBar
                                key={star}
                                label={String(star)}
                                value={distribution[String(star)] || 0}
                                max={totalCount || 1}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                        >
                            <div className="flex items-start gap-3">
                                <Avatar size="sm" className="flex-shrink-0">
                                    {review.avatar_url ? (
                                        <Avatar.Image src={review.avatar_url} />
                                    ) : null}
                                    <Avatar.Fallback className="text-[10px]">
                                        {(review.username || "A")[0]?.toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">
                                            {review.is_anonymous ? "Anonimo" : review.username || "Usuario"}
                                        </span>
                                        {review.created_at && (
                                            <span className="text-xs text-[var(--muted)] flex-shrink-0">
                                                {timeAgo(review.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    <StarRating value={review.overall_rating} readonly size="sm" />
                                    {review.comment && (
                                        <p className="text-sm text-[var(--foreground)]/80 mt-2 leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                    <div className="size-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/20">
                        💬
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Sé el primero en opinar</h3>
                    <p className="text-[var(--muted)] max-w-md">
                        Comparte tu experiencia con {tenantName} para ayudar a otros miembros de la comunidad.
                    </p>
                    {isAuth && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="mt-4 font-semibold bg-[var(--accent)] text-[var(--accent-foreground)]"
                            onPress={() => setShowModal(true)}
                        >
                            Escribir reseña
                        </Button>
                    )}
                </div>
            )}

            {/* Write Review Modal */}
            <Modal>
                <Modal.Backdrop isOpen={showModal} onOpenChange={setShowModal}>
                    <Modal.Container>
                        <Modal.Dialog className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full">
                            <Modal.CloseTrigger className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]" />
                            <Modal.Header className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
                                <Modal.Heading className="text-lg font-bold text-[var(--foreground)]">Escribir reseña para {tenantName}</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body className="px-6 py-4">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--foreground)] mb-2 block">
                                            Calificación general
                                        </label>
                                        <StarRating value={formRating} onChange={setFormRating} size="lg" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--foreground)] mb-2 block">
                                            Comentario
                                        </label>
                                        <textarea
                                            value={formComment}
                                            onChange={(e) => setFormComment(e.target.value)}
                                            placeholder="Comparte tu experiencia..."
                                            rows={4}
                                            className="w-full rounded-xl p-3 text-sm bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)]"
                                        />
                                    </div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="px-6 py-4 flex justify-end gap-2 border-t border-[var(--border)]">
                                <Button variant="secondary" onPress={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    className="bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold"
                                    onPress={handleSubmit}
                                    isDisabled={submitting || !formComment.trim()}
                                >
                                    {submitting ? "Enviando..." : "Publicar reseña"}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}
