import { apiPost, apiDelete } from "./client";

export type EntityType =
    | "user_profile"
    | "user_cover"
    | "store_logo"
    | "store_cover"
    | "product_image"
    | "tournament_cover"
    | "game_cover";

export interface PresignResponse {
    upload_url: string;
    key: string;
    expires_at: string;
}

export interface ImageRecord {
    id: string;
    entity_type: EntityType;
    entity_id: string;
    public_url: string;
    content_type: string;
    size_bytes: number;
    created_at: string;
}

// ── Presign ──

export async function presignImage(
    entityType: EntityType,
    contentType: string,
    token?: string,
    entityId?: string
) {
    return apiPost<{ success: boolean; data: PresignResponse }>(
        "/images/presign",
        { entity_type: entityType, content_type: contentType, entity_id: entityId ?? "" },
        { token }
    );
}

// ── Upload directo a R2 (PUT con presigned URL) ──

export async function uploadToR2(presignedUrl: string, file: File): Promise<void> {
    const res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}

// ── Confirm ──

export async function confirmImage(
    key: string,
    entityType: EntityType,
    token?: string,
    entityId?: string
) {
    return apiPost<{ success: boolean; data: ImageRecord }>(
        "/images/confirm",
        { key, entity_type: entityType, entity_id: entityId ?? "" },
        { token }
    );
}

// ── Flujo completo (presign → upload → confirm) ──

export async function uploadImage(
    file: File,
    entityType: EntityType,
    token?: string,
    entityId?: string
): Promise<ImageRecord> {
    const presignRes = await presignImage(entityType, file.type, token, entityId);
    const { upload_url, key } = presignRes.data;

    await uploadToR2(upload_url, file);

    const confirmRes = await confirmImage(key, entityType, token, entityId);
    return confirmRes.data;
}

// ── Delete ──

export async function deleteImage(imageId: string, token?: string) {
    return apiDelete<{ success: boolean }>(`/images/${imageId}`, { token });
}
