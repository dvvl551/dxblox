"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  game: string;
};

type GameCard = {
  name: string;
  slug: string;
  image: string;
  desc: string;
  listings: string;
};

const GAME_CONFIG = [
  {
    name: "Adopt Me",
    slug: "adopt-me",
    image: "/games/adopt-me.jpg",
    desc: "Pets, rare items and popular offers.",
  },
  {
    name: "MM2",
    slug: "mm2",
    image: "/games/mm2.jpg",
    desc: "Knives, guns and high-demand trades.",
  },
  {
    name: "Blox Fruits",
    slug: "blox-fruits",
    image: "/games/blox-fruits.jpg",
    desc: "Items, offers and active player listings.",
  },
  {
    name: "Steal a Brainrot",
    slug: "steal-a-brainrot",
    image: "/games/steal-a-brainrot.jpg",
    desc: "Trending deals and fast-moving listings.",
  },
  {
    name: "Blade Ball",
    slug: "blade-ball",
    image: "/games/blade-ball.jpg",
    desc: "Competitive items and wanted listings.",
  },
  {
    name: "Da Hood",
    slug: "da-hood",
    image: "/games/da-hood.jpg",
    desc: "Weapons, skins and active street-market listings.",
  },
] as const;

function MarketplaceStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-violet-500/20 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.10),rgba(255,255,255,0.03))]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase.from("listings").select("id, game");

      if (error) {
        setErrorMessage("Could not load game stats.");
        setListings([]);
        setLoading(false);
        return;
      }

      setListings((data ?? []) as Listing[]);
      setLoading(false);
    };

    fetchListings();
  }, []);

  const games = useMemo<GameCard[]>(() => {
    const counts: Record<string, number> = {};

    for (const listing of listings) {
      counts[listing.game] = (counts[listing.game] ?? 0) + 1;
    }

    return GAME_CONFIG.map((game) => ({
      ...game,
      listings: `${counts[game.name] ?? 0} listings`,
    }));
  }, [listings]);

  const totalListings = useMemo(() => listings.length, [listings]);

  const activeGames = useMemo(
    () => new Set(listings.map((listing) => listing.game)).size,
    [listings]
  );

  const mostActiveGame = useMemo(() => {
    if (listings.length === 0) return "No activity yet";

    const counts: Record<string, number> = {};
    for (const listing of listings) {
      counts[listing.game] = (counts[listing.game] ?? 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [listings]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="games" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Games</span>
        </div>

        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Dxblox games
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Explore Roblox games
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-[#9CA3AF]">
                Browse supported games on Dxblox and open their listing pages to
                view real offers, categories and wanted items.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                  Supported games
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                  Real marketplace listings
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                  Fast discovery
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/listing"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  Browse listings
                </Link>

                <Link
                  href="/create-listing"
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Post a listing
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MarketplaceStatCard label="Marketplace listings" value={totalListings} />
              <MarketplaceStatCard label="Active games" value={activeGames} />
              <MarketplaceStatCard label="Most active" value={mostActiveGame} />
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              All games
            </h2>
            <p className="mt-2 text-[#9CA3AF]">
              Open a game to browse its active listings and categories.
            </p>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 text-sm text-[#9CA3AF]">
              Loading games...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <Link
                  key={game.name}
                  href={`/games/${game.slug}`}
                  className="group block rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-white/8 bg-[#0f1018]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <img
                      src={game.image}
                      alt={game.name}
                      className="absolute inset-0 h-full w-full object-contain object-center p-1 transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-5">
                    <div className="text-2xl font-bold text-white">
                      {game.name}
                    </div>

                    <p className="mt-3 min-h-[52px] text-sm leading-6 text-[#9CA3AF]">
                      {game.desc}
                    </p>

                    <div className="mt-4 text-sm text-violet-300">
                      {game.listings}
                    </div>

                    <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
                      Open game page
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