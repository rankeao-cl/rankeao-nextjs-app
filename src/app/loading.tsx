export default function Loading() {
  return (
    <div className="rk-container py-10 space-y-6 animate-pulse">
      <div className="surface-panel h-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card h-36" />
        <div className="surface-card h-36" />
        <div className="surface-card h-36" />
      </div>
      <div className="surface-panel h-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-card h-64" />
        <div className="surface-card h-64" />
        <div className="surface-card h-64" />
        <div className="surface-card h-64" />
      </div>
    </div>
  );
}
