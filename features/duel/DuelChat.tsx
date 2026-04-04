"use client";

import Image from "next/image";
import { Comment } from "@gravity-ui/icons";
import { timeAgo } from "@/lib/utils/format";

// ── Types ──

export interface DuelComment {
    id: string;
    username?: string;
    avatar_url?: string;
    content?: string;
    text?: string;
    created_at?: string;
}

export interface DuelChatProps {
    comments: DuelComment[];
    commentText: string;
    sendingComment: boolean;
    isMyDuel: boolean;
    onCommentTextChange: (text: string) => void;
    onSendComment: () => void;
}

// ── Desktop sidebar ──

function ChatMessages({ comments }: { comments: DuelComment[] }) {
    if (!Array.isArray(comments) || comments.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-xs" style={{ color: "var(--muted)" }}>Sin mensajes aun</p>
            </div>
        );
    }

    return (
        <>
            {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                        {c.avatar_url ? (
                            <Image src={c.avatar_url} alt="" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{c.username || "Usuario"}</span>
                            {c.created_at && <span className="text-[10px]" style={{ color: "var(--muted)" }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                        </div>
                        <p className="text-[13px] leading-[19px] m-0 mt-0.5" style={{ color: "var(--foreground)" }}>{c.content || c.text}</p>
                    </div>
                </div>
            ))}
        </>
    );
}

function ChatInput({ commentText, sendingComment, onCommentTextChange, onSendComment, size = "default" }: {
    commentText: string;
    sendingComment: boolean;
    onCommentTextChange: (text: string) => void;
    onSendComment: () => void;
    size?: "default" | "compact";
}) {
    const inputStyle = size === "compact"
        ? { backgroundColor: "var(--surface-solid)", borderRadius: 99, border: "1px solid var(--border)", padding: "10px 16px", color: "var(--foreground)" }
        : { backgroundColor: "var(--background)", borderRadius: 99, border: "1px solid var(--border)", padding: "10px 14px", color: "var(--foreground)" };

    return (
        <div className={`flex items-center gap-2 ${size === "default" ? "pt-3 border-t" : ""}`} style={size === "default" ? { borderColor: "var(--border)" } : undefined}>
            <input
                type="text"
                placeholder={size === "compact" ? "Mensaje..." : "Escribe un mensaje..."}
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSendComment(); }}
                maxLength={300}
                className="flex-1 text-[13px] outline-none"
                style={inputStyle}
            />
            <button
                onClick={onSendComment}
                disabled={!commentText.trim() || sendingComment}
                className="px-4 py-2.5 rounded-full border-none text-xs font-bold text-white shrink-0"
                style={{
                    backgroundColor: "var(--accent)",
                    cursor: !commentText.trim() || sendingComment ? "not-allowed" : "pointer",
                    opacity: !commentText.trim() || sendingComment ? 0.4 : 1,
                }}
            >
                {sendingComment ? "..." : "Enviar"}
            </button>
        </div>
    );
}

// ── Main component ──

export default function DuelChat({
    comments,
    commentText,
    sendingComment,
    isMyDuel,
    onCommentTextChange,
    onSendComment,
}: DuelChatProps) {
    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden 2xl:block fixed" style={{
                top: "50%", transform: "translateY(-50%)",
                left: "calc(50% + 540px)",
                width: "calc(100vw - 50% - 556px)",
                maxWidth: 320, minWidth: 240,
                maxHeight: "70vh",
            }}>
                <div className="flex flex-col gap-3 rounded-2xl border p-4 h-full" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)", maxHeight: "70vh" }}>
                    <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                        <Comment style={{ width: 16, height: 16, color: "var(--foreground)" }} />
                        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Chat del duelo</span>
                        {comments.length > 0 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                                {comments.length}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[200px]" style={{ scrollbarWidth: "thin", maxHeight: "calc(80vh - 140px)" }}>
                        <ChatMessages comments={comments} />
                    </div>

                    {isMyDuel && (
                        <ChatInput
                            commentText={commentText}
                            sendingComment={sendingComment}
                            onCommentTextChange={onCommentTextChange}
                            onSendComment={onSendComment}
                        />
                    )}
                </div>
            </div>

            {/* Mobile chat */}
            <div className="2xl:hidden mb-4">
                {comments.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                        {comments.map((c) => (
                            <div key={c.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                                    {c.avatar_url ? (
                                        <Image src={c.avatar_url} alt="" width={24} height={24} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span className="text-[9px] font-bold" style={{ color: "var(--muted)" }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>{c.username || "Usuario"}</span>
                                    {c.created_at && <span className="text-[9px] ml-1.5" style={{ color: "var(--muted)" }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                                    <p className="text-[13px] leading-[18px] m-0 mt-0.5" style={{ color: "var(--foreground)" }}>{c.content || c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {isMyDuel && (
                    <ChatInput
                        commentText={commentText}
                        sendingComment={sendingComment}
                        onCommentTextChange={onCommentTextChange}
                        onSendComment={onSendComment}
                        size="compact"
                    />
                )}
            </div>
        </>
    );
}
