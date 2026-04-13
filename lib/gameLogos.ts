// Static game branding — logo images stored in /public/games/

export interface GameBrand {
  logo: string;       // path to local logo in /public/games/
  color: string;      // brand primary color
  bg: string;         // dark background for gradients
  banner?: string;    // optional static banner image path
  /** Tailwind classes to apply on the <img> so the logo is visible on any theme background */
  logoCls: string;
}

// logoCls: "dark:brightness-0 dark:invert" inverts black SVG paths to white on dark themes.
// Use "dark:brightness-0 dark:invert opacity-90" for slightly softer rendering.
const DARK_LOGO = "dark:brightness-0 dark:invert";

const gameBrands: Record<string, GameBrand> = {
  magic:                { logo: "/games/magic.svg",              color: "#F0A500", bg: "#1A0A00", logoCls: DARK_LOGO },
  pokemon:              { logo: "/games/pokemon.svg",            color: "#FFCB05", bg: "#003A70", logoCls: DARK_LOGO },
  yugioh:               { logo: "/games/yugioh.svg",             color: "#FFD700", bg: "#1a002e", logoCls: DARK_LOGO },
  onepiece:             { logo: "/games/onepiece.svg",           color: "#E74C3C", bg: "#1A0000", logoCls: DARK_LOGO },
  lorcana:              { logo: "/games/lorcana.svg",            color: "#A78BFA", bg: "#0A0030", logoCls: DARK_LOGO },
  digimon:              { logo: "/games/digimon.svg",            color: "#3B82F6", bg: "#001030", logoCls: DARK_LOGO },
  "flesh-and-blood":    { logo: "/games/flesh-and-blood.svg",    color: "#DC2626", bg: "#2A0000", logoCls: DARK_LOGO },
  "star-wars-unlimited":{ logo: "/games/star-wars-unlimited.svg",color: "#FACC15", bg: "#0A0A0A", logoCls: DARK_LOGO },
};

const defaultBrand: GameBrand = { logo: "", color: "#3B82F6", bg: "#0A0A1A", logoCls: "" };

// Alias map: various names/slugs → canonical key
const aliases: Record<string, string> = {
  "magic: the gathering": "magic",
  "magicthegathering": "magic",
  "mtg": "magic",
  "pokémon tcg": "pokemon",
  "pokemontcg": "pokemon",
  "ptcg": "pokemon",
  "yu-gi-oh!": "yugioh",
  "yu-gi-oh": "yugioh",
  "ygo": "yugioh",
  "one piece card game": "onepiece",
  "onepiececardgame": "onepiece",
  "opcg": "onepiece",
  "disney lorcana": "lorcana",
  "disneylorcana": "lorcana",
  "digimon card game": "digimon",
  "digimoncardgame": "digimon",
  "dcg": "digimon",
  "flesh and blood": "flesh-and-blood",
  "fleshandblood": "flesh-and-blood",
  "fab": "flesh-and-blood",
  "star wars: unlimited": "star-wars-unlimited",
  "starwarsunlimited": "star-wars-unlimited",
  "swu": "star-wars-unlimited",
};

function resolveSlug(input: string): string {
  if (!input) return "";
  // Direct match
  if (gameBrands[input]) return input;
  // Lowercase match
  const lower = input.toLowerCase();
  if (gameBrands[lower]) return lower;
  // Alias match
  if (aliases[lower]) return aliases[lower];
  // Strip non-alphanumeric and try alias
  const stripped = lower.replace(/[^a-z0-9]/g, "");
  if (aliases[stripped]) return aliases[stripped];
  // Partial match: check if any brand key is contained in the input
  for (const key of Object.keys(gameBrands)) {
    if (lower.includes(key)) return key;
  }
  return input;
}

export function getGameBrand(slug: string): GameBrand {
  return gameBrands[resolveSlug(slug)] || defaultBrand;
}

/** Resolve any game name/slug to canonical key */
export { resolveSlug as resolveGameSlug };

/** CSS background for tournament banners — rich gradient per game */
export function getGameBannerStyle(slug: string): React.CSSProperties {
  const brand = getGameBrand(slug);
  // If a static banner exists, use it
  if (brand.banner) {
    return {
      backgroundImage: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%), url(${brand.banner})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  // Dynamic gradient with game color accent
  const c = brand.color;
  return {
    background: `radial-gradient(ellipse at 70% 20%, ${c}18 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${c}10 0%, transparent 50%), linear-gradient(145deg, ${brand.bg} 0%, #0a0a0e 50%, ${brand.bg}cc 100%)`,
  };
}
