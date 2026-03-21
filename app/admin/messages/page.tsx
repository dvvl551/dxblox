"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type ListingRow = {
  id: string;
  user_id: string;
  item_name: string;
  game: string;
  category: string;
  price: string;
  status: string;
  image_url: string | null;
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

export default function AdminMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, ListingRow>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [lastMessagesMap, setLastMessagesMap] = useState<
    Record<string, MessageRow>
  >({});

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const fetchAdminMessages = async () => {
      if (authLoading) return;

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

      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("id, listing_id, buyer_id, seller_id, created_at")
          .order("created_at", { ascending: false });

      if (conversationsError) {
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
      const participantIds = [
        ...new Set(
          nextConversations.flatMap((item) => [item.buyer_id, item.seller_id])
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
          .select("id, user_id, item_name, game, category, price, status, image_url")
          .in("id", listingIds),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .in("id", participantIds),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false }),
      ]);

      const nextListingsMap: Record<string, ListingRow> = {};
      (listingsData ?? []).forEach((row) => {
        const typedRow = row as ListingRow;
        nextListingsMap[typedRow.id] = typedRow;
      });
      setListingsMap(nextListingsMap);

      const nextProfilesMap: Record<string, ProfileRow> = {};
      (profilesData ?? []).forEach((row) => {
        const typedRow = row as ProfileRow;
        nextProfilesMap[typedRow.id] = typedRow;
      });
      setProfilesMap(nextProfilesMap);

      const nextLastMessagesMap: Record<string, MessageRow> = {};
      (messagesData ?? []).forEach((row) => {
        const typedRow = row as MessageRow;
        if (!nextLastMessagesMap[typedRow.conversation_id]) {
          nextLastMessagesMap[typedRow.conversation_id] = typedRow;
        }
      });
      setLastMessagesMap(nextLastMessagesMap);

      setLoading(false);
    };

    fetchAdminMessages();
  }, [user, authLoading, profile]);

  const filteredConversations = useMemo(() => {
    return conversations
      .map((conversation) => {
        const listing = listingsMap[conversation.listing_id];
        const buyer = profilesMap[conversation.buyer_id];
        const seller = profilesMap[conversation.seller_id];
        const lastMessage = lastMessagesMap[conversation.id];

        return {
          conversation,
          listing,
          buyer,
          seller,
          lastMessage,
        };
      })
      .filter((item) => {
        const searchValue = search.trim().toLowerCase();
        if (!searchValue) return true;

        const listingName = item.listing?.item_name.toLowerCase() || "";
        const listingGame = item.listing?.game.toLowerCase() || "";
        const buyerName = item.buyer?.username?.toLowerCase() || "";
        const sellerName = item.seller?.username?.toLowerCase() || "";
        const lastMessage = item.lastMessage?.content.toLowerCase() || "";

        return (
          listingName.includes(searchValue) ||
          listingGame.includes(searchValue) ||
          buyerName.includes(searchValue) ||
          sellerName.includes(searchValue) ||
          lastMessage.includes(searchValue)
        );
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.conversation.created_at;
        const bTime = b.lastMessage?.created_at || b.conversation.created_at;

        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [conversations, listingsMap, profilesMap, lastMessagesMap, search]);

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
          <span className="text-white">Messages</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Admin moderation
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Conversations
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                View buyer and seller chats for moderation and scam checks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total</div>
                <div className="mt-1 text-2xl font-bold">
                  {conversations.length}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Visible</div>
                <div className="mt-1 text-2xl font-bold">
                  {filteredConversations.length}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Mode</div>
                <div className="mt-1 text-sm font-semibold text-violet-300">
                  Read only
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
              placeholder="Search listing, buyer, seller or message..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
            />
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
              <div className="text-xl font-bold text-white">
                No conversations found
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                There are no matching chats right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredConversations.map((item) => {
                const listing = item.listing;
                const buyerName = item.buyer?.username || "Unknown buyer";
                const sellerName = item.seller?.username || "Unknown seller";
                const buyerAvatar = item.buyer?.avatar_url || null;
                const sellerAvatar = item.seller?.avatar_url || null;
                const lastMessageText = item.lastMessage?.content || "No messages yet.";
                const lastActivity =
                  item.lastMessage?.created_at || item.conversation.created_at;

                return (
                  <article
                    key={item.conversation.id}
                    className="rounded-[28px] border border-white/10 bg-[#131320] p-5 transition hover:border-violet-500/30"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <ListingImage
                          src={listing?.image_url || null}
                          alt={listing?.item_name || "Conversation listing"}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-lg font-bold text-white">
                              {listing?.item_name || "Deleted listing"}
                            </div>
                            {listing?.game && (
                              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                                {listing.game}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-sm text-[#9CA3AF]">
                            {listing
                              ? `${listing.game} • ${listing.category}`
                              : "Listing unavailable"}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <div className="mb-2 text-xs text-[#9CA3AF]">
                                Buyer
                              </div>
                              <div className="flex items-center gap-3">
                                {buyerAvatar ? (
                                  <img
                                    src={buyerAvatar}
                                    alt={buyerName}
                                    className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                                    {buyerName[0]?.toUpperCase() || "B"}
                                  </div>
                                )}

                                <div className="min-w-0 truncate text-sm font-semibold text-white">
                                  {buyerName}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <div className="mb-2 text-xs text-[#9CA3AF]">
                                Seller
                              </div>
                              <div className="flex items-center gap-3">
                                {sellerAvatar ? (
                                  <img
                                    src={sellerAvatar}
                                    alt={sellerName}
                                    className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                                    {sellerName[0]?.toUpperCase() || "S"}
                                  </div>
                                )}

                                <div className="min-w-0 truncate text-sm font-semibold text-white">
                                  {sellerName}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">
                              Last message
                            </div>
                            <div className="mt-2 text-sm leading-7 text-white/85">
                              {truncateText(lastMessageText, 140)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                          <div className="text-xs text-emerald-300">Price</div>
                          <div className="mt-1 font-bold text-emerald-300">
                            {listing?.price || "Unknown"}
                          </div>
                        </div>

                        <div className="text-right text-xs text-[#9CA3AF]">
                          <div>{formatDate(lastActivity)}</div>
                          <div className="mt-1">{formatTime(lastActivity)}</div>
                        </div>

                        <Link
                          href={`/admin/messages/${item.conversation.id}`}
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                        >
                          Open conversation
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}