"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
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
      <div className="min-h-screen bg-[#030712] text-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            You must be signed in to view your support inbox.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 text-sm text-[#9CA3AF]">
          <Link href="/support" className="hover:text-white">
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
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorText}
          </div>
        ) : null}

        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1 text-sm text-violet-200">
            Support inbox
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Your conversations
          </h1>

          <p className="mt-3 text-[#9CA3AF]">
            View your support requests and replies from the Dxblox team.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Threads</h2>
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
                No support conversations yet.
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`block w-full rounded-[24px] border p-4 text-left transition ${
                      selectedThreadId === thread.id
                        ? "border-violet-500/30 bg-violet-500/[0.07]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">
                          {thread.subject}
                        </p>
                        <p className="mt-2 text-sm text-[#9CA3AF]">
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

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Conversation</h2>
              <span className="text-sm text-[#9CA3AF]">
                {selectedThread ? "Open thread" : "Nothing selected"}
              </span>
            </div>

            {!selectedThread ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[#9CA3AF]">
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
                      <p className="mt-2 text-xs text-[#7E879B]">
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

                <div className="mt-5 space-y-3">
                  {loadingMessages ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[#9CA3AF]">
                      No messages yet.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const senderProfile = profiles[msg.sender_id];
                      const isMe = msg.sender_id === user?.id;
                      const isAdmin = senderProfile?.role === "admin";

                      return (
                        <div
                          key={msg.id}
                          className={`rounded-2xl border p-4 ${
                            isMe
                              ? "border-violet-500/20 bg-violet-500/10"
                              : "border-white/10 bg-white/[0.03]"
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
                  <label className="block text-sm font-medium text-white/90">
                    Reply
                  </label>

                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write your message here..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7B8197] focus:border-violet-400/30 focus:bg-white/[0.07]"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send message"}
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
        <div className="min-h-screen bg-[#030712] text-white">
          <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-[#9CA3AF]">
            Loading support inbox...
          </div>
        </div>
      }
    >
      <SupportInboxPageContent />
    </Suspense>
  );
}