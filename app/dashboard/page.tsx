"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type Listing = {
  id: string;
  game: string;
  item_name: string;
  price: string;
  status: string;
  created_at: string;
  image_url: string | null;
};

type Submission = {
  id: string;
  listing_id: string | null;
  user_id: string;
  submission_type: "create" | "edit";
  review_status: "pending" | "approved" | "rejected";
  game: string;
  category: string;
  item_name: string;
  price: string;
  offer_type: string;
  status: string;
  description: string | null;
  image_url: string | null;
  proof_url: string | null;
  review_note: string | null;
  created_at: string;
};

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [listings, setListings] = useState<Listing[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      if (authLoading) return;

      if (!user) {
        setListings([]);
        setLoadingListings(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id, game, item_name, price, status, created_at, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Could not load your listings.");
        setListings([]);
        setLoadingListings(false);
        return;
      }

      setListings((data ?? []) as Listing[]);
      setLoadingListings(false);
    };

    fetchListings();
  }, [user, authLoading]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (authLoading) return;

      if (!user) {
        setSubmissions([]);
        setLoadingSubmissions(false);
        return;
      }

      const { data, error } = await supabase
        .from("listing_submissions")
        .select(
          "id, listing_id, user_id, submission_type, review_status, game, category, item_name, price, offer_type, status, description, image_url, proof_url, review_note, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage((prev) =>
          prev || "Could not load your review requests."
        );
        setSubmissions([]);
        setLoadingSubmissions(false);
        return;
      }

      setSubmissions((data ?? []) as Submission[]);
      setLoadingSubmissions(false);
    };

    fetchSubmissions();
  }, [user, authLoading]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (authLoading) return;

      if (!user) {
        setConversations([]);
        setLoadingMessages(false);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("id, listing_id, buyer_id, seller_id, created_at")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage((prev) => prev || "Could not load your messages.");
        setConversations([]);
        setLoadingMessages(false);
        return;
      }

      setConversations((data ?? []) as Conversation[]);
      setLoadingMessages(false);
    };

    fetchConversations();
  }, [user, authLoading]);

  const activeCount = useMemo(
    () => listings.filter((listing) => listing.status === "Available").length,
    [listings]
  );

  const pendingLiveCount = useMemo(
    () => listings.filter((listing) => listing.status === "Pending").length,
    [listings]
  );

  const soldCount = useMemo(
    () => listings.filter((listing) => listing.status === "Sold").length,
    [listings]
  );

  const pendingReviewCount = useMemo(
    () =>
      submissions.filter((submission) => submission.review_status === "pending")
        .length,
    [submissions]
  );

  const rejectedReviewCount = useMemo(
    () =>
      submissions.filter((submission) => submission.review_status === "rejected")
        .length,
    [submissions]
  );

  const conversationCount = conversations.length;

  const latestGame = useMemo(() => {
    if (listings.length === 0) return "No listings yet";
    return listings[0].game;
  }, [listings]);

  const latestActivity = useMemo(() => {
    if (submissions.length > 0) {
      return `Last request: ${submissions[0].item_name}`;
    }
    if (listings.length > 0) {
      return `Published ${listings[0].item_name}`;
    }
    return "No recent activity";
  }, [listings, submissions]);

  const latestMessageActivity = useMemo(() => {
    if (conversations.length === 0) return "No conversations yet";
    return `Active conversations: ${conversations.length}`;
  }, [conversations]);

  const accountType = profile?.role === "admin" ? "Admin" : "User";
  const isAdmin = profile?.role === "admin";

  const liveStatusStyle = (status: string) => {
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

  const reviewStatusStyle = (status: string) => {
    if (status === "pending") {
      return "border-orange-500/30 bg-orange-500/15 text-orange-300";
    }

    if (status === "approved") {
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    }

    if (status === "rejected") {
      return "border-red-500/30 bg-red-500/15 text-red-300";
    }

    return "border-white/10 bg-white/5 text-white/75";
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!user) return;
    if (deletingId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    setDeletingId(listingId);

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) {
        setErrorMessage("Could not delete listing. Please try again.");
        return;
      }

      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      setSuccessMessage("Listing deleted successfully.");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const ListingImage = ({
    src,
    alt,
    small = false,
  }: {
    src: string | null;
    alt: string;
    small?: boolean;
  }) => {
    const sizeClass = small ? "h-24" : "h-36";

    if (!src) {
      return (
        <div
          className={`flex ${sizeClass} items-center justify-center rounded-[18px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]`}
        >
          No image
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} w-full rounded-[18px] border border-white/8 object-cover`}
      />
    );
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="dashboard" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Dashboard</span>
        </div>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-2xl font-black text-white">
                {profile?.username?.[0]?.toUpperCase() || "D"}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">
                    Dashboard
                  </h1>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                    {isAdmin ? "Admin view" : "Seller view"}
                  </span>
                </div>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#9CA3AF]">
                  Manage your live listings, review requests, and messages from
                  one place.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Active</div>
                <div className="mt-1 text-2xl font-bold">{activeCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Live pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingLiveCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold</div>
                <div className="mt-1 text-2xl font-bold">{soldCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Review pending</div>
                <div className="mt-1 text-2xl font-bold">
                  {pendingReviewCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Rejected</div>
                <div className="mt-1 text-2xl font-bold">
                  {rejectedReviewCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Messages</div>
                <div className="mt-1 text-2xl font-bold">
                  {loadingMessages ? "..." : conversationCount}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/create-listing"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                Create listing
              </Link>

              <Link
                href="/messages"
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
              >
                Open messages
              </Link>

              <Link
                href="/wishlist"
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
              >
                Open wishlist
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin/reviews"
                    className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-6 py-3 font-semibold text-violet-300 transition hover:bg-violet-500/15"
                  >
                    Review requests
                  </Link>
                  <Link
                    href="/admin/users"
                    className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-6 py-3 font-semibold text-violet-300 transition hover:bg-violet-500/15"
                  >
                    Admin users
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-bold">Quick overview</h2>
            <p className="mt-4 leading-7 text-[#9CA3AF]">
              This dashboard now shows your public listings, moderation flow,
              and your messaging activity.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Profile status</div>
                <div className="mt-2 text-[#9CA3AF]">
                  {user ? "Connected and active" : "Not signed in"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Main game</div>
                <div className="mt-2 text-[#9CA3AF]">{latestGame}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Last activity</div>
                <div className="mt-2 text-[#9CA3AF]">{latestActivity}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Account type</div>
                <div className="mt-2 text-[#9CA3AF]">{accountType}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4 sm:col-span-2">
                <div className="text-sm font-semibold">Inbox activity</div>
                <div className="mt-2 text-[#9CA3AF]">{latestMessageActivity}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">My live listings</h2>
                  <p className="mt-2 text-[#9CA3AF]">
                    Your currently published listings.
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

              {loadingListings ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  Loading your listings...
                </div>
              ) : listings.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  You do not have any live listings yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                    >
                      <Link href={`/listing/${listing.id}`} className="block">
                        <ListingImage
                          src={listing.image_url}
                          alt={listing.item_name}
                        />

                        <div className="mt-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-bold">
                              {listing.item_name}
                            </div>
                            <div className="mt-1 text-sm text-[#9CA3AF]">
                              {listing.game}
                            </div>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${liveStatusStyle(
                              listing.status
                            )}`}
                          >
                            {listing.status}
                          </span>
                        </div>
                      </Link>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xl font-bold">{listing.price}</div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/listing/${listing.id}`}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                          >
                            View
                          </Link>

                          <Link
                            href={`/edit-listing/${listing.id}`}
                            className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/15"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={deletingId === listing.id}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === listing.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">My review requests</h2>
                  <p className="mt-2 text-[#9CA3AF]">
                    Track all your create and edit requests.
                  </p>
                </div>
              </div>

              {loadingSubmissions ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  Loading your review requests...
                </div>
              ) : submissions.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  You have not sent any review requests yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <div>
                          <ListingImage
                            src={submission.image_url}
                            alt={submission.item_name}
                            small
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                                  {submission.submission_type}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${reviewStatusStyle(
                                    submission.review_status
                                  )}`}
                                >
                                  {submission.review_status}
                                </span>
                              </div>

                              <div className="mt-3 text-lg font-bold">
                                {submission.item_name}
                              </div>
                              <div className="mt-1 text-sm text-[#9CA3AF]">
                                {submission.game} • {submission.category}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-[#9CA3AF]">Price</div>
                              <div className="mt-1 text-lg font-bold">
                                {submission.price}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                              <div className="text-xs text-[#9CA3AF]">
                                Offer type
                              </div>
                              <div className="mt-1 font-medium">
                                {submission.offer_type}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                              <div className="text-xs text-[#9CA3AF]">
                                Listing status
                              </div>
                              <div className="mt-1 font-medium">
                                {submission.status}
                              </div>
                            </div>
                          </div>

                          {submission.review_note && (
                            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                              <div className="text-xs text-red-300">
                                Review note
                              </div>
                              <div className="mt-2 text-sm text-red-200">
                                {submission.review_note}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 text-sm text-[#9CA3AF]">
                            Sent on{" "}
                            {new Date(submission.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h3 className="text-xl font-bold">Quick actions</h3>
              <div className="mt-4 space-y-3">
                <Link
                  href="/messages"
                  className="block rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300 transition hover:bg-violet-500/15"
                >
                  Open messages
                </Link>

                <Link
                  href="/profile"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Open profile
                </Link>

                <Link
                  href="/wishlist"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Open wishlist
                </Link>

                <Link
                  href="/games"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Browse games
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      href="/admin/reviews"
                      className="block rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300 transition hover:bg-violet-500/15"
                    >
                      Open admin reviews
                    </Link>
                    <Link
                      href="/admin/users"
                      className="block rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300 transition hover:bg-violet-500/15"
                    >
                      Open admin users
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h3 className="text-xl font-bold">Inbox</h3>
              <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Conversations</div>
                <div className="mt-2 text-3xl font-black">
                  {loadingMessages ? "..." : conversationCount}
                </div>
                <div className="mt-2 text-sm text-[#9CA3AF]">
                  {loadingMessages
                    ? "Loading message activity..."
                    : conversationCount > 0
                    ? "Your inbox is active and ready."
                    : "No conversations started yet."}
                </div>
              </div>

              <Link
                href="/messages"
                className="mt-4 block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
              >
                Go to inbox
              </Link>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Dashboard notes</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Notes
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Live listings and review requests are now separated clearly
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Rejected requests can show an admin note here
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Messages are now accessible directly from your dashboard
                </li>
                {isAdmin && (
                  <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    Admin accounts can jump directly to reviews and users
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}