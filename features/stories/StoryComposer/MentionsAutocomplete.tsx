"use client";

import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import Image from "next/image";
import { searchUsers, extractUserSearchResults } from "@/lib/api/social";
import type { UserSearchResult } from "@/lib/types/social";

type MentionsAutocompleteProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  textareaClassName?: string;
  textareaStyle?: React.CSSProperties;
  rows?: number;
  maxLength?: number;
};

type MentionSession = {
  start: number;
  query: string;
};

function getMentionAtCursor(value: string, cursor: number): MentionSession | null {
  const before = value.slice(0, cursor);
  const match = /(^|\s)@([\w]{0,20})$/.exec(before);
  if (!match) return null;
  const atIndex = cursor - match[2].length - 1;
  return { start: atIndex, query: match[2] };
}

function MentionsAutocompleteInner(
  { value, onChange, placeholder, textareaClassName, textareaStyle, rows = 3, maxLength = 120 }: MentionsAutocompleteProps,
  forwardedRef: Ref<HTMLTextAreaElement>
) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const [session, setSession] = useState<MentionSession | null>(null);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const resolveRef = (node: HTMLTextAreaElement | null) => {
    internalRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) (forwardedRef as { current: HTMLTextAreaElement | null }).current = node;
  };

  useEffect(() => {
    if (!session || session.query.length < 1) {
      setResults([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers({ q: session.query, per_page: 6 });
        setResults(extractUserSearchResults(res));
      } catch (error: unknown) {
        console.warn("Fallo buscando usuarios", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [session]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.slice(0, maxLength);
    onChange(next);
    const cursor = event.target.selectionStart ?? next.length;
    setSession(getMentionAtCursor(next, cursor));
  };

  const handleSelect = (username: string) => {
    if (!session) return;
    const before = value.slice(0, session.start);
    const after = value.slice(session.start + 1 + session.query.length);
    const inserted = `${before}@${username} ${after}`.slice(0, maxLength);
    onChange(inserted);
    setSession(null);
    setResults([]);
    // Restore focus after state update.
    window.requestAnimationFrame(() => {
      const node = internalRef.current;
      if (!node) return;
      const cursorPos = Math.min(inserted.length, session.start + username.length + 2);
      node.focus();
      node.setSelectionRange(cursorPos, cursorPos);
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={resolveRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={textareaClassName}
        style={textareaStyle}
      />
      {session && session.query.length >= 1 && (results.length > 0 || loading) && (
        <div
          className="absolute left-0 right-0 top-full z-[120] mt-1 max-h-56 overflow-y-auto rounded-xl border shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface-solid)" }}
        >
          {loading && (
            <p className="p-3 text-center text-xs" style={{ color: "var(--muted)" }}>
              Buscando...
            </p>
          )}
          {!loading &&
            results.map((user) => (
              <button
                key={user.id ?? user.username}
                type="button"
                onClick={() => handleSelect(user.username)}
                className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: "var(--surface)" }}
                >
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.username} width={32} height={32} className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">@{user.username}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const MentionsAutocomplete = forwardRef<HTMLTextAreaElement, MentionsAutocompleteProps>(MentionsAutocompleteInner);
MentionsAutocomplete.displayName = "MentionsAutocomplete";

export default MentionsAutocomplete;
