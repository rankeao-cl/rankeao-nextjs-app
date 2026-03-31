import { StarFill, ShieldCheck, ShoppingCart, Person, Heart } from "@gravity-ui/icons";

export interface UserRoleData {
    name: string;
    isPremium?: boolean;
    isVerified?: boolean;
    isStore?: boolean;
    isStoreStaff?: boolean;
    isModerator?: boolean;
    isSupporter?: boolean;
}

interface Props {
    user: UserRoleData;
    className?: string;
    showBadges?: boolean;
}

/**
 * Component to standardize user display names and badges across the platform.
 * Implements Section 9.1 and 9.8 from UX/UI Brief.
 */
export function UserDisplayName({ user, className = "", showBadges = true }: Props) {
    // Determine the base text color based on the highest priority role
    let textColorClass = "text-[var(--foreground)]";
    let fontWeightClass = "font-medium";

    if (user.isModerator) {
        textColorClass = "text-red-500";
        fontWeightClass = "font-bold";
    } else if (user.isStore) {
        textColorClass = "text-orange-400";
        fontWeightClass = "font-bold";
    } else if (user.isPremium) {
        textColorClass = "text-yellow-400";
        fontWeightClass = "font-bold";
    } else if (user.isStoreStaff) {
        textColorClass = "text-orange-300";
    }

    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            <span className={`${textColorClass} ${fontWeightClass} truncate`}>
                {user.name}
            </span>
            {showBadges && (
                <span className="inline-flex items-center gap-0.5 shrink-0 opacity-90">
                    {user.isVerified && (
                        <ShieldCheck className="size-3.5 text-blue-400" />
                    )}
                    {user.isPremium && (
                        <StarFill className="size-3 text-yellow-500" />
                    )}
                    {user.isStore && (
                        <ShoppingCart className="size-3.5 text-orange-500" />
                    )}
                    {user.isModerator && (
                        <ShieldCheck className="size-3.5 text-red-500" />
                    )}
                    {user.isSupporter && (
                        <Heart className="size-3.5 text-amber-700" />
                    )}
                    {user.isStoreStaff && (
                        <Person className="size-3 text-orange-300" />
                    )}
                </span>
            )}
        </span>
    );
}

export function getUserRoleData(apiUser: any): UserRoleData {
    if (!apiUser) return { name: "Usuario" };

    // Simulate reading roles from API user object. 
    // Usually apiUser might have an array of roles or specific flags.
    // For MVP we map them if they exist, or default to some strings for showcase.
    const name = apiUser.display_name || apiUser.name || apiUser.username || "Usuario";

    return {
        name,
        isVerified: apiUser.verified === true || apiUser.is_verified === true,
        isPremium: apiUser.premium === true || (apiUser.roles && apiUser.roles.includes("premium")),
        isStore: apiUser.type === "store" || apiUser.is_store === true,
        isStoreStaff: apiUser.roles && apiUser.roles.includes("store_staff"),
        isModerator: apiUser.roles && apiUser.roles.includes("moderator"),
        isSupporter: apiUser.roles && apiUser.roles.includes("supporter"),
    };
}
