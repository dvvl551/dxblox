"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

function getStatusClasses(status: string) {
  if (status === "open") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (status === "answered") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "closed") {
    return "border-white/10 bg-white/[0.05] text-white/70";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-200";
}

type BannerState = {
  type: "success" | "error";
  text: string;
} | null;

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

  const isAdmin = profile?.role === "admin";

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

    if (!error && data) {
      setSelectedMessages(data as SupportMessage[]);
    } else {
      setSelectedMessages([]);
      setBanner({
        type: "error",
        text: error?.message || "Could not load conversation.",
      });
    }

    setLoadingMessages(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadThreads(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedMessages([]);
      return;
    }

    loadMessages(selectedThreadId);
  }, [selectedThreadId]);

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

    const { error } = await supabase
      .from("support_threads")
      .delete()
      .eq("id", threadToDelete.thread.id);

    if (error) {
      setBanner({
        type: "error",
        text: error.message || "Could not delete thread.",
      });
      setDeletingThread(false);
      return;
    }

    if (selectedThreadId === threadToDelete.thread.id) {
      setSelectedThreadId(null);
      setSelectedMessages([]);
      setReply("");
    }

    setDeleteModalOpen(false);
    setThreadToDelete(null);
    setDeletingThread(false);

    await loadThreads(true);

    setBanner({
      type: "success",
      text: "Support conversation deleted successfully.",
    });
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

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        thread_id: selectedThreadId,
        sender_id: user.id,
        content: reply.trim(),
      });

    if (messageError) {
      setBanner({
        type: "error",
        text: messageError.message || "Could not send reply.",
      });
      setSendingReply(false);
      return;
    }

    const { error: threadUpdateError } = await supabase
      .from("support_threads")
      .update({ status: "answered" })
      .eq("id", selectedThreadId);

    if (threadUpdateError) {
      setBanner({
        type: "error",
        text: threadUpdateError.message || "Could not update thread status.",
      });
      setSendingReply(false);
      return;
    }

    setReply("");
    await loadMessages(selectedThreadId);
    await loadThreads(true);
    setSendingReply(false);

    setBanner({
      type: "success",
      text: "Reply sent successfully.",
    });
  }

  const selectedMeta = useMemo(
    () => threads.find((item) => item.thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar active="admin" />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            Access denied.
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar active="admin" />

        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-6 text-sm text-[#9CA3AF]">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>{" "}
            /{" "}
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>{" "}
            / <span className="text-white">Support</span>
          </div>

          {banner ? (
            <div
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {banner.text}
            </div>
          ) : null}

          <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(76,29,149,0.10)]">
            <div className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1 text-sm text-violet-200">
              Support inbox
            </div>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Contact requests
                </h1>
                <p className="mt-3 text-[#9CA3AF]">
                  Open support messages sent from the footer drawer, review the
                  user profile, then answer or delete the thread.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-xs text-[#9CA3AF]">Threads</div>
                  <div className="mt-1 text-2xl font-bold">{threads.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-xs text-[#9CA3AF]">Open</div>
                  <div className="mt-1 text-2xl font-bold">
                    {threads.filter((t) => t.thread.status === "open").length}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-xs text-[#9CA3AF]">Selected</div>
                  <div className="mt-1 text-2xl font-bold">
                    {selectedThreadId ? 1 : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Inbox</h2>
                <span className="text-sm text-[#9CA3AF]">
                  {loading ? "Loading..." : `${threads.length} results`}
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                  Loading support threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                  No support messages yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.map((threadMeta) => {
                    const { thread, profile, latestMessage } = threadMeta;

                    return (
                      <div
                        key={thread.id}
                        className={`rounded-[24px] border p-4 ${
                          selectedThreadId === thread.id
                            ? "border-violet-500/30 bg-violet-500/[0.07]"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/10">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.username ?? "User avatar"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-base font-semibold text-white">
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

                            <p className="mt-2 line-clamp-2 text-sm text-[#9CA3AF]">
                              {latestMessage?.content ?? "No message content."}
                            </p>

                            <div className="mt-3 text-xs text-[#7E879B]">
                              {formatDate(thread.created_at)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => openThread(thread.id)}
                              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              Open
                            </button>

                            <button
                              type="button"
                              onClick={() => askDeleteThread(threadMeta)}
                              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
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

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Conversation</h2>
                <span className="text-sm text-[#9CA3AF]">
                  {selectedMeta ? "Open thread" : "Nothing selected"}
                </span>
              </div>

              {!selectedMeta ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[#9CA3AF]">
                  Select a support request to view the full conversation.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/10">
                        {selectedMeta.profile?.avatar_url ? (
                          <img
                            src={selectedMeta.profile.avatar_url}
                            alt={selectedMeta.profile.username ?? "User avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-base font-semibold text-white">
                            {(selectedMeta.profile?.username?.[0] ?? "U").toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold">
                            {selectedMeta.profile?.username ?? "Unknown user"}
                          </p>
                          <Link
                            href={`/users/${selectedMeta.thread.user_id}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#C3CAD8] transition hover:text-white"
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

                        <p className="mt-2 text-xs text-[#7E879B]">
                          Thread created {formatDate(selectedMeta.thread.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {loadingMessages ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                        Loading conversation...
                      </div>
                    ) : selectedMessages.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                        No messages in this thread.
                      </div>
                    ) : (
                      selectedMessages.map((msg) => {
                        const isUser = msg.sender_id === selectedMeta.thread.user_id;

                        return (
                          <div
                            key={msg.id}
                            className={`rounded-2xl border p-4 ${
                              isUser
                                ? "border-violet-500/20 bg-violet-500/10"
                                : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-white">
                                {isUser
                                  ? selectedMeta.profile?.username ?? "User"
                                  : "Admin"}
                              </span>
                              <span className="text-xs text-[#9CA3AF]">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-[#D7DEED]">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })
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
                        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7B8197] focus:border-violet-400/30 focus:bg-white/[0.07]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingReply ? "Sending..." : "Send reply"}
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

          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#18172b_0%,#0f1327_100%)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300">
              Delete support thread
            </div>

            <h3 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Delete conversation?
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
              This will permanently remove the selected support thread and all
              messages inside it.
            </p>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm text-[#9CA3AF]">User</div>
              <div className="mt-1 text-xl font-bold text-white">
                {threadToDelete.profile?.username ?? "Unknown user"}
              </div>

              <div className="mt-4 text-sm text-[#9CA3AF]">Subject</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {threadToDelete.thread.subject}
              </div>

              <div className="mt-4 text-sm text-[#9CA3AF]">Latest message</div>
              <div className="mt-1 text-sm leading-7 text-[#D7DEED]">
                {threadToDelete.latestMessage?.content ?? "No message content."}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirmDeleteThread}
                disabled={deletingThread}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
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
      ) : null}
    </>
  );
}