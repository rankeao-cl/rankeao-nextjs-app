# Rankeao.cl Frontend Publico (Next.js)

## 1. Stack Tecnico

- `Next.js 16` (App Router)
- `React 19`
- `TypeScript`
- `HeroUI v3 beta` (`@heroui/react@3.0.0-beta.8`)
- `Tailwind CSS v4` + `@tailwindcss/postcss`

## 2. Direccion Visual Implementada

- Tema oscuro dominante (`negro/gris profundo`)
- Acentos neon (`morado`, `cyan`, `rojo`) y glows premium
- Tipografia:
  - `Rajdhani` para headings
  - `Inter` para texto cuerpo
- Navbar fija con links centrados + CTAs a la derecha (`Login`, `Registrate`)
- Hero landing alta, titular grande y secciones con lenguaje visual consistente

### Clases globales clave

Definidas en `src/app/globals.css`:

- `.rk-container`
- `.rk-hero`
- `.surface-panel`
- `.surface-card`
- `.section-title`
- `.section-subtitle`
- `.kicker`
- `.hero-title`
- `.hero-title-accent`
- `.neon-button`

## 3. Archivos Principales

- `tailwind.config.js`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/app/page.tsx`
- `src/app/torneos/page.tsx`
- `src/app/ranking/page.tsx`
- `src/app/marketplace/page.tsx`
- `src/app/comunidades/page.tsx`
- `src/app/juegos/page.tsx`
- `src/app/juegos/JuegosExplorer.tsx`
- `src/app/torneos/TorneosFilters.tsx`
- `src/app/marketplace/MarketplaceFilters.tsx`
- `src/app/comunidades/ComunidadesFilters.tsx`
- `src/app/ranking/RankingTabs.tsx`
- `src/components/TournamentCard.tsx`
- `src/components/ProductCard.tsx`
- `src/components/GameCard.tsx`
- `src/components/TenantCard.tsx`
- `src/components/LeaderboardTable.tsx`

Extras UX:

- `src/app/not-found.tsx` (404)
- `src/app/error.tsx` (error boundary UI)
- `src/app/loading.tsx` (skeleton style loading)
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`

## 4. API: Que se Usa y Donde

Valor por defecto (fallback interno en `src/lib/api.ts`):

Cliente: `src/lib/api.ts`

### Landing (`src/app/page.tsx`)

- `getTournaments({ sort: "upcoming", per_page: 6 })`
  - Seccion `/ Torneos Destacados`
- `getXpLeaderboard({ period: "all_time", per_page: 8 })`
  - Seccion `Rankings Globales Chile` (XP)
- `getGames()`
  - Seccion `Juegos Populares`
  - Juego base para rating
- `getGameFormats(gameSlug)`
  - Carga formatos cuando el juego no trae formatos embebidos
- `getRatingLeaderboard({ game, format, per_page: 8 })`
  - Seccion `Rankings Globales Chile` (Rating)
- `getListings({ sort: "newest", per_page: 8 })`
  - Seccion `Mercado Destacado`
- `getTenants({ sort: "rating-desc", per_page: 6 })`
  - Seccion `Tiendas Locales en Chile`
- `getBadges({ sort: "rarity-desc", per_page: 6 })`
  - Seccion `Gamificacion`
- `getSeasons()`
  - Badge de temporada activa en Hero

### Torneos (`src/app/torneos/page.tsx`)

- `getTournaments(...)` con filtros reales de query string:
  - `q`, `status`, `game`, `format`, `city`, `is_ranked`, `page`, `per_page`
- `getGames()`
  - Para selector de juego en filtros

### Ranking (`src/app/ranking/page.tsx`)

- `getXpLeaderboard({ period: "all_time", per_page: 20 })`
- `getGames()`
- `getGameFormats(gameSlug)`
- `getRatingLeaderboard({ game, format, per_page: 20 })`

### Marketplace (`src/app/marketplace/page.tsx`)

- `getListings(...)` con filtros reales:
  - `q`, `condition`, `min_price`, `max_price`, `sort`, `page`, `per_page`

### Comunidades (`src/app/comunidades/page.tsx`)

- `getTenants(...)` con filtros reales:
  - `q`, `city`, `region`, `min_rating`, `sort`, `page`, `per_page`

### Juegos (`src/app/juegos/page.tsx`)

- `getGames()`
- `getGameFormats(gameSlug)`
  - Enriquecimiento por juego cuando faltan formatos

## 5. Normalizacion de Payloads

Se agrego proteccion en varias vistas con `Array.isArray(...)` para evitar errores de prerender cuando la API devuelve estructura distinta a la esperada.

## 6. Metadata

- Metadata base global en `src/app/layout.tsx`
- Metadata dinamica por filtros en:
  - `src/app/torneos/page.tsx` (`generateMetadata`)
  - `src/app/marketplace/page.tsx` (`generateMetadata`)

## 7. Auth Integrada

Se conectaron estos endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`

Archivos clave:

- `src/context/AuthContext.tsx`
- `src/app/providers.tsx`
- `src/app/login/LoginForm.tsx`
- `src/app/register/RegisterForm.tsx`
- `src/components/Navbar.tsx`

## 8. Feature Flags

Definidos en `lib/flags.ts`. Se leen desde `NEXT_PUBLIC_*` en build time.

- `NEXT_PUBLIC_BUYER_WALLET_ENABLED` (default: `"false"`)
  - `true` → muestra el `DepositModal` y el boton "Recargar" en la sidebar/pagina de wallet.
  - `false` (actual) → el wallet de compradores queda oculto. Las compras se cobran directo via Transbank al pagar en el marketplace. El wallet pasa a ser usado solo para payouts de sellers (detectado via `useIsSeller`, que consulta `GET /marketplace/seller/me`).
