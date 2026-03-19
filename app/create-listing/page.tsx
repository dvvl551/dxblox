"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const GAME_CATEGORIES: Record<string, string[]> = {
  MM2: ["Knives", "Guns", "Bundles", "Looking for"],
  "Adopt Me": ["Pets", "Eggs", "Vehicles", "Looking for"],
  "Blox Fruits": ["Fruits", "Bundles", "Accounts", "Looking for"],
  "Blade Ball": ["Weapons", "Effects", "Emotes", "Bundles", "Looking for"],
  "Steal a Brainrot": [
    "Rare items",
    "Limited offers",
    "Trending deals",
    "Looking for",
  ],
  "Da Hood": ["Weapons", "Skins", "Bundles", "Looking for"],
};

const OFFER_TYPES = ["For sale", "Trade", "Looking for"] as const;
const STATUSES = ["Available", "Pending", "Sold"] as const;

const BLOCKED_TERMS = [
  "discord.gg",
  "telegram",
  "porn",
  "nsfw",
  "nude",
];

function containsBlockedTerm(value: string) {
  const lower = value.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [game, setGame] = useState("");
  const [category, setCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [offerType, setOfferType] =
    useState<(typeof OFFER_TYPES)[number]>("For sale");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Available");
  const [description, setDescription] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const availableCategories = useMemo(() => {
    if (!game) return [];
    return GAME_CATEGORIES[game] ?? [];
  }, [game]);

  const needsPrice = offerType === "For sale";

  const handleGameChange = (value: string) => {
    setGame(value);
    setCategory("");
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleOfferTypeChange = (value: string) => {
    const nextOfferType = value as (typeof OFFER_TYPES)[number];
    setOfferType(nextOfferType);

    if (nextOfferType !== "For sale") {
      setPrice("");
    }

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) return;

    if (parts[1] && parts[1].length > 2) return;

    setPrice(cleaned);

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const resetForm = () => {
    setGame("");
    setCategory("");
    setItemName("");
    setPrice("");
    setOfferType("For sale");
    setStatus("Available");
    setDescription("");
    setConfirmed(false);
  };

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait.");
      return;
    }

    if (!user) {
      setErrorMessage("You must be signed in to create a listing.");
      return;
    }

    if (!game || !(game in GAME_CATEGORIES)) {
      setErrorMessage("Please choose a valid game.");
      return;
    }

    if (!category || !availableCategories.includes(category)) {
      setErrorMessage("Please choose a valid category for this game.");
      return;
    }

    const trimmedItemName = itemName.trim();
    if (!trimmedItemName) {
      setErrorMessage("Please enter an item name.");
      return;
    }

    if (trimmedItemName.length < 2 || trimmedItemName.length > 60) {
      setErrorMessage("Item name must be between 2 and 60 characters.");
      return;
    }

    if (containsBlockedTerm(trimmedItemName)) {
      setErrorMessage("Your item name contains blocked content.");
      return;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 500) {
      setErrorMessage("Description must be 500 characters or less.");
      return;
    }

    if (containsBlockedTerm(trimmedDescription)) {
      setErrorMessage("Your description contains blocked content.");
      return;
    }

    if (!OFFER_TYPES.includes(offerType)) {
      setErrorMessage("Please choose a valid offer type.");
      return;
    }

    if (!STATUSES.includes(status)) {
      setErrorMessage("Please choose a valid status.");
      return;
    }

    if (needsPrice) {
      if (!price) {
        setErrorMessage("Please enter a price.");
        return;
      }

      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        setErrorMessage("Price must be a valid number greater than 0.");
        return;
      }

      if (parsedPrice > 999999) {
        setErrorMessage("Price is too high.");
        return;
      }
    }

    if (!confirmed) {
      setErrorMessage("You must confirm that the listing is accurate.");
      return;
    }

    const finalPrice =
      offerType === "For sale"
        ? `$${Number(price).toFixed(2)}`
        : offerType === "Trade"
        ? "Trade"
        : "Looking for";

    try {
      setLoading(true);

      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        game,
        category,
        item_name: trimmedItemName,
        price: finalPrice,
        offer_type: offerType,
        status,
        description: trimmedDescription || null,
        image_url: null,
        proof_url: null,
      });

      if (error) {
        setErrorMessage("Could not publish listing. Please try again.");
        return;
      }

      setSuccessMessage("Listing published successfully.");
      resetForm();

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar />

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
          <span className="text-white">Create listing</span>
        </div>

        <section className="grid gap-8 xl:grid-cols-[1fr_340px]">
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                New listing
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Create a listing
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Add your item details, choose the game, and publish a cleaner
                listing on Dxblox.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handlePublish}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Game
                  </label>
                  <select
                    value={game}
                    onChange={(e) => handleGameChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" className="bg-[#131320] text-white">
                      Choose a game
                    </option>
                    {Object.keys(GAME_CATEGORIES).map((gameName) => (
                      <option
                        key={gameName}
                        value={gameName}
                        className="bg-[#131320] text-white"
                      >
                        {gameName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errorMessage) setErrorMessage("");
                      if (successMessage) setSuccessMessage("");
                    }}
                    disabled={!game}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="" className="bg-[#131320] text-white">
                      {game ? "Select a category" : "Choose a game first"}
                    </option>
                    {availableCategories.map((categoryName) => (
                      <option
                        key={categoryName}
                        value={categoryName}
                        className="bg-[#131320] text-white"
                      >
                        {categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Item name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    maxLength={60}
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      if (errorMessage) setErrorMessage("");
                      if (successMessage) setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Offer type
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => handleOfferTypeChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    {OFFER_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-[#131320] text-white"
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Price
                  </label>

                  {needsPrice ? (
                    <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
                      <span className="mr-3 text-sm text-white/70">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#73798f]"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#9CA3AF]">
                      Price is disabled for this offer type.
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as (typeof STATUSES)[number]);
                      if (errorMessage) setErrorMessage("");
                      if (successMessage) setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1B27] px-4 py-3 text-sm text-white outline-none"
                  >
                    {STATUSES.map((statusValue) => (
                      <option
                        key={statusValue}
                        value={statusValue}
                        className="bg-[#131320] text-white"
                      >
                        {statusValue}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Description
                </label>
                <textarea
                  placeholder="Describe your listing..."
                  rows={6}
                  maxLength={500}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errorMessage) setErrorMessage("");
                    if (successMessage) setSuccessMessage("");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                />
                <div className="mt-2 text-right text-xs text-[#73798f]">
                  {description.length}/500
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Upload image
                  </label>
                  <div className="flex min-h-[120px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[#9CA3AF]">
                    Disabled for now to avoid unsafe uploads.
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Upload proof
                  </label>
                  <div className="flex min-h-[120px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[#9CA3AF]">
                    Proof upload will come later with moderation.
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-[#9CA3AF]">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    if (errorMessage) setErrorMessage("");
                    if (successMessage) setSuccessMessage("");
                  }}
                  className="mt-1 rounded border-white/10 bg-white/5"
                />
                <span>
                  I confirm that this listing is accurate and follows platform
                  rules.
                </span>
              </label>

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

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Publishing..." : "Publish listing"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                >
                  Save draft
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-bold">Listing tips</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#9CA3AF]">
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Use a clear and accurate item name
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Use the correct category for the selected game
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Keep the price numeric and realistic
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Avoid external links or unsafe content
                </li>
              </ul>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Upload safety</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Disabled
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Image and proof uploads are temporarily disabled until a safer
                moderation flow is added.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6">
              <h3 className="text-xl font-bold">Quick links</h3>
              <div className="mt-4 space-y-3">
                <Link
                  href="/dashboard"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/wishlist"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Open wishlist
                </Link>
                <Link
                  href="/games"
                  className="block rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/85 transition hover:bg-white/10"
                >
                  Browse games
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}