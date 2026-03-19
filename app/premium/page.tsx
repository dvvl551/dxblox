import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PremiumPage() {
  const perks = [
    {
      title: "More active listings",
      desc: "Publish more listings at the same time and manage a bigger seller profile.",
    },
    {
      title: "Priority visibility",
      desc: "Get better placement on selected sections and stand out more clearly.",
    },
    {
      title: "Premium badge",
      desc: "Show a stronger profile with a premium badge on your listings and seller page.",
    },
    {
      title: "Future advanced tools",
      desc: "Get access to later features like deeper stats, better alerts and seller tools.",
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "Free",
      desc: "A simple starting point for browsing and testing Dxblox.",
      features: [
        "Limited active listings",
        "Basic wishlist",
        "Standard profile",
        "Access to core pages",
      ],
      highlight: false,
    },
    {
      name: "Premium",
      price: "€4.99/month",
      desc: "The best option for active users who want more visibility and tools.",
      features: [
        "More active listings",
        "Premium badge",
        "Better profile visibility",
        "Future premium tools",
      ],
      highlight: true,
    },
    {
      name: "Pro Seller",
      price: "€9.99/month",
      desc: "Built for serious sellers who want more reach and stronger account tools.",
      features: [
        "Highest listing capacity",
        "Priority placement",
        "Advanced visibility",
        "Seller-focused upgrades later",
      ],
      highlight: false,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

<Navbar active="premium" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
  <Link href="/" className="transition hover:text-white">
    Home
  </Link>
  <span>/</span>
  <span className="text-white">Premium</span>
</div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
              Dxblox Premium
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Unlock more on Dxblox
            </h1>
            <p className="mt-4 text-base leading-7 text-[#9CA3AF]">
              Premium is made for users who want stronger visibility, more active
              listings and a better seller profile as Dxblox grows.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Why go premium?</h2>
            <p className="mt-2 text-[#9CA3AF]">
              A cleaner profile, more listings and stronger visibility across the platform.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-[24px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-violet-500/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-violet-500/15" />
                <div className="mt-4 text-xl font-bold">{perk.title}</div>
                <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Plans</h2>
            <p className="mt-2 text-[#9CA3AF]">
              Start simple, then upgrade when you need more tools and visibility.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
className={`rounded-[28px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] ${
  plan.highlight
    ? "border-violet-500/30 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.08))]"
    : "border-white/10 bg-[#131320]"
}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold">{plan.name}</div>
                    <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                      {plan.desc}
                    </p>
                  </div>
                  {plan.highlight && (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                      Best value
                    </span>
                  )}
                </div>

                <div className="mt-6 text-4xl font-black tracking-tight">
                  {plan.price}
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85"
                    >
                      {feature}
                    </div>
                  ))}
                </div>

<Link
  href="/signup"
  className={`mt-6 block rounded-2xl px-6 py-3 text-center font-semibold transition ${
    plan.highlight
      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02]"
      : "border border-white/10 text-white/90 hover:bg-white/5"
  }`}
>
  Choose plan
</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[30px] border border-white/10 bg-[#131320] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Ready to upgrade?
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#9CA3AF]">
                Create your account, start with the platform and move to premium
                when you want stronger tools and visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
<Link
  href="/signup"
  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
>
  Create account
</Link>
<Link
  href="/games"
  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
>
  Browse games
</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}