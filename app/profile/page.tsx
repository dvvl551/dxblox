"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type Listing = {
  id: string;
  item_name: string;
  game: string;
  price: string;
  status: string;
  created_at: string;
  image_url?: string | null;
};

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];
const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

function ListingImage({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-44 w-full items-center justify-center rounded-[22px] border border-white/8 bg-black/20 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-44 w-full rounded-[22px] border border-white/8 object-cover"
    />
  );
}

function ProfileStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-violet-500/20 hover:bg-[linear-gradient(180deg,rgba(124,92,255,0.10),rgba(255,255,255,0.03))]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A7AFBF]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-black leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.94),rgba(11,15,26,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedAvatar]);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (authLoading) return;

      if (!user) {
        setListings([]);
        setLoadingListings(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id, item_name, game, price, status, created_at, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setListings([]);
        setLoadingListings(false);
        return;
      }

      setListings((data ?? []) as Listing[]);
      setLoadingListings(false);
    };

    fetchMyListings();
  }, [user, authLoading]);

  const totalListingsCount = listings.length;

  const activeListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === "Available").length,
    [listings]
  );

  const pendingListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === "Pending").length,
    [listings]
  );

  const soldListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === "Sold").length,
    [listings]
  );

  const joinedYear = useMemo(() => {
    if (!user?.created_at) return "—";
    return new Date(user.created_at).getFullYear().toString();
  }, [user]);

  const joinedLabel = useMemo(() => {
    if (!user?.created_at) return "Unknown";
    const date = new Date(user.created_at);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
  }, [user]);

  const mainGame = useMemo(() => {
    if (listings.length === 0) return "No listings yet";

    const counts: Record<string, number> = {};

    for (const listing of listings) {
      counts[listing.game] = (counts[listing.game] ?? 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [listings]);

  const recentActivity = useMemo(() => {
    if (listings.length === 0) return [];

    return listings.slice(0, 4).map((listing) => ({
      id: listing.id,
      text:
        listing.status === "Sold"
          ? `Sold ${listing.item_name}`
          : listing.status === "Pending"
          ? `Updated ${listing.item_name} and it's pending`
          : `Posted ${listing.item_name}`,
      date: new Date(listing.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
    }));
  }, [listings]);

  const badgeStyle = (status: string) => {
    if (status === "Available") {
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    }
    if (status === "Pending") {
      return "border-orange-500/30 bg-orange-500/15 text-orange-300";
    }
    if (status === "Sold") {
      return "border-red-500/30 bg-red-500/15 text-red-300";
    }
    return "border-white/10 bg-white/5 text-white/75";
  };

  const handleAvatarChange = (file: File | null) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      setSelectedAvatar(null);
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrorMessage("Only JPG and PNG avatars are allowed.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage("Avatar size must be 3 MB or less.");
      return;
    }

    setSelectedAvatar(file);
  };

  const handleSaveProfile = async () => {
    if (saving) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait.");
      return;
    }

    if (!user) {
      setErrorMessage("You must be signed in to edit your profile.");
      return;
    }

    const cleanUsername = username.trim();
    const cleanBio = bio.trim();

    if (!cleanUsername) {
      setErrorMessage("Please enter a username.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMessage("Username must be between 3 and 20 characters.");
      return;
    }

    if (cleanBio.length > 300) {
      setErrorMessage("Bio must be 300 characters or less.");
      return;
    }

    try {
      setSaving(true);

      let nextAvatarUrl = avatarUrl;

      if (selectedAvatar) {
        const fileExt = selectedAvatar.type === "image/png" ? "png" : "jpg";
        const safeName = sanitizeFileName(selectedAvatar.name);
        const filePath = `${user.id}/${Date.now()}-${
          safeName || `avatar.${fileExt}`
        }`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedAvatar, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedAvatar.type,
          });

        if (uploadError) {
          setErrorMessage(uploadError.message || "Could not upload avatar.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        nextAvatarUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          bio: cleanBio || null,
          avatar_url: nextAvatarUrl,
        })
        .eq("id", user.id);

      if (error) {
        setErrorMessage(error.message || "Could not update profile.");
        return;
      }

      setAvatarUrl(nextAvatarUrl);
      setSelectedAvatar(null);
      setSuccessMessage("Profile updated successfully.");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const previewAvatar = avatarPreviewUrl || avatarUrl;

  const displayInitial =
    username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-violet-600/10 via-transparent to-transparent" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Profile</span>
        </div>

        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="relative border-b border-white/8 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(61,169,252,0.10),rgba(255,255,255,0.02))] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {previewAvatar ? (
                  <img
                    src={previewAvatar}
                    alt={username || "Profile avatar"}
                    className="h-28 w-28 rounded-[28px] border border-white/10 object-cover shadow-2xl shadow-black/25"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-500/40 to-blue-500/25 text-4xl font-black text-white shadow-2xl shadow-black/25">
                    {displayInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                      {username || "Your profile"}
                    </h1>

                    {profile?.role === "admin" && (
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200">
                        Admin
                      </span>
                    )}
                  </div>

                  <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">
                    {bio?.trim()
                      ? bio
                      : "Add a bio to make your profile look cleaner, more trusted and more memorable for buyers and sellers."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                      Joined {joinedLabel}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                      Main game: {mainGame}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                      {activeListingsCount} active listings
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02]"
                >
                  Open dashboard
                </Link>

                <Link
                  href="/create-listing"
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Create listing
                </Link>

                {user && (
                  <Link
                    href={`/users/${user.id}`}
                    className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                  >
                    Public profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
            <ProfileStatCard label="Active" value={activeListingsCount} />
            <ProfileStatCard label="Total" value={totalListingsCount} />
            <ProfileStatCard label="Pending" value={pendingListingsCount} />
            <ProfileStatCard label="Sold" value={soldListingsCount} />
            <ProfileStatCard label="Joined" value={joinedYear} />
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <SectionCard
              title="Seller showcase"
              description="A cleaner look at your latest listings."
              actions={
                listings.length > 0 ? (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Manage in dashboard
                  </Link>
                ) : undefined
              }
            >
              {loadingListings ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  Loading your listings...
                </div>
              ) : listings.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                  You do not have any listings yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {listings.slice(0, 6).map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listing/${listing.id}`}
                      className="group rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-violet-500/30"
                    >
                      <ListingImage
                        src={listing.image_url}
                        alt={listing.item_name}
                      />

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-white">
                            {listing.item_name}
                          </div>
                          <div className="mt-1 text-sm text-[#9CA3AF]">
                            {listing.game}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyle(
                            listing.status
                          )}`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xl font-bold text-white">
                          {listing.price}
                        </div>
                        <div className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition group-hover:bg-white/5">
                          View listing
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <SectionCard
              title="Edit profile"
              description="Update your public seller information and avatar."
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Avatar
                  </label>

                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-4">
                      {previewAvatar ? (
                        <img
                          src={previewAvatar}
                          alt="Avatar preview"
                          className="h-20 w-20 rounded-[20px] border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-2xl font-black text-white">
                          {displayInitial}
                        </div>
                      )}

                      <div className="text-sm text-[#9CA3AF]">
                        JPG / PNG only. Max size: 3 MB.
                      </div>
                    </div>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) =>
                        handleAvatarChange(e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-violet-500"
                    />

                    {selectedAvatar && (
                      <div className="mt-3 text-sm text-emerald-300">
                        Selected: {selectedAvatar.name}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Username
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage("");
                      if (successMessage) setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#73798f] focus:border-violet-400/30 focus:bg-white/[0.07]"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Bio
                  </label>
                  <textarea
                    rows={5}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                      if (errorMessage) setErrorMessage("");
                      if (successMessage) setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#73798f] focus:border-violet-400/30 focus:bg-white/[0.07]"
                    placeholder="Write a short bio about your seller profile"
                  />
                  <div className="mt-2 text-right text-xs text-[#73798f]">
                    {bio.length}/300
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {successMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Recent activity">
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-[#9CA3AF]">
                    No recent activity yet.
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-white/8 bg-white/5 p-4"
                    >
                      <div className="text-sm text-white/90">{activity.text}</div>
                      <div className="mt-1 text-xs text-[#9CA3AF]">
                        {activity.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <section className="rounded-[32px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">Profile tips</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Tips
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Use a clean username people remember
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Keep your bio short and trustworthy
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Upload a clean avatar for better trust
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Keep your best listings active and updated
                </li>
              </ul>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}