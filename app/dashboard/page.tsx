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
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
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
        .select("id, game, item_name, price, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Could not load your listings.");
        setListings([]);
        setLoadingListings(false);
        return;
      }

      setListings(data ?? []);
      setLoadingListings(false);
    };

    fetchListings();
  }, [user, authLoading]);

  const activeCount = useMemo(
    () => listings.filter((listing) => listing.status === "Available").length,
    [listings]
  );

  const pendingCount = useMemo(
    () => listings.filter((listing) => listing.status === "Pending").length,
    [listings]
  );

  const soldCount = useMemo(
    () => listings.filter((listing) => listing.status === "Sold").length,
    [listings]
  );

  const latestGame = useMemo(() => {
    if (listings.length === 0) return "No listings yet";
    return listings[0].game;
  }, [listings]);

  const latestActivity = useMemo(() => {
    if (listings.length === 0) return "No recent listing activity";
    return `Published ${listings[0].item_name}`;
  }, [listings]);

  const accountType = profile?.role === "admin" ? "Admin" : "User";

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
                    {profile?.role === "admin" ? "Admin view" : "Seller view"}
                  </span>
                </div>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#9CA3AF]">
                  Manage your listings, keep track of your activity and get a
                  quick view of your Dxblox account.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Active listings</div>
                <div className="mt-1 text-2xl font-bold">{activeCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold</div>
                <div className="mt-1 text-2xl font-bold">{soldCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total listings</div>
                <div className="mt-1 text-2xl font-bold">{listings.length}</div>
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
                href="/wishlist"
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
              >
                Open wishlist
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-bold">Quick overview</h2>
            <p className="mt-4 leading-7 text-[#9CA3AF]">
              This dashboard gives a clean summary of your real account activity
              and listings from Supabase.
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
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">My listings</h2>
                <p className="mt-2 text-[#9CA3AF]">
                  Track your current posts and their status.
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
                You do not have any listings yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <Link href={`/listing/${listing.id}`} className="block">
                      <div className="h-36 rounded-[18px] border border-white/8 bg-black/20" />

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
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(
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

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h3 className="text-xl font-bold">Quick actions</h3>
              <div className="mt-4 space-y-3">
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
              </div>
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
                  Your dashboard is now reading real listings from Supabase
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Image and proof uploads can be added next with Supabase Storage
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Form logic can be improved next for game-specific categories
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}