"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useStoryDraftStore } from "@/lib/stores/story-draft-store";
import { browseDecks, getUserProfile } from "@/lib/api/social";
import type { UserProfile, Deck } from "@/lib/types/social";
import { useStoriesTray, useMarkStoryViewed, useStoryViewer } from "@/features/stories/hooks";
import StoryComposer from "@/features/stories/StoryComposer";
import StoryViewer from "@/features/stories/StoryViewer";
import FeedTray from "@/features/feed/FeedClient/FeedTray";

const DeckFanModal = dynamic(() => import("@/features/deck/DeckFanModal"), { ssr: false });

export default function FeedClient() {
  const { status, session } = useAuth();
  const isAuth = status === "authenticated";
  const avatarUrl = useAuthStore((s) => s.avatarUrl);

  const { data: storyGroupsData } = useStoriesTray(session?.accessToken, isAuth);
  const storyGroups = useMemo(() => storyGroupsData ?? [], [storyGroupsData]);
  const markStoryViewedMutation = useMarkStoryViewed(session?.accessToken);

  const onStoryViewed = useCallback(
    (storyId: string) => {
      markStoryViewedMutation.mutate({ storyId });
    },
    [markStoryViewedMutation]
  );

  const viewer = useStoryViewer({ storyGroups, onStoryViewed });

  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const pendingDraft = useStoryDraftStore((s) => s.draft);
  const consumeDraft = useStoryDraftStore((s) => s.consumeDraft);
  const [activeDraft, setActiveDraft] = useState<ReturnType<typeof useStoryDraftStore.getState>["draft"] | null>(null);

  useEffect(() => {
    if (!isAuth || !pendingDraft) return;
    const draft = consumeDraft();
    if (!draft) return;
    setActiveDraft(draft);
    setCreateStoryOpen(true);
  }, [isAuth, pendingDraft, consumeDraft]);

  useEffect(() => {
    if (!isAuth || !session?.username || avatarUrl) return;
    getUserProfile(session.username)
      .then((res) => {
        const profile = ((res?.data as { user?: UserProfile } | undefined)?.user ?? res?.data ?? res) as
          | Partial<UserProfile>
          | undefined;
        if (profile?.avatar_url) useAuthStore.getState().setAvatarUrl(profile.avatar_url);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo cargar perfil para feed", error);
      });
  }, [isAuth, session?.username, avatarUrl]);

  useEffect(() => {
    browseDecks({ per_page: 15, sort: "newest" })
      .then((val: Record<string, unknown>) => {
        const d =
          ((val?.data as Record<string, unknown>)?.decks as Deck[] | undefined) ||
          (val?.data as Deck[] | undefined) ||
          (val?.decks as Deck[] | undefined) ||
          [];
        setDecks(Array.isArray(d) ? d : []);
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron cargar mazos del feed", error);
      });
  }, []);

  const sortedDecks = useMemo(
    () =>
      [...decks].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
      ),
    [decks]
  );

  const openCreateStoryModal = useCallback(() => {
    if (!isAuth) return;
    setCreateStoryOpen(true);
  }, [isAuth]);

  const closeCreateStoryModal = useCallback(() => {
    setCreateStoryOpen(false);
    setActiveDraft(null);
  }, []);

  const handleNextGroup = useCallback(() => {
    if (!viewer.position) return;
    viewer.goToGroup(viewer.position.groupIndex + 1);
  }, [viewer]);

  const handlePrevGroup = useCallback(() => {
    if (!viewer.position) return;
    viewer.goToGroup(viewer.position.groupIndex - 1);
  }, [viewer]);

  return (
    <>
      <FeedTray
        storyGroups={storyGroups}
        decks={sortedDecks}
        isAuth={isAuth}
        username={session?.username}
        avatarUrl={avatarUrl}
        onOpenCreate={openCreateStoryModal}
        onOpenGroup={(idx) => viewer.openAt(idx, 0)}
        onOpenDeck={setActiveDeckId}
      />

      <StoryComposer
        isOpen={createStoryOpen}
        onClose={closeCreateStoryModal}
        accessToken={session?.accessToken}
        initialDraft={activeDraft}
      />

      {viewer.isOpen && viewer.activeGroup && viewer.activeStory && viewer.position && (
        <StoryViewer
          group={viewer.activeGroup}
          story={viewer.activeStory}
          storyIndex={viewer.position.storyIndex}
          paused={viewer.paused}
          progress={viewer.progress}
          onClose={viewer.close}
          onNext={viewer.next}
          onPrev={viewer.prev}
          onNextGroup={handleNextGroup}
          onPrevGroup={handlePrevGroup}
          onPause={viewer.pause}
          onResume={viewer.resume}
          onTogglePause={viewer.togglePause}
          preloadImageUrl={viewer.nextStoryInNextGroup?.image_url ?? null}
          accessToken={session?.accessToken}
          currentUsername={session?.username}
        />
      )}

      {activeDeckId && <DeckFanModal deckId={activeDeckId} onClose={() => setActiveDeckId(null)} />}
    </>
  );
}
