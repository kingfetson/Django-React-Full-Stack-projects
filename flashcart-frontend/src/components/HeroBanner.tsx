"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Flash Sale! 20% Off",
      description: "Use code FLASH20 at checkout",
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop",
      bgColor: "from-orange-600 to-red-600",
    },
    {
      title: "Free Shipping",
      description: "On orders over KES 5000",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
      bgColor: "from-blue-600 to-blue-800",
    },
    {
      title: "New Arrivals",
      description: "Check out our latest products",
      image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&h=400&fit=crop",
      bgColor: "from-purple-600 to-purple-800",
    },
    {
      title: "Premium Quality",
      description: "Best electronics and accessories",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop",
      bgColor: "from-green-600 to-teal-600",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative rounded-xl overflow-hidden mb-8 shadow-lg">
      {/* Background Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <Image
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className={`absolute inset-0 bg-linear-to-r ${slides[currentSlide].bgColor} opacity-80`}></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-2 animate-fade-in">
            {slides[currentSlide].title}
          </h2>
          <p className="text-lg md:text-xl mb-4 animate-fade-in-delayed">
            {slides[currentSlide].description}
          </p>
          <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105">
            Shop Now →
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === index 
                ? "w-8 h-2 bg-white" 
                : "w-2 h-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}