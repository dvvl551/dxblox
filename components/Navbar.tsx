"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type NavbarProps = {
  active?:
    | "home"
    | "games"
    | "listing"
    | "wishlist"
    | "premium"
    | "dashboard"
    | "messages"
    | "admin";
};

export default function Navbar({ active }: NavbarProps) {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email ||
    "Account";

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "owner" ||
    profile?.role === "moderator";

  const avatarUrl = profile?.avatar_url || null;
  const initial = displayName[0]?.toUpperCase() || "A";

const desktopLinkClass = (name: NavbarProps["active"]) =>
  active === name
    ? "relative rounded-2xl border border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] px-4 py-2 text-white shadow-[0_0_25px_rgba(168,85,247,0.18)] backdrop-blur-xl transition before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_45%,transparent)]"
    : "relative rounded-2xl px-4 py-2 text-white/55 transition duration-200 hover:bg-white/7 hover:text-white";

const mobileLinkClass = (name: NavbarProps["active"]) =>
  active === name
    ? "relative rounded-2xl border border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] px-3 py-2 text-white shadow-[0_0_25px_rgba(168,85,247,0.18)] backdrop-blur-xl transition before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_45%,transparent)]"
    : "rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-white/60 transition hover:border-white/15 hover:bg-white/[0.08] hover:text-white";

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 border-b border-white/10 bg-[#070812]/72 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_left,rgba(239,68,68,0.08),transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background:repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(255,255,255,0.03)_4px)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
<Link href="/" className="group flex items-center gap-3 shrink-0">
  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.95),rgba(59,130,246,0.92),rgba(239,68,68,0.88))] text-sm font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.28)] transition duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_40px_rgba(168,85,247,0.35)]">
    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_45%,transparent)]" />
    <span className="relative z-10 tracking-[0.15em]">DX</span>
  </div>
</Link>

          <nav className="hidden items-center gap-1 rounded-[24px] border border-white/10 bg-white/[0.045] p-1.5 shadow-[0_0_35px_rgba(168,85,247,0.06)] backdrop-blur-2xl md:flex">
            <Link href="/" className={desktopLinkClass("home")}>
              Home
            </Link>
            <Link href="/games" className={desktopLinkClass("games")}>
              Games
            </Link>
            <Link href="/listing" className={desktopLinkClass("listing")}>
              Listings
            </Link>
            <Link href="/wishlist" className={desktopLinkClass("wishlist")}>
              Wishlist
            </Link>
            <Link href="/messages" className={desktopLinkClass("messages")}>
              Messages
            </Link>
            <Link href="/premium" className={desktopLinkClass("premium")}>
              Premium
            </Link>
            <Link href="/dashboard" className={desktopLinkClass("dashboard")}>
              Dashboard
            </Link>

            {isAdmin && (
              <Link href="/admin" className={desktopLinkClass("admin")}>
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-xl transition duration-200 hover:border-fuchsia-400/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Sign in
                </Link>

                <Link
                  href="/create-listing"
                  className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.9),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.24)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.3)]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                  <span className="relative z-10">Post listing</span>
                </Link>
              </>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/profile"
                  className="group flex max-w-[280px] items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.05] px-3 py-2 shadow-[0_0_30px_rgba(59,130,246,0.05)] backdrop-blur-2xl transition duration-200 hover:border-fuchsia-400/20 hover:bg-white/[0.08]"
                >
                  <div className="shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-11 w-11 rounded-[16px] border border-white/10 object-cover shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                      />
                    ) : (
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(59,130,246,0.22),rgba(239,68,68,0.18))] text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.12)]">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,transparent)]" />
                        <span className="relative z-10">{initial}</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {displayName}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-white/42">
                        Open profile
                      </span>

                      {isAdmin && (
                        <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-fuchsia-200">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <Link
                  href="/create-listing"
                  className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.9),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.24)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(168,85,247,0.3)]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
                  <span className="relative z-10">Post listing</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-xl transition duration-200 hover:border-rose-400/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {!loading && user && (
              <Link href="/profile" className="shrink-0" aria-label="Profile">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 rounded-[16px] border border-white/10 object-cover shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                  />
                ) : (
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(59,130,246,0.22),rgba(239,68,68,0.18))] text-sm font-bold text-white">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,transparent)]" />
                    <span className="relative z-10">{initial}</span>
                  </div>
                )}
              </Link>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Sign in
              </Link>
            )}

            {!loading && user && (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          <Link href="/" className={mobileLinkClass("home")}>
            Home
          </Link>
          <Link href="/games" className={mobileLinkClass("games")}>
            Games
          </Link>
          <Link href="/listing" className={mobileLinkClass("listing")}>
            Listings
          </Link>
          <Link href="/wishlist" className={mobileLinkClass("wishlist")}>
            Wishlist
          </Link>
          <Link href="/messages" className={mobileLinkClass("messages")}>
            Messages
          </Link>
          <Link href="/premium" className={mobileLinkClass("premium")}>
            Premium
          </Link>
          <Link href="/dashboard" className={mobileLinkClass("dashboard")}>
            Dashboard
          </Link>

          {isAdmin && (
            <Link href="/admin" className={mobileLinkClass("admin")}>
              Admin
            </Link>
          )}

          <Link
            href="/create-listing"
            className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.9),rgba(59,130,246,0.9),rgba(239,68,68,0.82))] px-3 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.22)]"
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%,transparent)]" />
            <span className="relative z-10">Post</span>
          </Link>
        </div>
      </div>
    </header>
  );
}