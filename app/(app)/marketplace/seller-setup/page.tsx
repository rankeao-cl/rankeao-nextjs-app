"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Button, Spinner, Switch, toast } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  getMySellerProfile,
  setupSellerProfile,
  updateSellerProfile,
  addBankAccount,
  deleteBankAccount,
} from "@/lib/api/marketplace";
import type { SellerProfile, BankAccount } from "@/lib/types/marketplace";
import { ArrowLeft } from "@gravity-ui/icons";

const REGIONS = [
  "Arica y Parinacota",
  "Tarapaca",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaiso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Nuble",
  "Biobio",
  "La Araucania",
  "Los Rios",
  "Los Lagos",
  "Aysen",
  "Magallanes",
];

// ── Section Card ──

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="glass-sm border border-[var(--border)] mb-4">
      <Card.Header className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{title}</p>
      </Card.Header>
      <Card.Content className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        {children}
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function SellerSetupPage() {
  const { status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";
  const router = useRouter();

  // Form state
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [acceptsShipping, setAcceptsShipping] = useState(true);
  const [acceptsInPerson, setAcceptsInPerson] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_type: "CORRIENTE", account_number: "", holder_name: "", holder_rut: "" });
  const [bankSaving, setBankSaving] = useState(false);

  // Loading state
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing profile
  useEffect(() => {
    if (!isAuth) {
      setProfileLoading(false);
      return;
    }
    getMySellerProfile()
      .then((res) => {
        const profile = (res?.data ?? res?.seller ?? res) as SellerProfile & {
          accepts_shipping?: boolean;
          accepts_in_person?: boolean;
        };
        if (profile?.user_id) {
          setIsEditing(true);
          setStoreName(profile.display_name ?? profile.username ?? "");
          setBio(profile.bio ?? "");
          setCity(profile.city ?? "");
          setRegion(profile.region ?? "");
          setAcceptsShipping(profile.accepts_shipping ?? true);
          setAcceptsInPerson(profile.accepts_in_person ?? false);
        }
      })
      .catch(() => {
        // No existing profile, that's fine
      })
      .finally(() => setProfileLoading(false));
  }, [isAuth]);

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast.danger("Error", { description: "Ingresa un nombre para tu tienda" });
      return;
    }
    if (!city.trim() || !region.trim()) {
      toast.danger("Error", { description: "Ingresa tu ciudad y region" });
      return;
    }
    if (!isEditing && !acceptTerms) {
      toast.danger("Error", { description: "Debes aceptar los terminos y condiciones" });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateSellerProfile({
          display_name: storeName,
          bio,
          city,
          region,
          accepts_shipping: acceptsShipping,
          accepts_in_person: acceptsInPerson,
        });
        toast.success("Perfil actualizado", { description: "Los cambios se guardaron correctamente." });
      } else {
        await setupSellerProfile({
          store_name: storeName,
          bio,
          city,
          region,
          accept_terms: acceptTerms,
          accepts_shipping: acceptsShipping,
          accepts_in_person: acceptsInPerson,
        });
        toast.success("Perfil creado", { description: "Tu perfil de vendedor fue creado exitosamente." });
      }
      router.push("/marketplace");
    } catch {
      // Error handled by API client
    } finally {
      setSaving(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion</p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para configurar tu perfil de vendedor.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-12">
      {/* Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/marketplace"
              className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
            </Link>
            <Chip color="accent" variant="soft" size="sm" className="px-3">
              Vendedor
            </Chip>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            {isEditing ? "Editar perfil de vendedor" : "Configurar tienda"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {isEditing
              ? "Actualiza la informacion de tu perfil de vendedor."
              : "Completa el formulario para comenzar a vender en el marketplace."}
          </p>
        </div>
      </section>

      <div className="px-4 lg:px-6">
        {/* Store Info */}
        <SectionCard title="Informacion de la tienda">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)]">Nombre de la tienda</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Ej: Mi Tienda TCG"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)]">Descripcion (opcional)</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] min-h-[80px] resize-none"
                placeholder="Cuenta sobre tu tienda..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard title="Ubicacion">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)]">Ciudad</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Ej: Santiago"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] mb-2">Region</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      region === r
                        ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {region && (
                <p className="text-sm text-[var(--accent)] font-semibold mt-2">
                  Seleccionado: {region}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Delivery Methods */}
        <SectionCard title="Metodos de entrega">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-[var(--foreground)]">Envio por courier</span>
              <Switch
                isSelected={acceptsShipping}
                onChange={setAcceptsShipping}
                size="sm"
              />
            </div>
            <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between py-1">
              <span className="text-sm font-medium text-[var(--foreground)]">Entrega en persona</span>
              <Switch
                isSelected={acceptsInPerson}
                onChange={setAcceptsInPerson}
                size="sm"
              />
            </div>
          </div>
        </SectionCard>

        {/* Bank Accounts (only in edit mode) */}
        {isEditing && (
          <SectionCard title="Cuentas bancarias">
            <div className="space-y-3">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{acc.bank_name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {acc.account_type === "CORRIENTE" ? "Cuenta Corriente" : acc.account_type === "VISTA" ? "Cuenta Vista" : "Cuenta RUT"}
                        {acc.account_number_last4 ? ` ****${acc.account_number_last4}` : ""}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{acc.holder_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onPress={async () => {
                        if (!confirm("Eliminar esta cuenta bancaria?")) return;
                        try {
                          await deleteBankAccount(acc.id);
                          setBankAccounts((prev) => prev.filter((a) => a.id !== acc.id));
                          toast.success("Cuenta eliminada");
                        } catch { toast.danger("Error al eliminar"); }
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No tienes cuentas bancarias registradas.</p>
              )}

              {!showBankForm ? (
                <Button size="sm" variant="secondary" onPress={() => setShowBankForm(true)}>
                  + Agregar cuenta
                </Button>
              ) : (
                <div className="space-y-3 p-4 rounded-xl border border-[var(--border)]">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--muted)]">Banco</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                      placeholder="Ej: Banco de Chile"
                      value={bankForm.bank_name}
                      onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted)] mb-1 block">Tipo de cuenta</label>
                    <div className="flex gap-2">
                      {[{ k: "CORRIENTE", l: "Corriente" }, { k: "VISTA", l: "Vista" }, { k: "RUT", l: "RUT" }].map((t) => (
                        <button
                          key={t.k}
                          onClick={() => setBankForm({ ...bankForm, account_type: t.k })}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${bankForm.account_type === t.k ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border)] text-[var(--muted)]"}`}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--muted)]">Numero de cuenta</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                      value={bankForm.account_number}
                      onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)]">Titular</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                        value={bankForm.holder_name}
                        onChange={(e) => setBankForm({ ...bankForm, holder_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)]">RUT</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                        placeholder="12.345.678-9"
                        value={bankForm.holder_rut}
                        onChange={(e) => setBankForm({ ...bankForm, holder_rut: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="tertiary" onPress={() => setShowBankForm(false)}>Cancelar</Button>
                    <Button
                      size="sm"
                      variant="primary"
                      isPending={bankSaving}
                      onPress={async () => {
                        if (!bankForm.bank_name || !bankForm.account_number || !bankForm.holder_name) {
                          toast.danger("Completa todos los campos");
                          return;
                        }
                        setBankSaving(true);
                        try {
                          const res = await addBankAccount(bankForm);
                          const newAcc = res?.bank_account ?? res;
                          setBankAccounts((prev) => [...prev, newAcc]);
                          setBankForm({ bank_name: "", account_type: "CORRIENTE", account_number: "", holder_name: "", holder_rut: "" });
                          setShowBankForm(false);
                          toast.success("Cuenta agregada");
                        } catch { toast.danger("Error al agregar cuenta"); }
                        finally { setBankSaving(false); }
                      }}
                    >
                      Guardar cuenta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Terms (only for new setup) */}
        {!isEditing && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <Switch
              isSelected={acceptTerms}
              onChange={setAcceptTerms}
              size="sm"
            />
            <p className="text-sm text-[var(--muted)]">
              Acepto los terminos y condiciones del marketplace
            </p>
          </div>
        )}

        {/* Save Button */}
        <Button
          variant="primary"
          className="w-full"
          size="lg"
          isPending={saving}
          onPress={handleSave}
        >
          {isEditing ? "Guardar cambios" : "Crear perfil de vendedor"}
        </Button>
      </div>
    </div>
  );
}
