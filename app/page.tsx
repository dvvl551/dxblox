import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DxbloxHomepage() {
const games = [
  {
    name: "Adopt Me",
    slug: "adopt-me",
    image: "/games/adopt-me.jpg",
    desc: "Pets, rare items and popular offers.",
    listings: "1,284 listings",
    gradient: "from-pink-500/20 to-fuchsia-500/10",
  },
  {
    name: "MM2",
    slug: "mm2",
    image: "/games/mm2.jpg",
    desc: "Knives, guns and high-demand trades.",
    listings: "932 listings",
    gradient: "from-violet-500/20 to-indigo-500/10",
  },
  {
    name: "Blox Fruits",
    slug: "blox-fruits",
    image: "/games/blox-fruits.jpg",
    desc: "Items, offers and active player listings.",
    listings: "776 listings",
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    name: "Steal a Brainrot",
    slug: "steal-a-brainrot",
    image: "/games/steal-a-brainrot.jpg",
    desc: "Trending deals and fast-moving listings.",
    listings: "418 listings",
    gradient: "from-orange-500/20 to-red-500/10",
  },
  {
    name: "Blade Ball",
    slug: "blade-ball",
    image: "/games/blade-ball.jpg",
    desc: "Competitive items and wanted listings.",
    listings: "695 listings",
    gradient: "from-sky-500/20 to-blue-500/10",
  },
  {
    name: "Da Hood",
    slug: "da-hood",
    image: "/games/da-hood.jpg",
    desc: "Weapons, skins and active street-market listings.",
    listings: "351 listings",
    gradient: "from-emerald-500/20 to-lime-500/10",
  },
];

  const listings = [
    {
      item: "Frost Dragon",
      game: "Adopt Me",
      price: "$24.99",
      seller: "DxTrader",
      trust: 92,
      badge: "Verified",
    },
    {
      item: "Icepiercer",
      game: "MM2",
      price: "$18.00",
      seller: "ShadowDX",
      trust: 91,
      badge: "Premium",
    },
    {
      item: "Leopard Bundle",
      game: "Blox Fruits",
      price: "$29.00",
      seller: "NovaTrade",
      trust: 88,
      badge: "Verified",
    },
    {
      item: "Limited Pack",
      game: "Steal a Brainrot",
      price: "$12.50",
      seller: "QuickList",
      trust: 83,
      badge: "Proof",
    },
    {
      item: "Blade Aura Set",
      game: "Blade Ball",
      price: "$16.90",
      seller: "VantaSell",
      trust: 90,
      badge: "Verified",
    },
    {
      item: "Corrupt",
      game: "MM2",
      price: "$34.00",
      seller: "NightSeller",
      trust: 95,
      badge: "Premium",
    },
  ];

  const sellers = [
    { name: "DxTrader", trust: 94, listings: 18, game: "MM2", badge: "Verified" },
    { name: "NovaTrade", trust: 91, listings: 13, game: "Blox Fruits", badge: "Premium" },
    { name: "VantaSell", trust: 89, listings: 11, game: "Blade Ball", badge: "Verified" },
  ];

  const Badge = ({ label }: { label: string }) => {
    const styles: Record<string, string> = {
      Verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      Premium: "bg-violet-500/15 text-violet-300 border-violet-500/30",
      Proof: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    };

    return (
      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[label] || "bg-white/10 text-white/80 border-white/10"}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.12),transparent_28%)] pointer-events-none" />

<Navbar active="home" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <section className="grid items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Independent platform • Not affiliated with Roblox
            </div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">
              Dxblox
            </h1>
            <p className="mt-4 max-w-2xl text-xl font-semibold text-white/90">
              Trade smarter. Stay safer.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">
              Discover listings for popular Roblox games, find trusted sellers and keep your wishlist organized in one clean place.
            </p>

            <div className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/20">
              <input
                className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#73798f]"
                placeholder="Search a game, item or seller..."
              />
<button className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]">
  Search
</button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">Verified sellers</span>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300">Proof-based listings</span>
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-300">Fast discovery</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
<Link
  href="/games"
  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Explore games
</Link>
<Link
  href="/create-listing"
  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
>
  Post a listing
</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#131320] p-5 shadow-2xl shadow-violet-950/20">
            <div className="rounded-[22px] bg-gradient-to-br from-violet-500/20 to-blue-500/10 p-5">
              <div className="h-56 rounded-2xl border border-white/10 bg-black/20" />
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-[#9CA3AF]">Featured listing</div>
                <div className="mt-1 text-2xl font-bold">Icepiercer</div>
                <div className="mt-1 text-sm text-[#9CA3AF]">MM2 • Knife</div>
              </div>
              <Badge label="Verified" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Price</div>
                <div className="mt-1 font-semibold">$18.00</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Seller</div>
                <div className="mt-1 font-semibold">ShadowDX</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="text-xs text-[#9CA3AF]">Trust</div>
                <div className="mt-1 font-semibold">91</div>
              </div>
            </div>
<Link
  href="/listing"
  className="mt-5 block w-full rounded-2xl bg-white/6 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
>
  View listing
</Link>
          </div>
        </section>

        <section id="games" className="py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular games</h2>
              <p className="mt-2 text-[#9CA3AF]">Browse listings from the most active Roblox communities on Dxblox.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
{games.map((game) => (
<Link
  key={game.name}
  href={`/games/${game.slug}`}
  className="group block rounded-[26px] border border-white/10 bg-[#10111a] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
>
<div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1018]">
  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
  <img
    src={game.image}
    alt={game.name}
    className="absolute inset-0 h-full w-full object-contain object-center p-1 transition duration-300 group-hover:scale-105"
  />
</div>
    <div className="mt-4">
      <div className="text-lg font-bold">{game.name}</div>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#9CA3AF]">{game.desc}</p>
      <div className="mt-3 text-xs text-violet-300">{game.listings}</div>
<div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
  View listings
</div>
    </div>
  </Link>
))}
          </div>
        </section>

        <section id="listings" className="py-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Featured listings</h2>
            <p className="mt-2 text-[#9CA3AF]">Highlighted offers from active and trusted users.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <div key={`${listing.item}-${listing.seller}`} className="rounded-[24px] border border-white/10 bg-[#131320] p-4">
                <div className="h-44 rounded-[18px] border border-white/8 bg-white/5" />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold">{listing.item}</div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">{listing.game}</div>
                  </div>
                  <Badge label={listing.badge} />
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
        </section>

        <section className="py-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Why Dxblox</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Verified profiles",
                text: "Build trust with stronger seller identities and cleaner profiles.",
              },
              {
                title: "Proof-based listings",
                text: "Encourage clearer posts with proof and reduce fake or low-quality listings.",
              },
              {
                title: "Smarter discovery",
                text: "Search faster, filter better and keep track of wanted items in one place.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-[#131320] p-6">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-violet-500/15" />
                <div className="text-xl font-bold">{item.title}</div>
                <p className="mt-3 leading-7 text-[#9CA3AF]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Top sellers</h2>
              <p className="mt-2 text-[#9CA3AF]">Profiles with active listings, stronger trust and better visibility.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {sellers.map((seller) => (
              <div key={seller.name} className="rounded-[24px] border border-white/10 bg-[#131320] p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20" />
                  <div>
                    <div className="text-lg font-bold">{seller.name}</div>
                    <div className="mt-1"><Badge label={seller.badge} /></div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <div className="text-[#9CA3AF]">Trust</div>
                    <div className="mt-1 font-semibold">{seller.trust}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <div className="text-[#9CA3AF]">Listings</div>
                    <div className="mt-1 font-semibold">{seller.listings}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <div className="text-[#9CA3AF]">Main game</div>
                    <div className="mt-1 font-semibold">{seller.game}</div>
                  </div>
                </div>
<Link
  href="/profile"
  className="mt-5 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/5"
>
  View profile
</Link>
              </div>
            ))}
          </div>
        </section>

        <section id="wishlist" className="py-10">
          <div className="grid gap-6 rounded-[30px] border border-white/10 bg-[#131320] p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300">Wishlist</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Track what you want</h2>
              <p className="mt-4 max-w-xl leading-7 text-[#9CA3AF]">
                Build your wishlist and keep your search clean across your favorite Roblox games.
              </p>
<Link
  href="/wishlist"
  className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Open wishlist
</Link>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
              {[
                ["Harvester", "MM2", "High priority"],
                ["Frost Dragon", "Adopt Me", "Wanted"],
                ["Blade Aura", "Blade Ball", "Medium priority"],
              ].map(([name, game, status]) => (
                <div key={name} className="mb-3 flex items-center justify-between rounded-2xl border border-white/8 bg-[#0f1018] px-4 py-3 last:mb-0">
                  <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-[#9CA3AF]">{game}</div>
                  </div>
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0B0B12]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <div className="text-xl font-bold">Dxblox</div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#9CA3AF]">
              A cleaner way to discover listings, trusted sellers and wishlist tracking for popular Roblox games.
            </p>
          </div>
          <div>
            <div className="font-semibold">Platform</div>
            <div className="mt-3 space-y-2 text-sm text-[#9CA3AF]">
              <div>Home</div>
              <div>Games</div>
              <div>Listings</div>
              <div>Wishlist</div>
            </div>
          </div>
          <div>
            <div className="font-semibold">Support</div>
            <div className="mt-3 space-y-2 text-sm text-[#9CA3AF]">
              <div>Help</div>
              <div>Contact</div>
              <div>Report</div>
              <div>Premium</div>
            </div>
          </div>
          <div>
            <div className="font-semibold">Legal</div>
            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              Dxblox is an independent platform and is not affiliated with Roblox.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
