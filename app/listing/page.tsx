"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

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
  created_at: string;
};

const GAME_OPTIONS = [
  "All games",
  "MM2",
  "Adopt Me",
  "Blox Fruits",
  "Blade Ball",
  "Steal a Brainrot",
  "Da Hood",
] as const;

const STATUS_OPTIONS = ["All statuses", "Available", "Pending", "Sold"] as const;

export default function ListingPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] =
    useState<(typeof GAME_OPTIONS)[number]>("All games");
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, description, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage("Could not load listings.");
        setListings([]);
        setLoading(false);
        return;
      }

      setListings(data ?? []);
      setLoading(false);
    };

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        listing.item_name.toLowerCase().includes(searchValue) ||
        listing.game.toLowerCase().includes(searchValue) ||
        listing.category.toLowerCase().includes(searchValue) ||
        (listing.description ?? "").toLowerCase().includes(searchValue);

      const matchesGame =
        selectedGame === "All games" || listing.game === selectedGame;

      const matchesStatus =
        selectedStatus === "All statuses" || listing.status === selectedStatus;

      return matchesSearch && matchesGame && matchesStatus;
    });
  }, [listings, search, selectedGame, selectedStatus]);

  const availableCount = useMemo(
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

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="listing" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Listings</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Marketplace
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Browse listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Discover real listings from Dxblox users across supported games.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total</div>
                <div className="mt-1 text-2xl font-bold">{listings.length}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Available</div>
                <div className="mt-1 text-2xl font-bold">{availableCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">{pendingCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold</div>
                <div className="mt-1 text-2xl font-bold">{soldCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Search
              </label>
              <input
                type="text"
                placeholder="Search item, game or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Game
              </label>
              <select
                value={selectedGame}
                onChange={(e) =>
                  setSelectedGame(e.target.value as (typeof GAME_OPTIONS)[number])
                }
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {GAME_OPTIONS.map((game) => (
                  <option
                    key={game}
                    value={game}
                    className="bg-[#131320] text-white"
                  >
                    {game}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value as (typeof STATUS_OPTIONS)[number]
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status}
                    value={status}
                    className="bg-[#131320] text-white"
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] px-6 py-8 text-sm text-[#9CA3AF]">
              Loading listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] px-6 py-8 text-sm text-[#9CA3AF]">
              No listings found with the current filters.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="rounded-[24px] border border-white/10 bg-[#131320] p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                >
                  <div className="h-44 rounded-[18px] border border-white/8 bg-white/5" />

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{listing.item_name}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        {listing.game} • {listing.category}
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

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#9CA3AF]">Offer type</span>
                    <span className="font-medium">{listing.offer_type}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-2xl font-bold">{listing.price}</div>
                    <div className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]">
                      View listing
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}