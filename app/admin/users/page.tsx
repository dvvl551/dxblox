"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
};

function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") {
    return (
      <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
        Admin
      </span>
    );
  }

  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/75">
      User
    </span>
  );
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All roles");
  const [selectedSort, setSelectedSort] = useState("Newest");

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        setErrorMessage("You must be signed in.");
        return;
      }

      if (profile && profile.role !== "admin") {
        setLoading(false);
        setErrorMessage("Access denied.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, bio, role, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setUsers([]);
        setErrorMessage(error.message || "Could not load users.");
        setLoading(false);
        return;
      }

      setUsers((data ?? []) as ProfileRow[]);
      setLoading(false);
    };

    fetchUsers();
  }, [user, authLoading, profile]);

  const adminCount = useMemo(
    () => users.filter((item) => item.role === "admin").length,
    [users]
  );

  const userCount = useMemo(
    () => users.filter((item) => item.role !== "admin").length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    let next = [...users];

    if (searchValue) {
      next = next.filter((item) => {
        const username = item.username?.toLowerCase() || "";
        const bio = item.bio?.toLowerCase() || "";
        const id = item.id.toLowerCase();

        return (
          username.includes(searchValue) ||
          bio.includes(searchValue) ||
          id.includes(searchValue)
        );
      });
    }

    if (selectedRole === "Admins") {
      next = next.filter((item) => item.role === "admin");
    }

    if (selectedRole === "Users") {
      next = next.filter((item) => item.role !== "admin");
    }

    next.sort((a, b) => {
      if (selectedSort === "Oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      if (selectedSort === "A-Z") {
        return (a.username || "Unknown").localeCompare(b.username || "Unknown");
      }

      if (selectedSort === "Z-A") {
        return (b.username || "Unknown").localeCompare(a.username || "Unknown");
      }

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return next;
  }, [users, search, selectedRole, selectedSort]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedRole !== "All roles" ||
    selectedSort !== "Newest";

  const resetFilters = () => {
    setSearch("");
    setSelectedRole("All roles");
    setSelectedSort("Newest");
  };

  if (!loading && (!user || !isAdmin)) {
    return (
      <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {errorMessage || "Access denied."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="admin" />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-white">Admin users</span>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                Admin users
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Manage users
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Browse public profiles, roles and account activity from one
                place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total</div>
                <div className="mt-1 text-2xl font-bold">{users.length}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Admins</div>
                <div className="mt-1 text-2xl font-bold">{adminCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Users</div>
                <div className="mt-1 text-2xl font-bold">{userCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username, bio or user ID..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="All roles" className="bg-[#131320] text-white">
                  All roles
                </option>
                <option value="Admins" className="bg-[#131320] text-white">
                  Admins
                </option>
                <option value="Users" className="bg-[#131320] text-white">
                  Users
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#9CA3AF]">Sort</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="Newest" className="bg-[#131320] text-white">
                  Newest
                </option>
                <option value="Oldest" className="bg-[#131320] text-white">
                  Oldest
                </option>
                <option value="A-Z" className="bg-[#131320] text-white">
                  A-Z
                </option>
                <option value="Z-A" className="bg-[#131320] text-white">
                  Z-A
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <div className="text-sm text-[#9CA3AF]">
              <span className="font-semibold text-white">
                {filteredUsers.length}
              </span>{" "}
              {filteredUsers.length === 1 ? "user found" : "users found"}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/5"
            >
              Reset filters
            </button>
          </div>
        </section>

        <section className="mt-8">
          {errorMessage && loading === false && user && isAdmin && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-center">
              <div className="text-xl font-bold text-white">No users found</div>
              <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                Try changing your search or filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((item) => {
                const username = item.username || "Unknown user";
                const bio = item.bio?.trim() || "This user has not added a bio yet.";
                const joinedDate = new Date(item.created_at);
                const formattedJoinedDate = Number.isNaN(joinedDate.getTime())
                  ? "Unknown"
                  : joinedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                const isOwnCard = user?.id === item.id;

                return (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-white/10 bg-[#131320] p-5 transition hover:-translate-y-1 hover:border-violet-500/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={username}
                            className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-xl font-black text-white">
                            {username[0]?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-white">
                            {username}
                          </div>
                          <div className="mt-1 text-sm text-[#9CA3AF]">
                            Joined {formattedJoinedDate}
                          </div>
                        </div>
                      </div>

                      <RoleBadge role={item.role} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-xs text-[#9CA3AF]">Bio</div>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-white/85">
                        {bio}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#9CA3AF]">User ID</span>
                        <span className="max-w-[180px] truncate text-right text-white/85">
                          {item.id}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/users/${item.id}`}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      >
                        View public profile
                      </Link>

                      {isOwnCard && (
                        <Link
                          href="/profile"
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                        >
                          Open my profile
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}