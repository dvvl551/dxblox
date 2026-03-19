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
  created_at: string;
};

type SellerProfile = {
  id: string;
  username: string | null;
  role: string;
};

function badgeStyle(badge: string) {
  if (badge === "Verified") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  }
  if (badge === "Premium") {
    return "border-violet-500/30 bg-violet-500/15 text-violet-300";
  }
  return "border-sky-500/30 bg-sky-500/15 text-sky-300";
}

const categories = [
  { name: "Weapons", desc: "Popular blades and high-demand items." },
  { name: "Effects", desc: "Visual effects and clean active listings." },
  { name: "Bundles", desc: "Grouped offers and premium packs." },
  { name: "Looking for", desc: "Wanted posts from active players." },
];

const wantedItems = [
  { name: "Shadow Blade", saves: 133 },
  { name: "Champion Pack", saves: 104 },
  { name: "Golden Katana", saves: 81 },
  { name: "Crimson Trail", saves: 67 },
];

export default function BladeBallPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, SellerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState("");
  const [selectedSort, setSelectedSort] = useState("Most recent");

  useEffect(() => {
    const fetchBladeBallListings = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, created_at"
        )
        .eq("game", "Blade Ball")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setListings([]);
        setLoading(false);
        return;
      }

      const bladeBallListings = data ?? [];
      setListings(bladeBallListings);

      const uniqueUserIds = [...new Set(bladeBallListings.map((item) => item.user_id))];

      if (uniqueUserIds.length > 0) {
        const { data: sellersData } = await supabase
          .from("profiles")
          .select("id, username, role")
          .in("id", uniqueUserIds);

        const nextSellerMap: Record<string, SellerProfile> = {};
        (sellersData ?? []).forEach((seller) => {
          nextSellerMap[seller.id] = seller;
        });

        setSellerMap(nextSellerMap);
      } else {
        setSellerMap({});
      }

      setLoading(false);
    };

    fetchBladeBallListings();
  }, []);

  const featuredListing = listings[0] ?? null;

  const filteredListings = useMemo(() => {
    let next = [...listings];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      next = next.filter(
        (listing) =>
          listing.item_name.toLowerCase().includes(query) ||
          listing.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      next = next.filter((listing) => listing.category === selectedCategory);
    }

    if (selectedOfferType) {
      next = next.filter((listing) => listing.offer_type === selectedOfferType);
    }

    if (selectedSort === "Lowest price") {
      next.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
    } else if (selectedSort === "Highest price") {
      next.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
    } else {
      next.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return next;
  }, [listings, search, selectedCategory, selectedOfferType, selectedSort]);

  const sellerStats = useMemo(() => {
    const counts: Record<string, number> = {};

    listings.forEach((listing) => {
      counts[listing.user_id] = (counts[listing.user_id] ?? 0) + 1;
    });

    return Object.entries(counts)
      .map(([userId, count]) => ({
        userId,
        username: sellerMap[userId]?.username || "Unknown seller",
        role: sellerMap[userId]?.role || "user",
        listings: count,
      }))
      .sort((a, b) => b.listings - a.listings)
      .slice(0, 3);
  }, [listings, sellerMap]);

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,169,252,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,92,255,0.10),transparent_28%)] pointer-events-none" />

      <Navbar active="games" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/games" className="transition hover:text-white">
            Games
          </Link>
          <span>/</span>
          <span className="text-white">Blade Ball</span>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#131320]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 lg:p-10">
              <div className="mb-4 inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                Blade Ball marketplace
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Blade Ball Listings
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">
                Browse competitive listings, wanted items and active offers from Blade Ball players.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Active listings</div>
                  <div className="mt-1 text-lg font-bold">{listings.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Verified sellers</div>
                  <div className="mt-1 text-lg font-bold">
                    {
                      sellerStats.filter(
                        (seller) =>
                          seller.role === "admin" || seller.role === "user"
                      ).length
                    }
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Wanted items</div>
                  <div className="mt-1 text-lg font-bold">{wantedItems.length}</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/create-listing"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  Post Blade Ball listing
                </Link>
                <Link
                  href="/wishlist"
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Browse wishlist
                </Link>
              </div>
            </div>

            <div className="min-h-[280px] border-t border-white/8 bg-[radial-gradient(circle_at_top,rgba(61,169,252,0.22),transparent_40%),linear-gradient(135deg,rgba(61,169,252,0.16),rgba(124,92,255,0.10))] lg:border-l lg:border-t-0">
              <div className="flex h-full items-end p-8">
                <div className="w-full rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                  {featuredListing ? (
                    <>
                      <div className="text-sm text-[#9CA3AF]">Featured Blade Ball listing</div>
                      <div className="mt-2 text-2xl font-bold">
                        {featuredListing.item_name}
                      </div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        {featuredListing.category} • {featuredListing.price}
                      </div>
                      <Link
                        href={`/listing/${featuredListing.id}`}
                        className="mt-5 block w-full rounded-2xl bg-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/15"
                      >
                        View featured listing
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-[#9CA3AF]">Featured Blade Ball listing</div>
                      <div className="mt-2 text-2xl font-bold">No listing yet</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">
                        Create the first Blade Ball listing on Dxblox.
                      </div>
                      <Link
                        href="/create-listing"
                        className="mt-5 block w-full rounded-2xl bg-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/15"
                      >
                        Create listing
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[26px] border border-white/10 bg-[#131320] p-5">
          <div className="grid gap-4 lg:grid-cols-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f] lg:col-span-2"
              placeholder="Search item..."
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#131320] text-white">
                Category
              </option>
              <option value="Weapons" className="bg-[#131320] text-white">
                Weapons
              </option>
              <option value="Effects" className="bg-[#131320] text-white">
                Effects
              </option>
              <option value="Bundles" className="bg-[#131320] text-white">
                Bundles
              </option>
              <option value="Looking for" className="bg-[#131320] text-white">
                Looking for
              </option>
            </select>
            <select
              disabled
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50 outline-none"
            >
              <option>Price range</option>
            </select>
            <select
              value={selectedOfferType}
              onChange={(e) => setSelectedOfferType(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#131320] text-white">
                Offer type
              </option>
              <option value="For sale" className="bg-[#131320] text-white">
                For sale
              </option>
              <option value="Trade" className="bg-[#131320] text-white">
                Trade
              </option>
              <option value="Looking for" className="bg-[#131320] text-white">
                Looking for
              </option>
            </select>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
            >
              <option className="bg-[#131320] text-white">Most recent</option>
              <option className="bg-[#131320] text-white">Lowest price</option>
              <option className="bg-[#131320] text-white">Highest price</option>
            </select>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="mt-2 text-[#9CA3AF]">Explore the most active Blade Ball listing types.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((cat) => {
              const count = listings.filter(
                (listing) => listing.category === cat.name
              ).length;

              return (
                <div
                  key={cat.name}
                  className="rounded-[24px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-sky-500/30"
                >
                  <div className="h-12 w-12 rounded-2xl bg-sky-500/15" />
                  <div className="mt-4 text-xl font-bold">{cat.name}</div>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#9CA3AF]">{cat.desc}</p>
                  <div className="mt-4 text-sm text-sky-300">{count} listings</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Active listings</h2>
              <p className="mt-2 text-[#9CA3AF]">Current Blade Ball offers from Dxblox users.</p>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-[#131320] p-6 text-[#9CA3AF]">
                Loading Blade Ball listings...
              </div>
            ) : errorMessage ? (
              <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                {errorMessage}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#131320] p-6 text-[#9CA3AF]">
                No Blade Ball listings match your filters yet.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredListings.map((listing) => {
                  const seller = sellerMap[listing.user_id];
                  const sellerName = seller?.username || "Unknown seller";
                  const sellerBadge =
                    seller?.role === "admin" ? "Premium" : "Verified";

                  return (
                    <div
                      key={listing.id}
                      className="rounded-[24px] border border-white/10 bg-[#131320] p-4"
                    >
                      <div className="h-44 rounded-[18px] border border-white/8 bg-gradient-to-br from-white/8 to-white/3" />
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-bold">{listing.item_name}</div>
                          <div className="mt-1 text-sm text-[#9CA3AF]">{listing.category}</div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyle(sellerBadge)}`}>
                          {sellerBadge}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-[#9CA3AF]">Seller</span>
                        <span className="font-medium">{sellerName}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-[#9CA3AF]">Offer type</span>
                        <span className="font-medium">{listing.offer_type}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-2xl font-bold">{listing.price}</div>
                        <Link
                          href={`/listing/${listing.id}`}
                          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                        >
                          View listing
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[#131320] p-5">
              <h3 className="text-xl font-bold">Top Blade Ball sellers</h3>
              <div className="mt-4 space-y-3">
                {sellerStats.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-[#9CA3AF]">
                    No Blade Ball sellers yet.
                  </div>
                ) : (
                  sellerStats.map((seller) => (
                    <div
                      key={seller.userId}
                      className="rounded-2xl border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{seller.username}</div>
                          <div className="mt-1 text-sm text-[#9CA3AF]">
                            {seller.listings} active listings
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#9CA3AF]">Role</div>
                          <div className="font-bold">
                            {seller.role === "admin" ? "Admin" : "User"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#131320] p-5">
              <h3 className="text-xl font-bold">Most wanted</h3>
              <div className="mt-4 space-y-3">
                {wantedItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">{item.saves} wishlist saves</div>
                    </div>
                    <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/90 transition hover:bg-white/5">
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-sky-500/20 bg-sky-500/10 p-5">
              <h3 className="text-xl font-bold">Stay sharp on Blade Ball</h3>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Check seller profiles, compare listings and save the items you want most.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function extractPrice(price: string) {
  const numeric = Number(price.replace(/[^\d.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}