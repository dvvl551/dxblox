"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type EditListingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Listing = {
  id: string;
  user_id: string;
  game: string;
  category: string;
  item_name: string;
  price: string;
  offer_type: string;
  status: string;
  description: string | null;
  image_url: string | null;
  proof_url: string | null;
  created_at: string;
};

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

function extractEditablePrice(price: string, offerType: string) {
  if (offerType !== "For sale") return "";
  const cleaned = price.replace(/[^0-9.]/g, "");
  return cleaned;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id: listingId } = use(params);

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [listing, setListing] = useState<Listing | null>(null);

  const [game, setGame] = useState("");
  const [category, setCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [offerType, setOfferType] =
    useState<(typeof OFFER_TYPES)[number]>("For sale");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Available");
  const [description, setDescription] = useState("");

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedProof, setSelectedProof] = useState<File | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [pageError, setPageError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const availableCategories = useMemo(() => {
    if (!game) return [];
    return GAME_CATEGORIES[game] ?? [];
  }, [game]);

  const needsPrice = offerType === "For sale";

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      setLoadingPage(true);
      setPageError("");
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, user_id, game, category, item_name, price, offer_type, status, description, image_url, proof_url, created_at"
        )
        .eq("id", listingId)
        .single();

      if (error || !data) {
        setPageError("Listing not found.");
        setLoadingPage(false);
        return;
      }

      const typedListing = data as Listing;
      setListing(typedListing);

      setGame(typedListing.game);
      setCategory(typedListing.category);
      setItemName(typedListing.item_name);
      setOfferType(typedListing.offer_type as (typeof OFFER_TYPES)[number]);
      setStatus(typedListing.status as (typeof STATUSES)[number]);
      setDescription(typedListing.description ?? "");
      setPrice(
        extractEditablePrice(typedListing.price, typedListing.offer_type)
      );
      setExistingImageUrl(typedListing.image_url);
      setExistingProofUrl(typedListing.proof_url);

      setLoadingPage(false);
    };

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    if (!authLoading && user && listing && user.id !== listing.user_id) {
      setPageError("You are not allowed to edit this listing.");
    }
  }, [authLoading, user, listing]);

  const handleGameChange = (value: string) => {
    setGame(value);
    setCategory("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleOfferTypeChange = (value: string) => {
    const nextOfferType = value as (typeof OFFER_TYPES)[number];
    setOfferType(nextOfferType);

    if (nextOfferType !== "For sale") {
      setPrice("");
    }

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setPrice(cleaned);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleImageChange = (
    file: File | null,
    mode: "listing" | "proof"
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      if (mode === "listing") setSelectedImage(null);
      if (mode === "proof") setSelectedProof(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Only JPG and PNG images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Image size must be 3 MB or less.");
      return;
    }

    if (mode === "listing") setSelectedImage(file);
    if (mode === "proof") setSelectedProof(file);
  };

  const uploadImageToStorage = async (file: File, folder: string, userId: string) => {
    const fileExt = file.type === "image/png" ? "png" : "jpg";
    const safeName = sanitizeFileName(file.name);
    const filePath = `${userId}/${folder}/${Date.now()}-${
      safeName || `image.${fileExt}`
    }`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Upload failed.");
    }

    const { data: publicUrlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait.");
      return;
    }

    if (!user) {
      setErrorMessage("You must be signed in to edit a listing.");
      return;
    }

    if (!listing) {
      setErrorMessage("Listing not found.");
      return;
    }

    if (user.id !== listing.user_id) {
      setErrorMessage("You are not allowed to edit this listing.");
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
      setErrorMessage("You must confirm that the updated listing is accurate.");
      return;
    }

    const finalPrice =
      offerType === "For sale"
        ? `$${Number(price).toFixed(2)}`
        : offerType === "Trade"
        ? "Trade"
        : "Looking for";

    try {
      setSubmitting(true);

      let uploadedImageUrl = existingImageUrl;
      let uploadedProofUrl = existingProofUrl;

      if (selectedImage) {
        uploadedImageUrl = await uploadImageToStorage(
          selectedImage,
          "listing",
          user.id
        );
      }

      if (selectedProof) {
        uploadedProofUrl = await uploadImageToStorage(
          selectedProof,
          "proof",
          user.id
        );
      }

      const { error } = await supabase.from("listing_submissions").insert({
        listing_id: listing.id,
        user_id: user.id,
        submission_type: "edit",
        review_status: "pending",
        game,
        category,
        item_name: trimmedItemName,
        price: finalPrice,
        offer_type: offerType,
        status,
        description: trimmedDescription || null,
        image_url: uploadedImageUrl,
        proof_url: uploadedProofUrl,
      });

      if (error) {
        setErrorMessage(
          error.message || "Could not send edit request for review."
        );
        return;
      }

      setSuccessMessage("Edit request sent for review successfully.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canRenderForm =
    !loadingPage &&
    !pageError &&
    listing &&
    user &&
    user.id === listing.user_id;

  return (
    <div className="relative min-h-screen bg-[#0B0B12] text-[#F5F7FF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(61,169,252,0.10),transparent_28%)]" />

      <Navbar active="listing" />

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
          <span className="text-white">Edit listing</span>
        </div>

        {loadingPage ? (
          <div className="rounded-[30px] border border-white/10 bg-[#131320] p-8 text-[#9CA3AF]">
            Loading listing...
          </div>
        ) : pageError ? (
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {pageError}
          </div>
        ) : canRenderForm ? (
          <section className="grid gap-8 xl:grid-cols-[1fr_340px]">
            <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="mb-6">
                <div className="mb-4 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                  Edit listing
                </div>
                <h1 className="text-4xl font-black tracking-tight">
                  Update your listing
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                  Submit your updated listing for admin review before the changes
                  go live.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmitEdit}>
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
                        setErrorMessage("");
                        setSuccessMessage("");
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
                        setErrorMessage("");
                        setSuccessMessage("");
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
                        setErrorMessage("");
                        setSuccessMessage("");
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
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[#73798f]"
                  />
                  <div className="mt-2 text-right text-xs text-[#73798f]">
                    {description.length}/500
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Listing image
                  </label>
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) =>
                        handleImageChange(e.target.files?.[0] ?? null, "listing")
                      }
                      className="block w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-violet-500"
                    />
                    <p className="mt-3 text-sm text-[#9CA3AF]">
                      Allowed: JPG, JPEG, PNG. Max size: 3 MB.
                    </p>
                    {selectedImage ? (
                      <p className="mt-2 text-sm text-emerald-300">
                        New image selected: {selectedImage.name}
                      </p>
                    ) : existingImageUrl ? (
                      <img
                        src={existingImageUrl}
                        alt="Current listing"
                        className="mt-4 h-40 w-full rounded-2xl border border-white/10 object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#9CA3AF]">
                    Proof image
                  </label>
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-4 py-6">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) =>
                        handleImageChange(e.target.files?.[0] ?? null, "proof")
                      }
                      className="block w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded-xl file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-violet-500"
                    />
                    <p className="mt-3 text-sm text-[#9CA3AF]">
                      Optional proof image. JPG / PNG only.
                    </p>
                    {selectedProof ? (
                      <p className="mt-2 text-sm text-emerald-300">
                        New proof selected: {selectedProof.name}
                      </p>
                    ) : existingProofUrl ? (
                      <img
                        src={existingProofUrl}
                        alt="Current proof"
                        className="mt-4 h-40 w-full rounded-2xl border border-white/10 object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-[#9CA3AF]">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => {
                      setConfirmed(e.target.checked);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="mt-1 rounded border-white/10 bg-white/5"
                  />
                  <span>
                    I confirm that the updated listing is accurate and follows
                    platform rules.
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
                    disabled={submitting}
                    className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send edit for review"}
                  </button>

                  <Link
                    href={`/listing/${listing.id}`}
                    className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-white/90 transition hover:border-white/20 hover:bg-white/5"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[30px] border border-white/10 bg-[#131320] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
                <h2 className="text-xl font-bold">Edit review flow</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#9CA3AF]">
                  <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    Your changes are submitted first
                  </li>
                  <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    Admin checks the updated content
                  </li>
                  <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    Approved edits replace the live version
                  </li>
                  <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    Rejected edits stay private
                  </li>
                </ul>
              </div>

              <div className="rounded-[30px] border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(61,169,252,0.10))] p-6 shadow-[0_20px_80px_rgba(76,29,149,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">Current listing</h3>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                    Live data
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  You are editing <span className="font-semibold">{listing.item_name}</span>.
                  The live listing stays visible until the edit is reviewed.
                </p>
              </div>
            </aside>
          </section>
        ) : (
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            You are not allowed to edit this listing.
          </div>
        )}
      </main>
    </div>
  );
}