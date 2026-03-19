"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
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

export default function DxbloxHomepage() {
  const router = useRouter();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [wishlistedIds, setWishlistedIds] = useState<string[]>([]);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, user_id, game, category, item_name, price, status, created_at")
        .order("created_at", { ascending: false });

      setListings(data ?? []);
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

  const featuredListings = useMemo(() => listings.slice(0, 6), [listings]);

  const featuredListing = useMemo(() => {
    if (listings.length === 0) return null;
    return listings[0];
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

  const Badge = ({ label }: { label: string }) => {
    const styles: Record<string, string> = {
      Available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      Pending: "bg-orange-500/15 text-orange-300 border-orange-500/30",
      Sold: "bg-red-500/15 text-red-300 border-red-500/30",
    };

    return (
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
          styles[label] || "bg-white/10 text-white/80 border-white/10"
        }`}
      >
        {label}
      </span>
    );
  };

  const handleToggleWishlist = async (
    event: any,
    listing: Listing
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (wishlistLoadingId) return;

    setActionMessage("");
    setActionError("");

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === listing.user_id) {
      setActionError("You cannot add your own listing to your wishlist.");
      return;
    }

    const isWishlisted = wishlistedIds.includes(listing.id);

    setWishlistLoadingId(listing.id);

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listing.id);

        if (error) {
          setActionError("Could not remove from wishlist. Please try again.");
          return;
        }

        setWishlistedIds((prev) => prev.filter((id) => id !== listing.id));
        setActionMessage("Removed from wishlist.");
      } else {
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: user.id,
          listing_id: listing.id,
        });

        if (error) {
          setActionError("Could not add to wishlist. Please try again.");
          return;
        }

        setWishlistedIds((prev) => [...prev, listing.id]);
        setActionMessage("Added to wishlist.");
      }
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.12),transparent_28%)]" />

      <Navbar active="home" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <section className="grid items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Independent platform • Not affiliated with Roblox
            </div>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">
              Dxblox
            </h1>

            <p className="mt-4 max-w-2xl text-xl font-semibold text-white/90">
              Trade smarter. Stay safer.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">
              Discover real listings for popular Roblox games, find trusted sellers
              and keep your wishlist organized in one clean place.
            </p>

            <div className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/20">
              <input
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#73798f]"
                placeholder="Search a game, item or seller..."
                readOnly
              />
              <Link
                href="/listing"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                Browse
              </Link>
            </div>

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

          <div className="rounded-[28px] border border-white/10 bg-[#131320] p-5 shadow-2xl shadow-violet-950/20">
            <div className="rounded-[22px] bg-gradient-to-br from-violet-500/20 to-blue-500/10 p-5">
              <div className="h-56 rounded-2xl border border-white/10 bg-black/20" />
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-[#9CA3AF]">Featured listing</div>
                <div className="mt-1 text-2xl font-bold">
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
                <div className="mt-1 font-semibold">
                  {featuredListing?.price || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Game</div>
                <div className="mt-1 font-semibold">
                  {featuredListing?.game || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Status</div>
                <div className="mt-1 font-semibold">
                  {featuredListing?.status || "—"}
                </div>
              </div>
            </div>

            <Link
              href={featuredListing ? `/listing/${featuredListing.id}` : "/listing"}
              className="mt-5 block w-full rounded-2xl bg-white/6 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              View listing
            </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Popular games</h2>
            <p className="mt-2 text-[#9CA3AF]">
              Browse listings from the most active Roblox communities on Dxblox.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {games.map((game) => (
              <Link
                key={game.name}
                href={`/games/${game.slug}`}
                className="group block rounded-[26px] border border-white/10 bg-[#10111a] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1018]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <img
                    src={game.image}
                    alt={game.name}
                    className="absolute inset-0 h-full w-full object-contain object-center p-1 transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-4">
                  <div className="text-lg font-bold">{game.name}</div>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#9CA3AF]">
                    {game.desc}
                  </p>
                  <div className="mt-3 text-xs text-violet-300">{game.listings}</div>
                  <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
                    View listings
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Featured listings</h2>
            <p className="mt-2 text-[#9CA3AF]">
              Latest real offers from Dxblox users.
            </p>
          </div>

          {actionError && (
            <div className="mb-4 rounded-[24px] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {actionError}
            </div>
          )}

          {actionMessage && (
            <div className="mb-4 rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {actionMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-[24px] border border-white/10 bg-[#131320] p-6 text-sm text-[#9CA3AF]">
              Loading featured listings...
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[#131320] p-6 text-sm text-[#9CA3AF]">
              No listings yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((listing) => {
                const isWishlisted = wishlistedIds.includes(listing.id);
                const isOwnListing = !!user && user.id === listing.user_id;
                const isCurrentCardLoading = wishlistLoadingId === listing.id;

                return (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="rounded-[24px] border border-white/10 bg-[#131320] p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <div className="h-44 rounded-[18px] border border-white/8 bg-white/5" />

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold">{listing.item_name}</div>
                        <div className="mt-1 text-sm text-[#9CA3AF]">
                          {listing.game}
                        </div>
                      </div>

                      <Badge label={listing.status} />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[#9CA3AF]">Category</span>
                      <span className="font-medium">{listing.category}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-2xl font-bold">{listing.price}</div>
                      <div className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]">
                        View listing
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={(event) => handleToggleWishlist(event, listing)}
                        disabled={isCurrentCardLoading || isOwnListing}
                        className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isOwnListing
                            ? "border border-white/10 bg-white/5 text-white/50"
                            : isWishlisted
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                            : "border border-white/10 text-white/90 hover:bg-white/5"
                        }`}
                      >
                        {isOwnListing && "Your listing"}
                        {!isOwnListing && isCurrentCardLoading && "Saving..."}
                        {!isOwnListing &&
                          !isCurrentCardLoading &&
                          isWishlisted &&
                          "Remove from wishlist"}
                        {!isOwnListing &&
                          !isCurrentCardLoading &&
                          !isWishlisted &&
                          "Add to wishlist"}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="py-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Why Dxblox</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Real listings",
                text: "Browse real marketplace posts from connected users.",
              },
              {
                title: "Cleaner profiles",
                text: "Build trust with usernames, bios and better seller pages.",
              },
              {
                title: "Smarter discovery",
                text: "Search faster, filter better and keep track of wanted items in one place.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/10 bg-[#131320] p-6"
              >
                <div className="mb-4 h-12 w-12 rounded-2xl bg-violet-500/15" />
                <div className="text-xl font-bold">{item.title}</div>
                <p className="mt-3 leading-7 text-[#9CA3AF]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="grid gap-6 rounded-[30px] border border-white/10 bg-[#131320] p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300">
                Wishlist
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Track what you want
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-[#9CA3AF]">
                Build your wishlist and keep your search clean across your favorite
                Roblox games.
              </p>
              <Link
                href="/wishlist"
                className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                Open wishlist
              </Link>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
              {featuredListings.slice(0, 3).length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-[#0f1018] px-4 py-3 text-sm text-[#9CA3AF]">
                  Wishlist preview will look better once you have more listings.
                </div>
              ) : (
                featuredListings.slice(0, 3).map((listing) => (
                  <div
                    key={listing.id}
                    className="mb-3 flex items-center justify-between rounded-2xl border border-white/8 bg-[#0f1018] px-4 py-3 last:mb-0"
                  >
                    <div>
                      <div className="font-semibold">{listing.item_name}</div>
                      <div className="text-sm text-[#9CA3AF]">{listing.game}</div>
                    </div>
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                      {listing.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0B0B12]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <div className="text-xl font-bold">Dxblox</div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#9CA3AF]">
              A cleaner way to discover listings, trusted sellers and wishlist
              tracking for popular Roblox games.
            </p>
          </div>

          <div>
            <div className="font-semibold">Platform</div>
            <div className="mt-3 space-y-2 text-sm text-[#9CA3AF]">
              <div>Home</div>
              <div>Games</div>
              <div>Listings</div>
              <div>Wishlist</div>
            </div>
          </div>

          <div>
            <div className="font-semibold">Support</div>
            <div className="mt-3 space-y-2 text-sm text-[#9CA3AF]">
              <div>Help</div>
              <div>Contact</div>
              <div>Report</div>
              <div>Premium</div>
            </div>
          </div>

          <div>
            <div className="font-semibold">Legal</div>
            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              Dxblox is an independent platform and is not affiliated with Roblox.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}