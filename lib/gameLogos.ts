// Static game branding — logo images stored in /public/games/

export interface GameBrand {
  logo: string;       // path to local logo in /public/games/
  color: string;      // brand primary color
  bg: string;         // dark background for gradients
  banner?: string;    // optional static banner image path
}

const gameBrands: Record<string, GameBrand> = {
  magic:                { logo: "/games/magic.svg",              color: "#F0A500", bg: "#1A0A00" },
  pokemon:              { logo: "/games/pokemon.svg",            color: "#FFCB05", bg: "#003A70" },
  yugioh:               { logo: "/games/yugioh.svg",             color: "#FFD700", bg: "#1a002e" },
  onepiece:             { logo: "/games/onepiece.svg",           color: "#E74C3C", bg: "#1A0000" },
  lorcana:              { logo: "/games/lorcana.svg",            color: "#A78BFA", bg: "#0A0030" },
  digimon:              { logo: "/games/digimon.svg",            color: "#3B82F6", bg: "#001030" },
  "flesh-and-blood":    { logo: "/games/flesh-and-blood.svg",    color: "#DC2626", bg: "#2A0000" },
  "star-wars-unlimited":{ logo: "/games/star-wars-unlimited.svg",color: "#FACC15", bg: "#0A0A0A" },
};

const defaultBrand: GameBrand = { logo: "", color: "#3B82F6", bg: "#0A0A1A" };

export function getGameBrand(slug: string): GameBrand {
  return gameBrands[slug] || defaultBrand;
}

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
