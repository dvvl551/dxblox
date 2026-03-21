"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-xs text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-16 rounded-2xl border border-white/8 object-cover"
    />
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

  const bottomRef = useRef<HTMLDivElement | null>(null);

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

      const { data: conversationData, error: conversationError } =
        await supabase
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
          .select("id, user_id, item_name, game, category, price, image_url, status")
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

          setMessages((prev) => {
            if (prev.some((item) => item.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, conversation, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !conversation) return;
    if (sending) return;

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
      const tempContent = content;

      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: tempContent,
        })
        .select("id, conversation_id, sender_id, content, created_at")
        .single();

      if (error || !insertedMessage) {
        console.error("Send message error:", error);
        setErrorMessage(
          error?.message || "Could not send message. Please try again."
        );
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item.id === insertedMessage.id)) {
          return prev;
        }
        return [...prev, insertedMessage as MessageRow];
      });

      setMessageInput("");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSending(false);
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

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="messages" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
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
          <div className="rounded-[30px] border border-red-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-8 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
            <div className="text-lg font-semibold text-red-200">
              Conversation unavailable
            </div>
            <p className="mt-3 text-sm leading-7 text-red-300/90">
              {errorMessage}
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
            Loading conversation...
          </div>
        ) : !user ? (
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
            <div className="text-xl font-bold text-white">
              Sign in to access messages
            </div>
            <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
              You need an account to view this conversation.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              Go to login
            </Link>
          </div>
        ) : conversation && listing ? (
          <section className="grid gap-8 xl:grid-cols-[320px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                  Listing
                </div>

                <div className="flex items-start gap-4">
                  <ListingImage src={listing.image_url} alt={listing.item_name} />

                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold text-white">
                      {listing.item_name}
                    </div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">
                      {listing.game} • {listing.category}
                    </div>
                    <div className="mt-3 text-xl font-bold text-emerald-300">
                      {listing.price}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9CA3AF]">Status</span>
                    <span className="font-semibold text-white">
                      {listing.status}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/listing/${listing.id}`}
                  className="mt-5 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/5"
                >
                  View listing
                </Link>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                  Participants
                </div>

                <div className="space-y-4">
                  {[buyerProfile, sellerProfile].filter(Boolean).map((profileItem) => {
                    const typedProfile = profileItem as ProfileRow;
                    const username = typedProfile.username || "Unknown user";
                    const isMe = typedProfile.id === user.id;
                    const isAdmin = typedProfile.role === "admin";
                    const roleLabel =
                      typedProfile.id === conversation.buyer_id ? "Buyer" : "Seller";

                    return (
                      <div
                        key={typedProfile.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-3"
                      >
                        {typedProfile.avatar_url ? (
                          <img
                            src={typedProfile.avatar_url}
                            alt={username}
                            className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                            {username[0]?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate font-semibold text-white">
                              {username}
                            </div>

                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/75">
                              {roleLabel}
                            </span>

                            {isMe && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/75">
                                You
                              </span>
                            )}

                            {isAdmin && (
                              <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                Admin
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#9CA3AF]">
                            Conversation member
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#131320] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-2xl font-bold text-white">
                      Conversation with {otherUser?.username || "Unknown user"}
                    </div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">
                      Stay on Dxblox and trade carefully.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-[#9CA3AF]">
                      {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-[#9CA3AF]">
                      Started {formatHeaderDate(conversation.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pt-6">
                {errorMessage && conversation && (
                  <div className="mb-4 rounded-[24px] border border-red-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-5 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
                    <div className="text-base font-semibold text-red-200">
                      Message issue
                    </div>
                    <p className="mt-2 text-sm leading-7 text-red-300/90">
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

              <div className="max-h-[560px] space-y-4 overflow-y-auto px-6 pb-6">
                {messages.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 text-center">
                    <div className="text-lg font-bold text-white">
                      No messages yet
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                      Start the conversation below.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === user.id;
                    const senderProfile =
                      message.sender_id === buyerProfile?.id
                        ? buyerProfile
                        : sellerProfile;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-[24px] px-4 py-3 shadow-sm ${
                            isMine
                              ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                              : "border border-white/10 bg-white/5 text-white"
                          }`}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={
                                isMine ? "text-white/80" : "text-[#9CA3AF]"
                              }
                            >
                              {senderProfile?.username || "Unknown user"}
                            </span>
                            <span
                              className={
                                isMine ? "text-white/60" : "text-[#6F778B]"
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
                  })
                )}

                <div ref={bottomRef} />
              </div>

              <div className="border-t border-white/8 px-6 py-5">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                  <textarea
                    rows={4}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Write your message..."
                    maxLength={1000}
                    className="w-full resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#73798f]"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#9CA3AF]">
                      {messageInput.trim().length}/1000 characters
                    </div>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || messageInput.trim().length === 0}
                      className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send message"}
                    </button>
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