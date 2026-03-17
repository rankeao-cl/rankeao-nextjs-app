// Static game branding — logo images stored in /public/games/

export interface GameBrand {
  logo: string;       // path to local logo in /public/games/
  color: string;      // brand primary color
  bg: string;         // dark background for gradients
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
