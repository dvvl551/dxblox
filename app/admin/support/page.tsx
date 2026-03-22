"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type SupportThread = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role?: string | null;
};

type SupportMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ThreadWithMeta = {
  thread: SupportThread;
  profile: Profile | null;
  latestMessage: SupportMessage | null;
};

type BannerState = {
  type: "success" | "error";
  text: string;
} | null;

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortTime(value: string) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  if (status === "open") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  if (status === "answered") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "closed") {
    return "border-white/10 bg-white/[0.05] text-white/70";
  }

  return "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200";
}

function SupportStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_0_30px_rgba(168,85,247,0.04)] transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/20 hover:shadow-[0_0_40px_rgba(168,85,247,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_35%,transparent_70%,rgba(168,85,247,0.05))]" />
      <div className="relative text-[11px] font-semibold uppercase tracking-[0.26em] text-white/40">
        {label}
      </div>
      <div className="relative mt-3 text-4xl font-black leading-none text-white transition group-hover:text-fuchsia-100">
        {value}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [threads, setThreads] = useState<ThreadWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [banner, setBanner] = useState<BannerState>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<ThreadWithMeta | null>(null);
  const [deletingThread, setDeletingThread] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const shouldForceScrollOnNextUpdateRef = useRef(false);
  const hasAutoScrolledInitiallyRef = useRef(false);

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "owner" ||
    profile?.role === "moderator";

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (behavior === "auto") {
      el.scrollTop = el.scrollHeight;
      return;
    }

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  };

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom < 120;
  };

  const areMessagesEqual = (a: SupportMessage[], b: SupportMessage[]) => {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (
        a[i].id !== b[i].id ||
        a[i].content !== b[i].content ||
        a[i].sender_id !== b[i].sender_id ||
        a[i].created_at !== b[i].created_at
      ) {
        return false;
      }
    }

    return true;
  };

  async function loadThreads(preserveSelected = true) {
    setLoading(true);

    const { data: threadRows, error: threadError } = await supabase
      .from("support_threads")
      .select("id, user_id, subject, status, created_at")
      .order("created_at", { ascending: false });

    if (threadError || !threadRows) {
      setThreads([]);
      setLoading(false);
      setBanner({
        type: "error",
        text: threadError?.message || "Could not load support threads.",
      });
      return;
    }

    const userIds = [...new Set(threadRows.map((t) => t.user_id))];
    const threadIds = threadRows.map((t) => t.id);

    const [{ data: profiles }, { data: messages }] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, username, avatar_url, role")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      threadIds.length > 0
        ? supabase
            .from("support_messages")
            .select("id, thread_id, sender_id, content, created_at")
            .in("thread_id", threadIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const profileMap = new Map<string, Profile>();
    (profiles ?? []).forEach((p) => {
      profileMap.set(p.id, p as Profile);
    });

    const latestMessageMap = new Map<string, SupportMessage>();
    (messages ?? []).forEach((m) => {
      if (!latestMessageMap.has(m.thread_id)) {
        latestMessageMap.set(m.thread_id, m as SupportMessage);
      }
    });

    const merged: ThreadWithMeta[] = threadRows.map((thread) => ({
      thread: thread as SupportThread,
      profile: profileMap.get(thread.user_id) ?? null,
      latestMessage: latestMessageMap.get(thread.id) ?? null,
    }));

    setThreads(merged);

    if (!preserveSelected) {
      setSelectedThreadId(merged[0]?.thread.id ?? null);
    } else if (selectedThreadId) {
      const stillExists = merged.some((item) => item.thread.id === selectedThreadId);
      if (!stillExists) {
        setSelectedThreadId(merged[0]?.thread.id ?? null);
      }
    } else {
      setSelectedThreadId(merged[0]?.thread.id ?? null);
    }

    setLoading(false);
  }

  async function loadMessages(threadId: string) {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from("support_messages")
      .select("id, thread_id, sender_id, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      setSelectedMessages([]);
      setBanner({
        type: "error",
        text: error.message || "Could not load conversation.",
      });
      setLoadingMessages(false);
      return;
    }

    const nextMessages = (data ?? []) as SupportMessage[];

    setSelectedMessages((prev) => {
      if (areMessagesEqual(prev, nextMessages)) {
        return prev;
      }
      return nextMessages;
    });

    setLoadingMessages(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadThreads(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedMessages([]);
      hasAutoScrolledInitiallyRef.current = false;
      return;
    }

    hasAutoScrolledInitiallyRef.current = false;
    shouldForceScrollOnNextUpdateRef.current = true;
    loadMessages(selectedThreadId);
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedMessages.length) return;

    if (!hasAutoScrolledInitiallyRef.current) {
      hasAutoScrolledInitiallyRef.current = true;
      scrollToBottom("auto");
      shouldForceScrollOnNextUpdateRef.current = false;
      return;
    }

    if (shouldForceScrollOnNextUpdateRef.current || shouldStickToBottomRef.current) {
      scrollToBottom("smooth");
      shouldForceScrollOnNextUpdateRef.current = false;
    }
  }, [selectedMessages]);

  useEffect(() => {
    if (!deleteModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletingThread) {
        setDeleteModalOpen(false);
        setThreadToDelete(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [deleteModalOpen, deletingThread]);

  useEffect(() => {
    if (!isAdmin) return;

    const messagesChannel = supabase
      .channel("admin-support-messages-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;

          await loadThreads(true);

          if (selectedThreadId && newMessage.thread_id === selectedThreadId) {
            if (isNearBottom()) {
              shouldForceScrollOnNextUpdateRef.current = true;
            }

            setSelectedMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    const threadsChannel = supabase
      .channel("admin-support-threads-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
        },
        async () => {
          await loadThreads(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadsChannel);
    };
  }, [isAdmin, selectedThreadId]);

  function openThread(threadId: string) {
    setSelectedThreadId(threadId);
    setReply("");
    setBanner(null);
  }

  function askDeleteThread(threadMeta: ThreadWithMeta) {
    setBanner(null);
    setThreadToDelete(threadMeta);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deletingThread) return;
    setDeleteModalOpen(false);
    setThreadToDelete(null);
  }

  async function confirmDeleteThread() {
    if (!threadToDelete) return;

    setDeletingThread(true);
    setBanner(null);

    try {
      const { error } = await supabase
        .from("support_threads")
        .delete()
        .eq("id", threadToDelete.thread.id);

      if (error) {
        throw new Error(error.message || "Could not delete thread.");
      }

      if (selectedThreadId === threadToDelete.thread.id) {
        setSelectedThreadId(null);
        setSelectedMessages([]);
        setReply("");
      }

      setDeleteModalOpen(false);
      setThreadToDelete(null);

      await loadThreads(true);

      setBanner({
        type: "success",
        text: "Support conversation deleted successfully.",
      });
    } catch (error) {
      setBanner({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not delete thread.",
      });
    } finally {
      setDeletingThread(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setBanner({
        type: "error",
        text: "You must be signed in.",
      });
      return;
    }

    if (!selectedThreadId) {
      setBanner({
        type: "error",
        text: "No thread selected.",
      });
      return;
    }

    if (!reply.trim()) {
      setBanner({
        type: "error",
        text: "Write a reply first.",
      });
      return;
    }

    setSendingReply(true);
    setBanner(null);

    try {
      const content = reply.trim();

      const { data: insertedMessage, error: messageError } = await supabase
        .from("support_messages")
        .insert({
          thread_id: selectedThreadId,
          sender_id: user.id,
          content,
        })
        .select("id, thread_id, sender_id, content, created_at")
        .single();

      if (messageError || !insertedMessage) {
        throw new Error(messageError?.message || "Could not send reply.");
      }

      const { error: threadUpdateError } = await supabase
        .from("support_threads")
        .update({ status: "answered" })
        .eq("id", selectedThreadId);

      if (threadUpdateError) {
        throw new Error(
          threadUpdateError.message || "Could not update thread status."
        );
      }

      shouldForceScrollOnNextUpdateRef.current = true;

      setSelectedMessages((prev) => {
        if (prev.some((msg) => msg.id === insertedMessage.id)) return prev;
        return [...prev, insertedMessage as SupportMessage];
      });

      setReply("");
      await loadThreads(true);

      setBanner({
        type: "success",
        text: "Reply sent successfully.",
      });
    } catch (error) {
      setBanner({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not send reply.",
      });
    } finally {
      setSendingReply(false);
    }
  }

  const selectedMeta = useMemo(
    () => threads.find((item) => item.thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#05030A] text-white">
        <Navbar active="admin" />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-300">
            Access denied.
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

        <Navbar active="admin" />

        <main className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="mb-6 text-sm text-white/45">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>{" "}
            / <span className="text-white">Support</span>
          </div>

          {banner ? (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300"
              }`}
            >
              {banner.text}
            </div>
          ) : null}

          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_24%)]" />

            <div className="relative">
              <div className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 text-sm text-fuchsia-200 shadow-[0_0_20px_rgba(168,85,247,0.10)]">
                Admin support
              </div>

              <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
                    Contact requests
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                    Review support requests sent by users, answer directly, and moderate conversations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SupportStatCard label="Threads" value={threads.length} />
                  <SupportStatCard
                    label="Open"
                    value={threads.filter((t) => t.thread.status === "open").length}
                  />
                  <SupportStatCard
                    label="Selected"
                    value={selectedThreadId ? 1 : 0}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.05)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Inbox</h2>
                <span className="text-sm text-white/40">
                  {loading ? "Loading..." : `${threads.length} results`}
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  Loading support threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  No support messages yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.map((threadMeta) => {
                    const { thread, profile, latestMessage } = threadMeta;

                    return (
                      <div
                        key={thread.id}
                        className={`rounded-[24px] border p-4 transition duration-300 ${
                          selectedThreadId === thread.id
                            ? "border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(168,85,247,0.10),rgba(255,255,255,0.04))] shadow-[0_0_25px_rgba(168,85,247,0.08)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.username ?? "User avatar"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(168,85,247,0.32),rgba(59,130,246,0.25),rgba(239,68,68,0.18))] text-base font-semibold text-white">
                                {(profile?.username?.[0] ?? "U").toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-white">
                                {profile?.username ?? "Unknown user"}
                              </p>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                                  thread.status
                                )}`}
                              >
                                {thread.status}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-white/90">
                              {thread.subject}
                            </p>

                            <p className="mt-2 line-clamp-2 text-sm text-white/45">
                              {latestMessage?.content ?? "No message content."}
                            </p>

                            <div className="mt-3 text-xs text-white/35">
                              {formatDate(thread.created_at)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => openThread(thread.id)}
                              className="relative overflow-hidden rounded-xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.18)] transition duration-300 hover:scale-[1.02]"
                            >
                              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                              <span className="relative z-10">Open</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => askDeleteThread(threadMeta)}
                              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(59,130,246,0.04)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Conversation</h2>
                <span className="text-sm text-white/40">
                  {selectedMeta ? "Open thread" : "Nothing selected"}
                </span>
              </div>

              {!selectedMeta ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">
                  Select a support request to view the full conversation.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
                        {selectedMeta.profile?.avatar_url ? (
                          <img
                            src={selectedMeta.profile.avatar_url}
                            alt={selectedMeta.profile.username ?? "User avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(168,85,247,0.32),rgba(59,130,246,0.25),rgba(239,68,68,0.18))] text-base font-semibold text-white">
                            {(selectedMeta.profile?.username?.[0] ?? "U").toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-white">
                            {selectedMeta.profile?.username ?? "Unknown user"}
                          </p>

                          <Link
                            href={`/users/${selectedMeta.thread.user_id}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            View profile
                          </Link>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                              selectedMeta.thread.status
                            )}`}
                          >
                            {selectedMeta.thread.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/90">
                          {selectedMeta.thread.subject}
                        </p>

                        <p className="mt-2 text-xs text-white/35">
                          Thread created {formatDate(selectedMeta.thread.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    onScroll={() => {
                      shouldStickToBottomRef.current = isNearBottom();
                    }}
                    className="mt-5 h-[420px] overflow-y-auto rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    {loadingMessages ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                        Loading conversation...
                      </div>
                    ) : selectedMessages.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                        No messages in this thread.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedMessages.map((msg) => {
                          const isUser = msg.sender_id === selectedMeta.thread.user_id;

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[20px] border p-4 ${
                                  isUser
                                    ? "border-white/10 bg-white/[0.04] text-white/88"
                                    : "border-fuchsia-400/18 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.12),rgba(239,68,68,0.10))] text-white shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium text-white">
                                    {isUser
                                      ? selectedMeta.profile?.username ?? "User"
                                      : "Admin"}
                                  </span>
                                  <span className="text-[11px] text-white/35">
                                    {formatShortTime(msg.created_at)}
                                  </span>
                                </div>

                                <p className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <form onSubmit={sendReply} className="mt-5 space-y-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/90">
                        Reply
                      </label>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        placeholder="Write your answer here..."
                        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.08)]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                        <span className="relative z-10">
                          {sendingReply ? "Sending..." : "Send reply"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReply("")}
                        className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {deleteModalOpen && threadToDelete ? (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#18172b_0%,#0f1327_100%)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12),transparent_30%),radial-gradient(circle_at_right,rgba(168,85,247,0.08),transparent_24%)]" />

            <div className="relative">
              <div className="inline-flex rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-300">
                Delete support thread
              </div>

              <h3 className="mt-5 text-3xl font-bold tracking-tight text-white">
                Delete conversation?
              </h3>

              <p className="mt-3 text-sm leading-7 text-white/55">
                This will permanently remove the selected support thread and all messages inside it.
              </p>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-sm text-white/40">User</div>
                <div className="mt-1 text-xl font-bold text-white">
                  {threadToDelete.profile?.username ?? "Unknown user"}
                </div>

                <div className="mt-4 text-sm text-white/40">Subject</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {threadToDelete.thread.subject}
                </div>

                <div className="mt-4 text-sm text-white/40">Latest message</div>
                <div className="mt-1 text-sm leading-7 text-white/82">
                  {threadToDelete.latestMessage?.content ?? "No message content."}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmDeleteThread}
                  disabled={deletingThread}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                >
                  {deletingThread ? "Deleting..." : "Delete conversation"}
                </button>

                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingThread}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}