"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type WishlistRow = {
  id: string;
  listing_id: string;
  created_at: string;
};

type Listing = {
  id: string;
  game: string;
  item_name: string;
  price: string;
  status: string;
  offer_type: string;
  image_url: string | null;
};

type WishlistItem = {
  wishlistId: string;
  savedAt: string;
  listing: Listing;
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

function offerTypeStyle(offerType: string) {
  if (offerType === "Looking for") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-300";
  }
  if (offerType === "Trade") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
  return "border-violet-500/20 bg-violet-500/10 text-violet-300";
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
      <div className="flex h-36 w-full items-center justify-center rounded-[18px] border border-white/8 bg-black/20 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-36 w-full rounded-[18px] border border-white/8 object-cover"
    />
  );
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (authLoading) return;

      if (!user) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlist_items")
        .select("id, listing_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (wishlistError) {
        setErrorMessage("Could not load wishlist.");
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      const rows = (wishlistData ?? []) as WishlistRow[];

      if (rows.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      const listingIds = rows.map((row) => row.listing_id);

      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("id, game, item_name, price, status, offer_type, image_url")
        .in("id", listingIds);

      if (listingsError) {
        setErrorMessage("Could not load saved listings.");
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      const listingMap = new Map<string, Listing>();
      (listingsData ?? []).forEach((listing) => {
        listingMap.set(listing.id, listing as Listing);
      });

      const mergedItems: WishlistItem[] = rows
        .map((row) => {
          const listing = listingMap.get(row.listing_id);
          if (!listing) return null;

          return {
            wishlistId: row.id,
            savedAt: row.created_at,
            listing,
          };
        })
        .filter((item): item is WishlistItem => item !== null);

      setWishlistItems(mergedItems);
      setLoading(false);
    };

    fetchWishlist();
  }, [user, authLoading]);

  const handleRemove = async (wishlistId: string) => {
    if (!user) return;
    if (removingId) return;

    setErrorMessage("");
    setSuccessMessage("");
    setRemovingId(wishlistId);

    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", wishlistId)
        .eq("user_id", user.id);

      if (error) {
        setErrorMessage("Could not remove item from wishlist.");
        return;
      }

      setWishlistItems((prev) =>
        prev.filter((item) => item.wishlistId !== wishlistId)
      );
      setSuccessMessage("Item removed from wishlist.");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const savedItemsCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  const availableCount = useMemo(
    () =>
      wishlistItems.filter((item) => item.listing.status === "Available").length,
    [wishlistItems]
  );

  const trackedGamesCount = useMemo(() => {
    const uniqueGames = new Set(wishlistItems.map((item) => item.listing.game));
    return uniqueGames.size;
  }, [wishlistItems]);

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="wishlist" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Wishlist</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Saved items
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Your wishlist
            </h1>
            <p className="mt-4 text-base leading-7 text-[#9CA3AF]">
              Save items you want to track and keep your search organized across
              all supported Dxblox games.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Saved items</h2>
                <p className="mt-2 text-[#9CA3AF]">
                  Quick access to items you want most.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                Loading your wishlist...
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                You must be signed in to use your wishlist.
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                Your wishlist is empty for now.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {wishlistItems.map((item) => (
                  <div
                    key={item.wishlistId}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <ListingImage
                      src={item.listing.image_url}
                      alt={item.listing.item_name}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(
                          item.listing.status
                        )}`}
                      >
                        {item.listing.status}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${offerTypeStyle(
                          item.listing.offer_type
                        )}`}
                      >
                        {item.listing.offer_type}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="text-xl font-bold">
                        {item.listing.item_name}
                      </div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        {item.listing.game}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {item.listing.price}
                      </div>
                      <Link
                        href={`/listing/${item.listing.id}`}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      >
                        View listing
                      </Link>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.wishlistId)}
                        disabled={removingId === item.wishlistId}
                        className="w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === item.wishlistId
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h3 className="text-xl font-bold">Wishlist stats</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">Saved items</div>
                  <div className="mt-1 text-2xl font-bold">{savedItemsCount}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">Available now</div>
                  <div className="mt-1 text-2xl font-bold">{availableCount}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">Tracked games</div>
                  <div className="mt-1 text-2xl font-bold">{trackedGamesCount}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Why use wishlist?</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Benefits
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Keep track of wanted items
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Revisit listings faster
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Stay organized across multiple games
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}