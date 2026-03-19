import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const myListings = [
    { item: "Icepiercer", game: "MM2", price: "$18.00", status: "Active" },
    { item: "Leopard Fruit", game: "Blox Fruits", price: "$29.00", status: "Active" },
    { item: "Champion Pack", game: "Blade Ball", price: "$25.00", status: "Pending" },
    { item: "Frost Dragon", game: "Adopt Me", price: "$24.99", status: "Sold" },
  ];

  const statusStyle = (status: string) => {
    if (status === "Active") {
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    }
    if (status === "Pending") {
      return "border-orange-500/30 bg-orange-500/15 text-orange-300";
    }
    return "border-white/10 bg-white/5 text-white/75";
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
              <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-violet-500/30 to-blue-500/20" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                    Seller view
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
                <div className="mt-1 text-2xl font-bold">2</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Pending</div>
                <div className="mt-1 text-2xl font-bold">1</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold</div>
                <div className="mt-1 text-2xl font-bold">1</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Wishlist items</div>
                <div className="mt-1 text-2xl font-bold">6</div>
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
              This dashboard gives a clean summary of your account activity,
              listings and tracked content. Later, this page can become the main
              control center for logged-in users.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Profile status</div>
                <div className="mt-2 text-[#9CA3AF]">Verified and active</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Main game</div>
                <div className="mt-2 text-[#9CA3AF]">MM2</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Last activity</div>
                <div className="mt-2 text-[#9CA3AF]">Updated a listing today</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm font-semibold">Account type</div>
                <div className="mt-2 text-[#9CA3AF]">Premium seller</div>
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

            <div className="grid gap-4 md:grid-cols-2">
              {myListings.map((listing) => (
<Link
  key={`${listing.item}-${listing.game}`}
  href="/listing"
  className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
>
                  <div className="h-36 rounded-[18px] border border-white/8 bg-black/20" />

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{listing.item}</div>
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
      This page will become more useful with real accounts
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Listings here can later be pulled from a database
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Admin tools can be added in a separate protected area
    </li>
  </ul>
</div>
          </aside>
        </section>
      </main>
    </div>
  );
}