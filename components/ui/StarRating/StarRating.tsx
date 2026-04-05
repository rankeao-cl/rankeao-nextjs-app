interface StarRatingProps {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export default function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
    const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
    return (
        <div role={readonly ? undefined : "radiogroup"} aria-label="Calificacion" className={`flex gap-0.5 ${sizeClass}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    aria-label={`${star} de 5 estrellas`}
                    aria-pressed={!readonly ? star === value : undefined}
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
