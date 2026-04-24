/**
 * Feature flags de la app.
 *
 * Los flags controlan features en desarrollo o pivots de producto. Se leen
 * desde variables de entorno expuestas al browser (prefijo `NEXT_PUBLIC_*`)
 * y quedan inlined en el bundle en build time — por eso no deben usarse
 * para proteger endpoints privados, sólo para ocultar UI.
 */

/**
 * Habilita el wallet para BUYERS (recarga de saldo vía DepositModal,
 * botón "Recargar" en la sidebar, etc).
 *
 * El pivot actual apunta a que los compradores paguen directo vía Transbank
 * al momento de la compra, así que por defecto queda en `false` y el wallet
 * pasa a ser usado sólo para payouts de sellers.
 *
 * Para reactivarlo en Vercel/Railway: setear `NEXT_PUBLIC_BUYER_WALLET_ENABLED=true`.
 */
export const BUYER_WALLET_ENABLED =
    process.env.NEXT_PUBLIC_BUYER_WALLET_ENABLED === "true";
