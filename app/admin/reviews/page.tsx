"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

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

type ProfileRow = {
  id: string;
  username: string | null;
  role: string | null;
  avatar_url?: string | null;
};

export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const fetchSubmissions = async () => {
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
        .from("listing_submissions")
        .select(
          "id, listing_id, user_id, submission_type, review_status, game, category, item_name, price, offer_type, status, description, image_url, proof_url, review_note, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message || "Could not load review requests.");
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const nextSubmissions = (data ?? []) as Submission[];
      setSubmissions(nextSubmissions);

      const uniqueUserIds = [...new Set(nextSubmissions.map((item) => item.user_id))];

      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, role")
          .in("id", uniqueUserIds);

        const nextProfilesMap: Record<string, ProfileRow> = {};
        (profilesData ?? []).forEach((row) => {
          const profileRow = row as ProfileRow;
          nextProfilesMap[profileRow.id] = profileRow;
        });
        setProfilesMap(nextProfilesMap);
      } else {
        setProfilesMap({});
      }

      setLoading(false);
    };

    fetchSubmissions();
  }, [user, authLoading, profile]);

  const pendingSubmissions = useMemo(
    () => submissions.filter((item) => item.review_status === "pending"),
    [submissions]
  );

  const approvedCount = useMemo(
    () => submissions.filter((item) => item.review_status === "approved").length,
    [submissions]
  );

  const rejectedCount = useMemo(
    () => submissions.filter((item) => item.review_status === "rejected").length,
    [submissions]
  );

  const pendingCount = pendingSubmissions.length;

  const handleApprove = async (submission: Submission) => {
    if (!isAdmin || actionId) return;

    setActionId(submission.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (submission.submission_type === "create") {
        const { error: createError } = await supabase.from("listings").insert({
          user_id: submission.user_id,
          game: submission.game,
          category: submission.category,
          item_name: submission.item_name,
          price: submission.price,
          offer_type: submission.offer_type,
          status: submission.status,
          description: submission.description,
          image_url: submission.image_url,
          proof_url: submission.proof_url,
        });

        if (createError) {
          setErrorMessage(createError.message || "Could not approve creation.");
          return;
        }
      }

      if (submission.submission_type === "edit") {
        if (!submission.listing_id) {
          setErrorMessage("Missing original listing ID for edit request.");
          return;
        }

        const { error: updateError } = await supabase
          .from("listings")
          .update({
            game: submission.game,
            category: submission.category,
            item_name: submission.item_name,
            price: submission.price,
            offer_type: submission.offer_type,
            status: submission.status,
            description: submission.description,
            image_url: submission.image_url,
            proof_url: submission.proof_url,
          })
          .eq("id", submission.listing_id);

        if (updateError) {
          setErrorMessage(updateError.message || "Could not approve edit.");
          return;
        }
      }

      const { error: reviewError } = await supabase
        .from("listing_submissions")
        .update({
          review_status: "approved",
          review_note: null,
        })
        .eq("id", submission.id);

      if (reviewError) {
        setErrorMessage(
          reviewError.message || "Approved listing but could not update request."
        );
        return;
      }

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === submission.id
            ? { ...item, review_status: "approved", review_note: null }
            : item
        )
      );

      setRejectNotes((prev) => {
        const next = { ...prev };
        delete next[submission.id];
        return next;
      });

      setSuccessMessage("Request approved successfully.");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!isAdmin || actionId) return;

    const note = rejectNotes[submissionId]?.trim() || "Rejected by admin";

    setActionId(submissionId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("listing_submissions")
        .update({
          review_status: "rejected",
          review_note: note,
        })
        .eq("id", submissionId);

      if (error) {
        setErrorMessage(error.message || "Could not reject request.");
        return;
      }

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                review_status: "rejected",
                review_note: note,
              }
            : item
        )
      );

      setSuccessMessage("Request rejected successfully.");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setActionId(null);
    }
  };

  const StatusBadge = ({ value }: { value: string }) => {
    const styles: Record<string, string> = {
      pending: "border-orange-500/30 bg-orange-500/15 text-orange-300",
      approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      rejected: "border-red-500/30 bg-red-500/15 text-red-300",
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
          <span className="text-white">Admin reviews</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Admin moderation
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Review requests
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Approve or reject listing creations and edits before they go
                live.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Approved</div>
                <div className="mt-1 text-2xl font-bold">{approvedCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Rejected</div>
                <div className="mt-1 text-2xl font-bold">{rejectedCount}</div>
              </div>
            </div>
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
              Loading review requests...
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
              No pending requests right now.
            </div>
          ) : (
            <div className="grid gap-5">
              {pendingSubmissions.map((submission) => {
                const sellerProfile = profilesMap[submission.user_id];
                const sellerName =
                  sellerProfile?.username || `User ${submission.user_id.slice(0, 8)}`;
                const sellerRole = sellerProfile?.role || "user";
                const sellerInitial = sellerName[0]?.toUpperCase() || "U";

                return (
                  <article
                    key={submission.id}
                    className="rounded-[28px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.20)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                            {submission.submission_type}
                          </span>
                          <StatusBadge value={submission.review_status} />
                        </div>

                        <h2 className="text-2xl font-bold">
                          {submission.item_name}
                        </h2>
                        <p className="mt-2 text-[#9CA3AF]">
                          {submission.game} • {submission.category}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-right">
                        <div className="text-xs text-emerald-300">Price</div>
                        <div className="mt-1 text-xl font-bold text-emerald-300">
                          {submission.price}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr]">
                      <div className="space-y-4">
                        {submission.image_url ? (
                          <img
                            src={submission.image_url}
                            alt={submission.item_name}
                            className="h-56 w-full rounded-[22px] border border-white/8 object-cover"
                          />
                        ) : (
                          <div className="flex h-56 items-center justify-center rounded-[22px] border border-white/8 bg-white/5 text-sm text-[#9CA3AF]">
                            No image
                          </div>
                        )}

                        <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                          <div className="mb-3 text-sm font-semibold text-white">
                            Seller
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black text-white">
                              {sellerInitial}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-base font-bold text-white">
                                {sellerName}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs text-[#9CA3AF]">
                                  {sellerRole}
                                </span>

                                {sellerRole === "admin" && (
                                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs text-violet-300">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">
                              Offer type
                            </div>
                            <div className="mt-1 font-semibold">
                              {submission.offer_type}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                            <div className="text-xs text-[#9CA3AF]">Status</div>
                            <div className="mt-1 font-semibold">
                              {submission.status}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                          <div className="text-xs text-[#9CA3AF]">Description</div>
                          <div className="mt-2 leading-7 text-white/85">
                            {submission.description?.trim()
                              ? submission.description
                              : "No description provided."}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                          <label className="mb-2 block text-sm text-[#9CA3AF]">
                            Reject note
                          </label>
                          <textarea
                            rows={3}
                            value={rejectNotes[submission.id] || ""}
                            onChange={(e) =>
                              setRejectNotes((prev) => ({
                                ...prev,
                                [submission.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional reason visible to the user..."
                            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleApprove(submission)}
                            disabled={actionId === submission.id}
                            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === submission.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(submission.id)}
                            disabled={actionId === submission.id}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === submission.id
                              ? "Processing..."
                              : "Reject"}
                          </button>
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
    </div>
  );
}