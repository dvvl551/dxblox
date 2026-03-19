import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AdoptMePage() {
  const categories = [
    { name: "Pets", desc: "Popular pets and rare active listings.", count: 326 },
    { name: "Eggs", desc: "Egg listings and wanted posts.", count: 98 },
    { name: "Vehicles", desc: "Vehicles and premium bundles.", count: 64 },
    { name: "Looking for", desc: "Wanted posts from buyers and traders.", count: 72 },
  ];

  const listings = [
    {
      item: "Frost Dragon",
      category: "Pets",
      price: "$24.99",
      seller: "DxTrader",
      trust: 92,
      badge: "Verified",
    },
    {
      item: "Shadow Dragon",
      category: "Pets",
      price: "$39.00",
      seller: "NovaTrade",
      trust: 95,
      badge: "Premium",
    },
    {
      item: "Safari Egg",
      category: "Eggs",
      price: "$15.50",
      seller: "NightSeller",
      trust: 88,
      badge: "Verified",
    },
    {
      item: "Neon Unicorn",
      category: "Pets",
      price: "$18.00",
      seller: "VantaSell",
      trust: 90,
      badge: "Premium",
    },
    {
      item: "Bat Dragon",
      category: "Pets",
      price: "$31.00",
      seller: "ShadowDX",
      trust: 91,
      badge: "Verified",
    },
    {
      item: "Luxury Car Pack",
      category: "Vehicles",
      price: "$12.00",
      seller: "QuickList",
      trust: 83,
      badge: "Proof",
    },
  ];

  const wantedItems = [
    { name: "Shadow Dragon", saves: 171 },
    { name: "Bat Dragon", saves: 148 },
    { name: "Frost Dragon", saves: 133 },
    { name: "Safari Egg", saves: 85 },
  ];

  const sellers = [
    { name: "DxTrader", trust: 92, listings: 21 },
    { name: "NovaTrade", trust: 95, listings: 16 },
    { name: "ShadowDX", trust: 91, listings: 12 },
  ];

  const badgeStyle = (badge: string) => {
    if (badge === "Verified") {
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    }
    if (badge === "Premium") {
      return "border-violet-500/30 bg-violet-500/15 text-violet-300";
    }
    return "border-sky-500/30 bg-sky-500/15 text-sky-300";
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.10),transparent_28%)] pointer-events-none" />

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
  <span className="text-white">Adopt Me</span>
</div>

        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#131320]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 lg:p-10">
              <div className="mb-4 inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-sm text-pink-300">
                Adopt Me marketplace
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Adopt Me Listings
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">
                Browse pets, eggs and popular Adopt Me listings from active Dxblox users.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Active listings</div>
                  <div className="mt-1 text-lg font-bold">612</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Verified sellers</div>
                  <div className="mt-1 text-lg font-bold">104</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-[#9CA3AF]">Wanted items</div>
                  <div className="mt-1 text-lg font-bold">159</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
<Link
  href="/create-listing"
  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Post Adopt Me listing
</Link>
<Link
  href="/wishlist"
  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
>
  Browse wishlist
</Link>
              </div>
            </div>

            <div className="min-h-[280px] border-t border-white/8 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_40%),linear-gradient(135deg,rgba(236,72,153,0.16),rgba(168,85,247,0.10))] lg:border-l lg:border-t-0">              <div className="flex h-full items-end p-8">
                <div className="w-full rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                  <div className="text-sm text-[#9CA3AF]">Featured listing</div>
                  <div className="mt-2 text-2xl font-bold">Shadow Dragon</div>
                  <div className="mt-1 text-sm text-[#9CA3AF]">Pet • Trust score 95</div>
<Link
  href="/listing"
  className="mt-5 block w-full rounded-2xl bg-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/15"
>
  View featured listing
</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[26px] border border-white/10 bg-[#131320] p-5">
          <div className="grid gap-4 lg:grid-cols-6">
            <input
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f] lg:col-span-2"
              placeholder="Search item..."
            />
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              <option>Category</option>
              <option>Pets</option>
              <option>Eggs</option>
              <option>Vehicles</option>
              <option>Looking for</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              <option>Price range</option>
              <option>Under $10</option>
              <option>$10 - $20</option>
              <option>$20 - $40</option>
              <option>$40+</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              <option>Offer type</option>
              <option>For sale</option>
              <option>Trade</option>
              <option>Looking for</option>
            </select>
            <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              <option>Sort by</option>
              <option>Most recent</option>
              <option>Lowest price</option>
              <option>Highest price</option>
              <option>Most viewed</option>
            </select>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="mt-2 text-[#9CA3AF]">Explore the most active Adopt Me listing types.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="rounded-[24px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-pink-500/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-pink-500/15" />
                <div className="mt-4 text-xl font-bold">{cat.name}</div>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#9CA3AF]">{cat.desc}</p>
                <div className="mt-4 text-sm text-pink-300">{cat.count} listings</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Active listings</h2>
              <p className="mt-2 text-[#9CA3AF]">Current Adopt Me offers from Dxblox users.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {listings.map((listing) => (
                <div
                  key={`${listing.item}-${listing.seller}`}
                  className="rounded-[24px] border border-white/10 bg-[#131320] p-4"
                >
                  <div className="h-44 rounded-[18px] border border-white/8 bg-gradient-to-br from-white/8 to-white/3" />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{listing.item}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">{listing.category}</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyle(listing.badge)}`}>
                      {listing.badge}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#9CA3AF]">Seller</span>
                    <span className="font-medium">{listing.seller}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#9CA3AF]">Trust score</span>
                    <span className="font-medium">{listing.trust}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-2xl font-bold">{listing.price}</div>
<Link
  href="/listing"
  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
>
  View listing
</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[#131320] p-5">
              <h3 className="text-xl font-bold">Top sellers</h3>
              <div className="mt-4 space-y-3">
                {sellers.map((seller) => (
                  <div
                    key={seller.name}
                    className="rounded-2xl border border-white/8 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{seller.name}</div>
                        <div className="mt-1 text-sm text-[#9CA3AF]">{seller.listings} active listings</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#9CA3AF]">Trust</div>
                        <div className="font-bold">{seller.trust}</div>
                      </div>
                    </div>
                  </div>
                ))}
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

            <div className="rounded-[24px] border border-pink-500/20 bg-pink-500/10 p-5">
              <h3 className="text-xl font-bold">Keep trades cleaner</h3>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Review the seller, compare listings and save the pets you want most.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}