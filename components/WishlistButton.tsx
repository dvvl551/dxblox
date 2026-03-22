"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type WishlistButtonProps = {
  listingId: string;
  listingUserId: string;
  initialIsWishlisted?: boolean;
  onChanged?: (nextValue: boolean) => void;
  fullWidth?: boolean;
};

export default function WishlistButton({
  listingId,
  listingUserId,
  initialIsWishlisted = false,
  onChanged,
  fullWidth = true,
}: WishlistButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [loading, setLoading] = useState(false);

  const isOwnListing = !!user && user.id === listingUserId;

  useEffect(() => {
    setIsWishlisted(initialIsWishlisted);
  }, [initialIsWishlisted, listingId]);

  const handleToggleWishlist = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id === listingUserId) {
      return;
    }

    setLoading(true);

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) return;

        setIsWishlisted(false);
        onChanged?.(false);
      } else {
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) return;

        setIsWishlisted(true);
        onChanged?.(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const widthClass = fullWidth ? "w-full" : "";

  const buttonClass = isOwnListing
    ? "border border-white/10 bg-white/[0.04] text-white/35"
    : isWishlisted
    ? "border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.08))] text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.08)] hover:border-emerald-400/30 hover:bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(16,185,129,0.10))]"
    : "border border-white/10 bg-white/[0.04] text-white/88 hover:border-fuchsia-400/20 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(168,85,247,0.08)]";

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      disabled={loading || isOwnListing}
      className={`group relative overflow-hidden rounded-[16px] px-4 py-3 text-sm font-semibold backdrop-blur-xl transition duration-300 ${widthClass} ${buttonClass} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {!isOwnListing && (
        <span className="pointer-events-none absolute inset-0 opacity-100 transition duration-300 group-hover:opacity-100">
          <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%,transparent)]" />
        </span>
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {isOwnListing && (
          <>
            <span className="h-2 w-2 rounded-full bg-white/25" />
            <span>Your listing</span>
          </>
        )}

        {!isOwnListing && loading && (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <span>Saving...</span>
          </>
        )}

        {!isOwnListing && !loading && isWishlisted && (
          <>
            <span className="text-base leading-none">✓</span>
            <span>Remove from wishlist</span>
          </>
        )}

        {!isOwnListing && !loading && !isWishlisted && (
          <>
            <span className="text-base leading-none">＋</span>
            <span>Add to wishlist</span>
          </>
        )}
      </span>
    </button>
  );
}