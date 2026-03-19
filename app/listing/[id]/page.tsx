"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type ListingPageProps = {
  params: Promise<{
    id: string;
  }>;
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
  description: string | null;
  image_url: string | null;
  proof_url: string | null;
  created_at: string;
};

type SellerProfile = {
  username: string | null;
  role: string;
};

export default function ListingDetailPage({ params }: ListingPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [listingId, setListingId] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setListingId(resolvedParams.id);
    };

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      setLoading(true);
      setPageError("");
      setActionError("");
      setActionMessage("");

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, description, image_url, proof_url, created_at"
        )
        .eq("id", listingId)
        .single();

      if (listingError || !listingData) {
        setPageError("Listing not found.");
        setListing(null);
        setSeller(null);
        setLoading(false);
        return;
      }

      setListing(listingData);

      const { data: sellerData } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", listingData.user_id)
        .single();

      setSeller(sellerData ?? null);
      setLoading(false);
    };

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    if (!user || !listingId) {
      setIsWishlisted(false);
      return;
    }

    const checkWishlistStatus = async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (!error && data) {
        setIsWishlisted(true);
      } else {
        setIsWishlisted(false);
      }
    };

    checkWishlistStatus();
  }, [user, listingId]);

  const handleDeleteListing = async () => {
    if (!user || !listing) return;
    if (deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");
    setActionMessage("");

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (error) {
        setActionError("Could not delete listing. Please try again.");
        return;
      }

      setActionMessage("Listing deleted successfully.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!listing) return;
    if (wishlistLoading) return;

    setActionError("");
    setActionMessage("");

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === listing.user_id) {
      setActionError("You cannot add your own listing to your wishlist.");
      return;
    }

    setWishlistLoading(true);

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

        setIsWishlisted(false);
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

        setIsWishlisted(true);
        setActionMessage("Added to wishlist.");
      }
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const sellerName = seller?.username || "Unknown seller";
  const isAdminSeller = seller?.role === "admin";
  const isOwner = !!user && !!listing && user.id === listing.user_id;

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
            Loading listing...
          </div>
        ) : pageError || !listing ? (
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {pageError || "Listing not found."}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <span>/</span>
              <Link href="/games" className="transition hover:text-white">
                Games
              </Link>
              <span>/</span>
              <span className="text-white">{listing.item_name}</span>
            </div>

            {actionMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {actionMessage}
              </div>
            )}

            {actionError && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {actionError}
              </div>
            )}

            <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="flex h-[420px] items-end rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(61,169,252,0.10))] p-6">
                  <div>
                    <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                      Featured item
                    </div>
                    <div className="mt-4 text-sm text-[#C9D2FF]">
                      {listing.game} • {listing.category}
                    </div>
                    <div className="mt-2 text-4xl font-black tracking-tight">
                      {listing.item_name}
                    </div>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#9CA3AF]">
                      Visual uploads are temporarily disabled. This area will
                      later show the real item image or proof preview.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="h-24 rounded-2xl border border-white/8 bg-white/5" />
                  <div className="h-24 rounded-2xl border border-white/8 bg-white/5" />
                  <div className="h-24 rounded-2xl border border-white/8 bg-white/5" />
                  <div className="h-24 rounded-2xl border border-white/8 bg-white/5" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                      {listing.offer_type}
                    </span>
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">
                      {listing.category}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      {listing.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-4xl font-black tracking-tight">
                        {listing.item_name}
                      </h1>
                      <p className="mt-2 text-[#9CA3AF]">
                        {listing.game} • {listing.category}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-right">
                      <div className="text-xs text-emerald-300">Price</div>
                      <div className="mt-1 text-2xl font-bold text-emerald-300">
                        {listing.price}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-xs text-[#9CA3AF]">Status</div>
                      <div className="mt-1 text-xl font-bold">
                        {listing.status}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-xs text-[#9CA3AF]">Offer type</div>
                      <div className="mt-1 text-xl font-bold">
                        {listing.offer_type}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-xs text-[#9CA3AF]">Game</div>
                      <div className="mt-1 font-semibold">{listing.game}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-xs text-[#9CA3AF]">Category</div>
                      <div className="mt-1 font-semibold">
                        {listing.category}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {isOwner ? (
                      <>
                        <Link
                          href={`/edit-listing/${listing.id}`}
                          className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                        >
                          Edit listing
                        </Link>
                        <button
                          type="button"
                          onClick={handleDeleteListing}
                          disabled={deleting}
                          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deleting ? "Deleting..." : "Delete listing"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]">
                          Contact seller
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleWishlist}
                          disabled={wishlistLoading}
                          className={`rounded-2xl px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isWishlisted
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                              : "border border-white/10 text-white/90 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          {wishlistLoading
                            ? "Saving..."
                            : isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"}
                        </button>

                        <button className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15">
                          Report
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold">Seller</h2>
                    {isAdminSeller && (
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4 rounded-[26px] border border-white/8 bg-white/5 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black">
                      {sellerName?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <div className="text-lg font-bold">{sellerName}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        {listing.game} seller
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="mt-5 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/5"
                  >
                    View seller profile
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
              <div className="space-y-8">
                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <h2 className="text-2xl font-bold">Description</h2>
                  <p className="mt-4 leading-7 text-[#9CA3AF]">
                    {listing.description?.trim()
                      ? listing.description
                      : "No description was added for this listing yet."}
                  </p>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <h2 className="text-2xl font-bold">Proof</h2>
                  <div className="mt-4 flex h-56 items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
                    Proof uploads are not enabled yet.
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">
                    Proof support will be added later with a safer upload and
                    moderation flow.
                  </p>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <h3 className="text-xl font-bold">Listing details</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Game</span>
                      <span>{listing.game}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Category</span>
                      <span>{listing.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Offer type</span>
                      <span>{listing.offer_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Status</span>
                      <span>{listing.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Listing ID</span>
                      <span className="max-w-[140px] truncate text-right">
                        {listing.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                  <h3 className="text-xl font-bold">Trade more safely</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Check the seller profile
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Review proof carefully when uploads are available
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Report suspicious listings
                    </li>
                  </ul>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}