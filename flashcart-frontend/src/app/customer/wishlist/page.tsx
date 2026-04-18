"use client";

import { useEffect, useState } from "react";
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
  const { token } = useAuth();
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/wishlist/${productId}/remove/`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Removed from wishlist");
        fetchWishlist();
      } else {
        toast.error("Failed to remove from wishlist");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
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
          <Link href="/" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 relative">
              <button
                onClick={() => removeFromWishlist(item.product_id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl"
                aria-label="Remove from wishlist"
              >
                ✕
              </button>
              <Link href={`/product/${item.product_id}`}>
                <div className="relative w-full h-40 mb-3">
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>
                <h4 className="font-semibold">{item.product_name}</h4>
                <p className="text-green-600 font-bold">KES {parseFloat(item.product_price).toLocaleString()}</p>
              </Link>
              <button
                onClick={() => addToCartHandler(item)}
                className="w-full mt-2 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}