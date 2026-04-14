
"use client";

import { useState } from "react";
import { useCartStore } from "../store/cartStore";

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

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div className="w-full h-40 mb-3 overflow-hidden rounded-lg bg-gray-200">
        <picture>
          <source srcSet={getImageSrc()} type="image/webp" />
          <source srcSet={getImageSrc()} type="image/jpeg" />
          <img
            src={getImageSrc()}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </picture>
      </div>

      <h2 className="text-lg font-semibold line-clamp-1">{product.name}</h2>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
      <p className="text-green-600 font-bold mb-3">KES {product.price}</p>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-label={`Add ${quantity} ${product.name}(s) to cart`}
      >
        Add to Cart {quantity > 1 && `(${quantity})`}
      </button>
    </div>
  );
}