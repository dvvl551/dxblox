"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

type Perk = {
  title: string;
  desc: string;
  accent: string;
};

type Plan = {
  name: string;
  price: string;
  desc: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  label?: string;
};

function GlowIcon({ accent }: { accent: string }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[0_10px_30px_rgba(0,0,0,0.16)] ${accent}`}
    >
      <div className="h-5 w-5 rounded-full bg-white/85 shadow-[0_0_22px_rgba(255,255,255,0.35)]" />
    </div>
  );
}

export default function PremiumPage() {
  const { user, loading } = useAuth();

  const perks: Perk[] = [
    {
      title: "More active listings",
      desc: "Post more listings at the same time and build a stronger presence across Dxblox.",
      accent: "border-violet-500/25 bg-violet-500/10",
    },
    {
      title: "Priority visibility",
      desc: "Stand out more clearly in key marketplace areas with stronger placement and cleaner presence.",
      accent: "border-sky-500/25 bg-sky-500/10",
    },
    {
      title: "Premium badge",
      desc: "Show a more trusted seller identity across listings, profiles and your overall marketplace presence.",
      accent: "border-emerald-500/25 bg-emerald-500/10",
    },
    {
      title: "Advanced tools later",
      desc: "Be first in line for future seller upgrades, analytics, alerts and stronger account tools.",
      accent: "border-fuchsia-500/25 bg-fuchsia-500/10",
    },
  ];

  const plans: Plan[] = [
    {
      name: "Basic",
      price: "Free",
      desc: "A clean starting point for browsing, messaging and getting used to the marketplace.",
      features: [
        "Limited active listings",
        "Basic wishlist access",
        "Standard seller profile",
        "Core marketplace access",
      ],
      cta: user ? "Stay on Basic" : "Start free",
      label: "Current entry point",
    },
    {
      name: "Premium",
      price: "€4.99/month",
      desc: "Best for active users who want stronger visibility, better branding and more room to grow.",
      features: [
        "More active listings",
        "Premium badge",
        "Better profile presence",
        "Access to future premium tools",
      ],
      highlight: true,
      cta: user ? "Upgrade to Premium" : "Choose Premium",
      label: "Most popular",
    },
    {
      name: "Pro Seller",
      price: "€9.99/month",
      desc: "Built for serious sellers who want more reach, stronger visibility and seller-first upgrades.",
      features: [
        "Highest listing capacity",
        "Priority marketplace placement",
        "Advanced seller visibility",
        "Future seller-focused upgrades",
      ],
      cta: user ? "Go Pro Seller" : "Choose Pro Seller",
      label: "For serious sellers",
    },
  ];

  const trustPoints = [
    "Clear premium identity across your account",
    "Built for active marketplace users",
    "Designed to grow with the Dxblox platform",
  ];

  const primaryHeroHref = user ? "/dashboard" : "/signup";
  const primaryHeroLabel = user ? "Go to dashboard" : "Get Premium";

  const secondaryHeroHref = user ? "/profile" : "/listing";
  const secondaryHeroLabel = user ? "View your profile" : "Explore marketplace";

  const finalPrimaryHref = user ? "/dashboard" : "/signup";
  const finalPrimaryLabel = user ? "Open dashboard" : "Create account";

  const finalSecondaryHref = user ? "/profile" : "/games";
  const finalSecondaryLabel = user ? "Go to profile" : "Browse games";

  const planCtaHref = (planName: string) => {
    if (!user) return "/signup";
    if (planName === "Basic") return "/dashboard";
    return "/dashboard";
  };

  const heroDescription = loading
    ? "Premium is built for users who want a stronger seller presence, more active listings, better placement and a cleaner marketplace identity as Dxblox grows."
    : user
      ? "You already have access to Dxblox. Premium is the next step if you want more listing capacity, stronger profile visibility and a cleaner seller presence."
      : "Premium is built for users who want a stronger seller presence, more active listings, better placement and a cleaner marketplace identity as Dxblox grows.";

  const finalDescription = loading
    ? "Start with Dxblox, build your profile and move to Premium when you want stronger visibility, more listings and a better seller identity."
    : user
      ? "You already have your Dxblox account. The next step is improving visibility, listing capacity and overall seller presence with premium tools."
      : "Start with Dxblox, build your profile and move to Premium when you want stronger visibility, more listings and a better seller identity.";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(91,33,182,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />

      <Navbar active="premium" />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Premium</span>
        </div>

        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-10">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Dxblox Premium
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Unlock more reach,
                <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
                  {" "}
                  trust and visibility
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#9CA3AF]">
                {heroDescription}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={primaryHeroHref}
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  {primaryHeroLabel}
                </Link>

                <Link
                  href={secondaryHeroHref}
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  {secondaryHeroLabel}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-violet-300/80">
                    Visibility
                  </div>
                  <div className="mt-2 text-sm leading-7 text-white/80">
                    Better presence across your profile and listings.
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-sky-300/80">
                    Capacity
                  </div>
                  <div className="mt-2 text-sm leading-7 text-white/80">
                    More room to keep your marketplace activity moving.
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">
                    Growth
                  </div>
                  <div className="mt-2 text-sm leading-7 text-white/80">
                    Future-ready tools as the Dxblox platform expands.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.08))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.20)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-violet-200">
                    Most popular
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Premium
                  </h2>
                </div>

                <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200">
                  Best value
                </span>
              </div>

              <div className="mt-6 text-4xl font-black tracking-tight text-white">
                €4.99
                <span className="ml-1 text-base font-medium text-white/65">
                  /month
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#C8D0E5]">
                Ideal for active users who want more room to sell, a stronger
                profile and better visibility across Dxblox.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "More active listings",
                  "Premium badge on profile",
                  "Better platform visibility",
                  "Access to future premium tools",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90"
                  >
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href={user ? "/dashboard" : "/signup"}
                className="mt-6 block rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                {user ? "Continue to upgrade" : "Upgrade now"}
              </Link>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs leading-6 text-white/60">
                Billing and premium activation flow can plug into your checkout
                logic later without changing this page structure.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Why go premium?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
              Built to make your account feel stronger, cleaner and more visible
              on the marketplace.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-violet-500/30"
              >
                <GlowIcon accent={perk.accent} />

                <div className="mt-4 text-xl font-bold text-white">
                  {perk.title}
                </div>

                <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Built for stronger seller presence
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                Premium keeps the same Dxblox experience while adding more room,
                more polish and more visibility.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
              Premium direction
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-medium text-violet-300">
                Stronger profile identity
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Premium helps your account stand out with a cleaner seller image
                and stronger trust signals across your public presence.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-medium text-sky-300">
                Better room to grow
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Keep more listings active at once and build a more complete
                marketplace profile over time.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-medium text-emerald-300">
                Future-ready upgrades
              </div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Premium is also your path to future visibility tools, seller
                insights and stronger account features.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Plans
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
              Start simple, then move up when you want more tools and presence.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[30px] border p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 ${
                  plan.highlight
                    ? "border-violet-500/30 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.08))]"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {plan.name}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">
                      {plan.desc}
                    </p>
                  </div>

                  {plan.label && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.highlight
                          ? "border border-violet-500/30 bg-violet-500/15 text-violet-300"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {plan.label}
                    </span>
                  )}
                </div>

                <div className="mt-6 text-4xl font-black tracking-tight text-white">
                  {plan.price}
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85"
                    >
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  href={planCtaHref(plan.name)}
                  className={`mt-6 block rounded-2xl px-6 py-3 text-center font-semibold transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02]"
                      : "border border-white/10 text-white/90 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.30)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                {user
                  ? "Ready to level up your seller presence?"
                  : "Ready to upgrade your presence?"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-8 text-[#9CA3AF]">
                {finalDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={finalPrimaryHref}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
              >
                {finalPrimaryLabel}
              </Link>

              <Link
                href={finalSecondaryHref}
                className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
              >
                {finalSecondaryLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}