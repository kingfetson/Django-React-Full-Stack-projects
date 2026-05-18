"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Define the Wishlist item type
interface WishlistItem {
  id: number;
  product_id: number;
  product_name: string;
  added_at: string;
}

interface WishlistButtonProps {
  productId: number;
  className?: string;
}

export default function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const checkWishlistStatus = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: WishlistItem[] = await response.json();
      const exists = data.some((item: WishlistItem) => item.product_id === productId);
      setIsInWishlist(exists);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  }, [user, token, productId]);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, checkWishlistStatus]);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/${productId}/toggle/`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsInWishlist(data.added);
        toast.success(data.message || (data.added ? "Added to wishlist" : "Removed from wishlist"));
      } else {
        toast.error(data.error || "Failed to update wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`${className} transition-transform hover:scale-110 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full`}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <span className="text-2xl">
        {loading ? "⏳" : (isInWishlist ? "❤️" : "🤍")}
      </span>
    </button>
  );
}