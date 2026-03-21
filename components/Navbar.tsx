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

  const desktopLinkClass = (name: NavbarProps["active"]) =>
    active === name
      ? "rounded-xl bg-white/10 px-4 py-2 text-white transition"
      : "rounded-xl px-4 py-2 text-[#9CA3AF] transition hover:bg-white/5 hover:text-white";

  const mobileLinkClass = (name: NavbarProps["active"]) =>
    active === name
      ? "rounded-xl bg-white/10 px-3 py-2 text-white transition"
      : "rounded-xl bg-white/5 px-3 py-2 text-[#9CA3AF] transition hover:bg-white/10 hover:text-white";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email ||
    "Account";

  const isAdmin = profile?.role === "admin";
  const avatarUrl = profile?.avatar_url || null;
  const initial = displayName[0]?.toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0B12]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-violet-500 to-blue-500 font-black text-white shadow-lg shadow-violet-900/30 ring-1 ring-white/10">
              DX
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-bold tracking-tight text-white">
                Dxblox
              </div>
              <div className="truncate text-xs text-[#9CA3AF]">
                Trade smarter. Stay safer.
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-sm md:flex">
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
              <>
                <Link href="/admin/reviews" className={desktopLinkClass("admin")}>
                  Reviews
                </Link>
                <Link href="/admin/users" className={desktopLinkClass("admin")}>
                  Users
                </Link>
              </>
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {!loading && !user && (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
              >
                Sign in
              </Link>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/profile"
                  className="group flex max-w-[240px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white ring-1 ring-white/10">
                        {initial}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white group-hover:text-white">
                      {displayName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-[#9CA3AF]">
                        View profile
                      </span>

                      {isAdmin && (
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            )}

            <Link
              href="/create-listing"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
            >
              Post listing
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {!loading && user && (
              <Link href="/profile" className="shrink-0" aria-label="Profile">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white ring-1 ring-white/10">
                    {initial}
                  </div>
                )}
              </Link>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
              >
                Sign in
              </Link>
            )}

            {!loading && user && (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
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
            <>
              <Link href="/admin/reviews" className={mobileLinkClass("admin")}>
                Reviews
              </Link>
              <Link href="/admin/users" className={mobileLinkClass("admin")}>
                Users
              </Link>
            </>
          )}

          <Link
            href="/create-listing"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition"
          >
            Post
          </Link>
        </div>
      </div>
    </header>
  );
}