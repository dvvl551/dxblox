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
        className="h-24 w-24 object-cover transition duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
}

function UserAvatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="h-11 w-11 rounded-2xl border border-white/10 object-cover shadow-[0_0_18px_rgba(168,85,247,0.08)]"
      />
    );
  }

  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(59,130,246,0.22),rgba(239,68,68,0.18))] text-sm font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,transparent)]" />
      <span className="relative z-10">{username[0]?.toUpperCase() || "U"}</span>
    </div>
  );
}

function InboxStatCard({
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

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(value);
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
        { data: listingsData, error: listingsError },
        { data: profilesData, error: profilesError },
        { data: messagesData, error: messagesError },
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

      if (listingsError) {
        console.error("Listings load error:", listingsError);
      }

      if (profilesError) {
        console.error("Profiles load error:", profilesError);
      }

      if (messagesError) {
        console.error("Messages load error:", messagesError);
      }

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
          <span className="text-white">Messages</span>
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_24%)]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200 shadow-[0_0_20px_rgba(168,85,247,0.10)]">
                Inbox
              </div>

              <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
                Messages
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                View all your buyer and seller conversations in one premium inbox.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InboxStatCard label="Conversations" value={conversations.length} />
              <InboxStatCard label="Results" value={conversationCards.length} />
              <div className="group relative overflow-hidden rounded-[24px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(168,85,247,0.12),rgba(59,130,246,0.06),rgba(255,255,255,0.03))] px-4 py-4 shadow-[0_0_30px_rgba(168,85,247,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(168,85,247,0.10)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_35%,transparent_70%,rgba(168,85,247,0.05))]" />
                <div className="relative text-[11px] font-semibold uppercase tracking-[0.26em] text-fuchsia-200/70">
                  Status
                </div>
                <div className="relative mt-3 text-sm font-semibold text-fuchsia-100">
                  Active inbox
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <label className="mb-2 block text-sm text-white/45">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username, listing or message..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.08)]"
            />
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && (
            <div className="mb-6 rounded-[24px] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(239,68,68,0.08))] p-5 shadow-[0_12px_40px_rgba(127,29,29,0.12)]">
              <div className="text-base font-semibold text-rose-200">
                Messages are unavailable right now
              </div>
              <p className="mt-2 text-sm leading-7 text-rose-300/90">
                {errorMessage}
              </p>
            </div>
          )}

          {loading ? (
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-8 text-white/45 backdrop-blur-xl">
              Loading messages...
            </div>
          ) : !user ? (
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-8 text-center backdrop-blur-xl">
              <div className="text-xl font-bold text-white">
                Sign in to view your inbox
              </div>
              <p className="mt-3 text-sm leading-7 text-white/55">
                You need an account to access conversations.
              </p>
              <Link
                href="/login"
                className="relative mt-5 inline-flex overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.22)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.28)]"
              >
                <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                <span className="relative z-10">Go to login</span>
              </Link>
            </div>
          ) : conversationCards.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-8 text-center backdrop-blur-xl">
              <div className="text-xl font-bold text-white">
                No conversations yet
              </div>
              <p className="mt-3 text-sm leading-7 text-white/55">
                Start by contacting a seller from a listing page.
              </p>
              <Link
                href="/listing"
                className="relative mt-5 inline-flex overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.22)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.28)]"
              >
                <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                <span className="relative z-10">Browse listings</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-5">
              {conversationCards.map((item) => {
                const listing = item.listing!;
                const otherUsername = item.otherUser?.username || "Unknown user";
                const otherAvatar = item.otherUser?.avatar_url || null;
                const isAdminUser =
                  item.otherUser?.role === "admin" ||
                  item.otherUser?.role === "owner" ||
                  item.otherUser?.role === "moderator";
                const roleLabel = item.amIBuyer ? "Seller" : "Buyer";
                const lastActivity =
                  item.lastMessage?.created_at || item.conversation.created_at;
                const hasLastMessage = !!item.lastMessage;
                const previewText = hasLastMessage
                  ? truncateText(item.lastMessage!.content, 110)
                  : "No messages yet.";

                return (
                  <Link
                    key={item.conversation.id}
                    href={`/messages/${item.conversation.id}`}
                    className="group block rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.92),rgba(11,15,26,0.92))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1.5 hover:border-fuchsia-400/25 hover:shadow-[0_24px_90px_rgba(168,85,247,0.16)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ListingImage
                          src={listing.image_url}
                          alt={listing.item_name}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-lg font-bold text-white transition group-hover:text-fuchsia-100">
                              {listing.item_name}
                            </div>

                            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200">
                              {listing.game}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/70">
                              {roleLabel}
                            </span>
                          </div>

                          <div className="mt-1 text-sm text-white/45">
                            {listing.game} • {listing.category}
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            <UserAvatar
                              username={otherUsername}
                              avatarUrl={otherAvatar}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-white">
                                  {otherUsername}
                                </div>

                                {isAdminUser && (
                                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                                    Admin
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-sm leading-6 text-white/50">
                                {previewText}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right shadow-[0_0_20px_rgba(16,185,129,0.06)]">
                          <div className="text-xs text-emerald-300/75">Price</div>
                          <div className="mt-1 font-bold text-emerald-300">
                            {listing.price}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-medium text-fuchsia-200">
                            {formatRelativeTime(lastActivity)}
                          </div>
                          <div className="mt-1 text-xs text-white/35">
                            {formatDate(lastActivity)} • {formatTime(lastActivity)}
                          </div>
                        </div>

                        <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-white/75 transition group-hover:border-fuchsia-400/20 group-hover:bg-white/[0.08] group-hover:text-fuchsia-200">
                          Open conversation
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