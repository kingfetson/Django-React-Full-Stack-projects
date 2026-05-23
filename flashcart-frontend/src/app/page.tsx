"use client";

import { useEffect, useState, useMemo } from "react";
import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";
import ProductSkeleton from "../components/ProductSkeleton";

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
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllProducts = async () => {
    try {
      // Use environment variable for API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL is not configured. Please check your .env.local file.');
      }
      
      console.log('API URL from env:', apiUrl);
      
      let allProducts: Product[] = [];
      let page = 1;
      let hasMore = true;
      
      console.log('Fetching all products from all pages...');
      
      while (hasMore) {
        const response = await fetch(`${apiUrl}/api/products/?page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log(`Page ${page} response:`, data);
        
        let productsArray = [];
        if (data.products && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (Array.isArray(data)) {
          productsArray = data;
        } else if (data.results && Array.isArray(data.results)) {
          productsArray = data.results;
        }
        
        allProducts = [...allProducts, ...productsArray];
        console.log(`Loaded page ${page}: ${productsArray.length} products (Total: ${allProducts.length})`);
        
        hasMore = data.has_next === true;
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 10) break;
      }
      
      console.log(`Finished loading all ${allProducts.length} products`);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(c => c))];
      console.log('Categories found:', uniqueCategories);
      
      // Count products by category
      const categoryCounts: Record<string, number> = {};
      allProducts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      console.log('Products by category:', categoryCounts);
      
      setProducts(allProducts);
      setTotalPages(page - 1);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const filteredProducts = useMemo(() => {
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700">Loading all products from all pages...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-gray-100 p-4 rounded text-left mb-4">
            <p className="font-semibold">Troubleshooting:</p>
            <ol className="list-decimal list-inside text-sm mt-2">
              <li>Check if Django backend is running on port 8000</li>
              <li>Verify NEXT_PUBLIC_API_URL in .env.local</li>
              <li>Restart Next.js after changing .env.local</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <HeroBanner />

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search products..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="default">Sort by: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
          
          {/* Show total pages loaded */}
          {totalPages > 1 && (
            <div className="mt-3 text-sm text-gray-500">
              Loaded all {products.length} products from {totalPages} pages
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-4">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No products found in this category</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}