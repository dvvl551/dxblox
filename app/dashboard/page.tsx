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

type ListingEditState = {
  latestEdit: Submission | null;
  hasPendingEdit: boolean;
  lastEditRejected: boolean;
  lastEditApproved: boolean;
};

type DeleteModalTarget = {
  id: string;
  item_name: string;
};

function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />
      {children}
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-violet-500/20 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.10),rgba(255,255,255,0.03))]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function DashboardPanel({
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
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function MiniInfoCard({
  label,
  value,
  description,
  accent = "default",
}: {
  label: string;
  value: string;
  description?: string;
  accent?: "default" | "violet";
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        accent === "violet"
          ? "border-violet-500/20 bg-violet-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`text-xs font-semibold uppercase tracking-[0.22em] ${
          accent === "violet" ? "text-violet-300/80" : "text-[#A7AFBF]"
        }`}
      >
        {label}
      </div>
      <div className="mt-3 text-base font-semibold text-white">{value}</div>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[#B7BED0]">{description}</p>
      )}
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  desc,
  accent = "default",
}: {
  href: string;
  title: string;
  desc: string;
  accent?: "default" | "violet";
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-[24px] border p-4 transition hover:-translate-y-1 ${
        accent === "violet"
          ? "border-violet-500/20 bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(255,255,255,0.03))] hover:border-violet-500/30 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.16),rgba(255,255,255,0.04))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`text-sm font-semibold ${
              accent === "violet" ? "text-violet-300" : "text-white"
            }`}
          >
            {title}
          </div>
          <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">{desc}</p>
        </div>

        <div
          className={`rounded-2xl border px-3 py-1 text-[11px] font-medium transition ${
            accent === "violet"
              ? "border-violet-500/20 bg-violet-500/10 text-violet-200"
              : "border-white/10 bg-white/5 text-white/70 group-hover:text-white"
          }`}
        >
          Open
        </div>
      </div>
    </Link>
  );
}

function ListingImage({
  src,
  alt,
  small = false,
}: {
  src: string | null;
  alt: string;
  small?: boolean;
}) {
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
}

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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] =
    useState<DeleteModalTarget | null>(null);

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
        setErrorMessage((prev) => prev || "Could not load your review requests.");
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

  const approvedReviewCount = useMemo(
    () =>
      submissions.filter((submission) => submission.review_status === "approved")
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

  const editStateByListingId = useMemo(() => {
    const editSubmissions = submissions.filter(
      (submission) =>
        submission.submission_type === "edit" && submission.listing_id
    );

    const map: Record<string, ListingEditState> = {};

    for (const submission of editSubmissions) {
      const listingId = submission.listing_id as string;
      const existing = map[listingId];

      if (!existing) {
        map[listingId] = {
          latestEdit: submission,
          hasPendingEdit: submission.review_status === "pending",
          lastEditRejected: submission.review_status === "rejected",
          lastEditApproved: submission.review_status === "approved",
        };
        continue;
      }

      const existingDate = new Date(existing.latestEdit?.created_at ?? 0).getTime();
      const currentDate = new Date(submission.created_at).getTime();

      if (currentDate > existingDate) {
        map[listingId] = {
          latestEdit: submission,
          hasPendingEdit: submission.review_status === "pending",
          lastEditRejected: submission.review_status === "rejected",
          lastEditApproved: submission.review_status === "approved",
        };
      }
    }

    return map;
  }, [submissions]);

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
    if (!user || deletingId) return;

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
      setDeleteModalTarget(null);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateListingStatus = async (
    listingId: string,
    nextStatus: "Available" | "Sold"
  ) => {
    if (!user || updatingStatusId) return;

    setErrorMessage("");
    setSuccessMessage("");
    setUpdatingStatusId(listingId);

    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: nextStatus })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) {
        setErrorMessage("Could not update listing status. Please try again.");
        return;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: nextStatus }
            : listing
        )
      );

      setSuccessMessage(
        nextStatus === "Sold"
          ? "Listing marked as sold."
          : "Listing marked as available."
      );
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <DashboardShell>
      <Navbar active="dashboard" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Dashboard</span>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,14,28,0.98),rgba(8,9,19,0.98))] px-5 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-2xl font-black text-white">
                  {profile?.username?.[0]?.toUpperCase() || "D"}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      Dashboard
                    </h1>

                    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
                      {isAdmin ? "Admin view" : "Seller view"}
                    </span>
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9CA3AF]">
                    Manage your listings, review requests, inbox, and marketplace
                    activity from one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/create-listing"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  Create listing
                </Link>

                <Link
                  href="/messages"
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Open messages
                </Link>

                <Link
                  href="/wishlist"
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Open wishlist
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3 font-semibold text-violet-300 transition hover:bg-violet-500/15"
                  >
                    Open admin panel
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <DashboardStatCard label="Active" value={activeCount} />
              <DashboardStatCard label="Live pending" value={pendingLiveCount} />
              <DashboardStatCard label="Sold" value={soldCount} />
              <DashboardStatCard label="Review pending" value={pendingReviewCount} />
              <DashboardStatCard label="Rejected" value={rejectedReviewCount} />
              <DashboardStatCard
                label="Messages"
                value={loadingMessages ? "..." : conversationCount}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <DashboardPanel
              title="My live listings"
              description="Your currently published listings."
            >
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
                  {listings.map((listing) => {
                    const isUpdatingStatus = updatingStatusId === listing.id;
                    const isDeleting = deletingId === listing.id;
                    const editState = editStateByListingId[listing.id];
                    const latestEdit = editState?.latestEdit ?? null;
                    const hasPendingEdit = editState?.hasPendingEdit ?? false;
                    const lastEditRejected = editState?.lastEditRejected ?? false;
                    const lastEditApproved = editState?.lastEditApproved ?? false;

                    return (
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
                              <div className="text-lg font-bold text-white">
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

                        {(hasPendingEdit || lastEditRejected || lastEditApproved) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {hasPendingEdit && (
                              <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
                                Edit pending review
                              </span>
                            )}

                            {!hasPendingEdit && lastEditRejected && (
                              <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300">
                                Last edit rejected
                              </span>
                            )}

                            {!hasPendingEdit && lastEditApproved && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                                Last edit approved
                              </span>
                            )}
                          </div>
                        )}

                        {latestEdit?.review_note &&
                          latestEdit.review_status === "rejected" && (
                            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                              <div className="text-xs text-red-300">Review note</div>
                              <div className="mt-1 text-sm text-red-200">
                                {latestEdit.review_note}
                              </div>
                            </div>
                          )}

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="text-xl font-bold text-white">{listing.price}</div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/listing/${listing.id}`}
                              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                            >
                              View
                            </Link>

                            <Link
                              href={`/edit-listing/${listing.id}`}
                              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                hasPendingEdit
                                  ? "pointer-events-none cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                                  : "border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15"
                              }`}
                            >
                              {hasPendingEdit ? "Edit pending" : "Edit"}
                            </Link>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {listing.status !== "Sold" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateListingStatus(listing.id, "Sold")
                              }
                              disabled={isUpdatingStatus || isDeleting}
                              className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdatingStatus ? "Updating..." : "Mark as sold"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateListingStatus(listing.id, "Available")
                              }
                              disabled={isUpdatingStatus || isDeleting}
                              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdatingStatus
                                ? "Updating..."
                                : "Mark as available"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModalTarget({
                                id: listing.id,
                                item_name: listing.item_name,
                              })
                            }
                            disabled={isDeleting || isUpdatingStatus}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting && deleteModalTarget?.id === listing.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="My review requests"
              description="Track all your create and edit requests."
            >
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

                              <div className="mt-3 text-lg font-bold text-white">
                                {submission.item_name}
                              </div>
                              <div className="mt-1 text-sm text-[#9CA3AF]">
                                {submission.game} • {submission.category}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-[#9CA3AF]">Price</div>
                              <div className="mt-1 text-lg font-bold text-white">
                                {submission.price}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                              <div className="text-xs text-[#9CA3AF]">
                                Offer type
                              </div>
                              <div className="mt-1 font-medium text-white">
                                {submission.offer_type}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                              <div className="text-xs text-[#9CA3AF]">
                                Listing status
                              </div>
                              <div className="mt-1 font-medium text-white">
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
                            Sent on {new Date(submission.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>
          </div>

          <aside className="space-y-5">
            <DashboardPanel
              title="Quick overview"
              description="A cleaner summary of your seller activity and account health."
            >
              <div className="grid gap-4">
                <MiniInfoCard
                  label="Profile status"
                  value={user ? "Connected and active" : "Not signed in"}
                  description="Your account is ready to manage listings, messages and review activity."
                  accent="violet"
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <MiniInfoCard label="Main game" value={latestGame} />
                  <MiniInfoCard label="Account type" value={accountType} />
                </div>

                <MiniInfoCard label="Last activity" value={latestActivity} />
                <MiniInfoCard label="Inbox activity" value={latestMessageActivity} />
              </div>
            </DashboardPanel>

            <DashboardPanel title="Quick actions">
              <div className="grid gap-3">
                <QuickActionCard
                  href="/messages"
                  title="Messages"
                  desc="Open your inbox and continue active conversations."
                  accent="violet"
                />
                <QuickActionCard
                  href="/profile"
                  title="Profile"
                  desc="Update your public seller profile and account identity."
                />
                <QuickActionCard
                  href="/wishlist"
                  title="Wishlist"
                  desc="Review saved listings and keep track of favorites."
                />
                <QuickActionCard
                  href="/games"
                  title="Browse games"
                  desc="Explore categories and find new listing opportunities."
                />
                {isAdmin && (
                  <QuickActionCard
                    href="/admin"
                    title="Admin panel"
                    desc="Access moderation tools, users, reports and support."
                    accent="violet"
                  />
                )}
              </div>
            </DashboardPanel>

            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">Inbox</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      Your messaging space on Dxblox.
                    </p>
                  </div>

                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                    Live
                  </span>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#A7AFBF]">
                        Conversations
                      </div>
                      <div className="mt-3 text-5xl font-black leading-none text-white">
                        {loadingMessages ? "..." : conversationCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-white/75">
                      Inbox health
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 p-4 text-sm leading-7 text-[#9CA3AF]">
                    {loadingMessages
                      ? "Loading message activity..."
                      : conversationCount > 0
                      ? "Your inbox is active and ready. Keep all trade communication on Dxblox."
                      : "No conversations started yet. Once buyers or sellers contact you, they will appear here."}
                  </div>

                  <Link
                    href="/messages"
                    className="mt-4 block rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-center font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                  >
                    Open inbox
                  </Link>
                </div>
              </div>
            </section>

            {isAdmin && (
              <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-white">Admin panel</h3>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                    Control center
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-white/85">
                  Access moderation tools, reports, users and conversations from
                  one clean admin hub.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs text-white/70">Pending reviews</div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {pendingReviewCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs text-white/70">Approved</div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {approvedReviewCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs text-white/70">Rejected</div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {rejectedReviewCount}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href="/admin"
                    className="inline-flex rounded-2xl border border-white/10 bg-black/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/20"
                  >
                    Open admin control center
                  </Link>
                </div>
              </section>
            )}

            <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">Dashboard notes</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Notes
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Live listings and review requests are separated clearly
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Rejected requests can display the admin note here
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Messages are accessible directly from your dashboard
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Pending edits are now visible on each live listing
                </li>
                {isAdmin && (
                  <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    Admin tools are now centralised inside the admin panel
                  </li>
                )}
              </ul>
            </section>
          </aside>
        </section>
      </main>

      {deleteModalTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b1020] p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300/80">
              Danger zone
            </p>

            <h3 className="mt-3 text-2xl font-bold text-white">
              Delete listing?
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              This action will permanently remove this listing from Dxblox.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">
                {deleteModalTarget.item_name}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                This cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteModalTarget(null)}
                disabled={deletingId !== null}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteListing(deleteModalTarget.id)}
                disabled={deletingId !== null}
                className="flex-1 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteModalTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}