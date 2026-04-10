"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Xmark } from "@gravity-ui/icons";
import { updateProfile } from "@/lib/api/social";
import { uploadImage } from "@/lib/api/images";
import type { UserProfile } from "@/lib/types/social";

interface ProfileEditModalProps {
    profile: UserProfile;
    token?: string;
    onClose: () => void;
    onSaved: (updated: Partial<UserProfile>) => void;
}

const COUNTRIES = [
    { code: "", label: "Ninguno" },
    { code: "CL", label: "Chile" },
    { code: "AR", label: "Argentina" },
    { code: "MX", label: "Mexico" },
    { code: "CO", label: "Colombia" },
    { code: "PE", label: "Peru" },
];

const INPUT_CLASSES = "w-full text-[15px] py-3.5 px-4 bg-transparent border-none outline-none";

export default function ProfileEditModal({ profile, token, onClose, onSaved }: ProfileEditModalProps) {
    const [bio, setBio] = useState(profile?.bio || "");
    const [city, setCity] = useState(profile?.city || "");
    const [country, setCountry] = useState(profile?.country_code || profile?.country || "");
    const [displayName, setDisplayName] = useState(profile?.display_name || profile?.name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || "");
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const initial = (profile?.display_name || profile?.name || profile?.username || "?")[0]?.toUpperCase();

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        setUploadingAvatar(true);
        try {
            const img = await uploadImage(file, "user_profile", token);
            setAvatarUrl(img.public_url);
        } catch (err) {
            console.error("Error subiendo avatar:", err);
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        setUploadingBanner(true);
        try {
            const img = await uploadImage(file, "user_cover", token);
            setBannerUrl(img.public_url);
        } catch (err) {
            console.error("Error subiendo banner:", err);
        } finally {
            setUploadingBanner(false);
            e.target.value = "";
        }
    };

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const payload: Record<string, string> = {};
            if (bio !== (profile?.bio || "")) payload.bio = bio;
            if (city !== (profile?.city || "")) payload.city = city;
            if (country !== (profile?.country_code || profile?.country || "")) payload.country = country;
            if (displayName !== (profile?.display_name || profile?.name || "")) payload.display_name = displayName;
            if (avatarUrl !== (profile?.avatar_url || "")) payload.avatar_url = avatarUrl;
            if (bannerUrl !== (profile?.banner_url || "")) payload.banner_url = bannerUrl;

            if (Object.keys(payload).length === 0) {
                onClose();
                return;
            }

            await updateProfile(payload, token);
            onSaved({ ...profile, ...payload });
        } catch (err: unknown) {
            console.error(err instanceof Error ? err.message : "Error al actualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Modal */}
            <div
                className="relative w-full max-w-[480px] rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col"
                style={{ backgroundColor: "var(--background)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-4"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none"
                        style={{ backgroundColor: "var(--surface-solid)" }}
                    >
                        <Xmark width={20} height={20} color="var(--foreground)" />
                    </button>
                    <span className="text-[17px] font-bold" style={{ color: "var(--foreground)" }}>Perfil</span>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploadingAvatar || uploadingBanner}
                        className="rounded-[20px] px-[18px] py-2 text-[13px] font-bold border-none text-white"
                        style={{
                            backgroundColor: "var(--accent)",
                            cursor: (saving || uploadingAvatar || uploadingBanner) ? "not-allowed" : "pointer",
                            opacity: (saving || uploadingAvatar || uploadingBanner) ? 0.6 : 1,
                        }}
                    >
                        {saving ? "..." : "Guardar"}
                    </button>
                </div>

                {/* Banner — clickable para subir imagen */}
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleBannerFile} />
                <button
                    type="button"
                    className="h-[140px] overflow-hidden relative w-full border-none p-0 cursor-pointer group"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                >
                    {bannerUrl ? (
                        <Image src={bannerUrl} alt="" fill sizes="480px" className="object-cover" />
                    ) : (
                        <div className="w-full h-full relative">
                            <div className="absolute inset-0 h-1/2" style={{ backgroundColor: "var(--surface-solid)" }} />
                            <div className="absolute inset-x-0 top-1/2 h-1/2" style={{ backgroundColor: "var(--surface-solid-secondary)" }} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingBanner
                            ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Camera width={28} height={28} color="white" />
                        }
                    </div>
                </button>

                {/* Avatar — clickable, overlapping banner */}
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarFile} />
                <div className="-mt-10 pl-4 mb-3">
                    <button
                        type="button"
                        className="relative w-20 h-20 rounded-full border-none p-0 cursor-pointer group"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                    >
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt=""
                                width={80}
                                height={80}
                                className="object-cover rounded-full"
                                style={{ border: "4px solid var(--background)" }}
                            />
                        ) : (
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "var(--surface-solid)", border: "4px solid var(--background)" }}
                            >
                                <span className="text-[28px] font-extrabold text-white">{initial}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploadingAvatar
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Camera width={20} height={20} color="white" />
                            }
                        </div>
                    </button>
                </div>

                {/* Form fields */}
                <div className="px-4 pb-6">
                    {/* Display Name */}
                    <p className="text-[11px] font-bold tracking-wide mb-2 ml-1" style={{ color: "var(--muted)" }}>
                        NOMBRE PARA MOSTRAR
                    </p>
                    <div className="rounded-xl overflow-hidden mb-5" style={{ backgroundColor: "var(--surface-solid)" }}>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tu nombre publico"
                            className={INPUT_CLASSES}
                            style={{ color: "var(--foreground)" }}
                        />
                    </div>

                    {/* Bio */}
                    <p className="text-[11px] font-bold tracking-wide mb-2 ml-1" style={{ color: "var(--muted)" }}>BIO</p>
                    <div className="rounded-xl overflow-hidden mb-5" style={{ backgroundColor: "var(--surface-solid)" }}>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Cuentanos sobre ti..."
                            maxLength={300}
                            rows={3}
                            className={INPUT_CLASSES + " min-h-[88px] resize-none"}
                            style={{ color: "var(--foreground)" }}
                        />
                        <p className="text-[11px] text-right px-4 pb-2.5" style={{ color: "var(--muted)" }}>
                            {bio.length}/300
                        </p>
                    </div>

                    {/* Location */}
                    <p className="text-[11px] font-bold tracking-wide mb-2 ml-1" style={{ color: "var(--muted)" }}>INFORMACION</p>
                    <div className="rounded-xl overflow-hidden mb-5" style={{ backgroundColor: "var(--surface-solid)" }}>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ciudad"
                            className={INPUT_CLASSES}
                            style={{ color: "var(--foreground)" }}
                        />
                        <div className="h-px ml-4" style={{ backgroundColor: "var(--border)" }} />
                        <div className="flex flex-wrap gap-2 p-3 px-4">
                            {COUNTRIES.map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => setCountry(c.code)}
                                    className="px-3 py-1.5 rounded-2xl text-[13px] border-none cursor-pointer"
                                    style={{
                                        backgroundColor: country === c.code ? "var(--accent)" : "var(--surface)",
                                        color: country === c.code ? "#FFFFFF" : "var(--muted)",
                                        fontWeight: country === c.code ? 600 : 400,
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
