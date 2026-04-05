import {
    House,
    Cup,
    TargetDart,
    ChartColumn,
    ShoppingCart,
    Persons,
    Medal,
} from "@gravity-ui/icons";

export interface NavItem {
    href: string;
    label: string;
    icon: typeof House;
    authRequired?: boolean;
    badgeKey?: "duelos";
}

export const sidebarItems: NavItem[] = [
    { href: "/", label: "Feed", icon: House },
    { href: "/duelos", label: "Duelos", icon: TargetDart, authRequired: true, badgeKey: "duelos" },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { href: "/torneos", label: "Torneos", icon: Cup },
    { href: "/comunidades", label: "Comunidades", icon: Persons },
    { href: "/ranking", label: "Ranking", icon: ChartColumn },
];

export const bottomTabs = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Medal },
    { href: "/duelos", label: "Duelos", icon: TargetDart, authRequired: true },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
];

export const authPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export const fullWidthPages = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/terminos", "/privacidad", "/cookies"];
