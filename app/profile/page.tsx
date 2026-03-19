import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const activeListings = [
    { item: "Icepiercer", game: "MM2", price: "$18.00", badge: "Verified" },
    { item: "Champion Pack", game: "Blade Ball", price: "$25.00", badge: "Premium" },
    { item: "Leopard Fruit", game: "Blox Fruits", price: "$29.00", badge: "Verified" },
    { item: "Frost Dragon", game: "Adopt Me", price: "$24.99", badge: "Premium" },
  ];

  const recentActivity = [
    "Updated listing price for Icepiercer",
    "Posted a new Blade Ball bundle",
    "Added proof to Leopard Fruit listing",
    "Saved a wanted item to wishlist",
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

<Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
  <Link href="/" className="transition hover:text-white">
    Home
  </Link>
  <span>/</span>
  <span className="text-white">Profile</span>
</div>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-violet-500/30 to-blue-500/20" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">ShadowDX</h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Verified seller
                  </span>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                    Premium
                  </span>
                </div>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#9CA3AF]">
                  Active multi-game seller on Dxblox. Focused on clean listings,
                  proof-based posts and fast replies.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Trust score</div>
                <div className="mt-1 text-2xl font-bold">91</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Active listings</div>
                <div className="mt-1 text-2xl font-bold">18</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Joined</div>
                <div className="mt-1 text-2xl font-bold">2025</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Main game</div>
                <div className="mt-1 text-2xl font-bold">MM2</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
<Link
  href="/login"
  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Message seller
</Link>
              <button className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5">
                Save profile
              </button>
              <button className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15">
                Report
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-bold">About this seller</h2>
            <p className="mt-4 leading-7 text-[#9CA3AF]">
              ShadowDX keeps listings updated, adds proof when needed and stays
              active across multiple supported games. This page is meant to help
              buyers review the profile before contacting the seller.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Seller status</div>
                <div className="mt-2 text-[#9CA3AF]">Verified and active</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Response speed</div>
                <div className="mt-2 text-[#9CA3AF]">Usually replies quickly</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Preferred games</div>
                <div className="mt-2 text-[#9CA3AF]">MM2, Blade Ball, Blox Fruits</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Listing quality</div>
                <div className="mt-2 text-[#9CA3AF]">Clean posts and proof-based updates</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
            <h2 className="text-2xl font-bold">Active listings</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {activeListings.map((listing) => (
<Link
  key={listing.item}
  href="/listing"
  className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:border-violet-500/30"
>
                  <div className="h-36 rounded-[18px] border border-white/8 bg-black/20" />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{listing.item}</div>
                      <div className="mt-1 text-sm text-[#9CA3AF]">{listing.game}</div>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyle(
                        listing.badge
                      )}`}
                    >
                      {listing.badge}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xl font-bold">{listing.price}</div>
                    <div className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                      View listing
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h3 className="text-xl font-bold">Recent activity</h3>
              <div className="mt-4 space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity}
                    className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-[#9CA3AF]"
                  >
                    {activity}
                  </div>
                ))}
              </div>
            </div>

<div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-xl font-bold">Profile checks</h3>
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
      Safety tips
    </span>
  </div>

  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Review trust score
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Check active listings
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Compare proof and profile activity
    </li>
  </ul>
</div>
          </aside>
        </section>
      </main>
    </div>
  );
}