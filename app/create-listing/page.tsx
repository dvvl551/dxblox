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
  "Blade Ball": ["Swords", "Finishers", "Emotes", "Bundles", "Looking for"],
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

const BLOCKED_TERMS = ["discord.gg", "telegram", "porn", "nsfw", "nude"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

function containsBlockedTerm(value: string) {
  const lower = value.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const availableCategories = useMemo(() => {
    if (!game) return [];
    return GAME_CATEGORIES[game] ?? [];
  }, [game]);

  const needsPrice = offerType === "For sale";

  const clearFeedback = () => {
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleGameChange = (value: string) => {
    setGame(value);
    setCategory("");
    clearFeedback();
  };

  const handleOfferTypeChange = (value: string) => {
    const nextOfferType = value as (typeof OFFER_TYPES)[number];
    setOfferType(nextOfferType);

    if (nextOfferType !== "For sale") {
      setPrice("");
    }

    clearFeedback();
  };

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setPrice(cleaned);
    clearFeedback();
  };

  const handleImageChange = (file: File | null) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      setSelectedImage(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImage(null);
      setErrorMessage("Only JPG and PNG images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setSelectedImage(null);
      setErrorMessage("Image size must be 3 MB or less.");
      return;
    }

    setSelectedImage(file);
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
    setSelectedImage(null);
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

      let uploadedImageUrl: string | null = null;

      if (selectedImage) {
        const fileExt = selectedImage.type === "image/png" ? "png" : "jpg";
        const safeName = sanitizeFileName(selectedImage.name);
        const filePath = `${user.id}/${Date.now()}-${
          safeName || `image.${fileExt}`
        }`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(filePath, selectedImage, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedImage.type,
          });

        if (uploadError) {
          setErrorMessage(
            uploadError.message || "Could not upload image. Please try again."
          );
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from("listing_submissions").insert({
        listing_id: null,
        user_id: user.id,
        submission_type: "create",
        review_status: "pending",
        game,
        category,
        item_name: trimmedItemName,
        price: finalPrice,
        offer_type: offerType,
        status,
        description: trimmedDescription || null,
        image_url: uploadedImageUrl,
        proof_url: null,
      });

      if (error) {
        setErrorMessage(
          error.message || "Could not send listing for review. Please try again."
        );
        return;
      }

      setSuccessMessage("Listing sent for review successfully.");
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

  const canPreviewImage = selectedImage && ALLOWED_IMAGE_TYPES.includes(selectedImage.type);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070b14] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(91,33,182,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
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

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                New listing
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Create a listing
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                Add your item details and send your listing for admin review
                before publication. Keep everything clear, accurate and easy to
                verify.
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
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1F2E] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500/40 focus:bg-white/5"
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
                      clearFeedback();
                    }}
                    disabled={!game}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1F2E] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500/40 focus:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
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
                      clearFeedback();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#73798f] focus:border-violet-500/40 focus:bg-white/[0.07]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Offer type
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => handleOfferTypeChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1F2E] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500/40 focus:bg-white/5"
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
                    <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500/40 focus-within:bg-white/[0.07]">
                      <span className="mr-3 text-sm text-white/70">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#73798f]"
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
                      clearFeedback();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-[#1A1F2E] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500/40 focus:bg-white/5"
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm text-[#9CA3AF]">
                    Description
                  </label>
                  <span className="text-xs text-[#73798f]">
                    {description.length}/500
                  </span>
                </div>

                <textarea
                  placeholder="Describe your listing..."
                  rows={6}
                  maxLength={500}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFeedback();
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#73798f] focus:border-violet-500/40 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#9CA3AF]">
                  Upload image
                </label>

                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-4 sm:p-5">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) =>
                      handleImageChange(e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-violet-500"
                  />

                  <p className="mt-3 text-sm text-[#9CA3AF]">
                    Allowed: JPG, JPEG, PNG. Max size: 3 MB.
                  </p>

                  {selectedImage && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
                      <p className="text-sm text-emerald-300">
                        Selected: {selectedImage.name}
                      </p>

                      {canPreviewImage && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0E1320]">
                          <img
                            src={URL.createObjectURL(selectedImage)}
                            alt="Listing preview"
                            className="h-48 w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[#C8D0E5]">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    clearFeedback();
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
                  disabled={loading || authLoading}
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send for review"}
                </button>

                <button
                  type="button"
                  disabled
                  className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/55 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Save draft soon
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h2 className="text-xl font-bold text-white">Review flow</h2>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#9CA3AF]">
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Your listing is submitted first
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Admin checks the content
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Approved listings become public
                </li>
                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Rejected ones stay private
                </li>
              </ul>
            </div>

            <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">Image safety</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  JPG / PNG only
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/85">
                Uploaded images are limited to JPG and PNG formats and still go
                through review before publication.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,38,0.96),rgba(11,15,26,0.96))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <h3 className="text-xl font-bold text-white">Publishing tips</h3>

              <div className="mt-4 space-y-3 text-sm leading-6 text-[#9CA3AF]">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Use a clear item name buyers can instantly recognize.
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Keep the description short, clean and focused on what matters.
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Add a clean image when possible to improve review clarity.
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}