"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CustomerLayout from "@/components/CustomerLayout";

interface WishlistItem {
  id: number;
  name: string;
  price: string;
  image: string;
}

export default function CustomerWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

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
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="relative w-full h-40 mb-3">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                  unoptimized
                />
              </div>
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-green-600 font-bold">KES {item.price}</p>
              <button className="w-full mt-2 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}