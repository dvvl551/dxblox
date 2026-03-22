"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, MessageSquare, Send, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type AdminProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type SupportThread = {
  id: string;
  subject: string | null;
  status: string | null;
  created_at?: string | null;
};

type SupportMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
};

type SupportDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type DrawerView = "home" | "conversation";

function formatMessageTime(value: string) {
  try {
    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function SupportDrawer({
  open,
  onClose,
}: SupportDrawerProps) {
  const { user } = useAuth();

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [view, setView] = useState<DrawerView>("home");

  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setView("home");
      setThread(null);
      setMessages([]);
      setSubject("");
      setMessage("");
      setErrorText("");
      return;
    }

    let cancelled = false;

    async function loadAdmins() {
      setLoadingAdmins(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("role", ["admin", "owner", "moderator"])
        .order("username", { ascending: true })
        .limit(6);

      if (cancelled) return;

      if (!error && data) {
        setAdmins((data ?? []) as AdminProfile[]);
      } else {
        setAdmins([]);
      }

      setLoadingAdmins(false);
    }

    loadAdmins();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;

    let mounted = true;

    async function bootConversation() {
      const loaded = await ensureConversationLoaded();
      if (!mounted) return;

      if (loaded?.thread && loaded.messages.length > 0) {
        setView("conversation");
      }
    }

    bootConversation();

    return () => {
      mounted = false;
    };
  }, [open, user]);

  useEffect(() => {
    if (!open || !thread?.id) return;

    const channel = supabase
      .channel(`support-drawer-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, thread?.id]);

  useEffect(() => {
    if (!messages.length) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const previewAdmins = useMemo(() => admins.slice(0, 3), [admins]);

  async function ensureConversationLoaded() {
    if (!user) return null;

    setLoadingConversation(true);
    setErrorText("");

    try {
      const { data: existingThread, error: threadLookupError } = await supabase
        .from("support_threads")
        .select("id, subject, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (threadLookupError) {
        throw new Error(threadLookupError.message);
      }

      if (!existingThread) {
        setThread(null);
        setMessages([]);
        return { thread: null, messages: [] as SupportMessage[] };
      }

      const typedThread = existingThread as SupportThread;
      setThread(typedThread);
      setSubject(typedThread.subject ?? "");

      const { data: messageData, error: messageError } = await supabase
        .from("support_messages")
        .select("id, thread_id, sender_id, content, created_at")
        .eq("thread_id", typedThread.id)
        .order("created_at", { ascending: true });

      if (messageError) {
        throw new Error(messageError.message);
      }

      const typedMessages = (messageData ?? []) as SupportMessage[];
      setMessages(typedMessages);

      return { thread: typedThread, messages: typedMessages };
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Could not load your support conversation."
      );
      return null;
    } finally {
      setLoadingConversation(false);
    }
  }

  async function createThreadIfNeeded() {
    if (!user) return null;
    if (thread?.id) return thread.id;

    const fallbackSubject = subject.trim() || "Support request";

    const { data: newThread, error } = await supabase
      .from("support_threads")
      .insert({
        user_id: user.id,
        subject: fallbackSubject,
        status: "open",
      })
      .select("id, subject, status, created_at")
      .single();

    if (error || !newThread) {
      throw new Error(error?.message || "Could not create support thread.");
    }

    const typedThread = newThread as SupportThread;
    setThread(typedThread);
    setSubject(typedThread.subject ?? fallbackSubject);

    return typedThread.id;
  }

  async function handleOpenConversation() {
    setErrorText("");

    if (!user) {
      setErrorText("You need to be logged in to open support.");
      return;
    }

    await ensureConversationLoaded();
    setView("conversation");
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    setErrorText("");

    if (!user) {
      setErrorText("You need to be logged in to send a support message.");
      return;
    }

    if (!message.trim()) {
      setErrorText("Please write a message before sending.");
      return;
    }

    if (!subject.trim() && !thread) {
      setErrorText("Please add a subject for your support request.");
      return;
    }

    setSending(true);

    try {
      const threadId = await createThreadIfNeeded();

      if (!threadId) {
        throw new Error("Missing thread.");
      }

      if (subject.trim()) {
        await supabase
          .from("support_threads")
          .update({
            subject: subject.trim(),
            status: "open",
          })
          .eq("id", threadId);
      } else {
        await supabase
          .from("support_threads")
          .update({ status: "open" })
          .eq("id", threadId);
      }

      const content = message.trim();

      const { data: insertedMessage, error: messageError } = await supabase
        .from("support_messages")
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content,
        })
        .select("id, thread_id, sender_id, content, created_at")
        .single();

      if (messageError || !insertedMessage) {
        throw new Error(messageError?.message || "Could not send message.");
      }

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === insertedMessage.id)) return prev;
        return [...prev, insertedMessage as SupportMessage];
      });

      setMessage("");
      setView("conversation");
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Something went wrong while sending your message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm transition-all duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-5xl transform transition-all duration-300 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="relative overflow-hidden rounded-t-[34px] border border-white/10 bg-[linear-gradient(180deg,#12182d_0%,#0a1020_52%,#070b15_100%)] shadow-[0_-20px_80px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-12 top-10 h-32 w-32 rounded-full bg-fuchsia-500/12 blur-3xl" />
            <div className="absolute right-12 top-20 h-28 w-28 rounded-full bg-blue-500/12 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />
          </div>

          <div className="relative px-6 pb-8 pt-5 sm:px-8 sm:pb-10">
            <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/15" />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-4 flex -space-x-3">
                  {loadingAdmins ? (
                    <>
                      <div className="h-14 w-14 rounded-full border-2 border-white/15 bg-white/10" />
                      <div className="h-14 w-14 rounded-full border-2 border-white/15 bg-white/10" />
                      <div className="h-14 w-14 rounded-full border-2 border-white/15 bg-white/10" />
                    </>
                  ) : previewAdmins.length > 0 ? (
                    previewAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="h-14 w-14 overflow-hidden rounded-full border-2 border-white/15 bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                      >
                        {admin.avatar_url ? (
                          <img
                            src={admin.avatar_url}
                            alt={admin.username ?? "Admin avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(168,85,247,0.32),rgba(59,130,246,0.25),rgba(239,68,68,0.18))] text-sm font-semibold text-white">
                            {(admin.username?.[0] ?? "A").toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 text-sm font-semibold text-white">
                        A
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 text-sm font-semibold text-white">
                        D
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 text-sm font-semibold text-white">
                        M
                      </div>
                    </>
                  )}
                </div>

                <h2 className="bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                  {view === "home" ? "Support center" : "Support conversation"}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                  {view === "home"
                    ? "Open a conversation with the Dxblox team, report an issue, or join the community."
                    : "Stay here and chat directly with support from this drawer."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close support drawer"
              >
                <X size={18} />
              </button>
            </div>

            {errorText ? (
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorText}
              </div>
            ) : null}

            {view === "home" ? (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleOpenConversation}
                    className="group rounded-[24px] border border-white/10 bg-white/[0.05] p-5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-400/25 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-fuchsia-200">
                        <MessageSquare size={18} />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Open support conversation
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Start or continue your chat directly here.
                        </p>
                      </div>
                    </div>
                  </button>

                  <Link
                    href="/reports"
                    onClick={onClose}
                    className="group rounded-[24px] border border-white/10 bg-white/[0.05] p-5 transition hover:-translate-y-0.5 hover:border-fuchsia-400/25 hover:bg-white/[0.08] hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-200">
                        <ShieldAlert size={18} />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Report a user or issue
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Open a report if something looks suspicious.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Community Discord
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        Add your Discord link here and replace it later.
                      </p>
                    </div>

                    <a
                      href="https://discord.gg/your-link"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/15"
                    >
                      Join Discord
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.45fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
                    Thread details
                  </h3>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Example: Problem with a listing"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/38">
                      Status
                    </div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {thread?.status || "New conversation"}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Messages
                      </h3>
                      <p className="mt-1 text-sm text-white/45">
                        Chat directly with the Dxblox team.
                      </p>
                    </div>

                    {loadingConversation && (
                      <span className="text-xs text-white/45">Loading…</span>
                    )}
                  </div>

                  <div className="mt-4 h-[280px] overflow-y-auto rounded-[20px] border border-white/8 bg-black/20 p-3 sm:p-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center">
                        <div>
                          <div className="text-sm font-medium text-white">
                            No messages yet
                          </div>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                            Send your first message and the conversation will stay here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((item) => {
                          const isMine = !!user && item.sender_id === user.id;

                          return (
                            <div
                              key={item.id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-6 ${
                                  isMine
                                    ? "border border-fuchsia-400/18 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.12),rgba(239,68,68,0.10))] text-white shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                                    : "border border-white/10 bg-white/[0.05] text-white/85"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{item.content}</p>
                                <div className="mt-2 text-[11px] text-white/35">
                                  {formatMessageTime(item.created_at)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      New message
                    </label>

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Explain your problem here..."
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.07]"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={15} />
                        {sending ? "Sending..." : "Send message"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMessage("");
                          setErrorText("");
                        }}
                        className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}