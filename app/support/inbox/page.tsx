"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type SupportThread = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
};

type SupportMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function SupportInboxPageContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadThreads() {
    if (!user) return;

    setLoading(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_threads")
      .select("id, user_id, subject, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message || "Could not load support inbox.");
      setThreads([]);
      setLoading(false);
      return;
    }

    const threadRows = (data ?? []) as SupportThread[];
    setThreads(threadRows);

    const requestedThread = searchParams.get("thread");

    if (requestedThread && threadRows.some((t) => t.id === requestedThread)) {
      setSelectedThreadId(requestedThread);
    } else if (threadRows.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threadRows[0].id);
    } else if (threadRows.length === 0) {
      setSelectedThreadId(null);
    }

    setLoading(false);
  }

  async function loadMessages(threadId: string) {
    setLoadingMessages(true);
    setErrorText("");

    const { data, error } = await supabase
      .from("support_messages")
      .select("id, thread_id, sender_id, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorText(error.message || "Could not load conversation.");
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const rows = (data ?? []) as SupportMessage[];
    setMessages(rows);

    const senderIds = [...new Set(rows.map((m) => m.sender_id))];

    if (senderIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, role")
        .in("id", senderIds);

      const nextProfiles: Record<string, Profile> = {};
      (profileRows ?? []).forEach((p) => {
        nextProfiles[p.id] = p as Profile;
      });
      setProfiles(nextProfiles);
    } else {
      setProfiles({});
    }

    setLoadingMessages(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    loadThreads();
  }, [user, authLoading]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    loadMessages(selectedThreadId);
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedThreadId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setErrorText("You must be signed in.");
      return;
    }

    if (!selectedThreadId) {
      setErrorText("No thread selected.");
      return;
    }

    if (!reply.trim()) {
      setErrorText("Write a message first.");
      return;
    }

    setSending(true);
    setErrorText("");
    setSuccessText("");

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        thread_id: selectedThreadId,
        sender_id: user.id,
        content: reply.trim(),
      });

    if (messageError) {
      setErrorText(messageError.message || "Could not send your message.");
      setSending(false);
      return;
    }

    const { error: threadUpdateError } = await supabase
      .from("support_threads")
      .update({ status: "open" })
      .eq("id", selectedThreadId)
      .eq("user_id", user.id);

    if (threadUpdateError) {
      setErrorText(
        threadUpdateError.message || "Could not update thread status."
      );
      setSending(false);
      return;
    }

    setReply("");
    await loadMessages(selectedThreadId);
    await loadThreads();
    setSending(false);
    setSuccessText("Message sent successfully.");
  }

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#05030A] text-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-200">
            You must be signed in to view your support inbox.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 text-sm text-white/45">
          <Link href="/support" className="transition hover:text-white">
            Support
          </Link>{" "}
          / <span className="text-white">Inbox</span>
        </div>

        {successText ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {successText}
          </div>
        ) : null}

        {errorText ? (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorText}
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_24%)]" />

          <div className="relative">
            <div className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 text-sm text-fuchsia-200 shadow-[0_0_20px_rgba(168,85,247,0.10)]">
              Support inbox
            </div>

            <h1 className="mt-5 bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
              Your conversations
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              View your support requests and replies from the Dxblox team in one
              place.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.08fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.05)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Threads</h2>
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
                No support conversations yet.
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`block w-full rounded-[24px] border p-4 text-left transition duration-300 ${
                      selectedThreadId === thread.id
                        ? "border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(168,85,247,0.10),rgba(255,255,255,0.04))] shadow-[0_0_25px_rgba(168,85,247,0.08)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">
                          {thread.subject}
                        </p>
                        <p className="mt-2 text-sm text-white/40">
                          {formatDate(thread.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                          thread.status
                        )}`}
                      >
                        {thread.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(59,130,246,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Conversation</h2>
              <span className="text-sm text-white/40">
                {selectedThread ? "Open thread" : "Nothing selected"}
              </span>
            </div>

            {!selectedThread ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/45">
                Select a conversation to view it.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {selectedThread.subject}
                      </p>
                      <p className="mt-2 text-xs text-white/35">
                        Thread created {formatDate(selectedThread.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                        selectedThread.status
                      )}`}
                    >
                      {selectedThread.status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 h-[420px] overflow-y-auto rounded-[24px] border border-white/10 bg-black/20 p-4">
                  {loadingMessages ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                      No messages yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const senderProfile = profiles[msg.sender_id];
                        const isMe = msg.sender_id === user?.id;
                        const isAdmin =
                          senderProfile?.role === "admin" ||
                          senderProfile?.role === "owner" ||
                          senderProfile?.role === "moderator";

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-[20px] border p-4 ${
                                isMe
                                  ? "border-fuchsia-400/18 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.12),rgba(239,68,68,0.10))] text-white shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                                  : "border-white/10 bg-white/[0.04] text-white/88"
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-white">
                                  {isMe
                                    ? "You"
                                    : isAdmin
                                    ? senderProfile?.username || "Admin"
                                    : senderProfile?.username || "User"}
                                </span>

                                <span className="text-[11px] text-white/35">
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={sendReply} className="mt-5 space-y-3">
                  <label className="block text-sm font-medium text-white/90">
                    Reply
                  </label>

                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write your message here..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.08)]"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={sending}
                      className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                      <span className="relative z-10">
                        {sending ? "Sending..." : "Send message"}
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
  );
}

export default function SupportInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05030A] text-white">
          <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-white/45">
            Loading support inbox...
          </div>
        </div>
      }
    >
      <SupportInboxPageContent />
    </Suspense>
  );
}