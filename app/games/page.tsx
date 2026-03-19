import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function GamesPage() {
  const games = [
    {
      name: "Adopt Me",
      slug: "adopt-me",
      image: "/games/adopt-me.jpg",
      desc: "Pets, rare items and popular offers.",
      listings: "1,284 listings",
      accent: "text-pink-300",
      border: "hover:border-pink-500/30",
    },
    {
      name: "MM2",
      slug: "mm2",
      image: "/games/mm2.jpg",
      desc: "Knives, guns and high-demand trades.",
      listings: "932 listings",
      accent: "text-violet-300",
      border: "hover:border-violet-500/30",
    },
    {
      name: "Blox Fruits",
      slug: "blox-fruits",
      image: "/games/blox-fruits.jpg",
      desc: "Items, offers and active player listings.",
      listings: "776 listings",
      accent: "text-cyan-300",
      border: "hover:border-cyan-500/30",
    },
    {
      name: "Steal a Brainrot",
      slug: "steal-a-brainrot",
      image: "/games/steal-a-brainrot.jpg",
      desc: "Trending deals and fast-moving listings.",
      listings: "418 listings",
      accent: "text-orange-300",
      border: "hover:border-orange-500/30",
    },
    {
      name: "Blade Ball",
      slug: "blade-ball",
      image: "/games/blade-ball.jpg",
      desc: "Competitive items and wanted listings.",
      listings: "695 listings",
      accent: "text-sky-300",
      border: "hover:border-sky-500/30",
    },
    {
      name: "Da Hood",
      slug: "da-hood",
      image: "/games/da-hood.jpg",
      desc: "Weapons, skins and active street-market listings.",
      listings: "351 listings",
      accent: "text-emerald-300",
      border: "hover:border-emerald-500/30",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

 <Navbar active="games" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
  <Link href="/" className="transition hover:text-white">
    Home
  </Link>
  <span>/</span>
  <span className="text-white">Games</span>
</div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-8 lg:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Dxblox games
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Explore Roblox games
            </h1>
            <p className="mt-4 text-base leading-7 text-[#9CA3AF]">
              Browse supported games on Dxblox and open their listing pages to
              view offers, categories and wanted items.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">All games</h2>
            <p className="mt-2 text-[#9CA3AF]">
              Open a game to browse its active listings and categories.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
<Link
  key={game.name}
  href={`/games/${game.slug}`}
  className={`group block rounded-[26px] border border-white/10 bg-[#10111a] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${game.border}`}
>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-white/8 bg-[#0f1018]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <img
                    src={game.image}
                    alt={game.name}
                    className="absolute inset-0 h-full w-full object-contain object-center p-1 transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-5">
                  <div className="text-2xl font-bold">{game.name}</div>
                  <p className="mt-3 min-h-[52px] text-sm leading-6 text-[#9CA3AF]">
                    {game.desc}
                  </p>
                  <div className={`mt-4 text-sm ${game.accent}`}>
                    {game.listings}
                  </div>
                  <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
                    Open game page
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}