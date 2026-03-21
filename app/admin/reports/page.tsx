"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type ListingReport = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  review_status: string;
  created_at: string;
};

type ListingRow = {
  id: string;
  user_id: string;
  item_name: string;
  game: string;
  category: string;
  price: string;
  status: string;
  image_url: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
};

type ConfirmModalState =
  | {
      open: false;
      type: null;
      reportId: null;
      listingId: null;
      title: "";
      message: "";
      confirmLabel: "";
      tone: "danger" | "warning";
    }
  | {
      open: true;
      type: "delete-report" | "delete-listing-reports";
      reportId: string | null;
      listingId: string | null;
      title: string;
      message: string;
      confirmLabel: string;
      tone: "danger" | "warning";
    };

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    pending: "border-orange-500/30 bg-orange-500/15 text-orange-300",
    resolved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    dismissed: "border-red-500/30 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[value] || "border-white/10 bg-white/5 text-white/75"
      }`}
    >
      {value}
    </span>
  );
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
      <div className="flex h-56 w-full items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-56 w-full rounded-[22px] border border-white/8 object-cover"
    />
  );
}

const emptyModalState: ConfirmModalState = {
  open: false,
  type: null,
  reportId: null,
  listingId: null,
  title: "",
  message: "",
  confirmLabel: "",
  tone: "danger",
};

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [reports, setReports] = useState<ListingReport[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, ListingRow>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmModal, setConfirmModal] =
    useState<ConfirmModalState>(emptyModalState);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [highVolumeOnly, setHighVolumeOnly] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const fetchReports = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        setErrorMessage("You must be signed in.");
        return;
      }

      if (profile && profile.role !== "admin") {
        setLoading(false);
        setErrorMessage("Access denied.");
        return;
      }

      const { data, error } = await supabase
        .from("listing_reports")
        .select(
          "id, listing_id, reporter_id, reason, details, review_status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setReports([]);
        setListingsMap({});
        setProfilesMap({});
        setErrorMessage(error.message || "Could not load reports.");
        setLoading(false);
        return;
      }

      const nextReports = (data ?? []) as ListingReport[];
      setReports(nextReports);

      if (nextReports.length === 0) {
        setListingsMap({});
        setProfilesMap({});
        setLoading(false);
        return;
      }

      const listingIds = [...new Set(nextReports.map((item) => item.listing_id))];
      const reporterIds = [...new Set(nextReports.map((item) => item.reporter_id))];

      const [{ data: listingsData }, { data: profilesData }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, user_id, item_name, game, category, price, status, image_url")
          .in("id", listingIds),
        supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .in("id", reporterIds),
      ]);

      const nextListingsMap: Record<string, ListingRow> = {};
      (listingsData ?? []).forEach((row) => {
        const typedRow = row as ListingRow;
        nextListingsMap[typedRow.id] = typedRow;
      });
      setListingsMap(nextListingsMap);

      const nextProfilesMap: Record<string, ProfileRow> = {};
      (profilesData ?? []).forEach((row) => {
        const typedRow = row as ProfileRow;
        nextProfilesMap[typedRow.id] = typedRow;
      });
      setProfilesMap(nextProfilesMap);

      setLoading(false);
    };

    fetchReports();
  }, [user, authLoading, profile]);

  const pendingCount = useMemo(
    () => reports.filter((item) => item.review_status === "pending").length,
    [reports]
  );

  const resolvedCount = useMemo(
    () => reports.filter((item) => item.review_status === "resolved").length,
    [reports]
  );

  const dismissedCount = useMemo(
    () => reports.filter((item) => item.review_status === "dismissed").length,
    [reports]
  );

  const reportCountByListing = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((report) => {
      map[report.listing_id] = (map[report.listing_id] || 0) + 1;
    });
    return map;
  }, [reports]);

  const topReasonByListing = useMemo(() => {
    const reasonMap: Record<string, Record<string, number>> = {};

    reports.forEach((report) => {
      if (!reasonMap[report.listing_id]) {
        reasonMap[report.listing_id] = {};
      }

      const reason = report.reason || "Other";
      reasonMap[report.listing_id][reason] =
        (reasonMap[report.listing_id][reason] || 0) + 1;
    });

    const result: Record<string, string> = {};

    Object.entries(reasonMap).forEach(([listingId, reasons]) => {
      const sorted = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
      result[listingId] = sorted[0]?.[0] || "Other";
    });

    return result;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reports.filter((report) => {
      const listing = listingsMap[report.listing_id];
      const reporter = profilesMap[report.reporter_id];
      const listingName = listing?.item_name?.toLowerCase() || "";
      const listingGame = listing?.game?.toLowerCase() || "";
      const reporterName = reporter?.username?.toLowerCase() || "";
      const reason = report.reason?.toLowerCase() || "";
      const details = report.details?.toLowerCase() || "";
      const topReason = topReasonByListing[report.listing_id]?.toLowerCase() || "";
      const listingReportCount = reportCountByListing[report.listing_id] || 0;

      const matchesSearch =
        !q ||
        listingName.includes(q) ||
        listingGame.includes(q) ||
        reporterName.includes(q) ||
        reason.includes(q) ||
        details.includes(q) ||
        topReason.includes(q);

      const matchesStatus =
        selectedStatus === "All" || report.review_status === selectedStatus.toLowerCase();

      const matchesHighVolume = !highVolumeOnly || listingReportCount >= 5;

      return matchesSearch && matchesStatus && matchesHighVolume;
    });
  }, [
    reports,
    listingsMap,
    profilesMap,
    search,
    selectedStatus,
    highVolumeOnly,
    reportCountByListing,
    topReasonByListing,
  ]);

  const hasActiveFilters =
    search.trim() !== "" || selectedStatus !== "All" || highVolumeOnly;

  const resetFilters = () => {
    setSearch("");
    setSelectedStatus("All");
    setHighVolumeOnly(false);
  };

  const closeConfirmModal = () => {
    if (actionId) return;
    setConfirmModal(emptyModalState);
  };

  const openDeleteReportModal = (reportId: string) => {
    setConfirmModal({
      open: true,
      type: "delete-report",
      reportId,
      listingId: null,
      title: "Delete report",
      message:
        "This will permanently delete this report from the database. Use this for fake reports or test reports.",
      confirmLabel: "Delete report",
      tone: "danger",
    });
  };

  const openDeleteAllReportsModal = (listingId: string) => {
    setConfirmModal({
      open: true,
      type: "delete-listing-reports",
      reportId: null,
      listingId,
      title: "Delete all reports",
      message:
        "This will permanently delete every report attached to this listing. Use this only to clean fake or test report spam.",
      confirmLabel: "Delete all reports",
      tone: "warning",
    });
  };

  const handleUpdateStatus = async (
    reportId: string,
    nextStatus: "resolved" | "dismissed"
  ) => {
    if (!isAdmin || actionId) return;

    setActionId(reportId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("listing_reports")
        .update({
          review_status: nextStatus,
        })
        .eq("id", reportId);

      if (error) {
        setErrorMessage(error.message || "Could not update report.");
        return;
      }

      setReports((prev) =>
        prev.map((item) =>
          item.id === reportId ? { ...item, review_status: nextStatus } : item
        )
      );

      setSuccessMessage(
        nextStatus === "resolved"
          ? "Report marked as resolved."
          : "Report dismissed successfully."
      );
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const deleteSingleReport = async (reportId: string) => {
    setActionId(reportId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("listing_reports")
        .delete()
        .eq("id", reportId);

      if (error) {
        setErrorMessage(error.message || "Could not delete report.");
        return;
      }

      setReports((prev) => prev.filter((item) => item.id !== reportId));
      setSuccessMessage("Report deleted successfully.");
      setConfirmModal(emptyModalState);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const deleteAllReportsForListing = async (listingId: string) => {
    setActionId(`bulk-${listingId}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("listing_reports")
        .delete()
        .eq("listing_id", listingId);

      if (error) {
        setErrorMessage(error.message || "Could not delete listing reports.");
        return;
      }

      setReports((prev) => prev.filter((item) => item.listing_id !== listingId));
      setSuccessMessage("All reports for this listing were deleted.");
      setConfirmModal(emptyModalState);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!isAdmin || actionId || !confirmModal.open) return;

    if (confirmModal.type === "delete-report" && confirmModal.reportId) {
      await deleteSingleReport(confirmModal.reportId);
      return;
    }

    if (
      confirmModal.type === "delete-listing-reports" &&
      confirmModal.listingId
    ) {
      await deleteAllReportsForListing(confirmModal.listingId);
    }
  };

  if (!loading && (!user || !isAdmin)) {
    return (
      <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {errorMessage || "Access denied."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="admin" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin" className="transition hover:text-white">
            Admin
          </Link>
          <span>/</span>
          <span className="text-white">Reports</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Admin moderation
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Listing reports
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Review reports, clean fake report spam, and moderate suspicious
                listings.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Resolved</div>
                <div className="mt-1 text-2xl font-bold">{resolvedCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Dismissed</div>
                <div className="mt-1 text-2xl font-bold">{dismissedCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_auto]">
            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listing, reason, details or reporter..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="All" className="bg-[#131320] text-white">
                  All
                </option>
                <option value="Pending" className="bg-[#131320] text-white">
                  Pending
                </option>
                <option value="Resolved" className="bg-[#131320] text-white">
                  Resolved
                </option>
                <option value="Dismissed" className="bg-[#131320] text-white">
                  Dismissed
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setHighVolumeOnly((prev) => !prev)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  highVolumeOnly
                    ? "border border-orange-500/20 bg-orange-500/10 text-orange-300"
                    : "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                }`}
              >
                High volume only
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-sm text-[#9CA3AF]">
              <span className="font-semibold text-white">
                {filteredReports.length}
              </span>{" "}
              {filteredReports.length === 1 ? "report found" : "reports found"}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
            >
              Reset filters
            </button>
          </div>
        </section>

        <section className="mt-8">
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
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
              <div className="text-xl font-bold text-white">No reports found</div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Try changing your search or filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredReports.map((report) => {
                const listing = listingsMap[report.listing_id];
                const reporter = profilesMap[report.reporter_id];

                const reporterName =
                  reporter?.username || `User ${report.reporter_id.slice(0, 8)}`;
                const reporterAvatar = reporter?.avatar_url || null;
                const reporterInitial = reporterName[0]?.toUpperCase() || "U";

                const formattedDate = new Date(report.created_at).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                );

                const listingReportCount = reportCountByListing[report.listing_id] || 1;
                const topReason = topReasonByListing[report.listing_id] || report.reason;
                const bulkDeleting = actionId === `bulk-${report.listing_id}`;

                return (
                  <article
                    key={report.id}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-[#131320] shadow-[0_20px_80px_rgba(0,0,0,0.20)]"
                  >
                    <div className="border-b border-white/8 bg-white/[0.02] px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300">
                              Report
                            </span>
                            <StatusBadge value={report.review_status} />

                            {listingReportCount >= 5 && (
                              <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-300">
                                {listingReportCount} reports on this listing
                              </span>
                            )}
                          </div>

                          <h2 className="truncate text-2xl font-bold">
                            {listing?.item_name || "Deleted listing"}
                          </h2>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#9CA3AF]">
                            <span>
                              {listing
                                ? `${listing.game} • ${listing.category}`
                                : "Listing unavailable"}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>Reported on {formattedDate}</span>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-right">
                          <div className="text-xs text-red-300">Reason</div>
                          <div className="mt-1 text-sm font-bold text-red-200">
                            {report.reason}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 px-6 py-6 xl:grid-cols-[280px_1fr]">
                      <div className="space-y-4">
                        <ListingImage
                          src={listing?.image_url || null}
                          alt={listing?.item_name || "Reported listing"}
                        />

                        <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                          <div className="mb-3 text-sm font-semibold text-white">
                            Reporter
                          </div>

                          <div className="flex items-center gap-4">
                            {reporterAvatar ? (
                              <img
                                src={reporterAvatar}
                                alt={reporterName}
                                className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black text-white">
                                {reporterInitial}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="truncate text-base font-bold text-white">
                                {reporterName}
                              </div>
                              <div className="mt-1 text-xs text-[#9CA3AF]">
                                Reporter account
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={`/users/${report.reporter_id}`}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
                            >
                              View reporter
                            </Link>

                            {listing && (
                              <Link
                                href={`/listing/${listing.id}`}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
                              >
                                View listing
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Game</div>
                            <div className="mt-1 font-semibold">
                              {listing?.game || "Unknown"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Category</div>
                            <div className="mt-1 font-semibold">
                              {listing?.category || "Unknown"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Price</div>
                            <div className="mt-1 font-semibold">
                              {listing?.price || "Unknown"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Status</div>
                            <div className="mt-1 font-semibold">
                              {listing?.status || "Unknown"}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Total reports</div>
                            <div className="mt-1 text-xl font-bold text-white">
                              {listingReportCount}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Top reason</div>
                            <div className="mt-1 font-semibold text-white">
                              {topReason}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Report status</div>
                            <div className="mt-1 font-semibold text-white">
                              {report.review_status}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                          <div className="text-xs text-[#9CA3AF]">Report details</div>
                          <div className="mt-2 leading-7 text-white/85">
                            {report.details?.trim()
                              ? report.details
                              : "No extra details provided."}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(report.id, "resolved")}
                            disabled={actionId === report.id || bulkDeleting}
                            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === report.id ? "Processing..." : "Resolve"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(report.id, "dismissed")}
                            disabled={actionId === report.id || bulkDeleting}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === report.id ? "Processing..." : "Dismiss"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteReportModal(report.id)}
                            disabled={actionId === report.id || bulkDeleting}
                            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete report
                          </button>

                          {listing && (
                            <button
                              type="button"
                              onClick={() => openDeleteAllReportsModal(listing.id)}
                              disabled={bulkDeleting || !!actionId}
                              className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-6 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {bulkDeleting
                                ? "Processing..."
                                : "Delete all reports for listing"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-sm ${
                    confirmModal.tone === "danger"
                      ? "border-red-500/20 bg-red-500/10 text-red-300"
                      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  Confirmation required
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                  {confirmModal.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={!!actionId}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-60"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#9CA3AF]">
              {confirmModal.message}
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={!!actionId}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={!!actionId}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmModal.tone === "danger"
                    ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                    : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/15"
                }`}
              >
                {actionId ? "Processing..." : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}