"use client";

import Link from "next/link";
import { useCartStore } from "../store/cartStore";

export default function Navigation() {
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <nav className="bg-orange-600 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-white hover:text-orange-100 transition">
            FlashCart Pro 🛒
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-orange-100 transition font-medium">
              Home
            </Link>
            <Link href="/cart" className="text-white hover:text-orange-100 transition font-medium">
              Cart
            </Link>
            <Link href="/orders" className="text-white hover:text-orange-100 transition font-medium">
  My Orders
</Link>
            <Link href="/contact" className="text-white hover:text-orange-100 transition font-medium">
              Contact
            </Link>
            <Link
              href="/cart"
              className="bg-white text-orange-600 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold hover:bg-orange-50 transition"
            >
              🛒 Cart
              {totalItems > 0 && (
                <span className="bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button - You can add mobile menu if needed */}
        </div>
      </div>
    </nav>
  );
}