"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface WishlistItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string;
  product_image: string;
  added_at: string;
}

export default function CustomerWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { token } = useAuth();
  const { addToCart } = useCartStore();

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeFromWishlist = async (productId: number) => {
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    
    setRemovingId(productId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/${productId}/remove/`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Removed from wishlist");
        // Refresh wishlist after removal
        await fetchWishlist();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove from wishlist");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  const addToCartHandler = (item: WishlistItem) => {
    addToCart({
      id: item.product_id,
      name: item.product_name,
      price: item.product_price,
      image: item.product_image,
    });
    toast.success(`${item.product_name} added to cart`);
  };

  if (loading) {
    return (
      <CustomerLayout title="My Wishlist">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="My Wishlist">
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save your favorite items here!</p>
          <Link 
            href="/" 
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in your wishlist
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 relative hover:shadow-lg transition-shadow group">
                <button
                  onClick={() => removeFromWishlist(item.product_id)}
                  disabled={removingId === item.product_id}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove from wishlist"
                >
                  {removingId === item.product_id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "✕"
                  )}
                </button>
                
                <Link href={`/product/${item.product_id}`}>
                  <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                  <h4 className="font-semibold text-lg mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {item.product_name}
                  </h4>
                  <p className="text-green-600 font-bold text-xl">
                    KES {parseFloat(item.product_price).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </p>
                </Link>
                
                <button
                  onClick={() => addToCartHandler(item)}
                  className="w-full mt-3 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </CustomerLayout>
  );
}