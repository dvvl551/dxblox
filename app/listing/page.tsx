"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import WishlistButton from "@/components/WishlistButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Listing = {
  id: string;
  user_id: string;
  game: string;
  category: string;
  item_name: string;
  price: string;
  offer_type: string;
  status: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

type SellerProfile = {
  id: string;
  username: string | null;
  role: string;
  avatar_url: string | null;
};

const GAME_OPTIONS = [
  "All games",
  "MM2",
  "Adopt Me",
  "Blox Fruits",
  "Blade Ball",
  "Steal a Brainrot",
  "Da Hood",
] as const;

const STATUS_OPTIONS = [
  "All statuses",
  "Available",
  "Pending",
  "Sold",
] as const;

const OFFER_TYPE_OPTIONS = [
  "All offer types",
  "Sell",
  "Buy",
  "Trade",
] as const;

const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Price: Low to high",
  "Price: High to low",
] as const;

function ListingImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-44 w-full items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-44 w-full rounded-[18px] border border-white/8 object-cover"
    />
  );
}

function getPriceNumber(price: string) {
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, SellerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] =
    useState<(typeof GAME_OPTIONS)[number]>("All games");
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [selectedOfferType, setSelectedOfferType] =
    useState<(typeof OFFER_TYPE_OPTIONS)[number]>("All offer types");
  const [selectedSort, setSelectedSort] =
    useState<(typeof SORT_OPTIONS)[number]>("Newest");

  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);

  useEffect(() => {
    const urlSearch = searchParams.get("search")?.trim() || "";
    const urlGame = searchParams.get("game")?.trim() || "All games";
    const urlStatus = searchParams.get("status")?.trim() || "All statuses";
    const urlCategory = searchParams.get("category")?.trim() || "All categories";
    const urlOfferType =
      searchParams.get("offerType")?.trim() || "All offer types";
    const urlSort = searchParams.get("sort")?.trim() || "Newest";

    setSearch(urlSearch);

    setSelectedGame(
      GAME_OPTIONS.includes(urlGame as (typeof GAME_OPTIONS)[number])
        ? (urlGame as (typeof GAME_OPTIONS)[number])
        : "All games"
    );

    setSelectedStatus(
      STATUS_OPTIONS.includes(urlStatus as (typeof STATUS_OPTIONS)[number])
        ? (urlStatus as (typeof STATUS_OPTIONS)[number])
        : "All statuses"
    );

    setSelectedOfferType(
      OFFER_TYPE_OPTIONS.includes(
        urlOfferType as (typeof OFFER_TYPE_OPTIONS)[number]
      )
        ? (urlOfferType as (typeof OFFER_TYPE_OPTIONS)[number])
        : "All offer types"
    );

    setSelectedSort(
      SORT_OPTIONS.includes(urlSort as (typeof SORT_OPTIONS)[number])
        ? (urlSort as (typeof SORT_OPTIONS)[number])
        : "Newest"
    );

    setSelectedCategory(urlCategory || "All categories");
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, description, image_url, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Could not load listings.");
        setListings([]);
        setSellerMap({});
        setLoading(false);
        return;
      }

      const nextListings = (data ?? []) as Listing[];
      setListings(nextListings);

      const uniqueUserIds = [...new Set(nextListings.map((item) => item.user_id))];

      if (uniqueUserIds.length > 0) {
        const { data: sellersData } = await supabase
          .from("profiles")
          .select("id, username, role, avatar_url")
          .in("id", uniqueUserIds);

        const nextSellerMap: Record<string, SellerProfile> = {};
        (sellersData ?? []).forEach((seller) => {
          const typedSeller = seller as SellerProfile;
          nextSellerMap[typedSeller.id] = typedSeller;
        });

        setSellerMap(nextSellerMap);
      } else {
        setSellerMap({});
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

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

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        listings
          .map((listing) => listing.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All categories", ...uniqueCategories];
  }, [listings]);

  useEffect(() => {
    if (
      selectedCategory !== "All categories" &&
      !categoryOptions.includes(selectedCategory)
    ) {
      setSelectedCategory("All categories");
    }
  }, [categoryOptions, selectedCategory]);

  const filteredListings = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const nextListings = listings.filter((listing) => {
      const seller = sellerMap[listing.user_id];
      const sellerName = seller?.username?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        listing.item_name.toLowerCase().includes(searchValue) ||
        listing.game.toLowerCase().includes(searchValue) ||
        listing.category.toLowerCase().includes(searchValue) ||
        listing.offer_type.toLowerCase().includes(searchValue) ||
        listing.price.toLowerCase().includes(searchValue) ||
        (listing.description ?? "").toLowerCase().includes(searchValue) ||
        sellerName.includes(searchValue);

      const matchesGame =
        selectedGame === "All games" || listing.game === selectedGame;

      const matchesStatus =
        selectedStatus === "All statuses" || listing.status === selectedStatus;

      const matchesCategory =
        selectedCategory === "All categories" ||
        listing.category === selectedCategory;

      const matchesOfferType =
        selectedOfferType === "All offer types" ||
        listing.offer_type.toLowerCase() === selectedOfferType.toLowerCase();

      return (
        matchesSearch &&
        matchesGame &&
        matchesStatus &&
        matchesCategory &&
        matchesOfferType
      );
    });

    return [...nextListings].sort((a, b) => {
      if (selectedSort === "Newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      if (selectedSort === "Oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      if (selectedSort === "Price: Low to high") {
        return getPriceNumber(a.price) - getPriceNumber(b.price);
      }

      if (selectedSort === "Price: High to low") {
        return getPriceNumber(b.price) - getPriceNumber(a.price);
      }

      return 0;
    });
  }, [
    listings,
    sellerMap,
    search,
    selectedGame,
    selectedStatus,
    selectedCategory,
    selectedOfferType,
    selectedSort,
  ]);

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

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedGame !== "All games" ||
    selectedStatus !== "All statuses" ||
    selectedCategory !== "All categories" ||
    selectedOfferType !== "All offer types" ||
    selectedSort !== "Newest";

  const buildQueryString = (next?: {
    search?: string;
    game?: string;
    status?: string;
    category?: string;
    offerType?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams();

    const nextSearch = next?.search ?? search;
    const nextGame = next?.game ?? selectedGame;
    const nextStatus = next?.status ?? selectedStatus;
    const nextCategory = next?.category ?? selectedCategory;
    const nextOfferType = next?.offerType ?? selectedOfferType;
    const nextSort = next?.sort ?? selectedSort;

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextGame !== "All games") params.set("game", nextGame);
    if (nextStatus !== "All statuses") params.set("status", nextStatus);
    if (nextCategory !== "All categories") params.set("category", nextCategory);
    if (nextOfferType !== "All offer types") {
      params.set("offerType", nextOfferType);
    }
    if (nextSort !== "Newest") params.set("sort", nextSort);

    const query = params.toString();
    return query ? `/listing?${query}` : "/listing";
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentQuery = searchParams.toString();
      const nextUrl = buildQueryString({ search });
      const nextQuery = nextUrl.includes("?") ? nextUrl.split("?")[1] : "";

      if (currentQuery !== nextQuery) {
        router.replace(nextUrl);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    search,
    selectedGame,
    selectedStatus,
    selectedCategory,
    selectedOfferType,
    selectedSort,
    router,
    searchParams,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedGame("All games");
    setSelectedStatus("All statuses");
    setSelectedCategory("All categories");
    setSelectedOfferType("All offer types");
    setSelectedSort("Newest");
    router.replace("/listing");
  };

  const statusStyle = (status: string) => {
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
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Listings</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Marketplace
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Browse listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Discover real listings from Dxblox users across supported games.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total</div>
                <div className="mt-1 text-2xl font-bold">{listings.length}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Available</div>
                <div className="mt-1 text-2xl font-bold">{availableCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold</div>
                <div className="mt-1 text-2xl font-bold">{soldCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Search
              </label>
              <input
                type="text"
                placeholder="Search item, game, category, offer type or seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Game
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as (typeof GAME_OPTIONS)[number])}
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {GAME_OPTIONS.map((game) => (
                  <option
                    key={game}
                    value={game}
                    className="bg-[#131320] text-white"
                  >
                    {game}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value as (typeof STATUS_OPTIONS)[number]
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status}
                    value={status}
                    className="bg-[#131320] text-white"
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {categoryOptions.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-[#131320] text-white"
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Offer type
              </label>
              <select
                value={selectedOfferType}
                onChange={(e) =>
                  setSelectedOfferType(
                    e.target.value as (typeof OFFER_TYPE_OPTIONS)[number]
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {OFFER_TYPE_OPTIONS.map((offerType) => (
                  <option
                    key={offerType}
                    value={offerType}
                    className="bg-[#131320] text-white"
                  >
                    {offerType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">Sort</label>
              <select
                value={selectedSort}
                onChange={(e) =>
                  setSelectedSort(e.target.value as (typeof SORT_OPTIONS)[number])
                }
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {SORT_OPTIONS.map((sortOption) => (
                  <option
                    key={sortOption}
                    value={sortOption}
                    className="bg-[#131320] text-white"
                  >
                    {sortOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-sm text-[#9CA3AF]">
              <span className="font-semibold text-white">
                {filteredListings.length}
              </span>{" "}
              {filteredListings.length === 1 ? "listing found" : "listings found"}
            </div>

            {hasActiveFilters && (
              <div className="text-xs text-violet-300">
                Filters are currently applied
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] px-6 py-8 text-sm text-[#9CA3AF]">
              Loading listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] px-6 py-10 text-center">
              <div className="mx-auto max-w-md">
                <div className="text-xl font-bold text-white">
                  No listings found
                </div>
                <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                  Try changing your search or filters to find more items.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const seller = sellerMap[listing.user_id];
                const sellerName = seller?.username || "Unknown seller";
                const sellerAvatar = seller?.avatar_url || null;
                const isAdminSeller = seller?.role === "admin";

                return (
                  <article
                    key={listing.id}
                    className="rounded-[24px] border border-white/10 bg-[#131320] p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <Link href={`/listing/${listing.id}`} className="block">
                      <ListingImage
                        src={listing.image_url}
                        alt={listing.item_name}
                      />

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold">
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
                        <span className="font-medium">{listing.offer_type}</span>
                      </div>
                    </Link>

                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/users/${listing.user_id}`}
                          className="flex min-w-0 items-center gap-3 transition hover:opacity-90"
                        >
                          {sellerAvatar ? (
                            <img
                              src={sellerAvatar}
                              alt={sellerName}
                              className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                              {sellerName[0]?.toUpperCase() || "S"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {sellerName}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-[#9CA3AF]">
                                Seller
                              </span>
                              {isAdminSeller && (
                                <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        <Link
                          href={`/users/${listing.user_id}`}
                          className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-2xl font-bold">{listing.price}</div>

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
                        initialIsWishlisted={wishlistedIds.includes(listing.id)}
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
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}