"use client";

import { useEffect, useState, useMemo } from "react";
import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";
import Layout from "@/components/Layout";

// Add the Product type definition
type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  created_at: string;
  category?: string;
};

const categories = ["All", "Electronics", "Office", "Accessories", "Kitchen"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error('API URL is not configured');
        }
        
        const response = await fetch(`${apiUrl}/api/products/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    // Use let instead of const since we need to modify it
    let result = [...products];

    if (searchTerm && searchTerm.trim()) {
      result = result.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price_desc":
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <HeroBanner />

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search products..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <select
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="default">Sort by: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}