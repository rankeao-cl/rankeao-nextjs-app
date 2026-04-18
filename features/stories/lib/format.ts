export function toInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatElapsedLabel(dateValue?: string): string {
  if (!dateValue) return "Ahora";
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return "Ahora";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (elapsedMinutes < 1) return "Ahora";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} d`;
}
