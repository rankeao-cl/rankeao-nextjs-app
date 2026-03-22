import Image from "next/image";

export default function MemberCard({ member }: { member: any }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-sunken)] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-tertiary)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.username} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-sm font-bold">{member.username?.[0]?.toUpperCase()}</span>
                )}
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">{member.username}</span>
                <span className="text-xs text-[var(--muted)]">{member.role || "Miembro"}</span>
            </div>
        </div>
    );
}
