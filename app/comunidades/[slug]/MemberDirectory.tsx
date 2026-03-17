"use client";

import { useState } from "react";
import { Button, Select, ListBox, Input } from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import Image from "next/image";

interface MemberProps {
    members: any[]; // Adjust this later with correct types
}

export default function MemberDirectory({ members }: MemberProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Grouping structure as requested in spec: Admin, Moderador, Miembro
    // Assuming member object will eventually have: id, username, avatar_url, role

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || m.role?.toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const admins = filteredMembers.filter(m => m.role === "ADMIN" || m.role === "OWNER");
    const mods = filteredMembers.filter(m => m.role === "MODERATOR");
    const regulars = filteredMembers.filter(m => m.role === "MEMBER" || !m.role);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters Header */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-xs flex items-center">
                    <div className="absolute left-3 z-10 text-default-400">
                        <Magnifier className="w-4 h-4" />
                    </div>
                    <Input
                        placeholder="Buscar miembro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9"
                        aria-label="Buscar miembro"
                    />
                </div>
                <Select
                    selectedKey={roleFilter}
                    onSelectionChange={(k) => setRoleFilter(String(k))}
                    className="w-full sm:max-w-[150px]"
                    aria-label="Filtrar por rol"
                >
                    <Select.Trigger className="bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-10 text-sm" />
                    <Select.Popover>
                        <ListBox>
                            <ListBox.Item key="all" id="all" textValue="Todos">Todos</ListBox.Item>
                            <ListBox.Item key="admin" id="admin" textValue="Administradores">Administradores</ListBox.Item>
                            <ListBox.Item key="moderator" id="moderator" textValue="Moderadores">Moderadores</ListBox.Item>
                            <ListBox.Item key="member" id="member" textValue="Miembros">Miembros</ListBox.Item>
                        </ListBox>
                    </Select.Popover>
                </Select>
            </div>

            <div className="flex flex-col gap-8">
                {/* Admins */}
                {admins.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                            👑 Administración
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {admins.map(m => (
                                <MemberCard key={m.id} member={m} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Moderators */}
                {mods.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                            🛡️ Moderadores
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mods.map(m => (
                                <MemberCard key={m.id} member={m} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Regulars */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                        👥 Miembros
                    </h3>
                    {regulars.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {regulars.map(m => (
                                <MemberCard key={m.id} member={m} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[var(--muted)] text-sm italic">
                            No se encontraron miembros regulares.
                        </p>
                    )}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-center">
                        <div className="text-3xl mb-2">🔍</div>
                        <h3 className="text-md font-bold text-[var(--foreground)]">Sin resultados</h3>
                        <p className="text-[var(--muted)] text-sm">Prueba ajustando los filtros de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MemberCard({ member }: { member: any }) {
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
