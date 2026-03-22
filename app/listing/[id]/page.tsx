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

type ListingReportRow = {
  id: string;
  reason: string;
  review_status: string;
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

type DeleteModalTarget = {
  id: string;
  item_name: string;
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
            <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function ListingDetailPage({ params }: ListingPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { id: listingId } = use(params);

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [moreFromSeller, setMoreFromSeller] = useState<Listing[]>([]);
  const [latestEditSubmission, setLatestEditSubmission] =
    useState<Submission | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("Suspicious listing");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  const [reportCount, setReportCount] = useState(0);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const [topReportReason, setTopReportReason] = useState<string | null>(null);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [deleteModalTarget, setDeleteModalTarget] =
    useState<DeleteModalTarget | null>(null);

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
        setLatestEditSubmission(null);
        setReportCount(0);
        setPendingReportCount(0);
        setTopReportReason(null);
        setLoading(false);
        return;
      }

      const typedListing = listingData as Listing;
      setListing(typedListing);

      const [
        { data: sellerData },
        { data: sellerListingsData },
        { data: reportsData },
        { data: editSubmissionsData },
      ] = await Promise.all([
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
        supabase
          .from("listing_reports")
          .select("id, reason, review_status")
          .eq("listing_id", typedListing.id),
        supabase
          .from("listing_submissions")
          .select(
            "id, listing_id, user_id, submission_type, review_status, game, category, item_name, price, offer_type, status, description, image_url, proof_url, review_note, created_at"
          )
          .eq("listing_id", typedListing.id)
          .eq("submission_type", "edit")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      setSeller((sellerData as SellerProfile) ?? null);
      setMoreFromSeller((sellerListingsData ?? []) as Listing[]);
      setLatestEditSubmission(
        ((editSubmissionsData ?? [])[0] as Submission | undefined) ?? null
      );

      const typedReports = (reportsData ?? []) as ListingReportRow[];
      setReportCount(typedReports.length);
      setPendingReportCount(
        typedReports.filter((item) => item.review_status === "pending").length
      );

      if (typedReports.length > 0) {
        const reasonCounts: Record<string, number> = {};

        typedReports.forEach((item) => {
          const key = item.reason || "Other";
          reasonCounts[key] = (reasonCounts[key] || 0) + 1;
        });

        const sortedReasons = Object.entries(reasonCounts).sort(
          (a, b) => b[1] - a[1]
        );

        setTopReportReason(sortedReasons[0]?.[0] || null);
      } else {
        setTopReportReason(null);
      }

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

  const refreshReports = async (currentListingId: string) => {
    const { data: refreshedReports } = await supabase
      .from("listing_reports")
      .select("id, reason, review_status")
      .eq("listing_id", currentListingId);

    const typedReports = (refreshedReports ?? []) as ListingReportRow[];
    setReportCount(typedReports.length);
    setPendingReportCount(
      typedReports.filter((item) => item.review_status === "pending").length
    );

    if (typedReports.length > 0) {
      const reasonCounts: Record<string, number> = {};

      typedReports.forEach((item) => {
        const key = item.reason || "Other";
        reasonCounts[key] = (reasonCounts[key] || 0) + 1;
      });

      const sortedReasons = Object.entries(reasonCounts).sort(
        (a, b) => b[1] - a[1]
      );

      setTopReportReason(sortedReasons[0]?.[0] || null);
    } else {
      setTopReportReason(null);
    }
  };

  const handleDeleteListing = async () => {
    if (!user || !listing) return;
    if (deleting) return;

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
      setDeleteModalTarget(null);

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateListingStatus = async (
    nextStatus: "Available" | "Sold"
  ) => {
    if (!user || !listing || updatingStatus) return;

    setUpdatingStatus(true);
    setActionError("");
    setActionMessage("");

    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: nextStatus })
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (error) {
        setActionError("Could not update listing status. Please try again.");
        return;
      }

      setListing((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      setActionMessage(
        nextStatus === "Sold"
          ? "Listing marked as sold."
          : "Listing marked as available."
      );
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setUpdatingStatus(false);
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
        setActionError(
          existingConversationError.message ||
            "Could not open conversation. Please try again."
        );
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
        setActionError(
          createConversationError?.message ||
            "Could not start conversation. Please try again."
        );
        return;
      }

      const firstMessage = `Hi, I'm interested in your listing: ${listing.item_name}`;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        content: firstMessage,
      });

      if (messageError) {
        setActionError(
          "Conversation created, but first message could not be sent."
        );
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

  const handleReportListing = async () => {
    if (!listing) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === listing.user_id) {
      setActionError("You cannot report your own listing.");
      setActionMessage("");
      return;
    }

    if (reporting) return;

    setReporting(true);
    setActionError("");
    setActionMessage("");

    try {
      const { error } = await supabase.from("listing_reports").insert({
        listing_id: listing.id,
        reporter_id: user.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

      if (error) {
        setActionError(error.message || "Could not send report.");
        return;
      }

      setActionMessage("Report sent successfully.");
      setShowReportForm(false);
      setReportReason("Suspicious listing");
      setReportDetails("");

      await refreshReports(listing.id);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setReporting(false);
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

  const reportBadgeStyle = useMemo(() => {
    if (reportCount >= 15) {
      return "border-red-500/30 bg-red-500/15 text-red-300";
    }

    if (reportCount >= 5) {
      return "border-orange-500/30 bg-orange-500/15 text-orange-300";
    }

    if (reportCount >= 1) {
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-300";
    }

    return "border-white/10 bg-white/5 text-white/75";
  }, [reportCount]);

  const reportLabel = useMemo(() => {
    if (reportCount >= 15) return "High report volume";
    if (reportCount >= 5) return "Community flagged";
    if (reportCount >= 1) return "Reported";
    return null;
  }, [reportCount]);

  const publicReportMessage = useMemo(() => {
    if (reportCount >= 15) {
      return `This listing has received ${reportCount} community reports and may be under review.`;
    }

    if (reportCount >= 5) {
      return `This listing has received ${reportCount} community reports. Please trade carefully.`;
    }

    if (reportCount >= 1) {
      return `This listing has received ${reportCount} community report${
        reportCount > 1 ? "s" : ""
      }.`;
    }

    return null;
  }, [reportCount]);

  const hasPendingEdit = latestEditSubmission?.review_status === "pending";
  const lastEditRejected = latestEditSubmission?.review_status === "rejected";
  const lastEditApproved = latestEditSubmission?.review_status === "approved";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-8 text-[#9CA3AF]">
            Loading listing...
          </div>
        ) : pageError || !listing ? (
          <div className="rounded-[32px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {pageError || "Listing not found."}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <span>/</span>
              <Link href="/listings" className="transition hover:text-white">
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

            {isOwner && latestEditSubmission && (
              <div
                className={`mb-6 rounded-[28px] border p-4 ${
                  hasPendingEdit
                    ? "border-orange-500/20 bg-orange-500/10"
                    : lastEditRejected
                    ? "border-red-500/20 bg-red-500/10"
                    : "border-emerald-500/20 bg-emerald-500/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        hasPendingEdit
                          ? "text-orange-200"
                          : lastEditRejected
                          ? "text-red-200"
                          : "text-emerald-200"
                      }`}
                    >
                      {hasPendingEdit
                        ? "Edit request in review"
                        : lastEditRejected
                        ? "Last edit was rejected"
                        : "Last edit was approved"}
                    </div>

                    <p
                      className={`mt-1 text-sm leading-7 ${
                        hasPendingEdit
                          ? "text-orange-100/90"
                          : lastEditRejected
                          ? "text-red-100/90"
                          : "text-emerald-100/90"
                      }`}
                    >
                      {hasPendingEdit
                        ? "Your latest edit request is still pending admin review. The live listing remains unchanged until approval."
                        : lastEditRejected
                        ? "Your latest edit request was rejected. Review the note below before submitting another update."
                        : "Your latest edit request was approved successfully."}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      hasPendingEdit
                        ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
                        : lastEditRejected
                        ? "border-red-500/30 bg-red-500/15 text-red-300"
                        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {latestEditSubmission.review_status}
                  </span>
                </div>

                {latestEditSubmission.review_note && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs text-white/70">Review note</div>
                    <div className="mt-2 text-sm text-white/90">
                      {latestEditSubmission.review_note}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-white/60">
                  Last edit request sent on{" "}
                  {new Date(latestEditSubmission.created_at).toLocaleString()}
                </div>
              </div>
            )}

            <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
                <ListingImage
                  src={listing.image_url}
                  alt={listing.item_name}
                  className="h-[460px] w-full rounded-[24px]"
                />

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <InfoStat label="Game" value={listing.game} />
                  <InfoStat label="Category" value={listing.category} />
                  <InfoStat label="Published" value={formattedDate} />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
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

                    {reportLabel && (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${reportBadgeStyle}`}
                      >
                        {reportLabel}
                      </span>
                    )}

                    {isOwner && hasPendingEdit && (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
                        Edit pending review
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-4xl font-black tracking-tight text-white">
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

                  {reportCount > 0 && (
                    <div className="mt-5 rounded-[24px] border border-orange-500/20 bg-orange-500/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-orange-200">
                            Community signal
                          </div>
                          <p className="mt-1 text-sm leading-7 text-orange-100/90">
                            {publicReportMessage}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                            <div className="text-xs text-orange-200/80">
                              Total reports
                            </div>
                            <div className="mt-1 text-lg font-bold text-white">
                              {reportCount}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                            <div className="text-xs text-orange-200/80">
                              Pending
                            </div>
                            <div className="mt-1 text-lg font-bold text-white">
                              {pendingReportCount}
                            </div>
                          </div>

                          {topReportReason && (
                            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                              <div className="text-xs text-orange-200/80">
                                Main reason
                              </div>
                              <div className="mt-1 text-sm font-semibold text-white">
                                {topReportReason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <InfoStat label="Status" value={listing.status} />
                    <InfoStat label="Offer type" value={listing.offer_type} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {isOwner ? (
                      <>
                        <Link
                          href={`/edit-listing/${listing.id}`}
                          className={`rounded-2xl px-6 py-3 font-semibold shadow-lg shadow-violet-900/30 transition ${
                            hasPendingEdit
                              ? "pointer-events-none cursor-not-allowed border border-white/10 bg-white/5 text-white/40 shadow-none"
                              : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:scale-[1.02]"
                          }`}
                        >
                          {hasPendingEdit ? "Edit pending review" : "Edit listing"}
                        </Link>

                        {listing.status !== "Sold" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateListingStatus("Sold")}
                            disabled={updatingStatus || deleting}
                            className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-6 py-3 font-semibold text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingStatus ? "Updating..." : "Mark as sold"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateListingStatus("Available")
                            }
                            disabled={updatingStatus || deleting}
                            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingStatus
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
                          disabled={deleting || updatingStatus}
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
                          onClick={() => setShowReportForm((prev) => !prev)}
                          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15"
                        >
                          {showReportForm ? "Close report" : "Report"}
                        </button>
                      </>
                    )}
                  </div>

                  {showReportForm && !isOwner && (
                    <div className="mt-4 rounded-[24px] border border-red-500/20 bg-red-500/5 p-4">
                      <div className="mb-3 text-sm font-semibold text-red-200">
                        Report this listing
                      </div>

                      <div className="grid gap-3">
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                        >
                          <option
                            value="Suspicious listing"
                            className="bg-[#131320] text-white"
                          >
                            Suspicious listing
                          </option>
                          <option
                            value="Possible scam"
                            className="bg-[#131320] text-white"
                          >
                            Possible scam
                          </option>
                          <option
                            value="Fake proof"
                            className="bg-[#131320] text-white"
                          >
                            Fake proof
                          </option>
                          <option
                            value="Wrong category"
                            className="bg-[#131320] text-white"
                          >
                            Wrong category
                          </option>
                          <option value="Other" className="bg-[#131320] text-white">
                            Other
                          </option>
                        </select>

                        <textarea
                          rows={4}
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Optional details..."
                          className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
                        />

                        <button
                          type="button"
                          onClick={handleReportListing}
                          disabled={reporting}
                          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reporting ? "Sending..." : "Send report"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-white">Seller</h2>
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black text-white">
                        {sellerName?.[0]?.toUpperCase() || "S"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-lg font-bold text-white">
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

            <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <SectionCard title="Description">
                  <div className="rounded-[22px] border border-white/8 bg-white/5 p-5">
                    <p className="leading-7 text-[#C8D0E0]">
                      {listing.description?.trim()
                        ? listing.description
                        : "No description was added for this listing yet."}
                    </p>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Proof"
                  description="Proof can help buyers review the listing more carefully."
                >
                  {listing.proof_url ? (
                    <div className="overflow-hidden rounded-[22px] border border-white/8 bg-white/5">
                      <img
                        src={listing.proof_url}
                        alt={`${listing.item_name} proof`}
                        className="h-72 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-60 items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
                      No proof uploaded yet
                    </div>
                  )}
                </SectionCard>

                {moreFromSeller.length > 0 && (
                  <SectionCard
                    title="More from this seller"
                    actions={
                      <Link
                        href={`/users/${listing.user_id}`}
                        className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
                      >
                        View all
                      </Link>
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      {moreFromSeller.map((item) => (
                        <Link
                          key={item.id}
                          href={`/listing/${item.id}`}
                          className="rounded-[22px] border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:border-violet-500/30"
                        >
                          <ListingImage
                            src={item.image_url}
                            alt={item.item_name}
                            className="h-32 w-full rounded-2xl"
                          />

                          <div className="mt-3">
                            <div className="truncate font-semibold text-white">
                              {item.item_name}
                            </div>
                            <div className="mt-1 text-sm text-[#9CA3AF]">
                              {item.game} • {item.category}
                            </div>
                            <div className="mt-3 text-lg font-bold text-white">
                              {item.price}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              <aside className="space-y-5">
                <SectionCard title="Listing details">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Game</span>
                      <span className="text-right text-white">{listing.game}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Category</span>
                      <span className="text-right text-white">
                        {listing.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Offer type</span>
                      <span className="text-right text-white">
                        {listing.offer_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Status</span>
                      <span className="text-right text-white">
                        {listing.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Published</span>
                      <span className="text-right text-white">
                        {formattedDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Reports</span>
                      <span className="text-right font-semibold text-white">
                        {reportCount}
                      </span>
                    </div>
                    {topReportReason && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#9CA3AF]">Top reason</span>
                        <span className="text-right text-white">
                          {topReportReason}
                        </span>
                      </div>
                    )}
                    {isOwner && latestEditSubmission && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#9CA3AF]">Last edit review</span>
                        <span className="text-right capitalize text-white">
                          {latestEditSubmission.review_status}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#9CA3AF]">Listing ID</span>
                      <span className="max-w-[150px] truncate text-right text-white">
                        {listing.id}
                      </span>
                    </div>
                  </div>
                </SectionCard>

                <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                  <h3 className="text-xl font-bold text-white">Trade more safely</h3>
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
                </section>
              </aside>
            </section>
          </>
        )}
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
                disabled={deleting}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteListing}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}