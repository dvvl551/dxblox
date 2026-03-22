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
    Available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Pending: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    Sold: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[label] || "border-white/10 bg-white/10 text-white/80"
      }`}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-violet-500/20 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.10),rgba(255,255,255,0.03))]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function SectionShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-[#9CA3AF]">{description}</p>
          )}
        </div>
        {action}
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
  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, status, created_at, image_url"
        )
        .order("created_at", { ascending: false });

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-violet-600/10 via-transparent to-transparent" />

      <Navbar active="home" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <section className="grid items-start gap-8 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:py-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Independent platform • Not affiliated with Roblox
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
              Buy and sell Roblox listings faster on Dxblox
            </h1>

            <p className="mt-4 max-w-2xl text-xl font-semibold text-white/90">
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
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
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

          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-5 shadow-2xl shadow-violet-950/20">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.08))] p-4">
              <ListingImage
                src={featuredListing?.image_url ?? null}
                alt={featuredListing?.item_name || "Featured listing"}
                className="h-64 w-full rounded-[20px] bg-black/20"
              />
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-[#9CA3AF]">Featured listing</div>
                <div className="mt-1 truncate text-2xl font-bold text-white">
                  {featuredListing?.item_name || "No listing yet"}
                </div>
                <div className="mt-1 text-sm text-[#9CA3AF]">
                  {featuredListing
                    ? `${featuredListing.game} • ${featuredListing.category}`
                    : "Create the first listing"}
                </div>
              </div>

              {featuredListing && <Badge label={featuredListing.status} />}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Price</div>
                <div className="mt-1 truncate font-semibold text-white">
                  {featuredListing?.price || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Game</div>
                <div className="mt-1 truncate font-semibold text-white">
                  {featuredListing?.game || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Status</div>
                <div className="mt-1 truncate font-semibold text-white">
                  {featuredListing?.status || "—"}
                </div>
              </div>
            </div>

            <Link
              href={featuredListing ? `/listing/${featuredListing.id}` : "/listing"}
              className="mt-5 block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              View listing
            </Link>
          </div>
        </section>

        <SectionShell
          title="Popular games"
          description="Browse listings from the most active Roblox communities on Dxblox."
          action={
            <Link
              href="/games"
              className="hidden text-sm font-semibold text-violet-300 transition hover:text-violet-200 md:inline-block"
            >
              View all games
            </Link>
          }
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {games.map((game) => (
              <Link
                key={game.name}
                href={`/games/${game.slug}`}
                className="group block rounded-[28px] border border-white/10 bg-[#10111a] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-white/8 bg-[#0f1018]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <img
                    src={game.image}
                    alt={game.name}
                    className="absolute inset-0 h-full w-full object-contain object-center p-1 transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-4">
                  <div className="text-lg font-bold text-white">{game.name}</div>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#9CA3AF]">
                    {game.desc}
                  </p>
                  <div className="mt-3 text-xs text-violet-300">
                    {game.listings}
                  </div>
                  <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
                    View listings
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Featured listings"
          description="Latest real offers from Dxblox users."
          action={
            <Link
              href="/listing"
              className="hidden text-sm font-semibold text-violet-300 transition hover:text-violet-200 md:inline-block"
            >
              Browse all listings
            </Link>
          }
        >
          {loading ? (
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 text-sm text-[#9CA3AF]">
              Loading featured listings...
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 text-sm text-[#9CA3AF]">
              No listings yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((listing) => (
                <article
                  key={listing.id}
                  className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                >
                  <Link href={`/listing/${listing.id}`} className="block">
                    <ListingImage
                      src={listing.image_url}
                      alt={listing.item_name}
                      className="h-44 w-full rounded-[20px]"
                    />

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-bold text-white">
                          {listing.item_name}
                        </div>
                        <div className="mt-1 text-sm text-[#9CA3AF]">
                          {listing.game}
                        </div>
                      </div>

                      <Badge label={listing.status} />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[#9CA3AF]">Category</span>
                      <span className="font-medium text-white">
                        {listing.category}
                      </span>
                    </div>
                  </Link>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="truncate text-2xl font-bold text-white">
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
        </SectionShell>

        <SectionShell title="Why Dxblox">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Live listings",
                text: "Browse active Roblox marketplace posts with cleaner cards, clearer pricing and faster discovery.",
              },
              {
                title: "Built-in messaging",
                text: "Contact sellers directly and keep conversations organized in one place.",
              },
              {
                title: "Reports & moderation",
                text: "Safer trading flow with review tools, reports and admin moderation already built in.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6"
              >
                <div className="mb-4 h-12 w-12 rounded-2xl border border-white/10 bg-white/5" />
                <div className="text-xl font-bold text-white">{item.title}</div>
                <p className="mt-3 leading-7 text-[#9CA3AF]">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <section className="py-10">
          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 lg:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300">
                Start on Dxblox
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Buy, sell and discover Roblox listings faster
              </h2>

              <p className="mt-4 leading-7 text-[#9CA3AF]">
                Explore active games, save listings to your wishlist and post
                your own offers in a cleaner marketplace experience.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/listing"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  Browse listings
                </Link>

                <Link
                  href="/create-listing"
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Post a listing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}