"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "../store/cartStore";
import WishlistButton from "./WishlistButton";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useCartStore();

  const getImageSrc = () => {
    if (imgError) {
      return `https://picsum.photos/400/300?random=${product.id}`;
    }
    return product.image;
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, Math.min(newQuantity, 99))); // Limit to 99 max
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-all transform hover:-translate-y-1 relative">
      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={product.id} className="text-2xl" />
      </div>

      <Link href={`/product/${product.id}`}>
        <div className="relative w-full h-40 mb-3 overflow-hidden rounded-lg bg-gray-200">
          <Image
            src={getImageSrc()}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-lg hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>

        <h2 className="text-lg font-semibold line-clamp-1 hover:text-orange-600 transition-colors">
          {product.name}
        </h2>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        <p className="text-green-600 font-bold text-xl mb-3">
          KES {parseFloat(product.price).toLocaleString()}
        </p>
      </Link>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Increase quantity"
          disabled={quantity >= 99}
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Add ${quantity} ${product.name}${quantity > 1 ? 's' : ''} to cart`}
      >
        Add to Cart {quantity > 1 && `(${quantity})`}
      </button>
    </div>
  );
}