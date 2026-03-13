import Link from "next/link";
import { Card, Avatar, Chip } from "@heroui/react";
import type { Tenant } from "@/lib/types/tenant";

function renderStars(rating?: number) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < full; i++) stars.push("★");
  if (half) stars.push("☆");
  return (
    <span className="text-[var(--foreground)] text-sm tracking-wider">{stars.join("")}</span>
  );
}

export default function TenantCard({ tenant }: { tenant: Tenant }) {
  return (
    <Link href={`/comunidades/${tenant.slug || tenant.id}`} className="block">
      <Card className="surface-card card-hover overflow-hidden h-full">
        <Card.Content className="p-4 gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              className="ring-2 ring-[var(--border)] bg-[var(--surface-secondary)] shrink-0"
            >
              <Avatar.Image src={tenant.logo_url || undefined} alt={tenant.name || "Tienda"} />
              <Avatar.Fallback>{tenant.name?.charAt(0)?.toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--foreground)] text-base truncate">{tenant.name}</h3>
              {tenant.city && (
                <p className="text-[var(--muted)] text-xs truncate font-medium">
                  📍 {tenant.city}
                  {tenant.region ? `, ${tenant.region}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tenant.rating != null && tenant.rating > 0 && (
              <div className="flex items-center gap-1">
                {renderStars(tenant.rating)}
                <span className="text-[var(--muted)] text-xs font-semibold">
                  ({tenant.review_count ?? 0})
                </span>
              </div>
            )}
            {tenant.is_public && (
              <Chip size="sm" color="success" variant="soft" className="text-xs font-semibold">
                Activa
              </Chip>
            )}
          </div>

          {tenant.description && (
            <p className="text-[var(--muted)] text-xs line-clamp-2">{tenant.description}</p>
          )}
        </Card.Content>
      </Card>
    </Link>
  );
}
