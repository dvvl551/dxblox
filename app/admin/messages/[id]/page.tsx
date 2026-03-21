"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type AdminMessagePageProps = {
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

export default function AdminMessageConversationPage({
  params,
}: AdminMessagePageProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { id: conversationId } = use(params);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<ProfileRow | null>(null);
  const [sellerProfile, setSellerProfile] = useState<ProfileRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!conversationId || authLoading) return;

    const fetchConversation = async () => {
      if (!user) {
        setLoading(false);
        setErrorMessage("You must be signed in.");
        return;
      }

      if (profile && profile.role !== "admin") {
        setLoading(false);
        setErrorMessage("Access denied.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

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
  }, [conversationId, user, authLoading, profile]);

  useEffect(() => {
    if (!conversationId || !user || !isAdmin) return;

    const channel = supabase
      .channel(`admin-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const { data } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, content, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

          setMessages((data ?? []) as MessageRow[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const otherSummary = useMemo(() => {
    if (!buyerProfile || !sellerProfile) return null;

    return {
      buyerName: buyerProfile.username || "Unknown buyer",
      sellerName: sellerProfile.username || "Unknown seller",
    };
  }, [buyerProfile, sellerProfile]);

  if (!loading && (!user || !isAdmin)) {
    return (
      <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {errorMessage || "Access denied."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="admin" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin" className="transition hover:text-white">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/messages" className="transition hover:text-white">
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
        ) : conversation ? (
          <section className="grid gap-8 xl:grid-cols-[320px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                  Listing
                </div>

                <div className="flex items-start gap-4">
                  <ListingImage
                    src={listing?.image_url || null}
                    alt={listing?.item_name || "Conversation listing"}
                  />

                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold text-white">
                      {listing?.item_name || "Deleted listing"}
                    </div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">
                      {listing ? `${listing.game} • ${listing.category}` : "Listing unavailable"}
                    </div>
                    <div className="mt-3 text-xl font-bold text-emerald-300">
                      {listing?.price || "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9CA3AF]">Status</span>
                    <span className="font-semibold text-white">
                      {listing?.status || "Unknown"}
                    </span>
                  </div>
                </div>

                {listing && (
                  <Link
                    href={`/listing/${listing.id}`}
                    className="mt-5 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/5"
                  >
                    View listing
                  </Link>
                )}
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                  Participants
                </div>

                <div className="space-y-4">
                  {[buyerProfile, sellerProfile].filter(Boolean).map((profileItem) => {
                    const typedProfile = profileItem as ProfileRow;
                    const username = typedProfile.username || "Unknown user";
                    const isAdminProfile = typedProfile.role === "admin";
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

                            {isAdminProfile && (
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
                      {otherSummary
                        ? `${otherSummary.buyerName} ↔ ${otherSummary.sellerName}`
                        : "Conversation"}
                    </div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">
                      Admin read-only conversation view.
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
              </div>

              <div className="max-h-[620px] space-y-4 overflow-y-auto px-6 pb-6">
                {messages.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 text-center">
                    <div className="text-lg font-bold text-white">
                      No messages yet
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                      This conversation has no message history.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isBuyerMessage = message.sender_id === buyerProfile?.id;
                    const senderProfile =
                      message.sender_id === buyerProfile?.id
                        ? buyerProfile
                        : sellerProfile;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isBuyerMessage ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-[24px] px-4 py-3 shadow-sm ${
                            isBuyerMessage
                              ? "border border-white/10 bg-white/5 text-white"
                              : "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                          }`}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={
                                isBuyerMessage ? "text-[#9CA3AF]" : "text-white/80"
                              }
                            >
                              {senderProfile?.username || "Unknown user"}
                            </span>
                            <span
                              className={
                                isBuyerMessage ? "text-[#6F778B]" : "text-white/60"
                              }
                            >
                              {isBuyerMessage ? "Buyer" : "Seller"}
                            </span>
                            <span
                              className={
                                isBuyerMessage ? "text-[#6F778B]" : "text-white/60"
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
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-[#9CA3AF]">
                  This admin view is read only. Message sending is disabled here.
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}