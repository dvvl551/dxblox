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
      <div className="flex h-36 w-full items-center justify-center rounded-[18px] border border-white/8 bg-black/20 text-sm text-[#9CA3AF]">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-36 w-full rounded-[18px] border border-white/8 object-cover"
    />
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

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

  const soldListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === "Sold").length,
    [listings]
  );

  const joinedYear = useMemo(() => {
    if (!user?.created_at) return "—";
    return new Date(user.created_at).getFullYear().toString();
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
    return listings
      .slice(0, 4)
      .map((listing) => `Posted or updated ${listing.item_name}`);
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

  const previewAvatar = selectedAvatar
    ? URL.createObjectURL(selectedAvatar)
    : avatarUrl;

  const displayInitial =
    username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Profile</span>
        </div>

        <section className="grid items-start gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt={username || "Profile avatar"}
                  className="h-24 w-24 rounded-[26px] border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-3xl font-black text-white">
                  {displayInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">
                    {username || "Your profile"}
                  </h1>

                  {profile?.role === "admin" && (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                      Admin
                    </span>
                  )}
                </div>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#9CA3AF]">
                  {bio?.trim()
                    ? bio
                    : "Add a short bio to make your seller profile look cleaner and more trustworthy."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
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
                      View public profile
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Active listings</div>
                <div className="mt-1 text-2xl font-bold">
                  {activeListingsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Total listings</div>
                <div className="mt-1 text-2xl font-bold">
                  {totalListingsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Joined</div>
                <div className="mt-1 text-2xl font-bold">{joinedYear}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Main game</div>
                <div className="mt-1 text-2xl font-bold">{mainGame}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Sold listings</div>
                <div className="mt-1 text-2xl font-bold">{soldListingsCount}</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-xs text-[#9CA3AF]">Email</div>
                <div className="mt-1 truncate text-sm font-medium text-white/90">
                  {user?.email || "Not signed in"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-bold">Edit profile</h2>
            <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
              Update your public seller information and avatar.
            </p>

            <div className="mt-6 space-y-5">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
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
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">My listings</h2>
                <p className="mt-2 text-sm text-[#9CA3AF]">
                  Quick view of your current live listings.
                </p>
              </div>

              {listings.length > 0 && (
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                >
                  Manage in dashboard
                </Link>
              )}
            </div>

            {loadingListings ? (
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                Loading your listings...
              </div>
            ) : listings.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 px-4 py-6 text-sm text-[#9CA3AF]">
                You do not have any listings yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {listings.slice(0, 6).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:border-violet-500/30"
                  >
                    <ListingImage
                      src={listing.image_url}
                      alt={listing.item_name}
                    />

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold">
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
                      <div className="text-xl font-bold">{listing.price}</div>
                      <div className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                        View listing
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h3 className="text-xl font-bold">Recent activity</h3>
              <div className="mt-4 space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-[#9CA3AF]">
                    No recent activity yet.
                  </div>
                ) : (
recentActivity.map((activity, index) => (
  <div
    key={`${activity}-${index}`}
    className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-[#9CA3AF]"
  >
    {activity}
  </div>
))
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Profile tips</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Tips
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Use a clean username
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Add a short bio for trust
                </li>
                <li className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  Upload a clean avatar
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}