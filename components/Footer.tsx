"use client";

import Link from "next/link";
import { useState } from "react";
import SupportDrawer from "@/components/SupportDrawer";

const platformLinks = [
  { label: "Marketplace", href: "/games" },
  { label: "New Listing", href: "/listing/new" },
  { label: "Messages", href: "/messages" },
  { label: "Dashboard", href: "/dashboard" },
];

const supportLinks = [
  { label: "Help Center", href: "/support" },
  { label: "Report a Problem", href: "/reports" },
];

const legalLinks = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Safety", href: "/legal/safety" },
];

type FooterProps = {
  className?: string;
};

export default function Footer({ className = "" }: FooterProps) {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <footer
        className={`relative overflow-hidden bg-[#05030A] text-white ${className}`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/35 to-transparent" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[18%] top-0 h-44 w-44 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute right-[16%] top-10 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="absolute inset-0 opacity-[0.03] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.35fr_0.9fr_0.9fr_0.9fr]">
            <div>
              <Link
                href="/"
                className="group inline-flex items-center gap-3 text-white transition hover:opacity-95"
              >
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.88),rgba(239,68,68,0.82))] shadow-[0_0_30px_rgba(168,85,247,0.22)] transition duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_42px_rgba(168,85,247,0.28)]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                  <span className="relative z-10 text-sm font-black tracking-[0.14em]">
                    DX
                  </span>
                </div>

                <div>
                  <div className="bg-gradient-to-r from-white via-fuchsia-100 to-white bg-clip-text text-xl font-black tracking-tight text-transparent">
                    Dxblox
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.30em] text-white/40">
                    Premium Marketplace
                  </div>
                </div>
              </Link>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
                Dxblox is a modern marketplace for Roblox listings, built for
                smoother browsing, trusted profiles, and better contact between
                users.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/listing/new"
                  className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.20)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(168,85,247,0.28)]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                  <span className="relative z-10">Create listing</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-fuchsia-400/20 hover:bg-white/[0.08]"
                >
                  Contact support
                </button>
              </div>
            </div>

            <FooterColumn title="Platform" links={platformLinks} />
            <FooterSupportColumn
              links={supportLinks}
              onContact={() => setSupportOpen(true)}
            />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>

          <div className="flex flex-col gap-4 pt-6 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Dxblox. All rights reserved.</p>

            <p className="max-w-2xl text-left md:text-right">
              Dxblox is an independent platform and is not affiliated with Roblox.
            </p>
          </div>
        </div>
      </footer>

      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </>
  );
}

type FooterColumnProps = {
  title: string;
  links: { label: string; href: string }[];
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/88">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="inline-flex text-sm text-white/50 transition hover:translate-x-0.5 hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type FooterSupportColumnProps = {
  links: { label: string; href: string }[];
  onContact: () => void;
};

function FooterSupportColumn({
  links,
  onContact,
}: FooterSupportColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/88">
        Support
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`support-${link.href}`}>
            <Link
              href={link.href}
              className="inline-flex text-sm text-white/50 transition hover:translate-x-0.5 hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={onContact}
            className="inline-flex text-sm text-white/50 transition hover:translate-x-0.5 hover:text-white"
          >
            Contact Us
          </button>
        </li>
      </ul>
    </div>
  );
}