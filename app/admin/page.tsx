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
  const [showWelcome, setShowWelcome] = useState(false);

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
      setShowWelcome(true);

      setTimeout(() => {
        setShowWelcome(false);
      }, 2200);
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
      <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_28%)]" />
        <Navbar />
        <main className="relative mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-200 backdrop-blur-xl">
            {errorMessage || "Access denied."}
          </div>
        </main>
      </div>
    );
  }

  if (!loading && showWelcome && user && isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.14),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 opacity-[0.04] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

        <Navbar active="admin" />

        <main className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center px-6 py-10">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-2xl shadow-[0_0_80px_rgba(168,85,247,0.12)]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-white/60">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              Private control node
            </div>

            <h1 className="bg-gradient-to-r from-white via-fuchsia-200 to-red-300 bg-clip-text text-6xl font-black tracking-[0.18em] text-transparent md:text-8xl">
              WELCOME
            </h1>

            <p className="mt-5 text-sm tracking-[0.18em] text-white/55 md:text-base">
              ADMIN ACCESS GRANTED
            </p>

            <div className="mx-auto mt-8 h-px w-40 bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/35">
              Initializing secure workspace...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <Navbar active="admin" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/45">
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

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_100px_rgba(168,85,247,0.08)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">
                Private admin hub
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Control center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                Quick moderation access for reviews, reports, users, marketplace
                conversations and support requests.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Reported listings
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {reportedListingsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Active listings
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {activeListings}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Admin users
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {adminUsers}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Support inbox
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {openSupportRequests}
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-8 text-white/55 backdrop-blur-2xl">
            Loading admin dashboard...
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {standardCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-fuchsia-400/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-white/45">{card.title}</div>
                      <div className="mt-2 text-4xl font-black text-white">
                        {card.value}
                      </div>
                    </div>

                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200">
                      {card.badge}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/55">
                    {card.description}
                  </p>

                  <div className="mt-5 text-sm font-semibold text-white">
                    Open →
                  </div>
                </Link>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_100px_rgba(168,85,247,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Priority actions</h2>

                  <Link
                    href="/admin/support"
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-fuchsia-400/30 hover:bg-white/10"
                  >
                    Open support inbox
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Link
                    href="/admin/reviews"
                    className="rounded-[22px] border border-white/10 bg-black/20 p-5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm text-white/45">Reviews</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {pendingReviews > 0
                        ? `${pendingReviews} pending submissions`
                        : "No pending submissions"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      Approve or reject listing creations and edits.
                    </p>
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="rounded-[22px] border border-white/10 bg-black/20 p-5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm text-white/45">Reports</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {pendingReports > 0
                        ? `${pendingReports} pending reports`
                        : "No pending reports"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      Check suspicious listings and clean fake reports.
                    </p>
                  </Link>

                  <Link
                    href="/admin/messages"
                    className="rounded-[22px] border border-white/10 bg-black/20 p-5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm text-white/45">Messages</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {totalMessages} conversations
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      Open buyer and seller chats in read-only mode.
                    </p>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="rounded-[22px] border border-white/10 bg-black/20 p-5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm text-white/45">Users</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {totalUsers} total users
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      Browse profiles, roles and admin accounts.
                    </p>
                  </Link>

                  <Link
                    href="/admin/support"
                    className="rounded-[22px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/15 md:col-span-2"
                  >
                    <div className="text-sm text-fuchsia-200">Support</div>
                    <div className="mt-2 text-xl font-bold text-white">
                      {openSupportRequests > 0
                        ? `${openSupportRequests} open support request${
                            openSupportRequests > 1 ? "s" : ""
                          }`
                        : "No open support requests"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#D7D9E8]">
                      Review footer contact messages, open the conversation,
                      check the sender profile, and delete threads if needed.
                    </p>
                  </Link>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(59,130,246,0.10),rgba(239,68,68,0.10))] p-6 shadow-[0_0_90px_rgba(168,85,247,0.16)] backdrop-blur-2xl">
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