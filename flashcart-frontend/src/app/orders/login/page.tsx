"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import toast from "react-hot-toast";

export default function OrderLogin() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMsg("");
    
    // Validate email
    if (!email.trim()) {
      setErrorMsg("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email address (e.g., name@example.com)");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Optional: Verify if email has any orders before proceeding
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/orders/?email=${encodeURIComponent(email)}`);
      const orders = await response.json();
      
      if (Array.isArray(orders) && orders.length === 0) {
        setErrorMsg("No orders found for this email address. Please check and try again.");
        setIsLoading(false);
        return;
      }
      
      // Store email and proceed
      localStorage.setItem("customerEmail", email);
      toast.success(`Welcome back! Found ${orders.length} order(s).`);
      router.push("/orders");
    } catch (error) {
      // Even if API fails, still allow access (fallback)
      console.error("Error checking orders:", error);
      localStorage.setItem("customerEmail", email);
      toast.success("Proceeding to orders page");
      router.push("/orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header with icon */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-800">View Your Orders</h1>
          </div>
          
          <p className="text-gray-600 mb-6 text-center">
            Enter the email address you used when placing your order to view your order history.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg(""); // Clear error on typing
                }}
                placeholder="customer@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                  errorMsg ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span> {errorMsg}
                </p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                "View My Orders"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <Link href="/" className="text-orange-600 hover:underline inline-block">
              ← Back to Shopping
            </Link>
            <div className="text-xs text-gray-500">
              Need help? <Link href="/contact" className="text-orange-600 hover:underline">Contact Support</Link>
            </div>
          </div>
        </div>
        
        {/* Helpful tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use the email address you provided during checkout</li>
            <li>• Check your spam folder for order confirmation emails</li>
            <li>• Contact support if you need help finding your order</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}