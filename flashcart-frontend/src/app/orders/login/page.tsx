"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Add this import
import Layout from "@/components/Layout";

export default function OrderLogin() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    
    localStorage.setItem("customerEmail", email);
    router.push("/orders");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">View Your Orders</h1>
          <p className="text-gray-600 mb-6 text-center">
            Enter the email address you used when placing your order
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition"
            >
              View My Orders
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-orange-600 hover:underline">
              ← Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}