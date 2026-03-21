"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type Listing = {
  id: string;
  item_name: string;
  game: string;
  category: string;
  price: string;
  image_url: string | null;
  user_id: string;
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
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-xs text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-20 w-20 rounded-2xl border border-white/8 object-cover"
    />
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, Listing>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [lastMessagesMap, setLastMessagesMap] = useState<
    Record<string, MessageRow>
  >({});

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchInbox = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        setErrorMessage("You must be signed in to view your messages.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("id, listing_id, buyer_id, seller_id, created_at")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

      if (conversationsError) {
        console.error("Conversations load error:", conversationsError);
        setConversations([]);
        setListingsMap({});
        setProfilesMap({});
        setLastMessagesMap({});
        setErrorMessage(
          conversationsError.message || "Could not load conversations."
        );
        setLoading(false);
        return;
      }

      const nextConversations = (conversationsData ?? []) as Conversation[];
      setConversations(nextConversations);

      if (nextConversations.length === 0) {
        setListingsMap({});
        setProfilesMap({});
        setLastMessagesMap({});
        setLoading(false);
        return;
      }

      const listingIds = [...new Set(nextConversations.map((item) => item.listing_id))];
      const otherUserIds = [
        ...new Set(
          nextConversations.map((item) =>
            item.buyer_id === user.id ? item.seller_id : item.buyer_id
          )
        ),
      ];
      const conversationIds = nextConversations.map((item) => item.id);

      const [
        { data: listingsData },
        { data: profilesData },
        { data: messagesData },
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("id, item_name, game, category, price, image_url, user_id")
          .in("id", listingIds),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .in("id", otherUserIds),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false }),
      ]);

      const nextListingsMap: Record<string, Listing> = {};
      (listingsData ?? []).forEach((item) => {
        const typedItem = item as Listing;
        nextListingsMap[typedItem.id] = typedItem;
      });
      setListingsMap(nextListingsMap);

      const nextProfilesMap: Record<string, ProfileRow> = {};
      (profilesData ?? []).forEach((item) => {
        const typedItem = item as ProfileRow;
        nextProfilesMap[typedItem.id] = typedItem;
      });
      setProfilesMap(nextProfilesMap);

      const nextLastMessagesMap: Record<string, MessageRow> = {};
      (messagesData ?? []).forEach((item) => {
        const typedItem = item as MessageRow;
        if (!nextLastMessagesMap[typedItem.conversation_id]) {
          nextLastMessagesMap[typedItem.conversation_id] = typedItem;
        }
      });
      setLastMessagesMap(nextLastMessagesMap);

      setLoading(false);
    };

    fetchInbox();
  }, [user, authLoading]);

  const conversationCards = useMemo(() => {
    if (!user) return [];

    return conversations
      .map((conversation) => {
        const listing = listingsMap[conversation.listing_id];
        const otherUserId =
          conversation.buyer_id === user.id
            ? conversation.seller_id
            : conversation.buyer_id;
        const otherUser = profilesMap[otherUserId];
        const lastMessage = lastMessagesMap[conversation.id];
        const amIBuyer = conversation.buyer_id === user.id;

        return {
          conversation,
          listing,
          otherUserId,
          otherUser,
          lastMessage,
          amIBuyer,
        };
      })
      .filter((item) => Boolean(item.listing))
      .filter((item) => {
        const searchValue = search.trim().toLowerCase();
        if (!searchValue) return true;

        const username = item.otherUser?.username?.toLowerCase() || "";
        const itemName = item.listing?.item_name.toLowerCase() || "";
        const game = item.listing?.game.toLowerCase() || "";
        const category = item.listing?.category.toLowerCase() || "";
        const lastMessage = item.lastMessage?.content.toLowerCase() || "";

        return (
          username.includes(searchValue) ||
          itemName.includes(searchValue) ||
          game.includes(searchValue) ||
          category.includes(searchValue) ||
          lastMessage.includes(searchValue)
        );
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.conversation.created_at;
        const bTime = b.lastMessage?.created_at || b.conversation.created_at;

        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [conversations, listingsMap, profilesMap, lastMessagesMap, search, user]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
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
          <span className="text-white">Messages</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Inbox
              </div>
              <h1 className="text-4xl font-black tracking-tight">Messages</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                View your buyer and seller conversations in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Conversations</div>
                <div className="mt-1 text-2xl font-bold">
                  {conversations.length}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Results</div>
                <div className="mt-1 text-2xl font-bold">
                  {conversationCards.length}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Status</div>
                <div className="mt-1 text-sm font-semibold text-violet-300">
                  Active inbox
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-[#9CA3AF]">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username, listing or message..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
            />
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && (
            <div className="mb-6 rounded-[24px] border border-red-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-5 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
              <div className="text-base font-semibold text-red-200">
                Messages are unavailable right now
              </div>
              <p className="mt-2 text-sm leading-7 text-red-300/90">
                {errorMessage}
              </p>
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
              Loading messages...
            </div>
          ) : !user ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
              <div className="text-xl font-bold text-white">
                Sign in to view your inbox
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                You need an account to access conversations.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                Go to login
              </Link>
            </div>
          ) : conversationCards.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
              <div className="text-xl font-bold text-white">
                No conversations yet
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Start by contacting a seller from a listing page.
              </p>
              <Link
                href="/listing"
                className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="grid gap-5">
              {conversationCards.map((item) => {
                const listing = item.listing!;
                const otherUsername =
                  item.otherUser?.username || "Unknown user";
                const otherAvatar = item.otherUser?.avatar_url || null;
                const isAdminUser = item.otherUser?.role === "admin";
                const roleLabel = item.amIBuyer ? "Seller" : "Buyer";
                const lastActivity =
                  item.lastMessage?.created_at || item.conversation.created_at;
                const hasLastMessage = !!item.lastMessage;
                const previewText = hasLastMessage
                  ? truncateText(item.lastMessage!.content, 90)
                  : "No messages yet.";

                return (
                  <Link
                    key={item.conversation.id}
                    href={`/messages/${item.conversation.id}`}
                    className="block rounded-[28px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ListingImage
                          src={listing.image_url}
                          alt={listing.item_name}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-lg font-bold text-white">
                              {listing.item_name}
                            </div>
                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                              {listing.game}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
                              {roleLabel}
                            </span>
                          </div>

                          <div className="mt-1 text-sm text-[#9CA3AF]">
                            {listing.game} • {listing.category}
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            {otherAvatar ? (
                              <img
                                src={otherAvatar}
                                alt={otherUsername}
                                className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                                {otherUsername[0]?.toUpperCase() || "U"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-white">
                                  {otherUsername}
                                </div>

                                {isAdminUser && (
                                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                    Admin
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-sm leading-6 text-[#9CA3AF]">
                                {previewText}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                          <div className="text-xs text-emerald-300">Price</div>
                          <div className="mt-1 font-bold text-emerald-300">
                            {listing.price}
                          </div>
                        </div>

                        <div className="text-right text-xs text-[#9CA3AF]">
                          <div>{formatDate(lastActivity)}</div>
                          <div className="mt-1">{formatTime(lastActivity)}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}