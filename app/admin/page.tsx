"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type SubmissionRow = {
  id: string;
  review_status: string;
};

type ReportRow = {
  id: string;
  review_status: string;
  listing_id: string;
};

type ConversationRow = {
  id: string;
};

type SupportThreadRow = {
  id: string;
  status: string;
};

type ProfileRow = {
  id: string;
  role: string | null;
};

type ListingRow = {
  id: string;
  status: string;
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingReviews, setPendingReviews] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [supportRequests, setSupportRequests] = useState(0);
  const [openSupportRequests, setOpenSupportRequests] = useState(0);
  const [reportedListingsCount, setReportedListingsCount] = useState(0);
  const [activeListings, setActiveListings] = useState(0);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const fetchAdminStats = async () => {
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

      setLoading(true);
      setErrorMessage("");

      const [
        { data: submissionsData, error: submissionsError },
        { data: reportsData, error: reportsError },
        { data: profilesData, error: profilesError },
        { data: conversationsData, error: conversationsError },
        { data: listingsData, error: listingsError },
        { data: supportThreadsData, error: supportThreadsError },
      ] = await Promise.all([
        supabase.from("listing_submissions").select("id, review_status"),
        supabase.from("listing_reports").select("id, review_status, listing_id"),
        supabase.from("profiles").select("id, role"),
        supabase.from("conversations").select("id"),
        supabase.from("listings").select("id, status"),
        supabase.from("support_threads").select("id, status"),
      ]);

      const firstError =
        submissionsError ||
        reportsError ||
        profilesError ||
        conversationsError ||
        listingsError ||
        supportThreadsError;

      if (firstError) {
        setErrorMessage(firstError.message || "Could not load admin stats.");
        setLoading(false);
        return;
      }

      const typedSubmissions = (submissionsData ?? []) as SubmissionRow[];
      const typedReports = (reportsData ?? []) as ReportRow[];
      const typedProfiles = (profilesData ?? []) as ProfileRow[];
      const typedConversations = (conversationsData ?? []) as ConversationRow[];
      const typedListings = (listingsData ?? []) as ListingRow[];
      const typedSupportThreads =
        (supportThreadsData ?? []) as SupportThreadRow[];

      setPendingReviews(
        typedSubmissions.filter((item) => item.review_status === "pending").length
      );

      setPendingReports(
        typedReports.filter((item) => item.review_status === "pending").length
      );

      setTotalUsers(typedProfiles.length);
      setAdminUsers(typedProfiles.filter((item) => item.role === "admin").length);

      setTotalMessages(typedConversations.length);
      setSupportRequests(typedSupportThreads.length);
      setOpenSupportRequests(
        typedSupportThreads.filter((item) => item.status === "open").length
      );

      setReportedListingsCount(
        new Set(typedReports.map((item) => item.listing_id)).size
      );

      setActiveListings(
        typedListings.filter((item) => item.status !== "Sold").length
      );

      setLoading(false);
    };

    fetchAdminStats();
  }, [user, authLoading, profile]);

  const standardCards = useMemo(
    () => [
      {
        title: "Pending reviews",
        value: pendingReviews,
        description: "Listing submissions waiting for approval.",
        href: "/admin/reviews",
        badge: pendingReviews > 0 ? `${pendingReviews} waiting` : "All clear",
      },
      {
        title: "Pending reports",
        value: pendingReports,
        description: "Community reports that still need review.",
        href: "/admin/reports",
        badge: pendingReports > 0 ? `${pendingReports} pending` : "All clear",
      },
      {
        title: "Users",
        value: totalUsers,
        description: "All profiles currently in the marketplace.",
        href: "/admin/users",
        badge: `${adminUsers} admins`,
      },
      {
        title: "Conversations",
        value: totalMessages,
        description: "Buyer and seller conversations available to moderate.",
        href: "/admin/messages",
        badge: "Read only",
      },
      {
        title: "Support",
        value: supportRequests,
        description: "Footer contact requests sent to the admin team.",
        href: "/admin/support",
        badge: openSupportRequests > 0 ? `${openSupportRequests} open` : "Inbox",
      },
    ],
    [
      pendingReviews,
      pendingReports,
      totalUsers,
      adminUsers,
      totalMessages,
      supportRequests,
      openSupportRequests,
    ]
  );

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
          <span className="text-white">Admin</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Admin hub
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Control center
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Quick moderation access for reviews, reports, users, marketplace
                conversations and support requests.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Reported listings</div>
                <div className="mt-1 text-2xl font-bold">
                  {reportedListingsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Active listings</div>
                <div className="mt-1 text-2xl font-bold">{activeListings}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Admin users</div>
                <div className="mt-1 text-2xl font-bold">{adminUsers}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Support inbox</div>
                <div className="mt-1 text-2xl font-bold">
                  {openSupportRequests}
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
            Loading admin dashboard...
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {standardCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-[24px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-violet-500/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-[#9CA3AF]">{card.title}</div>
                      <div className="mt-2 text-4xl font-black text-white">
                        {card.value}
                      </div>
                    </div>

                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                      {card.badge}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#9CA3AF]">
                    {card.description}
                  </p>

                  <div className="mt-5 text-sm font-semibold text-white">
                    Open →
                  </div>
                </Link>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Priority actions</h2>

                  <Link
                    href="/admin/support"
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-violet-500/30 hover:bg-white/10"
                  >
                    Open support inbox
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Link
                    href="/admin/reviews"
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30"
                  >
                    <div className="text-sm text-[#9CA3AF]">Reviews</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {pendingReviews > 0
                        ? `${pendingReviews} pending submissions`
                        : "No pending submissions"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      Approve or reject listing creations and edits.
                    </p>
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30"
                  >
                    <div className="text-sm text-[#9CA3AF]">Reports</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {pendingReports > 0
                        ? `${pendingReports} pending reports`
                        : "No pending reports"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      Check suspicious listings and clean fake reports.
                    </p>
                  </Link>

                  <Link
                    href="/admin/messages"
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30"
                  >
                    <div className="text-sm text-[#9CA3AF]">Messages</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {totalMessages} conversations
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      Open buyer and seller chats in read-only mode.
                    </p>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/30"
                  >
                    <div className="text-sm text-[#9CA3AF]">Users</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {totalUsers} total users
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      Browse profiles, roles and admin accounts.
                    </p>
                  </Link>

                  <Link
                    href="/admin/support"
                    className="rounded-[22px] border border-violet-500/20 bg-violet-500/10 p-5 transition hover:border-violet-400/40 hover:bg-violet-500/15 md:col-span-2"
                  >
                    <div className="text-sm text-violet-200">Support</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {openSupportRequests > 0
                        ? `${openSupportRequests} open support request${
                            openSupportRequests > 1 ? "s" : ""
                          }`
                        : "No open support requests"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#C9D2E7]">
                      Review footer contact messages, open the conversation,
                      check the sender profile, and delete threads if needed.
                    </p>
                  </Link>
                </div>
              </div>

              <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                <h2 className="text-2xl font-bold">Marketplace health</h2>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="text-sm text-white/70">
                      Pending review pressure
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {pendingReviews > 0
                        ? `${pendingReviews} items need attention`
                        : "Stable"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="text-sm text-white/70">
                      Community safety signal
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {reportedListingsCount > 0
                        ? `${reportedListingsCount} listings have reports`
                        : "No reported listings"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="text-sm text-white/70">Admin coverage</div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {adminUsers} admin{adminUsers > 1 ? "s" : ""} active in
                      system
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="text-sm text-white/70">Support activity</div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {openSupportRequests > 0
                        ? `${openSupportRequests} contact request${
                            openSupportRequests > 1 ? "s are" : " is"
                          } waiting`
                        : "Support inbox is clear"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/admin/reports"
                    className="inline-flex rounded-2xl border border-white/10 bg-black/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/20"
                  >
                    Open moderation tools
                  </Link>

                  <Link
                    href="/admin/support"
                    className="inline-flex rounded-2xl border border-white/10 bg-black/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/20"
                  >
                    Open support inbox
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}