interface RatingBarProps {
    label: string;
    value: number;
    max?: number;
}

export default function RatingBar({ label, value, max = 5 }: RatingBarProps) {
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
