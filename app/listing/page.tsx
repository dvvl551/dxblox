import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ListingPage() {
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
  <Link href="/games/mm2" className="transition hover:text-white">
    MM2
  </Link>
  <span>/</span>
  <span className="text-white">Icepiercer</span>
</div>

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
<div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#131320] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
  <div className="relative flex h-[420px] items-end overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.22),transparent_40%),linear-gradient(135deg,rgba(124,92,255,0.12),rgba(61,169,252,0.10))]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_25%)]" />
    <div className="absolute left-5 top-5 rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200 backdrop-blur">
      Featured item
    </div>
    <div className="relative z-10 p-6">
      <div className="text-sm text-[#C7D2FE]">MM2 • Knife</div>
      <div className="mt-2 text-3xl font-black tracking-tight">Icepiercer</div>
      <div className="mt-2 text-sm text-[#9CA3AF]">
        Premium visual preview area for the listing.
      </div>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-4 gap-3">
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-2">
      <div className="h-20 rounded-xl border border-white/8 bg-white/5" />
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/5 p-2 transition hover:border-violet-500/30">
      <div className="h-20 rounded-xl border border-white/8 bg-black/20" />
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/5 p-2 transition hover:border-violet-500/30">
      <div className="h-20 rounded-xl border border-white/8 bg-black/20" />
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/5 p-2 transition hover:border-violet-500/30">
      <div className="h-20 rounded-xl border border-white/8 bg-black/20" />
    </div>
  </div>
</div>

          <div className="space-y-5">
<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
  <div className="mb-4 flex flex-wrap gap-2">
    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
      Verified seller
    </span>
    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
      Premium listing
    </span>
    <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">
      Proof added
    </span>
  </div>

  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-4xl font-black tracking-tight">Icepiercer</h1>
      <p className="mt-2 text-[#9CA3AF]">MM2 • Knife</p>
    </div>

    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-right">
      <div className="text-xs text-emerald-300/80">Price</div>
      <div className="text-2xl font-black text-emerald-300">$18.00</div>
    </div>
  </div>

  <div className="mt-6 grid grid-cols-2 gap-4">
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">Status</div>
      <div className="mt-2 text-xl font-bold text-white">Available</div>
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">Offer type</div>
      <div className="mt-2 text-xl font-bold text-white">For sale</div>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-2 gap-4">
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">Trust score</div>
      <div className="mt-2 text-xl font-bold text-white">91</div>
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">Category</div>
      <div className="mt-2 text-xl font-bold text-white">Knife</div>
    </div>
  </div>

  <div className="mt-6 flex flex-wrap gap-3">
    <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]">
      Contact seller
    </button>
    <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/10">
      Add to wishlist
    </button>
    <button className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/15">
      Report
    </button>
  </div>
</div>

<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-2xl font-bold">Seller</h2>
    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
      Trusted profile
    </span>
  </div>

  <div className="mt-5 rounded-[26px] border border-white/8 bg-white/5 p-4">
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-lg font-black text-white">
        SD
      </div>

      <div className="min-w-0">
        <div className="text-lg font-bold">ShadowDX</div>
        <div className="mt-1 text-sm text-[#9CA3AF]">
          MM2 seller • 18 active listings
        </div>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-white/8 bg-[#0F111A] p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">
          Trust
        </div>
        <div className="mt-2 text-lg font-bold">91</div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#0F111A] p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">
          Joined
        </div>
        <div className="mt-2 text-lg font-bold">2025</div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-[#0F111A] p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-[#9CA3AF]">
          Listings
        </div>
        <div className="mt-2 text-lg font-bold">18</div>
      </div>
    </div>
  </div>

<Link
  href="/profile"
  className="mt-5 block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-semibold text-white transition hover:border-violet-500/30 hover:bg-white/10"
>
  View seller profile
</Link>
</div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h2 className="text-2xl font-bold">Description</h2>
              <p className="mt-4 leading-7 text-[#9CA3AF]">
                Clean MM2 listing for Icepiercer. Looking for a fair direct sale.
                Seller profile is active and this listing includes proof. Contact
                for more details or to discuss availability.
              </p>
            </div>

<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-2xl font-bold">Proof</h2>
    <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300">
      Included
    </span>
  </div>

  <div className="mt-4 rounded-[24px] border border-white/8 bg-white/5 p-3">
    <div className="flex h-56 items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-[linear-gradient(135deg,rgba(124,92,255,0.10),rgba(61,169,252,0.08))] text-sm text-[#9CA3AF]">
      Proof screenshot / item image area
    </div>
  </div>

  <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">
    Proof helps make listings cleaner and easier to trust. Always review
    the seller profile, verify the item carefully, and report anything
    suspicious.
  </p>
</div>

<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-2xl font-bold">Similar listings</h2>
    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
      MM2 picks
    </span>
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2">
    {[
      ["Harvester", "$36.00"],
      ["Corrupt", "$34.00"],
      ["Candleflame", "$16.50"],
      ["Elderwood Revolver", "$14.00"],
    ].map(([name, price]) => (
      <Link
        key={name}
        href="/listing"
        className="group rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/10"
      >
        <div className="relative overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(135deg,rgba(124,92,255,0.10),rgba(61,169,252,0.08))]">
          <div className="h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />
          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
            MM2
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-white">{name}</div>
            <div className="mt-1 text-sm text-[#9CA3AF]">
              Premium marketplace listing
            </div>
          </div>
          <div className="text-lg font-bold text-white">{price}</div>
        </div>
      </Link>
    ))}
  </div>
</div>
          </div>

          <aside className="space-y-5">
<div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
  <h3 className="text-xl font-bold">Listing details</h3>

  <div className="mt-4 space-y-3 text-sm">
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Posted</span>
      <span className="font-medium text-white">2 days ago</span>
    </div>
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Game</span>
      <span className="font-medium text-white">MM2</span>
    </div>
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Category</span>
      <span className="font-medium text-white">Knife</span>
    </div>
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Views</span>
      <span className="font-medium text-white">246</span>
    </div>
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Wishlist saves</span>
      <span className="font-medium text-white">31</span>
    </div>
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-[#9CA3AF]">Listing ID</span>
      <span className="font-medium text-white">#DXB-1024</span>
    </div>
  </div>
</div>

<div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-xl font-bold">Trade more safely</h3>
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
      Safety tips
    </span>
  </div>

  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Check the seller profile
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Review proof carefully
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Report suspicious listings
    </li>
  </ul>
</div>
          </aside>
        </section>
      </main>
    </div>
  );
}