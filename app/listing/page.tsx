"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
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
      <div className="flex h-52 w-full items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-sm text-white/40">
        No image
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
      <img
        src={src}
        alt={alt}
        className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
}

function MarketplaceStatCard({
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

function getPriceNumber(price: string) {
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ListingPageContent() {
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

  const filterInputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/30 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(168,85,247,0.08)]";

  const filterSelectClass =
    "w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/30 focus:bg-[#1E2030]";

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#05030A] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/45">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Listings</span>
        </div>

        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200 shadow-[0_0_20px_rgba(168,85,247,0.10)]">
                Marketplace
              </div>

              <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
                Browse listings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                Discover real listings from Dxblox users across supported games.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MarketplaceStatCard label="Total" value={listings.length} />
              <MarketplaceStatCard label="Available" value={availableCount} />
              <MarketplaceStatCard label="Pending" value={pendingCount} />
              <MarketplaceStatCard label="Sold" value={soldCount} />
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm text-white/45">Search</label>
              <input
                type="text"
                placeholder="Search item, game, category, offer type or seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={filterInputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/45">Game</label>
              <select
                value={selectedGame}
                onChange={(e) =>
                  setSelectedGame(e.target.value as (typeof GAME_OPTIONS)[number])
                }
                className={filterSelectClass}
              >
                {GAME_OPTIONS.map((game) => (
                  <option key={game} value={game} className="bg-[#131320] text-white">
                    {game}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/45">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value as (typeof STATUS_OPTIONS)[number]
                  )
                }
                className={filterSelectClass}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-[#131320] text-white">
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/45">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={filterSelectClass}
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
              <label className="mb-2 block text-sm text-white/45">
                Offer type
              </label>
              <select
                value={selectedOfferType}
                onChange={(e) =>
                  setSelectedOfferType(
                    e.target.value as (typeof OFFER_TYPE_OPTIONS)[number]
                  )
                }
                className={filterSelectClass}
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
              <label className="mb-2 block text-sm text-white/45">Sort</label>
              <select
                value={selectedSort}
                onChange={(e) =>
                  setSelectedSort(e.target.value as (typeof SORT_OPTIONS)[number])
                }
                className={filterSelectClass}
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:border-fuchsia-400/20 hover:bg-white/[0.08]"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-sm text-white/45">
              <span className="font-semibold text-white">
                {filteredListings.length}
              </span>{" "}
              {filteredListings.length === 1 ? "listing found" : "listings found"}
            </div>

            {hasActiveFilters && (
              <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-200">
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
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] px-6 py-8 text-sm text-white/50">
              Loading listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] px-6 py-10 text-center">
              <div className="mx-auto max-w-md">
                <div className="text-xl font-bold text-white">
                  No listings found
                </div>
                <p className="mt-3 text-sm leading-7 text-white/55">
                  Try changing your search or filters to find more items.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.22)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.28)]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                  <span className="relative z-10">Reset filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const seller = sellerMap[listing.user_id];
                const sellerName = seller?.username || "Unknown seller";
                const sellerAvatar = seller?.avatar_url || null;
                const isAdminSeller =
                  seller?.role === "admin" ||
                  seller?.role === "owner" ||
                  seller?.role === "moderator";

                return (
                  <article
                    key={listing.id}
                    className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-4 shadow-[0_0_0_rgba(168,85,247,0)] transition duration-300 hover:-translate-y-1.5 hover:border-fuchsia-400/25 hover:shadow-[0_0_40px_rgba(168,85,247,0.10)]"
                  >
                    <Link href={`/listing/${listing.id}`} className="block">
                      <ListingImage
                        src={listing.image_url}
                        alt={listing.item_name}
                      />

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-white transition group-hover:text-fuchsia-100">
                            {listing.item_name}
                          </div>
                          <div className="mt-1 text-sm text-white/45">
                            {listing.game} • {listing.category}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-[0_0_20px_rgba(255,255,255,0.02)] ${statusStyle(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-white/40">Offer type</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-white">
                          {listing.offer_type}
                        </span>
                      </div>
                    </Link>

                    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-3 backdrop-blur-xl transition group-hover:border-fuchsia-400/15">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/users/${listing.user_id}`}
                          className="flex min-w-0 items-center gap-3 transition hover:opacity-90"
                        >
                          {sellerAvatar ? (
                            <img
                              src={sellerAvatar}
                              alt={sellerName}
                              className="h-11 w-11 rounded-2xl border border-white/10 object-cover shadow-[0_0_18px_rgba(168,85,247,0.08)]"
                            />
                          ) : (
                            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(59,130,246,0.22),rgba(239,68,68,0.18))] text-sm font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.08)]">
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,transparent)]" />
                              <span className="relative z-10">
                                {sellerName[0]?.toUpperCase() || "S"}
                              </span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {sellerName}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-white/40">Seller</span>
                              {isAdminSeller && (
                                <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        <Link
                          href={`/users/${listing.user_id}`}
                          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/90 transition hover:border-fuchsia-400/20 hover:bg-white/[0.08]"
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="truncate text-2xl font-black text-white">
                        {listing.price}
                      </div>

                      <Link
                        href={`/listing/${listing.id}`}
                        className="relative overflow-hidden rounded-xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.18)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_38px_rgba(168,85,247,0.26)]"
                      >
                        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                        <span className="relative z-10">View listing</span>
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

export default function ListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05030A] text-white">
          <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-white/50">
            Loading listings...
          </div>
        </div>
      }
    >
      <ListingPageContent />
    </Suspense>
  );
}