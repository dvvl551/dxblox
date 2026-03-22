"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import WishlistButton from "@/components/WishlistButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type UserProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PublicProfile = {
  id: string;
  username: string | null;
  bio: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
};

type Listing = {
  id: string;
  user_id: string;
  game: string;
  category: string;
  item_name: string;
  price: string;
  offer_type: string;
  status: string;
  image_url: string | null;
  created_at: string;
};

function statusStyle(status: string) {
  if (status === "Available") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  }
  if (status === "Pending") {
    return "border-orange-500/30 bg-orange-500/15 text-orange-300";
  }
  if (status === "Sold") {
    return "border-red-500/30 bg-red-500/15 text-red-300";
  }
  return "border-white/10 bg-white/5 text-white/75";
}

function ListingImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-48 w-full rounded-[22px] border border-white/8 object-cover"
    />
  );
}

function SellerStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-violet-500/20 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.10),rgba(255,255,255,0.03))]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function SideInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function extractPrice(price: string) {
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", ".");
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? 0 : numeric;
}

export default function PublicUserProfilePage({
  params,
}: UserProfilePageProps) {
  const { user } = useAuth();
  const { id: userId } = use(params);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("All games");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [selectedSort, setSelectedSort] = useState("Most recent");

  useEffect(() => {
    if (!userId) return;

    const fetchPageData = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, bio, role, avatar_url, created_at")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setProfile(null);
        setListings([]);
        setErrorMessage("Seller profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData as PublicProfile);

      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, image_url, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (listingsError) {
        setListings([]);
      } else {
        setListings((listingsData ?? []) as Listing[]);
      }

      setLoading(false);
    };

    fetchPageData();
  }, [userId]);

  useEffect(() => {
    const fetchWishlistIds = async () => {
      if (!user) {
        setWishlistedIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("listing_id")
        .eq("user_id", user.id);

      if (error) {
        setWishlistedIds([]);
        return;
      }

      const ids = (data ?? []).map((item) => item.listing_id as string);
      setWishlistedIds(ids);
    };

    fetchWishlistIds();
  }, [user]);

  const availableCount = useMemo(
    () => listings.filter((listing) => listing.status === "Available").length,
    [listings]
  );

  const pendingCount = useMemo(
    () => listings.filter((listing) => listing.status === "Pending").length,
    [listings]
  );

  const soldCount = useMemo(
    () => listings.filter((listing) => listing.status === "Sold").length,
    [listings]
  );

  const games = useMemo(() => {
    return ["All games", ...Array.from(new Set(listings.map((l) => l.game)))];
  }, [listings]);

  const gamesCount = useMemo(() => {
    return new Set(listings.map((listing) => listing.game)).size;
  }, [listings]);

  const mainGame = useMemo(() => {
    if (listings.length === 0) return "No listings yet";

    const counts: Record<string, number> = {};

    for (const listing of listings) {
      counts[listing.game] = (counts[listing.game] ?? 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [listings]);

  const filteredListings = useMemo(() => {
    let next = [...listings];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      next = next.filter(
        (listing) =>
          listing.item_name.toLowerCase().includes(searchValue) ||
          listing.game.toLowerCase().includes(searchValue) ||
          listing.category.toLowerCase().includes(searchValue) ||
          listing.offer_type.toLowerCase().includes(searchValue)
      );
    }

    if (selectedGame !== "All games") {
      next = next.filter((listing) => listing.game === selectedGame);
    }

    if (selectedStatus !== "All statuses") {
      next = next.filter((listing) => listing.status === selectedStatus);
    }

    if (selectedSort === "Lowest price") {
      next.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
    } else if (selectedSort === "Highest price") {
      next.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
    } else {
      next.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return next;
  }, [listings, search, selectedGame, selectedStatus, selectedSort]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "Unknown";
    const date = new Date(profile.created_at);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [profile?.created_at]);

  const joinedLabel = useMemo(() => {
    if (!profile?.created_at) return "Unknown";
    const date = new Date(profile.created_at);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
  }, [profile?.created_at]);

  const isOwnProfile = !!user && user.id === userId;

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedGame !== "All games" ||
    selectedStatus !== "All statuses" ||
    selectedSort !== "Most recent";

  const resetFilters = () => {
    setSearch("");
    setSelectedGame("All games");
    setSelectedStatus("All statuses");
    setSelectedSort("Most recent");
  };

  const sellerInitial = profile?.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-violet-600/10 via-transparent to-transparent" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Seller profile</span>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-8 text-[#9CA3AF]">
            Loading seller profile...
          </div>
        ) : errorMessage || !profile ? (
          <div className="rounded-[32px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {errorMessage || "Seller profile not found."}
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <div className="relative border-b border-white/8 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(61,169,252,0.10),rgba(255,255,255,0.02))] px-6 py-8 sm:px-8 sm:py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%)]" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || "Seller avatar"}
                        className="h-28 w-28 rounded-[28px] border border-white/10 object-cover shadow-2xl shadow-black/25"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-500/40 to-blue-500/25 text-4xl font-black text-white shadow-2xl shadow-black/25">
                        {sellerInitial}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                          {profile.username || "Unknown seller"}
                        </h1>

                        {profile.role === "admin" && (
                          <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200">
                            Admin
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">
                        {profile.bio?.trim()
                          ? profile.bio
                          : "This seller has not added a bio yet."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-sm">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                          Member since {joinedLabel}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                          Main game: {mainGame}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                          {availableCount} active listings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isOwnProfile ? (
                      <Link
                        href="/profile"
                        className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                      >
                        Edit my profile
                      </Link>
                    ) : (
                      <Link
                        href="/listings"
                        className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/90 transition hover:bg-white/5"
                      >
                        Browse marketplace
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
                <SellerStatCard label="Total" value={listings.length} />
                <SellerStatCard label="Available" value={availableCount} />
                <SellerStatCard label="Pending" value={pendingCount} />
                <SellerStatCard label="Sold" value={soldCount} />
                <SellerStatCard label="Games" value={gamesCount} />
              </div>
            </section>

            <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
              <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Seller listings
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      Public listings from this seller.
                    </p>
                  </div>

                  <div className="text-sm text-[#9CA3AF]">
                    <span className="font-semibold text-white">
                      {filteredListings.length}
                    </span>{" "}
                    {filteredListings.length === 1
                      ? "listing found"
                      : "listings found"}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item, game, category..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#73798f] focus:border-violet-400/30 focus:bg-white/[0.07]"
                  />

                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    {games.map((game) => (
                      <option
                        key={game}
                        value={game}
                        className="bg-[#131320] text-white"
                      >
                        {game}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="All statuses" className="bg-[#131320] text-white">
                      All statuses
                    </option>
                    <option value="Available" className="bg-[#131320] text-white">
                      Available
                    </option>
                    <option value="Pending" className="bg-[#131320] text-white">
                      Pending
                    </option>
                    <option value="Sold" className="bg-[#131320] text-white">
                      Sold
                    </option>
                  </select>

                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="Most recent" className="bg-[#131320] text-white">
                      Most recent
                    </option>
                    <option value="Lowest price" className="bg-[#131320] text-white">
                      Lowest price
                    </option>
                    <option value="Highest price" className="bg-[#131320] text-white">
                      Highest price
                    </option>
                  </select>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <div className="text-xs text-[#9CA3AF]">
                    {hasActiveFilters
                      ? "Filters are currently applied"
                      : "Showing all public listings"}
                  </div>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Reset filters
                  </button>
                </div>

                <div className="mt-8">
                  {filteredListings.length === 0 ? (
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 text-center">
                      <div className="text-xl font-bold text-white">
                        No listings found
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                        Try changing your search or filters to see more results.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredListings.map((listing) => (
                        <article
                          key={listing.id}
                          className="rounded-[24px] border border-white/10 bg-[#10101A] p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                        >
                          <Link href={`/listing/${listing.id}`} className="block">
                            <ListingImage
                              src={listing.image_url}
                              alt={listing.item_name}
                            />

                            <div className="mt-4 flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="truncate text-lg font-bold text-white">
                                  {listing.item_name}
                                </div>
                                <div className="mt-1 text-sm text-[#9CA3AF]">
                                  {listing.game} • {listing.category}
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(
                                  listing.status
                                )}`}
                              >
                                {listing.status}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-sm">
                              <span className="text-[#9CA3AF]">Offer type</span>
                              <span className="font-medium text-white">
                                {listing.offer_type}
                              </span>
                            </div>
                          </Link>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="text-2xl font-bold text-white">
                              {listing.price}
                            </div>

                            <Link
                              href={`/listing/${listing.id}`}
                              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              View listing
                            </Link>
                          </div>

                          <div className="mt-4">
                            <WishlistButton
                              listingId={listing.id}
                              listingUserId={listing.user_id}
                              initialIsWishlisted={wishlistedIds.includes(
                                listing.id
                              )}
                              onChanged={(nextValue) => {
                                setWishlistedIds((prev) =>
                                  nextValue
                                    ? [...new Set([...prev, listing.id])]
                                    : prev.filter((id) => id !== listing.id)
                                );
                              }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
                  <h3 className="text-xl font-bold text-white">Seller info</h3>

                  <div className="mt-4 space-y-3">
                    <SideInfoCard
                      label="Username"
                      value={profile.username || "Unknown seller"}
                    />
                    <SideInfoCard label="Member since" value={memberSince} />
                    <SideInfoCard label="Main game" value={mainGame} />
                    <SideInfoCard
                      label="Profile type"
                      value={profile.role === "admin" ? "Admin seller" : "Seller"}
                    />
                  </div>
                </div>

                <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-white">Seller profile</h3>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                      Public
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/85">
                    Browse this seller’s public listings and view what is
                    currently available in their marketplace profile.
                  </p>
                </section>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}