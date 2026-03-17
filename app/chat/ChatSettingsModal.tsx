"use client";

import { useState } from "react";
import { Modal, Button, Avatar, Switch, toast } from "@heroui/react";
import { Persons, ArrowRightFromSquare, BellSlash, Bell, Person } from "@gravity-ui/icons";
import { muteChannel, unmuteChannel, leaveChannel } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import type { Channel } from "@/lib/types/chat";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  onChannelLeft?: () => void;
  onChannelUpdated?: (channel: Channel) => void;
}

export default function ChatSettingsModal({ isOpen, onOpenChange, channel, onChannelLeft, onChannelUpdated }: Props) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [isMuted, setIsMuted] = useState(channel?.is_muted ?? false);
  const [isTogglingMute, setIsTogglingMute] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!channel) return null;

  const isGroup = channel.type === "GROUP";
  const isCommunity = channel.type === "CLAN" || channel.type === "TOURNAMENT";
  const members = channel.members ?? [];
  const myUsername = session?.username;

  // DM: get other user
  let otherUser = null;
  if (channel.type === "DM" && myUsername) {
    otherUser = members.find(m => m.username !== myUsername) ?? null;
  }

  const displayName = channel.type === "DM" && otherUser
    ? otherUser.username
    : channel.name || "Canal";

  const handleToggleMute = async () => {
    if (!token || !channel) return;
    setIsTogglingMute(true);
    try {
      if (isMuted) {
        await unmuteChannel(channel.id, token);
        setIsMuted(false);
        toast.success("Notificaciones activadas");
      } else {
        await muteChannel(channel.id, token);
        setIsMuted(true);
        toast.success("Chat silenciado");
      }
      if (onChannelUpdated) {
        onChannelUpdated({ ...channel, is_muted: !isMuted });
      }
    } catch {
      toast.danger("Error al cambiar notificaciones");
    } finally {
      setIsTogglingMute(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !channel) return;
    setIsLeaving(true);
    try {
      await leaveChannel(channel.id, token);
      toast.success("Saliste del chat");
      onOpenChange(false);
      onChannelLeft?.();
    } catch {
      toast.danger("Error al salir del chat");
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop className="bg-black/50 backdrop-blur-md">
        <Modal.Container>
          <Modal.Dialog className="bg-[var(--bg-solid)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-0 shadow-2xl max-w-md w-full overflow-hidden">
            <Modal.CloseTrigger className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface-secondary)] rounded-full p-1 z-10" />

            {/* Header */}
            <Modal.Header className="px-5 py-4 border-b border-[var(--border)] items-center">
              <Modal.Icon className="bg-[var(--accent)]/10 text-[var(--accent)]">
                {channel.type === "DM" && otherUser ? (
                  <Person className="size-5" />
                ) : (
                  <Persons className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading className="text-lg font-bold">{displayName}</Modal.Heading>
              <p className="text-xs text-[var(--muted)]">
                {channel.type === "DM" ? "Mensaje directo" : `${members.length} miembros`}
              </p>
            </Modal.Header>

            <Modal.Body className="p-5 space-y-5">
              {/* Notifications toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  {isMuted ? <BellSlash className="size-5 text-[var(--muted)]" /> : <Bell className="size-5 text-[var(--accent)]" />}
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Notificaciones</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {isMuted ? "Silenciado — no recibirás alertas" : "Recibirás alertas de nuevos mensajes"}
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={!isMuted}
                  onChange={handleToggleMute}
                  isDisabled={isTogglingMute}
                />
              </div>

              {/* Members list */}
              {members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                    Miembros ({members.length})
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {members.map((member) => {
                      const isMe = member.username === myUsername;
                      return (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="w-8 h-8 text-xs border border-[var(--border)]">
                              <Avatar.Image src={member.avatar_url} alt={member.username} />
                              <Avatar.Fallback>{member.username?.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                            </Avatar>
                            {member.is_online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[var(--surface)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {member.username}
                              {isMe && <span className="text-[var(--accent)] ml-1 text-xs">(tú)</span>}
                            </p>
                            {member.role && member.role !== "member" && (
                              <p className="text-[10px] text-[var(--accent)] font-semibold uppercase">{member.role}</p>
                            )}
                          </div>
                          <span className={`text-[10px] font-medium ${member.is_online ? "text-green-500" : "text-[var(--muted)]"}`}>
                            {member.is_online ? "online" : "offline"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leave channel — only for groups/communities */}
              {(isGroup || isCommunity) && (
                <div className="pt-3 border-t border-[var(--border)]">
                  {showLeaveConfirm ? (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                      <p className="text-sm text-red-500 font-medium">
                        ¿Seguro que quieres salir de este {isGroup ? "grupo" : "canal"}? No podrás ver los mensajes anteriores.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          className="font-semibold"
                          onPress={handleLeave}
                          isPending={isLeaving}
                        >
                          Sí, salir
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-semibold"
                          onPress={() => setShowLeaveConfirm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <ArrowRightFromSquare className="size-4" />
                      <span className="text-sm font-medium">Salir del {isGroup ? "grupo" : "canal"}</span>
                    </button>
                  )}
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
