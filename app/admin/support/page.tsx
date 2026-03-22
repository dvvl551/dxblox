"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SupportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 text-sm text-white/45">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>{" "}
          / <span className="text-white">Support</span>
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_24%)]" />

          <div className="relative">
            <div className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 text-sm text-fuchsia-200 shadow-[0_0_20px_rgba(168,85,247,0.10)]">
              Support center
            </div>

            <h1 className="mt-5 bg-gradient-to-r from-white via-fuchsia-100 to-blue-100 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
              Need help?
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Get help with listings, reports, account issues and marketplace questions.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.05)]">
            <div className="text-sm font-semibold text-white">Contact support</div>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Use the support drawer from the footer to start a conversation directly with the Dxblox team.
            </p>
          </div>

          <Link
            href="/reports"
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl transition hover:border-fuchsia-400/20 hover:bg-white/[0.06]"
          >
            <div className="text-sm font-semibold text-white">Report a problem</div>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Report suspicious behavior, scams, listing issues or any marketplace problem.
            </p>
          </Link>

          <a
            href="https://discord.gg/your-link"
            target="_blank"
            rel="noreferrer"
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl transition hover:border-fuchsia-400/20 hover:bg-white/[0.06]"
          >
            <div className="text-sm font-semibold text-white">Community Discord</div>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Join the community, ask questions, and stay updated with Dxblox news.
            </p>
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}