import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererInnerProps {
    content: string;
    className?: string;
}

const components: Components = {
    h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: "16px 0 8px" }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: "14px 0 6px" }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: "12px 0 4px" }}>{children}</h3>,
    p: ({ children }) => <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.6, margin: "0 0 8px" }}>{children}</p>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{children}</a>,
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: "var(--foreground)" }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: "var(--foreground)" }}>{children}</em>,
    ul: ({ children }) => <ul style={{ margin: "4px 0 8px", paddingLeft: 20, listStyleType: "disc" }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: "4px 0 8px", paddingLeft: 20, listStyleType: "decimal" }}>{children}</ol>,
    li: ({ children }) => <li style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.6, marginBottom: 2 }}>{children}</li>,
    blockquote: ({ children }) => (
        <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12, margin: "8px 0", color: "var(--muted)" }}>
            {children}
        </blockquote>
    ),
    code: ({ className, children }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) {
            return (
                <code style={{
                    display: "block",
                    backgroundColor: "var(--code-bg)",
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: "var(--code-fg)",
                    overflowX: "auto",
                    whiteSpace: "pre",
                    margin: "8px 0",
                }}>
                    {children}
                </code>
            );
        }
        return (
            <code style={{
                backgroundColor: "var(--overlay)",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: 13,
                fontFamily: "monospace",
                color: "var(--code-fg)",
            }}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
    table: ({ children }) => (
        <div style={{ overflowX: "auto", margin: "8px 0" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
        </div>
    ),
    th: ({ children }) => <th style={{ borderBottom: "1px solid var(--border)", padding: "6px 10px", textAlign: "left", color: "var(--foreground)", fontWeight: 700 }}>{children}</th>,
    td: ({ children }) => <td style={{ borderBottom: "1px solid var(--surface)", padding: "6px 10px", color: "var(--foreground)" }}>{children}</td>,
};

export default function MarkdownRendererInner({ content, className }: MarkdownRendererInnerProps) {
    return (
        <div className={className}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
