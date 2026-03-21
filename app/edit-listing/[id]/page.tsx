"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WishlistButton from "@/components/WishlistButton";
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
  avatar_url: string | null;
};

export default function ListingDetailPage({ params }: ListingPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { id: listingId } = use(params);

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [moreFromSeller, setMoreFromSeller] = useState<Listing[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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
        setMoreFromSeller([]);
        setLoading(false);
        return;
      }

      const typedListing = listingData as Listing;
      setListing(typedListing);

      const [{ data: sellerData }, { data: sellerListingsData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, role, avatar_url")
            .eq("id", typedListing.user_id)
            .single(),
          supabase
            .from("listings")
            .select(
              "id, user_id, game, category, item_name, price, offer_type, status, description, image_url, proof_url, created_at"
            )
            .eq("user_id", typedListing.user_id)
            .neq("id", typedListing.id)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

      setSeller((sellerData as SellerProfile) ?? null);
      setMoreFromSeller((sellerListingsData ?? []) as Listing[]);
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

      setIsWishlisted(!error && !!data);
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

  const handleContactSeller = async () => {
    if (!listing) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === listing.user_id) {
      setActionError("You cannot start a conversation on your own listing.");
      setActionMessage("");
      return;
    }

    if (startingConversation) return;

    setStartingConversation(true);
    setActionError("");
    setActionMessage("");

    try {
      const { data: existingConversation, error: existingConversationError } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("buyer_id", user.id)
          .eq("seller_id", listing.user_id)
          .maybeSingle();

      if (existingConversationError) {
        setActionError("Could not open conversation. Please try again.");
        return;
      }

      if (existingConversation?.id) {
        router.push(`/messages/${existingConversation.id}`);
        return;
      }

      const { data: newConversation, error: createConversationError } =
        await supabase
          .from("conversations")
          .insert({
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.user_id,
          })
          .select("id")
          .single();

      if (createConversationError || !newConversation) {
        setActionError("Could not start conversation. Please try again.");
        return;
      }

      const firstMessage = `Hi, I'm interested in your listing: ${listing.item_name}`;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        content: firstMessage,
      });

      if (messageError) {
        setActionError("Conversation created, but first message could not be sent.");
        router.push(`/messages/${newConversation.id}`);
        return;
      }

      router.push(`/messages/${newConversation.id}`);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setStartingConversation(false);
    }
  };

  const sellerName = seller?.username || "Unknown seller";
  const isAdminSeller = seller?.role === "admin";
  const isOwner = !!user && !!listing && user.id === listing.user_id;

  const formattedDate = useMemo(() => {
    if (!listing?.created_at) return "Unknown";
    const date = new Date(listing.created_at);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [listing?.created_at]);

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

  const ListingImage = ({
    src,
    alt,
    className,
  }: {
    src: string | null;
    alt: string;
    className?: string;
  }) => {
    if (!src) {
      return (
        <div
          className={`flex items-center justify-center border border-white/8 bg-white/5 text-sm text-[#9CA3AF] ${className || ""}`}
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
  };

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
              <Link href="/listing" className="transition hover:text-white">
                Listings
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
                <ListingImage
                  src={listing.image_url}
                  alt={listing.item_name}
                  className="h-[420px] w-full rounded-[24px]"
                />

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="text-xs text-[#9CA3AF]">Game</div>
                    <div className="mt-1 font-semibold">{listing.game}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="text-xs text-[#9CA3AF]">Category</div>
                    <div className="mt-1 font-semibold">{listing.category}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="text-xs text-[#9CA3AF]">Published</div>
                    <div className="mt-1 font-semibold">{formattedDate}</div>
                  </div>
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
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(
                        listing.status
                      )}`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-4xl font-black tracking-tight">
                        {listing.item_name}
                      </h1>
                      <p className="mt-2 text-[#9CA3AF]">
                        {listing.game} • {listing.category}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-right">
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
                        <button
                          type="button"
                          onClick={handleContactSeller}
                          disabled={startingConversation}
                          className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {startingConversation ? "Opening..." : "Contact seller"}
                        </button>

                        <WishlistButton
                          listingId={listing.id}
                          listingUserId={listing.user_id}
                          initialIsWishlisted={isWishlisted}
                          fullWidth={false}
                          onChanged={(nextValue) => {
                            setIsWishlisted(nextValue);
                            setActionMessage(
                              nextValue
                                ? "Added to wishlist."
                                : "Removed from wishlist."
                            );
                            setActionError("");
                          }}
                        />

                        <button
                          type="button"
                          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15"
                        >
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
                    {seller?.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={sellerName}
                        className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black">
                        {sellerName?.[0]?.toUpperCase() || "S"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-lg font-bold">
                        {sellerName}
                      </div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        {listing.game} seller
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/users/${listing.user_id}`}
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
                  <div className="mt-4 rounded-[22px] border border-white/8 bg-white/5 p-5">
                    <p className="leading-7 text-[#C8D0E0]">
                      {listing.description?.trim()
                        ? listing.description
                        : "No description was added for this listing yet."}
                    </p>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <h2 className="text-2xl font-bold">Proof</h2>

                  {listing.proof_url ? (
                    <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8 bg-white/5">
                      <img
                        src={listing.proof_url}
                        alt={`${listing.item_name} proof`}
                        className="h-64 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mt-4 flex h-56 items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
                      No proof uploaded yet
                    </div>
                  )}

                  <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">
                    Proof support can be expanded later with a safer upload and
                    moderation flow.
                  </p>
                </div>

                {moreFromSeller.length > 0 && (
                  <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-2xl font-bold">More from this seller</h2>
                      <Link
                        href={`/users/${listing.user_id}`}
                        className="text-sm text-violet-300 transition hover:text-violet-200"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      {moreFromSeller.map((item) => (
                        <Link
                          key={item.id}
                          href={`/listing/${item.id}`}
                          className="rounded-[22px] border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-violet-500/30"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="h-32 w-full rounded-2xl border border-white/8 object-cover"
                            />
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
                              No image
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="truncate font-semibold">
                              {item.item_name}
                            </div>
                            <div className="mt-1 text-sm text-[#9CA3AF]">
                              {item.game} • {item.category}
                            </div>
                            <div className="mt-3 text-lg font-bold">
                              {item.price}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                  <h3 className="text-xl font-bold">Listing details</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Game</span>
                      <span className="text-right">{listing.game}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Category</span>
                      <span className="text-right">{listing.category}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Offer type</span>
                      <span className="text-right">{listing.offer_type}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Status</span>
                      <span className="text-right">{listing.status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Published</span>
                      <span className="text-right">{formattedDate}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
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
                      Check the seller profile first
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Review proof carefully when available
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Avoid rushed or suspicious trades
                    </li>
                    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      Report listings that look unsafe
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