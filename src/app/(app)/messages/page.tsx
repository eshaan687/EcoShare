"use client";

import {
  Archive,
  ArchiveRestore,
  Ban,
  Check,
  CheckCheck,
  Flag,
  Inbox,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

type InboxSection = "chats" | "requests" | "archived";

interface PeerProfile {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly location: string | null;
  readonly level: number;
  readonly total_xp: number;
}

interface ConversationListItem {
  readonly id: string;
  readonly status: "pending" | "accepted" | "declined";
  readonly initiatedBy: string | null;
  readonly lastMessagePreview: string | null;
  readonly lastMessageAt: string;
  readonly isArchived: boolean;
  readonly lastReadAt: string;
  readonly peer: PeerProfile;
}

interface ChatMessageItem {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly content: string;
  readonly createdAt: string;
  readonly pending?: boolean;
}

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

function DirectMessagesContent() {
  const searchParams = useSearchParams();
  const targetToUsername = searchParams.get("to")?.trim().replace(/^@/, "") ?? "";

  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const userId = user?.id ?? null;

  const [activeSection, setActiveSection] = useState<InboxSection>("chats");
  const [conversations, setConversations] = useState<
    readonly ConversationListItem[]
  >([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly ChatMessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // New Conversation / Message Request Modal (also triggered by ?to=username)
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [directoryMembers, setDirectoryMembers] = useState<
    readonly PeerProfile[]
  >([]);
  const [selectedRecipient, setSelectedRecipient] =
    useState<PeerProfile | null>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [startingRequest, setStartingRequest] = useState(false);

  // Report Modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingBusy, setReportingBusy] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const handledToParamRef = useRef<string>("");

  const loadConversations = useCallback(async () => {
    if (!supabase || !isSignedIn || !userId || !user) return;
    setLoadingInbox(true);
    try {
      await ensureCurrentUserProfile(supabase, user);

      const { data: myRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id, is_archived, last_read_at")
        .eq("user_id", userId);

      if (!myRows || myRows.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = myRows.map((r) => r.conversation_id);
      const myMetaByConv = new Map(
        myRows.map((r) => [
          r.conversation_id,
          { isArchived: r.is_archived, lastReadAt: r.last_read_at },
        ]),
      );

      const [{ data: convData }, { data: peerParticipants }] = await Promise.all(
        [
          supabase
            .from("conversations")
            .select("*")
            .in("id", convIds)
            .neq("status", "declined")
            .order("last_message_at", { ascending: false }),
          supabase
            .from("conversation_participants")
            .select("conversation_id, user_id")
            .in("conversation_id", convIds)
            .neq("user_id", userId),
        ],
      );

      if (!convData || convData.length === 0) {
        setConversations([]);
        return;
      }

      const peerIdByConv = new Map<string, string>();
      const peerIds = new Set<string>();
      for (const p of peerParticipants ?? []) {
        peerIdByConv.set(p.conversation_id, p.user_id);
        peerIds.add(p.user_id);
      }

      const profileById = new Map<string, PeerProfile>();
      if (peerIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select(
            "user_id, username, display_name, avatar_url, location, level, total_xp",
          )
          .in("user_id", Array.from(peerIds));

        for (const prof of (profilesData ?? []) as unknown as PeerProfile[]) {
          profileById.set(prof.user_id, prof);
        }
      }

      const mapped: ConversationListItem[] = [];
      for (const c of convData) {
        const peerId = peerIdByConv.get(c.id) ?? c.recipient_id ?? c.initiated_by;
        if (!peerId) continue;
        const peer = profileById.get(peerId) ?? {
          user_id: peerId,
          username: "member",
          display_name: c.title || "EcoShare Member",
          avatar_url: null,
          location: null,
          level: 1,
          total_xp: 0,
        };
        const meta = myMetaByConv.get(c.id);
        mapped.push({
          id: c.id,
          status:
            c.status === "pending"
              ? "pending"
              : c.status === "declined"
                ? "declined"
                : "accepted",
          initiatedBy: c.initiated_by,
          lastMessagePreview: c.last_message_preview,
          lastMessageAt: c.last_message_at,
          isArchived: meta?.isArchived ?? false,
          lastReadAt: meta?.lastReadAt ?? c.created_at,
          peer,
        });
      }

      setConversations(mapped);
    } finally {
      setLoadingInbox(false);
    }
  }, [supabase, isSignedIn, userId, user]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await loadConversations();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  // Handle ?to=username deep link from /u/[username] Profile "Message" button
  useEffect(() => {
    if (
      !targetToUsername ||
      !supabase ||
      !isSignedIn ||
      !userId ||
      handledToParamRef.current === targetToUsername.toLowerCase()
    ) {
      return;
    }

    handledToParamRef.current = targetToUsername.toLowerCase();

    void Promise.resolve().then(async () => {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select(
          "user_id, username, display_name, avatar_url, location, level, total_xp",
        )
        .ilike("username", targetToUsername)
        .eq("is_deleted", false)
        .maybeSingle();

      if (!targetProfile) {
        setErrorBanner(`Could not find user @${targetToUsername}.`);
        return;
      }

      if (targetProfile.user_id === userId) {
        setErrorBanner("You cannot start a message request with yourself.");
        return;
      }

      // Check if conversation already loaded
      const existing = conversations.find(
        (c) => c.peer.user_id === targetProfile.user_id,
      );
      if (existing) {
        setActiveSection(
          existing.isArchived
            ? "archived"
            : existing.status === "pending"
              ? "requests"
              : "chats",
        );
        setSelectedConvId(existing.id);
        return;
      }

      setSelectedRecipient(targetProfile as unknown as PeerProfile);
      setNewChatOpen(true);
    });
  }, [targetToUsername, supabase, isSignedIn, userId, conversations]);

  // Load messages when a conversation is selected
  const loadMessagesForConversation = useCallback(
    async (convId: string) => {
      if (!supabase || !userId) return;
      setLoadingMessages(true);
      try {
        const { data } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (data) {
          setMessages(
            data.map((r) => ({
              id: r.id,
              conversationId: r.conversation_id,
              senderId: r.sender_id,
              content: r.content,
              createdAt: r.created_at,
            })),
          );
        }

        // Update last_read_at for unread indicator
        const nowIso = new Date().toISOString();
        await supabase
          .from("conversation_participants")
          .update({ last_read_at: nowIso })
          .eq("conversation_id", convId)
          .eq("user_id", userId);

        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastReadAt: nowIso } : c)),
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [supabase, userId],
  );

  useEffect(() => {
    if (!selectedConvId) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await loadMessagesForConversation(selectedConvId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedConvId, loadMessagesForConversation]);

  // Realtime subscription on messages and conversations
  useEffect(() => {
    if (!supabase || !isSignedIn || !userId) return;

    const channel = supabase
      .channel("ecoshare-realtime-dms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          if (newRow.conversation_id === selectedConvId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [
                ...prev,
                {
                  id: newRow.id,
                  conversationId: newRow.conversation_id,
                  senderId: newRow.sender_id,
                  content: newRow.content,
                  createdAt: newRow.created_at,
                },
              ];
            });
          }
          void loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void loadConversations();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, isSignedIn, userId, selectedConvId, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedConvId]);

  const chatsList = useMemo(
    () =>
      conversations.filter((c) => !c.isArchived && c.status === "accepted"),
    [conversations],
  );

  const requestsList = useMemo(
    () =>
      conversations.filter((c) => !c.isArchived && c.status === "pending"),
    [conversations],
  );

  const archivedList = useMemo(
    () => conversations.filter((c) => c.isArchived),
    [conversations],
  );

  const sectionConversations = useMemo(() => {
    const base =
      activeSection === "chats"
        ? chatsList
        : activeSection === "requests"
          ? requestsList
          : archivedList;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (c) =>
        c.peer.display_name.toLowerCase().includes(q) ||
        c.peer.username.toLowerCase().includes(q) ||
        (c.lastMessagePreview ?? "").toLowerCase().includes(q),
    );
  }, [activeSection, chatsList, requestsList, archivedList, searchQuery]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) ?? null,
    [conversations, selectedConvId],
  );

  const unreadChatsCount = useMemo(
    () =>
      chatsList.filter(
        (c) => new Date(c.lastMessageAt).getTime() > new Date(c.lastReadAt).getTime(),
      ).length,
    [chatsList],
  );

  async function openNewMessageModal() {
    setErrorBanner(null);
    setNewChatOpen(true);
    if (!supabase || !userId) return;
    const { data } = await supabase
      .from("profiles")
      .select(
        "user_id, username, display_name, avatar_url, location, level, total_xp",
      )
      .eq("is_deleted", false)
      .neq("user_id", userId)
      .order("total_xp", { ascending: false })
      .limit(20);

    if (data) {
      setDirectoryMembers(data as unknown as PeerProfile[]);
    }
  }

  async function handleStartConversationRequest(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorBanner(null);

    if (!supabase || !isSignedIn || !user || !selectedRecipient) return;
    const trimmedIntro = introMessage.trim();
    if (!trimmedIntro) {
      setErrorBanner("Please write an introductory message.");
      return;
    }

    setStartingRequest(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      const { data, error } = await supabase.rpc(
        "start_or_get_direct_conversation",
        {
          p_recipient_id: selectedRecipient.user_id,
          p_intro_message: trimmedIntro,
        },
      );

      if (error) {
        setErrorBanner(error.message);
        return;
      }

      const result = data as {
        conversation_id: string;
        status: "pending" | "accepted";
      };

      await loadConversations();
      setNewChatOpen(false);
      setIntroMessage("");
      setActiveSection(result.status === "pending" ? "requests" : "chats");
      setSelectedConvId(result.conversation_id);
      setStatusBanner(
        result.status === "pending"
          ? `Message request sent to @${selectedRecipient.username}.`
          : `Conversation opened with @${selectedRecipient.username}.`,
      );
    } finally {
      setStartingRequest(false);
    }
  }

  async function handleRequestDecision(
    action: "accept" | "decline" | "block" | "report",
    reason?: string,
  ) {
    if (!supabase || !activeConversation) return;
    setErrorBanner(null);

    const { error } = await supabase.rpc("respond_to_message_request", {
      p_conversation_id: activeConversation.id,
      p_action: action,
      p_reason: reason ?? null,
    });

    if (error) {
      setErrorBanner(error.message);
      return;
    }

    await loadConversations();
    if (action === "accept") {
      setActiveSection("chats");
      setStatusBanner(
        `Accepted message request from @${activeConversation.peer.username}.`,
      );
    } else {
      setSelectedConvId(null);
      setStatusBanner(
        action === "block"
          ? `Blocked @${activeConversation.peer.username}.`
          : action === "report"
            ? `Reported and declined message request.`
            : `Declined message request.`,
      );
    }
  }

  async function handleToggleArchive(conv: ConversationListItem) {
    if (!supabase || !userId) return;
    const nextArchived = !conv.isArchived;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, isArchived: nextArchived } : c,
      ),
    );
    await supabase
      .from("conversation_participants")
      .update({ is_archived: nextArchived })
      .eq("conversation_id", conv.id)
      .eq("user_id", userId);
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || isSending || !activeConversation || !supabase || !userId) {
      return;
    }

    setErrorBanner(null);
    setMessageInput("");
    setIsSending(true);

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: userId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: userId,
          content: trimmed,
        })
        .select("id, conversation_id, sender_id, content, created_at")
        .single();

      if (error || !inserted) {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setMessageInput(trimmed);
        setErrorBanner(
          error?.message ?? "Could not send message. Please try again.",
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: inserted.id,
                conversationId: inserted.conversation_id,
                senderId: inserted.sender_id,
                content: inserted.content,
                createdAt: inserted.created_at,
              }
            : m,
        ),
      );
      void loadConversations();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Direct Messages</h1>
              <p className="text-xs text-muted-foreground">
                Real-time 1:1 member conversations and message requests with privacy controls
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary/40 px-3 py-1 text-xs font-semibold text-primary-dark">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isRealtimeConnected ? "bg-primary animate-pulse" : "bg-primary",
                )}
                aria-hidden="true"
              />
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isRealtimeConnected ? "Realtime Connected" : "Encrypted RLS"}
              </span>
            </div>

            {isSignedIn ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                pill
                onClick={() => void openNewMessageModal()}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Message
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {errorBanner ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-xs font-medium text-error"
        >
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {statusBanner ? (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-secondary/40 px-4 py-2.5 text-xs font-medium text-primary-dark"
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Dismiss status"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {!isSignedIn ? (
        <Card className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-primary-dark">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Sign in to access Direct Messages
          </h2>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            Direct messages and message requests are protected by participant Row-Level Security. Sign in to message other EcoShare members.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-background"
            >
              Create Account
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
            {/* Left Column: Inbox Tabs (Chats | Requests | Archived) + Search + Conversation List */}
            <div className="border-b border-border md:col-span-5 lg:col-span-4 md:border-b-0 md:border-r bg-background/40 flex flex-col">
              {/* 3 Inbox Section Tabs */}
              <div
                role="tablist"
                aria-label="Messaging sections"
                className="grid grid-cols-3 gap-1 border-b border-border bg-surface p-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSection === "chats"}
                  onClick={() => setActiveSection("chats")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                    activeSection === "chats"
                      ? "bg-secondary/75 text-primary-dark"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>Chats</span>
                  {unreadChatsCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                      {unreadChatsCount}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSection === "requests"}
                  onClick={() => setActiveSection("requests")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                    activeSection === "requests"
                      ? "bg-secondary/75 text-primary-dark"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>Requests</span>
                  {requestsList.length > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                      {requestsList.length}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSection === "archived"}
                  onClick={() => setActiveSection("archived")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                    activeSection === "archived"
                      ? "bg-secondary/75 text-primary-dark"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>Archived</span>
                  {archivedList.length > 0 ? (
                    <span className="text-[10px] text-muted-foreground">
                      ({archivedList.length})
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Conversation Search */}
              <div className="border-b border-border p-2.5">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    aria-label="Search conversations"
                    className="h-8 w-full rounded-full border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Conversation List or Polished Empty State */}
              <div className="divide-y divide-border/60 flex-1 overflow-y-auto">
                {loadingInbox ? (
                  <div className="p-4 text-xs text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : sectionConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/40 text-primary-dark">
                      <Inbox className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      No conversations yet. Discover people and start a conversation.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        pill
                        onClick={() => void openNewMessageModal()}
                      >
                        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        Start a Conversation
                      </Button>
                      <Link
                        href="/explore"
                        className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-background"
                      >
                        Discover People
                      </Link>
                    </div>
                  </div>
                ) : (
                  sectionConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const isUnread =
                      new Date(conv.lastMessageAt).getTime() >
                      new Date(conv.lastReadAt).getTime();

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setSelectedConvId(conv.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          isSelected
                            ? "bg-secondary/35 border-l-4 border-l-primary"
                            : "hover:bg-surface/80",
                        )}
                      >
                        <Avatar
                          src={conv.peer.avatar_url ?? undefined}
                          alt={conv.peer.display_name}
                          size="md"
                          className="h-10 w-10 border border-border"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                              {conv.peer.display_name}
                              {conv.peer.total_xp >= 50 ? (
                                <ShieldCheck
                                  className="h-3.5 w-3.5 text-primary shrink-0"
                                  aria-label="Verified contributor"
                                />
                              ) : null}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatMessageTime(conv.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-medium text-primary-dark truncate">
                              @{conv.peer.username}
                            </p>
                            {isUnread ? (
                              <span
                                className="h-2 w-2 rounded-full bg-primary"
                                aria-label="Unread messages"
                              />
                            ) : null}
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {conv.lastMessagePreview || "No messages yet"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation or Empty State */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-surface">
              {!activeConversation ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/45 text-primary-dark">
                    <MessageSquare className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    No conversations yet. Discover people and start a conversation.
                  </h2>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Select a conversation from the left or visit any member&apos;s profile (`/u/[username]`) and click Message to send a request.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    pill
                    onClick={() => void openNewMessageModal()}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Start a Conversation
                  </Button>
                </div>
              ) : (
                <>
                  {/* Active Contact Header with Profile Link & Archive Action */}
                  <div className="border-b border-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface">
                    <Link
                      href={`/u/${activeConversation.peer.username}`}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <Avatar
                        src={activeConversation.peer.avatar_url ?? undefined}
                        alt={activeConversation.peer.display_name}
                        size="md"
                        className="h-10 w-10 border border-border"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm font-bold text-foreground group-hover:text-primary-dark truncate">
                            {activeConversation.peer.display_name}
                          </h2>
                          {activeConversation.status === "pending" ? (
                            <Badge variant="warning">Message Request</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{activeConversation.peer.username}
                          {activeConversation.peer.location
                            ? ` · ${activeConversation.peer.location}`
                            : ""}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleArchive(activeConversation)}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-background/60 px-3 text-xs font-semibold text-foreground hover:bg-background cursor-pointer"
                      >
                        {activeConversation.isArchived ? (
                          <>
                            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                            Unarchive
                          </>
                        ) : (
                          <>
                            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                            Archive
                          </>
                        )}
                      </button>

                      <Link
                        href={`/u/${activeConversation.peer.username}`}
                        className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>

                  {/* Pending Request Banner for Recipient (Accept / Decline / Block / Report) */}
                  {activeConversation.status === "pending" ? (
                    <div className="border-b border-border bg-secondary/25 px-5 py-3 space-y-2">
                      {activeConversation.initiatedBy !== userId ? (
                        <>
                          <p className="text-xs font-semibold text-foreground">
                            @{activeConversation.peer.username} wants to send you a message. Accept to move this conversation to your Chats inbox.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              pill
                              onClick={() => void handleRequestDecision("accept")}
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Accept
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              pill
                              onClick={() => void handleRequestDecision("decline")}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              Decline
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              pill
                              onClick={() => void handleRequestDecision("block")}
                            >
                              <Ban className="h-3.5 w-3.5 text-error" aria-hidden="true" />
                              Block
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              pill
                              onClick={() => setReportOpen(true)}
                            >
                              <Flag className="h-3.5 w-3.5 text-error" aria-hidden="true" />
                              Report
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Message request pending — @{activeConversation.peer.username} must accept your request before unrestricted messaging is enabled.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Messages Scroll Area */}
                  <div
                    className="flex-1 space-y-3 overflow-y-auto p-5 bg-background/30 max-h-[380px]"
                    aria-live="polite"
                  >
                    {loadingMessages ? (
                      <p className="text-center text-xs text-muted-foreground">
                        Loading message history...
                      </p>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground">
                        No messages in this conversation yet. Say hello below!
                      </p>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === userId;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[82%] sm:max-w-[75%]",
                              isOwn ? "ml-auto items-end" : "mr-auto items-start",
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs",
                                isOwn
                                  ? "bg-primary text-white rounded-br-xs"
                                  : "bg-surface border border-border text-foreground rounded-bl-xs",
                              )}
                            >
                              <p>{msg.content}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isOwn ? (
                                <CheckCheck
                                  className="h-3 w-3 text-primary"
                                  aria-label={
                                    msg.pending ? "Sending" : "Delivered"
                                  }
                                />
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <form
                    onSubmit={(e) => void handleSendMessage(e)}
                    className="border-t border-border p-3.5 bg-surface flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${activeConversation.peer.display_name}...`}
                      aria-label={`Message ${activeConversation.peer.display_name}`}
                      maxLength={2000}
                      className="flex-1 h-10 rounded-full border border-border bg-background/70 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:outline-none"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      pill
                      disabled={!messageInput.trim() || isSending}
                      className="h-10 px-5 text-xs font-semibold shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isSending ? "Sending..." : "Send"}</span>
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Start Conversation / Message Request Modal */}
      <Dialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        title="Start a Conversation"
        description="Select an EcoShare member and send an introductory message."
      >
        <form
          onSubmit={(e) => void handleStartConversationRequest(e)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="new-chat-recipient"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Recipient
            </label>
            {selectedRecipient ? (
              <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-secondary/30 p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={selectedRecipient.avatar_url ?? undefined}
                    alt={selectedRecipient.display_name}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {selectedRecipient.display_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      @{selectedRecipient.username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecipient(null)}
                  className="text-xs font-semibold text-primary-dark hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <select
                id="new-chat-recipient"
                value=""
                onChange={(e) => {
                  const found = directoryMembers.find(
                    (m) => m.user_id === e.target.value,
                  );
                  if (found) setSelectedRecipient(found);
                }}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground"
                required
              >
                <option value="" disabled>
                  Select an EcoShare member...
                </option>
                {directoryMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name} (@{m.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="new-chat-intro"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Introductory Message
            </label>
            <Textarea
              id="new-chat-intro"
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="Write a friendly introduction about an environmental initiative or cleanup..."
              rows={3}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNewChatOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              pill
              disabled={startingRequest || !selectedRecipient || !introMessage.trim()}
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {startingRequest ? "Sending..." : "Send Message Request"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Report Message Request Modal */}
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report Conversation"
        description="Provide a reason for reporting this message request. The conversation will also be declined."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setReportingBusy(true);
            void Promise.resolve()
              .then(() =>
                handleRequestDecision("report", reportReason || "Spam or abuse"),
              )
              .finally(() => {
                setReportingBusy(false);
                setReportReason("");
                setReportOpen(false);
              });
          }}
          className="space-y-4"
        >
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for reporting (e.g., spam, off-topic, harassment)"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              pill
              disabled={reportingBusy}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-[20px]" />}>
      <DirectMessagesContent />
    </Suspense>
  );
}
