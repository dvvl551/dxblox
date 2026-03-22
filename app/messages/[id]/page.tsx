"use client";

import Link from "next/link";
import { KeyboardEvent, use, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type MessagePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type Listing = {
  id: string;
  user_id: string;
  item_name: string;
  game: string;
  category: string;
  price: string;
  image_url: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function ListingImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] text-xs text-white/40">
        No image
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
      <img
        src={src}
        alt={alt}
        className="h-24 w-24 object-cover transition duration-500 hover:scale-[1.04]"
      />
    </div>
  );
}

function UserAvatar({
  profile,
  fallback,
}: {
  profile: ProfileRow | null;
  fallback: string;
}) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.username || fallback}
        className="h-11 w-11 rounded-2xl border border-white/10 object-cover shadow-[0_0_18px_rgba(168,85,247,0.08)]"
      />
    );
  }

  const initial = (profile?.username || fallback || "U")[0]?.toUpperCase() || "U";

  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(59,130,246,0.22),rgba(239,68,68,0.18))] text-sm font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,transparent)]" />
      <span className="relative z-10">{initial}</span>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  const style =
    normalized === "active"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : normalized === "sold"
      ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
      : normalized === "reserved"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-white/10 bg-white/[0.05] text-white/80";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {value}
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_0_30px_rgba(168,85,247,0.04)] transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/20 hover:shadow-[0_0_40px_rgba(168,85,247,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_35%,transparent_70%,rgba(168,85,247,0.05))]" />
      <div className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
        {label}
      </div>
<div className="relative mt-3 truncate whitespace-nowrap text-lg font-black leading-tight text-white transition group-hover:text-fuchsia-100 sm:text-xl">
  {value}
</div>
    </div>
  );
}

export default function MessageConversationPage({ params }: MessagePageProps) {
  const { user, loading: authLoading } = useAuth();
  const { id: conversationId } = use(params);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<ProfileRow | null>(null);
  const [sellerProfile, setSellerProfile] = useState<ProfileRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(false);
  const hasInitialScrollRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;

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

  const areMessagesEqual = (a: MessageRow[], b: MessageRow[]) => {
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

  useEffect(() => {
    if (!conversationId || authLoading) return;

    const fetchConversation = async () => {
      if (!user) {
        setLoading(false);
        setErrorMessage("You must be signed in to view this conversation.");
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setActionMessage("");

      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select("id, listing_id, buyer_id, seller_id, created_at")
        .eq("id", conversationId)
        .maybeSingle();

      if (conversationError || !conversationData) {
        setConversation(null);
        setListing(null);
        setBuyerProfile(null);
        setSellerProfile(null);
        setMessages([]);
        setErrorMessage("Conversation not found.");
        setLoading(false);
        return;
      }

      const typedConversation = conversationData as Conversation;

      const isParticipant =
        typedConversation.buyer_id === user.id ||
        typedConversation.seller_id === user.id;

      if (!isParticipant) {
        setConversation(null);
        setListing(null);
        setBuyerProfile(null);
        setSellerProfile(null);
        setMessages([]);
        setErrorMessage("You do not have access to this conversation.");
        setLoading(false);
        return;
      }

      setConversation(typedConversation);

      const [
        { data: listingData },
        { data: buyerData },
        { data: sellerData },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, user_id, item_name, game, category, price, image_url, status"
          )
          .eq("id", typedConversation.listing_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .eq("id", typedConversation.buyer_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .eq("id", typedConversation.seller_id)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .eq("conversation_id", typedConversation.id)
          .order("created_at", { ascending: true }),
      ]);

      setListing((listingData as Listing) ?? null);
      setBuyerProfile((buyerData as ProfileRow) ?? null);
      setSellerProfile((sellerData as ProfileRow) ?? null);

      if (messagesError) {
        setMessages([]);
        setErrorMessage("Conversation loaded, but messages could not be loaded.");
      } else {
        setMessages((messagesData ?? []) as MessageRow[]);
      }

      setLoading(false);
    };

    fetchConversation();
  }, [conversationId, user, authLoading]);

  useEffect(() => {
    if (!conversationId || !conversation || !user) return;

    const mergeMessages = (incoming: MessageRow[]) => {
      setMessages((prev) => {
        const map = new Map<string, MessageRow>();

        [...prev, ...incoming].forEach((message) => {
          map.set(message.id, message);
        });

        const next = Array.from(map.values()).sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        if (areMessagesEqual(prev, next)) {
          return prev;
        }

        return next;
      });
    };

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageRow;

          if (newMessage.sender_id === user.id || isNearBottom()) {
            shouldAutoScrollRef.current = true;
          }

          mergeMessages([newMessage]);
        }
      )
      .subscribe();

    const pollInterval = window.setInterval(async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        mergeMessages(data as MessageRow[]);
      }
    }, 2500);

    return () => {
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [conversationId, conversation, user]);

  useEffect(() => {
    if (!messages.length) return;

    if (!hasInitialScrollRef.current) {
      hasInitialScrollRef.current = true;
      scrollToBottom("auto");
      shouldAutoScrollRef.current = false;
      return;
    }

    if (shouldAutoScrollRef.current) {
      scrollToBottom("smooth");
      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !conversation || sending) return;

    const content = messageInput.trim();

    if (!content) return;

    if (content.length > 1000) {
      setErrorMessage("Message is too long.");
      setActionMessage("");
      return;
    }

    setSending(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content,
        })
        .select("id, conversation_id, sender_id, content, created_at")
        .single();

      if (error || !insertedMessage) {
        setErrorMessage(
          error?.message || "Could not send message. Please try again."
        );
        return;
      }

      shouldAutoScrollRef.current = true;

      setMessages((prev) => {
        if (prev.some((item) => item.id === insertedMessage.id)) {
          return prev;
        }

        return [...prev, insertedMessage as MessageRow].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setMessageInput("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const otherUser = useMemo(() => {
    if (!conversation || !user) return null;
    return conversation.buyer_id === user.id ? sellerProfile : buyerProfile;
  }, [conversation, user, buyerProfile, sellerProfile]);

  const formatMessageTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHeaderDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; items: MessageRow[] }> = [];

    for (const message of messages) {
      const label = formatHeaderDate(message.created_at);
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.label !== label) {
        groups.push({
          label,
          items: [message],
        });
      } else {
        lastGroup.items.push(message);
      }
    }

    return groups;
  }, [messages]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05030A] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <Navbar active="messages" />

      <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/45">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/messages" className="transition hover:text-white">
            Messages
          </Link>
          <span>/</span>
          <span className="text-white">Conversation</span>
        </div>

        {errorMessage && !loading && !conversation && (
          <div className="rounded-[30px] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-8 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
            <div className="text-lg font-semibold text-rose-200">
              Conversation Unavailable
            </div>
            <p className="mt-3 text-sm leading-7 text-rose-300/90">
              {errorMessage}
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-8 text-white/45 backdrop-blur-xl">
            Loading conversation...
          </div>
        ) : !user ? (
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-8 text-center backdrop-blur-xl">
            <div className="text-xl font-bold text-white">
              Sign in to access messages
            </div>
            <p className="mt-3 text-sm leading-7 text-white/55">
              You need an account to view this conversation.
            </p>
            <Link
              href="/login"
              className="relative mt-5 inline-flex overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.22)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.28)]"
            >
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
              <span className="relative z-10">Go to login</span>
            </Link>
          </div>
        ) : conversation && listing ? (
          <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(12,16,28,0.92))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl">
                <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">
                  Listing details
                </div>

                <div className="flex items-start gap-4">
                  <ListingImage src={listing.image_url} alt={listing.item_name} />

                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold text-white">
                      {listing.item_name}
                    </div>
                    <div className="mt-1 text-sm text-white/45">
                      {listing.game} • {listing.category}
                    </div>
                    <div className="mt-3 text-xl font-bold text-emerald-300">
                      {listing.price}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoCard label="Status" value={listing.status} />
                  <InfoCard label="Messages" value={messages.length} />
                </div>

                <Link
                  href={`/listing/${listing.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-fuchsia-400/20 hover:bg-white/[0.08]"
                >
                  View listing
                </Link>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(12,16,28,0.92))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl">
                <div className="mb-4 inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                  Participants
                </div>

                <div className="space-y-4">
                  {[buyerProfile, sellerProfile].filter(Boolean).map((profileItem) => {
                    const typedProfile = profileItem as ProfileRow;
                    const username = typedProfile.username || "Unknown user";
                    const isMe = typedProfile.id === user.id;
                    const isAdmin =
                      typedProfile.role === "admin" ||
                      typedProfile.role === "owner" ||
                      typedProfile.role === "moderator";
                    const roleLabel =
                      typedProfile.id === conversation.buyer_id ? "Buyer" : "Seller";

                    return (
                      <div
                        key={typedProfile.id}
                        className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-3"
                      >
                        <UserAvatar profile={typedProfile} fallback={username} />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate font-semibold text-white">
                              {username}
                            </div>

                            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/75">
                              {roleLabel}
                            </span>

                            {isMe && (
                              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/75">
                                You
                              </span>
                            )}

                            {isAdmin && (
                              <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                                Admin
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-white/40">
                            Conversation member
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.95),rgba(11,15,26,0.95))] shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        profile={otherUser}
                        fallback={otherUser?.username || "User"}
                      />
                      <div className="min-w-0">
                        <div className="truncate bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-2xl font-black text-transparent">
                          {otherUser?.username || "Unknown user"}
                        </div>
                        <div className="mt-1 text-sm text-white/45">
                          Trade safely and keep all communication on Dxblox.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Messages" value={messages.length} />
                    <InfoCard
                      label="Started"
                      value={formatHeaderDate(conversation.created_at)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex h-[72vh] min-h-[620px] flex-col">
                <div className="px-5 pt-5 sm:px-6">
                  {errorMessage && conversation && (
                    <div className="mb-4 rounded-[24px] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-5 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
                      <div className="text-base font-semibold text-rose-200">
                        Message issue
                      </div>
                      <p className="mt-2 text-sm leading-7 text-rose-300/90">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {actionMessage && (
                    <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                      {actionMessage}
                    </div>
                  )}
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center">
                      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center">
                        <div className="text-lg font-bold text-white">
                          No messages yet
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/50">
                          Start the conversation below.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedMessages.map((group) => (
                        <div key={group.label}>
                          <div className="mb-4 flex items-center justify-center">
                            <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-medium text-white/45">
                              {group.label}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {group.items.map((message) => {
                              const isMine = message.sender_id === user.id;
                              const senderProfile =
                                message.sender_id === buyerProfile?.id
                                  ? buyerProfile
                                  : sellerProfile;

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    isMine ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[82%] rounded-[26px] border px-4 py-3 shadow-sm sm:max-w-[75%] ${
                                      isMine
                                        ? "border-fuchsia-400/18 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.12),rgba(239,68,68,0.10))] text-white shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                                        : "border-white/10 bg-white/[0.05] text-white"
                                    }`}
                                  >
                                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                                      <span
                                        className={
                                          isMine ? "text-white/78" : "text-white/45"
                                        }
                                      >
                                        {senderProfile?.username || "Unknown user"}
                                      </span>
                                      <span
                                        className={
                                          isMine ? "text-white/55" : "text-white/30"
                                        }
                                      >
                                        {formatMessageTime(message.created_at)}
                                      </span>
                                    </div>

                                    <p className="whitespace-pre-wrap break-words text-sm leading-7">
                                      {message.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 p-5 sm:p-6">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-3 shadow-[0_0_25px_rgba(59,130,246,0.04)]">
                    <textarea
                      rows={4}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      placeholder="Write your message..."
                      maxLength={1000}
                      className="w-full resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/25"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1 text-xs text-white/45">
                        <div>{messageInput.trim().length}/1000 characters</div>
                        <div className="text-white/28">
                          Enter to send • Shift + Enter for new line
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sending || messageInput.trim().length === 0}
                        className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                        <span className="relative z-10">
                          {sending ? "Sending..." : "Send message"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}