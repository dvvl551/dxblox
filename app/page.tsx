"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  status: string;
  created_at: string;
  image_url: string | null;
};

const GAME_IMAGE_MAP: Record<string, string> = {
  "Adopt Me": "/games/adopt-me.jpg",
  MM2: "/games/mm2.jpg",
  "Blox Fruits": "/games/blox-fruits.jpg",
  "Steal a Brainrot": "/games/steal-a-brainrot.jpg",
  "Blade Ball": "/games/blade-ball.jpg",
  "Da Hood": "/games/da-hood.jpg",
};

const GAME_SLUG_MAP: Record<string, string> = {
  "Adopt Me": "adopt-me",
  MM2: "mm2",
  "Blox Fruits": "blox-fruits",
  "Steal a Brainrot": "steal-a-brainrot",
  "Blade Ball": "blade-ball",
  "Da Hood": "da-hood",
};

const GAME_DESC_MAP: Record<string, string> = {
  "Adopt Me": "Pets, rare items and popular offers.",
  MM2: "Knives, guns and high-demand trades.",
  "Blox Fruits": "Items, offers and active player listings.",
  "Steal a Brainrot": "Trending deals and fast-moving listings.",
  "Blade Ball": "Competitive items and wanted listings.",
  "Da Hood": "Weapons, skins and active street-market listings.",
};

function ListingImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center border border-white/8 bg-white/5 text-sm text-[#9CA3AF] ${
          className || ""
        }`}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`border border-white/8 object-cover ${className || ""}`}
    />
  );
}

function Badge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Available: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    Pending: "border-orange-500/30 bg-orange-500/15 text-orange-300",
    Sold: "border-red-500/30 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[label] || "border-white/10 bg-white/5 text-white/75"
      }`}
    >
      {label}
    </span>
  );
}

function InfoStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function DxbloxHomepage() {
  const router = useRouter();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setPageError("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, status, created_at, image_url"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setListings([]);
        setPageError("Could not load listings right now.");
        setLoading(false);
        return;
      }

      setListings((data ?? []) as Listing[]);
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

  const availableListings = useMemo(
    () => listings.filter((listing) => listing.status === "Available"),
    [listings]
  );

  const featuredListings = useMemo(() => {
    if (availableListings.length > 0) return availableListings.slice(0, 6);
    return listings.slice(0, 6);
  }, [availableListings, listings]);

  const featuredListing = useMemo(() => {
    if (availableListings.length > 0) return availableListings[0];
    if (listings.length > 0) return listings[0];
    return null;
  }, [availableListings, listings]);

  const stats = useMemo(() => {
    const available = listings.filter(
      (listing) => listing.status === "Available"
    ).length;
    const sold = listings.filter((listing) => listing.status === "Sold").length;
    const pending = listings.filter(
      (listing) => listing.status === "Pending"
    ).length;
    const gamesCount = new Set(listings.map((listing) => listing.game)).size;

    return [
      { label: "Listings", value: listings.length },
      { label: "Available", value: available },
      { label: "Games", value: gamesCount },
      { label: "Sold", value: sold + pending },
    ];
  }, [listings]);

  const games = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const listing of listings) {
      counts[listing.game] = (counts[listing.game] ?? 0) + 1;
    }

    return Object.keys(GAME_IMAGE_MAP).map((gameName) => ({
      name: gameName,
      slug: GAME_SLUG_MAP[gameName],
      image: GAME_IMAGE_MAP[gameName],
      desc: GAME_DESC_MAP[gameName],
      listings: `${counts[gameName] ?? 0} listings`,
    }));
  }, [listings]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      router.push("/listing");
      return;
    }

    router.push(`/listing?search=${encodeURIComponent(normalizedSearch)}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="home" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Independent platform • Not affiliated with Roblox
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
              Buy and sell Roblox listings faster on Dxblox
            </h1>

            <p className="mt-4 text-xl font-semibold text-white/90">
              Trade smarter. Stay safer.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[#9CA3AF]">
              Discover real listings for popular Roblox games, explore active
              offers, contact sellers and keep your wishlist organized in one
              clean marketplace.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 flex max-w-2xl items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/20"
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-[#73798f]"
                placeholder="Search a game, item or seller..."
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                Browse
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                Real listings
              </span>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300">
                Live marketplace
              </span>
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-300">
                Fast discovery
              </span>
            </div>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <InfoStat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/games"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                Explore games
              </Link>
              <Link
                href="/create-listing"
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
              >
                Post a listing
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
            <ListingImage
              src={featuredListing?.image_url ?? null}
              alt={featuredListing?.item_name || "Featured listing"}
              className="h-[460px] w-full rounded-[24px]"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoStat label="Price" value={featuredListing?.price || "—"} />
              <InfoStat label="Game" value={featuredListing?.game || "—"} />
              <InfoStat label="Status" value={featuredListing?.status || "—"} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  {featuredListing?.status && <Badge label={featuredListing.status} />}
                  {featuredListing?.category && (
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">
                      {featuredListing.category}
                    </span>
                  )}
                </div>

                <h2 className="truncate text-3xl font-black tracking-tight text-white">
                  {featuredListing?.item_name || "No listing yet"}
                </h2>

                <p className="mt-2 text-[#9CA3AF]">
                  {featuredListing
                    ? `${featuredListing.game} • ${featuredListing.category}`
                    : "Create the first listing"}
                </p>
              </div>

              <Link
                href={featuredListing ? `/listing/${featuredListing.id}` : "/listing"}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                View listing
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <SectionCard
              title="Popular games"
              description="Browse listings from the most active Roblox communities on Dxblox."
              actions={
                <Link
                  href="/games"
                  className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
                >
                  View all
                </Link>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {games.map((game) => (
                  <Link
                    key={game.name}
                    href={`/games/${game.slug}`}
                    className="rounded-[22px] border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/8 bg-[#0f1018]">
                      <img
                        src={game.image}
                        alt={game.name}
                        className="h-full w-full object-contain object-center p-1"
                      />
                    </div>

                    <div className="mt-3">
                      <div className="font-semibold text-white">{game.name}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">{game.desc}</div>
                      <div className="mt-3 text-sm font-medium text-violet-300">
                        {game.listings}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Featured listings"
              description="Latest real offers from Dxblox users."
              actions={
                <Link
                  href="/listing"
                  className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
                >
                  Browse all
                </Link>
              }
            >
              {pageError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  {pageError}
                </div>
              ) : loading ? (
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-5 text-sm text-[#9CA3AF]">
                  Loading featured listings...
                </div>
              ) : featuredListings.length === 0 ? (
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-5 text-sm text-[#9CA3AF]">
                  No listings yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredListings.map((listing) => (
                    <article
                      key={listing.id}
                      className="rounded-[22px] border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-violet-500/30"
                    >
                      <Link href={`/listing/${listing.id}`} className="block">
                        <ListingImage
                          src={listing.image_url}
                          alt={listing.item_name}
                          className="h-40 w-full rounded-2xl"
                        />

                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">
                              {listing.item_name}
                            </div>
                            <div className="mt-1 text-sm text-[#9CA3AF]">
                              {listing.game} • {listing.category}
                            </div>
                          </div>

                          <Badge label={listing.status} />
                        </div>
                      </Link>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-lg font-bold text-white">
                          {listing.price}
                        </div>

                        <Link
                          href={`/listing/${listing.id}`}
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                        >
                          View
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
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <SectionCard title="Marketplace overview">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#9CA3AF]">Total listings</span>
                  <span className="text-right font-semibold text-white">
                    {stats[0]?.value}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#9CA3AF]">Available</span>
                  <span className="text-right font-semibold text-white">
                    {stats[1]?.value}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#9CA3AF]">Games covered</span>
                  <span className="text-right font-semibold text-white">
                    {stats[2]?.value}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#9CA3AF]">Sold / pending</span>
                  <span className="text-right font-semibold text-white">
                    {stats[3]?.value}
                  </span>
                </div>
              </div>
            </SectionCard>

            <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <h3 className="text-xl font-bold text-white">Why Dxblox</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Live listings from active Roblox traders
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Built-in messaging and wishlist tools
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Reports, moderation and safer trading flow
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Cleaner premium experience across the platform
                </li>
              </ul>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}