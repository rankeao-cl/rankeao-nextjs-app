"use client";

import type { RefObject } from "react";

interface MarkdownToolbarProps {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    content: string;
    onChange: (content: string) => void;
}

type ToolbarAction = {
    label: string;
    title: string;
    action: (content: string, start: number, end: number) => { newContent: string; cursorPos: number };
};

const actions: ToolbarAction[] = [
    {
        label: "H",
        title: "Titulo",
        action: (content, start, end) => {
            const before = content.slice(0, start);
            const selected = content.slice(start, end) || "Titulo";
            const after = content.slice(end);
            const lineStart = before.lastIndexOf("\n") + 1;
            const prefix = before.slice(lineStart);
            const newContent = before.slice(0, lineStart) + "## " + prefix + selected + after;
            return { newContent, cursorPos: lineStart + 3 + prefix.length + selected.length };
        },
    },
    {
        label: "B",
        title: "Negrita",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "texto";
            const newContent = content.slice(0, start) + `**${selected}**` + content.slice(end);
            return { newContent, cursorPos: start + 2 + selected.length };
        },
    },
    {
        label: "I",
        title: "Cursiva",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "texto";
            const newContent = content.slice(0, start) + `*${selected}*` + content.slice(end);
            return { newContent, cursorPos: start + 1 + selected.length };
        },
    },
    {
        label: "\uD83D\uDD17",
        title: "Enlace",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "enlace";
            const newContent = content.slice(0, start) + `[${selected}](url)` + content.slice(end);
            return { newContent, cursorPos: start + selected.length + 3 };
        },
    },
    {
        label: "\u2022",
        title: "Lista",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "elemento";
            const newContent = content.slice(0, start) + `- ${selected}` + content.slice(end);
            return { newContent, cursorPos: start + 2 + selected.length };
        },
    },
    {
        label: "1.",
        title: "Lista numerada",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "elemento";
            const newContent = content.slice(0, start) + `1. ${selected}` + content.slice(end);
            return { newContent, cursorPos: start + 3 + selected.length };
        },
    },
    {
        label: "</>",
        title: "Codigo",
        action: (content, start, end) => {
            const selected = content.slice(start, end);
            if (selected.includes("\n")) {
                const newContent = content.slice(0, start) + "```\n" + selected + "\n```" + content.slice(end);
                return { newContent, cursorPos: start + 4 + selected.length };
            }
            const text = selected || "codigo";
            const newContent = content.slice(0, start) + "`" + text + "`" + content.slice(end);
            return { newContent, cursorPos: start + 1 + text.length };
        },
    },
    {
        label: "\u201C",
        title: "Cita",
        action: (content, start, end) => {
            const selected = content.slice(start, end) || "cita";
            const newContent = content.slice(0, start) + `> ${selected}` + content.slice(end);
            return { newContent, cursorPos: start + 2 + selected.length };
        },
    },
];

export default function MarkdownToolbar({ textareaRef, content, onChange }: MarkdownToolbarProps) {
    function handleAction(action: ToolbarAction["action"]) {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const { newContent, cursorPos } = action(content, start, end);
        onChange(newContent);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
        });
    }

    return (
        <div style={{
            display: "flex",
            gap: 2,
            padding: "6px 8px",
            borderBottom: "1px solid var(--surface)",
            backgroundColor: "var(--surface-tertiary)",
            borderRadius: "12px 12px 0 0",
            flexWrap: "wrap",
        }}>
            {actions.map((a) => (
                <button
                    key={a.title}
                    type="button"
                    title={a.title}
                    onClick={() => handleAction(a.action)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--muted)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--overlay)";
                        e.currentTarget.style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--muted)";
                    }}
                >
                    {a.label}
                </button>
            ))}
        </div>
    );
}
