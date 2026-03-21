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
      <footer className={`relative bg-[#050816] ${className}`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute right-1/4 top-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3 text-white transition hover:opacity-90"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-blue-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                  <span className="text-lg font-semibold tracking-wide text-white">
                    D
                  </span>
                </div>

                <div>
                  <div className="text-xl font-semibold tracking-tight">
                    Dxblox
                  </div>
                  <div className="text-xs uppercase tracking-[0.28em] text-violet-300/70">
                    Premium Marketplace
                  </div>
                </div>
              </Link>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#9CA3AF]">
                Dxblox is a modern marketplace for Roblox listings, designed for
                smooth browsing, trusted profiles, and easy contact between users.
              </p>
            </div>

            <FooterColumn title="Platform" links={platformLinks} />

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/90">
                Support
              </h3>

              <ul className="mt-4 space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#9CA3AF] transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}

                <li>
                  <button
                    type="button"
                    onClick={() => setSupportOpen(true)}
                    className="text-sm text-[#9CA3AF] transition hover:text-white"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            <FooterColumn title="Legal" links={legalLinks} />
          </div>

          <div className="flex flex-col gap-4 pt-6 text-sm text-[#6B7280] md:flex-row md:items-center md:justify-between">
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
      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/90">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="text-sm text-[#9CA3AF] transition hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}