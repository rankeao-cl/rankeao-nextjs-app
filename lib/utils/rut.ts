// Utilidades de validacion/formato de RUT chileno.
// Copia canonica para reuso desde varios componentes. El backend es
// la fuente de verdad; estas funciones son solo feedback de UI.

export function cleanRut(input: string): string {
    return input.replace(/\./g, "").replace(/-/g, "").toUpperCase().trim();
}

export function computeRutDv(rutDigits: string): string {
    let sum = 0;
    let multiplier = 2;
    for (let i = rutDigits.length - 1; i >= 0; i--) {
        sum += parseInt(rutDigits[i], 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return "0";
    if (remainder === 10) return "K";
    return String(remainder);
}

export function isValidRut(input: string): boolean {
    const cleaned = cleanRut(input);
    if (cleaned.length < 2) return false;
    const digits = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    if (!/^\d+$/.test(digits)) return false;
    if (!/^[0-9K]$/.test(dv)) return false;
    return computeRutDv(digits) === dv;
}

export function formatRut(input: string): string {
    const cleaned = cleanRut(input);
    if (cleaned.length < 2) return input;
    const digits = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots}-${dv}`;
}
