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

        if (error) {
          return;
        }

        setIsWishlisted(false);
        onChanged?.(false);
      } else {
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) {
          return;
        }

        setIsWishlisted(true);
        onChanged?.(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      disabled={loading || isOwnListing}
      className={`${fullWidth ? "w-full" : ""} rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isOwnListing
          ? "border border-white/10 bg-white/5 text-white/50"
          : isWishlisted
          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
          : "border border-white/10 text-white/90 hover:bg-white/5"
      }`}
    >
      {isOwnListing && "Your listing"}
      {!isOwnListing && loading && "Saving..."}
      {!isOwnListing && !loading && isWishlisted && "Remove from wishlist"}
      {!isOwnListing && !loading && !isWishlisted && "Add to wishlist"}
    </button>
  );
}