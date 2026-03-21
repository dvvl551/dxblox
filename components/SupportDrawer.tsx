"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type AdminProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type SupportDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type DrawerView = "home" | "compose";

export default function SupportDrawer({
  open,
  onClose,
}: SupportDrawerProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [view, setView] = useState<DrawerView>("home");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");

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
        .eq("role", "admin")
        .order("username", { ascending: true })
        .limit(5);

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

  const previewAdmins = useMemo(() => admins.slice(0, 3), [admins]);

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErrorText("");

    if (!user) {
      setErrorText("You need to be logged in to send a support message.");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorText("Please add a subject and a message.");
      return;
    }

    setSending(true);

    try {
      const { data: existingThread, error: existingThreadError } = await supabase
        .from("support_threads")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingThreadError) {
        throw new Error(`Thread lookup error: ${existingThreadError.message}`);
      }

      let threadId = existingThread?.id ?? null;

      if (!threadId) {
        const { data: newThread, error: threadError } = await supabase
          .from("support_threads")
          .insert({
            user_id: user.id,
            subject: subject.trim(),
            status: "open",
          })
          .select("id")
          .single();

        if (threadError) {
          throw new Error(`Thread error: ${threadError.message}`);
        }

        if (!newThread) {
          throw new Error("Thread error: no thread returned.");
        }

        threadId = newThread.id;
      } else {
        const { error: updateThreadError } = await supabase
          .from("support_threads")
          .update({
            status: "open",
          })
          .eq("id", threadId)
          .eq("user_id", user.id);

        if (updateThreadError) {
          throw new Error(
            `Thread update error: ${updateThreadError.message}`
          );
        }
      }

      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content: message.trim(),
        });

      if (messageError) {
        throw new Error(`Message error: ${messageError.message}`);
      }

      setSubject("");
      setMessage("");
      setView("home");

      onClose();

      router.push(`/support/inbox?thread=${threadId}`, { scroll: true });

      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 50);
    } catch (error) {
      console.error("Support submit error:", error);
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
        className={`fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-4xl transform transition-all duration-300 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="relative overflow-hidden rounded-t-[32px] border border-white/10 bg-[linear-gradient(180deg,#10152f_0%,#0a1025_55%,#060a18_100%)] shadow-[0_-20px_80px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute right-10 top-20 h-24 w-24 rounded-full bg-blue-500/15 blur-3xl" />
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
                        className="h-14 w-14 overflow-hidden rounded-full border-2 border-white/15 bg-white/10"
                      >
                        {admin.avatar_url ? (
                          <img
                            src={admin.avatar_url}
                            alt={admin.username ?? "Admin avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-sm font-semibold text-white">
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

                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {view === "home" ? "Need help?" : "Send us a message"}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#A5B0C5] sm:text-base">
                  {view === "home"
                    ? "Contact the Dxblox team, open a report, or join the community."
                    : "Write directly to the team from here, then continue the conversation in your support inbox."}
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
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorText}
              </div>
            ) : null}

            {view === "home" ? (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorText("");
                      setView("compose");
                    }}
                    className="group rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-left transition hover:border-violet-400/30 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-200">
                        <MessageSquare size={18} />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Send us a message
                        </h3>
                        <p className="mt-1 text-sm text-[#9CA3AF]">
                          Contact the team directly from this panel.
                        </p>
                      </div>
                    </div>
                  </button>

                  <Link
                    href="/reports"
                    onClick={onClose}
                    className="group rounded-2xl border border-white/10 bg-white/[0.05] p-5 transition hover:border-violet-400/30 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-200">
                        <ShieldAlert size={18} />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Report a user or issue
                        </h3>
                        <p className="mt-1 text-sm text-[#9CA3AF]">
                          Open a report if something looks suspicious.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="mt-4">
                  <Link
                    href="/support/inbox"
                    onClick={onClose}
                    className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                  >
                    Open support inbox
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Community Discord
                      </h3>
                      <p className="mt-1 text-sm text-[#9CA3AF]">
                        Mets ton lien Discord ici maintenant, puis remplace-le
                        plus tard.
                      </p>
                    </div>

                    <a
                      href="https://discord.gg/your-link"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-500/15"
                    >
                      Join Discord
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Team
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {admins.slice(0, 3).map((admin) => (
                      <Link
                        key={admin.id}
                        href={`/users/${admin.id}`}
                        onClick={onClose}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/15 hover:bg-white/[0.06]"
                      >
                        <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/10">
                          {admin.avatar_url ? (
                            <img
                              src={admin.avatar_url}
                              alt={admin.username ?? "Admin avatar"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-base font-semibold text-white">
                              {(admin.username?.[0] ?? "A").toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-center">
                          <p className="text-sm font-semibold text-white">
                            {admin.username ?? "Admin"}
                          </p>
                          <p className="mt-1 text-xs text-[#9CA3AF]">
                            Dxblox Team
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setErrorText("");
                    setView("home");
                  }}
                  className="mb-5 inline-flex items-center gap-2 text-sm text-[#A5B0C5] transition hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Example: Problem with a listing"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7B8197] focus:border-violet-400/30 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Explain your problem here..."
                      rows={6}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7B8197] focus:border-violet-400/30 focus:bg-white/[0.07]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send message"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSubject("");
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}