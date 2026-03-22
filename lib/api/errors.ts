/**
 * Centralised API error handling.
 *
 * Architecture:
 *  1. ApiError     — typed Error subclass carrying the backend `code` and HTTP `status`.
 *  2. ERROR_CODES  — Record<code, message> for O(1) lookup by backend error code.
 *  3. RUNTIME_PATTERNS — small regex list for browser/network errors that never reach the API.
 *  4. mapErrorMessage(err) — single entry-point used by every component.
 *  5. parseErrorResponse(res) — extracts { code, message } from any backend error shape.
 */

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(code: string, message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
    }
}

// ---------------------------------------------------------------------------
// Backend error codes → Spanish UI messages  (O(1) lookup)
// ---------------------------------------------------------------------------

const ERROR_CODES: Record<string, string> = {
    // ── Auth ──
    EMAIL_TAKEN:            "Este correo ya esta en uso",
    USERNAME_TAKEN:         "Este nombre de usuario ya esta en uso",
    INVALID_CREDENTIALS:    "Correo o contraseña incorrectos",
    INVALID_REFRESH_TOKEN:  "Tu sesion ha expirado. Inicia sesion nuevamente",
    INVALID_TOKEN:          "El enlace ha expirado o no es valido",
    PASSWORD_TOO_SHORT:     "La contraseña debe tener al menos 8 caracteres",
    ALREADY_VERIFIED:       "Tu correo ya esta verificado",
    UNAUTHORIZED:           "Debes iniciar sesion",

    // ── Duelos ──
    CANNOT_SELF_DUEL:       "No puedes desafiarte a ti mismo",
    NOT_CHALLENGED:         "Solo el jugador desafiado puede realizar esta accion",
    NOT_CHALLENGER:         "Solo el retador puede realizar esta accion",
    NOT_PARTICIPANT:        "No eres participante de este duelo",
    CONFIRMER_IS_REPORTER:  "No puedes confirmar tu propio resultado. Espera a tu oponente",
    ALREADY_REPORTED:       "Ya fue reportado",
    INVALID_SCORE:          "El puntaje ingresado no es valido",
    TOO_FAR_AWAY:           "Estas demasiado lejos de tu oponente",
    NO_CHALLENGED_USER:     "No hay un oponente asignado en este duelo",
    DUEL_NOT_FOUND:         "Duelo no encontrado",

    // ── Torneos ──
    TOURNAMENT_NOT_FOUND:   "Torneo no encontrado",
    TOURNAMENT_FULL:        "El torneo esta lleno",
    ALREADY_REGISTERED:     "Ya estas inscrito",
    NOT_REGISTERED:         "No estas inscrito en este torneo",
    NOT_ENOUGH_PLAYERS:     "No hay suficientes jugadores para iniciar",
    REGISTRATION_CLOSED:    "Las inscripciones estan cerradas",
    CHECK_IN_NOT_OPEN:      "El check-in no esta disponible",
    ALREADY_CHECKED_IN:     "Ya hiciste check-in",
    TOURNAMENT_NOT_STARTED: "El torneo aun no ha comenzado",
    ALREADY_DROPPED:        "Ya te retiraste de este torneo",
    PRIVATE_NO_INVITATION:  "Este torneo es privado y requiere invitacion",
    BELOW_MIN_ELO:          "No cumples con el ELO minimo requerido",
    JUDGE_NOT_FOUND:        "Juez no encontrado",
    JUDGE_ALREADY_ASSIGNED: "El juez ya esta asignado",
    ROUND_NOT_COMPLETE:     "La ronda actual no ha terminado",
    MAX_ROUNDS_REACHED:     "Se alcanzo el maximo de rondas",

    // ── Clanes ──
    CLAN_NOT_FOUND:         "Clan no encontrado",
    CLAN_FULL:              "El clan esta lleno",
    CLAN_NAME_TAKEN:        "El nombre del clan ya esta en uso",
    CLAN_TAG_TAKEN:         "El tag del clan ya esta en uso",
    CLAN_NOT_RECRUITING:    "El clan no esta reclutando en este momento",
    ALREADY_IN_CLAN:        "Ya perteneces a un clan",
    NOT_LEADER:             "Solo el lider del clan puede realizar esta accion",
    NOT_LEADER_OR_OFFICER:  "Solo el lider u oficial puede realizar esta accion",
    NOT_IN_CLAN:            "No perteneces a este clan",
    LEADER_CANNOT_LEAVE:    "El lider no puede abandonar el clan. Transfiere el liderazgo primero",
    TARGET_ALREADY_OFFICER: "Este miembro ya es oficial",
    TARGET_ALREADY_MEMBER:  "Este miembro ya tiene rol de miembro",
    TARGET_ALREADY_LEADER:  "Este miembro ya es el lider",
    CANNOT_KICK_LEADER:     "No puedes expulsar al lider del clan",
    ALREADY_INVITED:        "Ya hay una invitacion pendiente para este usuario",
    ALREADY_APPLIED:        "Ya tienes una solicitud pendiente",
    INVITATION_NOT_PENDING: "La invitacion ya no esta pendiente",
    TARGET_NOT_MEMBER:      "El usuario no es miembro de este clan",

    // ── Chat ──
    POST_EMPTY:             "El mensaje no puede estar vacio",
    POST_TOO_LONG:          "El mensaje excede los 2000 caracteres",
    CHANNEL_NOT_FOUND:      "Canal no encontrado",
    MESSAGE_NOT_FOUND:      "Mensaje no encontrado",
    NOT_MEMBER:             "No eres miembro de este canal",
    EDIT_WINDOW_EXPIRED:    "Ya paso el tiempo para editar este mensaje",
    MESSAGE_DELETED:        "El mensaje fue eliminado",
    DM_EXACTLY_TWO:         "Un mensaje directo requiere exactamente 2 participantes",
    NAME_REQUIRED:          "Los grupos requieren un nombre",
    NOT_GROUP_CHANNEL:      "Esta accion solo aplica para grupos",
    CHANNEL_READONLY:       "Este canal es de solo lectura",
    CANNOT_LEAVE_DM:        "No puedes abandonar un mensaje directo",

    // ── Social ──
    CANNOT_FRIEND_SELF:      "No puedes enviarte una solicitud a ti mismo",
    CANNOT_FOLLOW_SELF:      "No puedes seguirte a ti mismo",
    CANNOT_BLOCK_SELF:       "No puedes bloquearte a ti mismo",
    ALREADY_FRIENDS:         "Ya son amigos",
    REQUEST_ALREADY_PENDING: "Ya hay una solicitud de amistad pendiente",
    ALREADY_FOLLOWING:       "Ya sigues a este usuario",
    ALREADY_BLOCKED:         "Este usuario ya esta bloqueado",
    NOT_FRIENDS:             "No son amigos",
    NOT_FOLLOWING:           "No sigues a este usuario",
    NOT_BLOCKED:             "Este usuario no esta bloqueado",
    BLOCKED:                 "Accion bloqueada por el usuario",
    REQUEST_NOT_PENDING:     "La solicitud ya no esta pendiente",
    NOT_ADDRESSEE:           "Solo el destinatario puede responder esta solicitud",
    FRIENDSHIP_NOT_FOUND:    "Amistad no encontrada",

    // ── Marketplace ──
    LISTING_NOT_FOUND:      "Publicacion no encontrada",
    LISTING_NOT_ACTIVE:     "La publicacion no esta activa",
    OFFERS_NOT_ACCEPTED:    "Esta publicacion no acepta ofertas",
    AMOUNT_TOO_LOW:         "El monto esta por debajo del minimo aceptado",
    CANNOT_OFFER_OWN_ITEM:  "No puedes ofertar en tu propia publicacion",
    OFFER_NOT_PENDING:      "La oferta ya no esta pendiente",
    MAX_COUNTER_DEPTH:      "Se alcanzo el maximo de contraofertas",
    NOT_COUNTER_OFFER:      "Esta oferta no es una contraoferta",
    SELLER_NOT_FOUND:       "Perfil de vendedor no encontrado",
    OUT_OF_STOCK:           "Sin stock disponible",

    // ── Tienda ──
    CART_EMPTY:                  "El carrito esta vacio",
    ORDER_ALREADY_CANCELLED:     "La orden ya fue cancelada",
    ORDER_ALREADY_SHIPPED:       "La orden ya fue enviada",
    ORDER_ALREADY_DISPUTED:      "La orden ya tiene una disputa activa",
    INVALID_STATUS_TRANSITION:   "No se puede cambiar al estado solicitado",
    INVALID_ORDER_STATUS:        "La orden no se puede disputar en este estado",
    REVIEW_ALREADY_EXISTS:       "Ya dejaste una reseña para esta orden",
    PAYMENT_METHOD_UNAVAILABLE:  "Metodo de pago no disponible",
    DELIVERY_METHOD_UNAVAILABLE: "Metodo de envio no disponible",
    PRODUCT_UNAVAILABLE:         "Producto no disponible",
    INSUFFICIENT_STOCK:          "Stock insuficiente",
    DUPLICATE_SKU:               "Ya existe un producto con este SKU",
    PRODUCT_HAS_PENDING_ORDERS:  "El producto tiene ordenes pendientes y no puede ser modificado",
    PLAN_LIMIT_REACHED:          "Alcanzaste el limite de productos de tu plan",
    INVALID_RARITY:              "Rareza no valida",

    // ── Cupones ──
    DUPLICATE_CODE:         "Ya existe un cupon con este codigo",
    COUPON_EXPIRED:         "El cupon ha expirado",
    COUPON_LIMIT_REACHED:   "El cupon alcanzo su limite de uso",
    COUPON_USER_LIMIT:      "Ya usaste este cupon el maximo de veces",
    COUPON_MIN_PURCHASE:    "El pedido no alcanza el monto minimo para este cupon",
    COUPON_NOT_APPLICABLE:  "El cupon no aplica para estos productos",

    // ── Tenant ──
    TENANT_NOT_FOUND:         "Tienda no encontrada",
    ALREADY_PUBLIC:           "La tienda ya es publica",
    ALREADY_PRIVATE:          "La tienda ya es privada",
    NOT_VERIFIED:             "La tienda debe estar verificada primero",
    SLUG_TAKEN:               "Esta URL ya esta en uso",
    SLUG_INVALID:             "La URL debe ser alfanumerica en minusculas con guiones, entre 3 y 60 caracteres",
    SLUG_COOLDOWN:            "Solo puedes cambiar la URL una vez cada 30 dias",
    LAST_ADMIN:               "No puedes eliminar al ultimo administrador",
    STAFF_LIMIT_REACHED:      "Alcanzaste el limite de staff de tu plan",
    CANNOT_CHANGE_OWNER:      "No puedes cambiar el rol del propietario",
    CANNOT_REMOVE_OWNER:      "No puedes eliminar al propietario",
    CANNOT_REMOVE_SELF:       "No puedes eliminarte a ti mismo del staff",
    CANNOT_PROMOTE_OWNER:     "No puedes promover a propietario por este medio",
    ALREADY_STAFF:            "El usuario ya es parte del staff",
    OWNER_ONLY:               "Solo el propietario puede realizar esta accion",
    INSUFFICIENT_ROLE:        "No tienes el rol suficiente para esta accion",
    MAX_TENANTS:              "Alcanzaste el maximo de tiendas permitidas",
    ALREADY_REVIEWED:         "Ya dejaste una reseña",
    OWN_TENANT:               "No puedes dejar una reseña en tu propia tienda",
    TENANT_NOT_FOLLOWED:      "No sigues esta tienda",
    TENANT_ALREADY_FOLLOWED:  "Ya sigues esta tienda",
    ALREADY_CANCELLED:        "La suscripcion ya esta pendiente de cancelacion",
    INVALID_TRANSITION:       "Transicion de estado no valida",

    // ── Gamificacion ──
    BADGE_NOT_FOUND:       "Insignia no encontrada",
    BADGE_INACTIVE:        "La insignia esta inactiva",
    CATEGORY_TAKEN:        "El nombre de categoria ya esta en uso",
    SEASON_NOT_FOUND:      "Temporada no encontrada",
    SEASON_NOT_ACTIVE:     "La temporada no esta activa",
    OVERLAPPING_SEASON:    "Ya existe una temporada activa en ese periodo",
    SEASON_ALREADY_CLOSED: "La temporada ya esta cerrada",

    // ── Catalogo ──
    COLLECTOR_NUMBER_TAKEN: "El numero de coleccion ya existe en este set",
    SET_CODE_TAKEN:         "El codigo del set ya existe para este juego",
    CARD_NOT_FOUND:         "Carta no encontrada",
    PRINTING_NOT_FOUND:     "Edicion no encontrada",
    SET_NOT_FOUND:          "Set no encontrado",
    FORMAT_NOT_FOUND:       "Formato no encontrado",
    GAME_NOT_FOUND:         "Juego no encontrado",

    // ── Notificaciones ──
    NOTIFICATION_NOT_FOUND: "Notificacion no encontrada",

    // ── Genéricos ──
    INVALID_STATUS:   "El estado actual no permite esta accion",
    FORBIDDEN:        "Acceso denegado",
    NOT_FOUND:        "Recurso no encontrado",
    VALIDATION:       "Datos ingresados no son validos",
    VALIDATION_ERROR: "Datos ingresados no son validos",
    INTERNAL:         "Error del servidor. Intenta mas tarde",
    INTERNAL_ERROR:   "Error del servidor. Intenta mas tarde",
    BAD_REQUEST:      "Solicitud no valida",
    USER_NOT_FOUND:   "Usuario no encontrado",
    MATCH_NOT_FOUND:  "Partida no encontrada",
    CATEGORY_NOT_FOUND: "Categoria no encontrada",
};

// ---------------------------------------------------------------------------
// Browser / network errors  (never reach the backend)
// ---------------------------------------------------------------------------

const RUNTIME_PATTERNS: [RegExp, string][] = [
    [/failed to fetch|fetch failed|networkerror/i, "Error de conexion. Verifica tu internet"],
    [/abort|cancel/i,                              "La solicitud fue cancelada"],
    [/timeout|timed?\s*out/i,                      "La solicitud tardo demasiado. Intenta de nuevo"],
    [/cors|cross-origin/i,                         "Error de conexion con el servidor"],
];

const FALLBACK = "Ocurrio un error inesperado";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Convierte cualquier error en un mensaje amigable en español. */
export function mapErrorMessage(err: unknown): string {
    // 1. ApiError → O(1) code lookup
    if (err instanceof ApiError) {
        const mapped = ERROR_CODES[err.code];
        if (mapped) return mapped;

        if (process.env.NODE_ENV === "development") {
            console.warn(`[error-map] Codigo no mapeado: "${err.code}" — "${err.message}"`);
        }
        return FALLBACK;
    }

    // 2. Cualquier otro error → extraer mensaje raw
    const raw = typeof err === "string" ? err
        : err instanceof Error           ? err.message
        : "";
    if (!raw) return FALLBACK;

    // 3. Errores de runtime del navegador
    for (const [pattern, msg] of RUNTIME_PATTERNS) {
        if (pattern.test(raw)) return msg;
    }

    // 4. Si el texto ya parece español, pasar tal cual
    if (!HAS_ENGLISH.test(raw)) return raw;

    return FALLBACK;
}

const HAS_ENGLISH = /\b(error|failed|not found|invalid|unauthorized|forbidden|timeout|cannot|unable|already|expired|required|missing|something went wrong)\b/i;

// ---------------------------------------------------------------------------
// Response parser  (shared between client.ts and any manual fetch)
// ---------------------------------------------------------------------------

/** Extrae { code, message } del body de un error HTTP del backend. */
export async function parseErrorResponse(
    res: Response,
): Promise<{ code: string; message: string }> {
    let code = `HTTP_${res.status}`;
    let message = res.statusText || "Unknown error";

    try {
        const body = await res.json();

        // Formato estándar: { error: { code, message } }
        if (body?.error?.code) {
            code = body.error.code;
            message = body.error.message ?? message;
        }
        // Flat: { code, message }
        else if (typeof body?.code === "string") {
            code = body.code;
            message = body.message ?? message;
        }
        // Legacy: { message }
        else if (typeof body?.message === "string") {
            message = body.message;
        }
        // Legacy: { error: "string" }
        else if (typeof body?.error === "string") {
            message = body.error;
        }
    } catch {
        // Body no era JSON — usamos los defaults de status/statusText
    }

    return { code, message };
}
