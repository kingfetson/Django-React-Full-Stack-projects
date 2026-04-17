"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function TrackOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || "");

  const handleTrack = () => {
    if (orderId) {
      router.push(`/order-confirmation?order_id=${orderId}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📍</div>
          <h1 className="text-2xl font-bold mb-4">Track Your Order</h1>
          <p className="text-gray-600 mb-6">
            Enter your order ID to track your shipment
          </p>
          
          <input
            type="text"
            placeholder="e.g., ORD-ABC12345"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />
          
          <button
            onClick={handleTrack}
            disabled={!orderId}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            Track Order
          </button>
          
          <div className="mt-6">
            <Link href="/" className="text-orange-600 hover:underline">
              ← Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}