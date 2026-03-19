import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function WishlistPage() {
  const wishlistItems = [
    {
      item: "Harvester",
      game: "MM2",
      price: "$36.00",
      priority: "High priority",
      badge: "Verified",
    },
    {
      item: "Leopard Fruit",
      game: "Blox Fruits",
      price: "$29.00",
      priority: "Wanted",
      badge: "Premium",
    },
    {
      item: "Shadow Dragon",
      game: "Adopt Me",
      price: "$39.00",
      priority: "High priority",
      badge: "Verified",
    },
    {
      item: "Blade Aura Set",
      game: "Blade Ball",
      price: "$16.90",
      priority: "Medium priority",
      badge: "Premium",
    },
    {
      item: "Collector Bundle",
      game: "Steal a Brainrot",
      price: "$17.80",
      priority: "Wanted",
      badge: "Verified",
    },
    {
      item: "Combat Pack",
      game: "Da Hood",
      price: "$24.00",
      priority: "Medium priority",
      badge: "Proof",
    },
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

  const priorityStyle = (priority: string) => {
    if (priority === "High priority") {
      return "border-red-500/20 bg-red-500/10 text-red-300";
    }
    if (priority === "Wanted") {
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";
    }
    return "border-white/10 bg-white/5 text-white/75";
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

<Navbar active="wishlist" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
  <Link href="/" className="transition hover:text-white">
    Home
  </Link>
  <span>/</span>
  <span className="text-white">Wishlist</span>
</div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Saved items
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Your wishlist
            </h1>
            <p className="mt-4 text-base leading-7 text-[#9CA3AF]">
              Save items you want to track and keep your search organized across
              all supported Dxblox games.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Saved items</h2>
                <p className="mt-2 text-[#9CA3AF]">
                  Quick access to items you want most.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {wishlistItems.map((item) => (
                <div
                  key={`${item.item}-${item.game}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                >
                  <div className="h-36 rounded-[18px] border border-white/8 bg-black/20" />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyle(
                        item.badge
                      )}`}
                    >
                      {item.badge}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityStyle(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-xl font-bold">{item.item}</div>
                    <div className="mt-1 text-sm text-[#9CA3AF]">{item.game}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-2xl font-bold">{item.price}</div>
<Link
  href="/listing"
  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
>
  View listing
</Link>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                      Remove
                    </button>
                    <button className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                      Move up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h3 className="text-xl font-bold">Wishlist stats</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">Saved items</div>
                  <div className="mt-1 text-2xl font-bold">6</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">High priority</div>
                  <div className="mt-1 text-2xl font-bold">2</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-[#9CA3AF]">Tracked games</div>
                  <div className="mt-1 text-2xl font-bold">6</div>
                </div>
              </div>
            </div>

<div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-xl font-bold">Why use wishlist?</h3>
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
      Benefits
    </span>
  </div>

  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Keep track of wanted items
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Revisit listings faster
    </li>
    <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      Stay organized across multiple games
    </li>
  </ul>
</div>
          </aside>
        </section>
      </main>
    </div>
  );
}