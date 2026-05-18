// src/app/customer/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Define proper types
interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface RecentOrder {
  id: number;
  order_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface WishlistItem {
  id: number;
  product_name: string;
  product_price: number;
  product_image?: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  wishlistItems: WishlistItem[];
}

export default function CustomerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    // Don't proceed if no token
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Fetch orders
      const ordersResponse = await fetch(`${apiUrl}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
      }
      
      const orders: RecentOrder[] = await ordersResponse.json();
      
      // Fetch wishlist
      const wishlistResponse = await fetch(`${apiUrl}/api/wishlist/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!wishlistResponse.ok) {
        throw new Error(`Failed to fetch wishlist: ${wishlistResponse.status}`);
      }
      
      const wishlistItems: WishlistItem[] = await wishlistResponse.json();
      
      // Calculate statistics
      const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      
      const stats: DashboardStats = {
        totalOrders: orders.length,
        totalSpent: totalSpent,
        wishlistCount: wishlistItems.length,
        pendingOrders: pendingOrders,
        deliveredOrders: deliveredOrders,
      };
      
      // Get recent orders (last 5)
      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setDashboardData({
        stats,
        recentOrders,
        wishlistItems: wishlistItems.slice(0, 5),
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [token, fetchDashboardData]);

  const getStatusBadgeClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      delivered: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
    };
    return statusClasses[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Please Login</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to view your dashboard.</p>
          <Link href="/login" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const { stats, recentOrders, wishlistItems } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-orange-600">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p className="text-gray-500 text-sm">Total Spent</p>
          <p className="text-3xl font-bold text-green-600">KES {stats.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p className="text-gray-500 text-sm">Wishlist Items</p>
          <p className="text-3xl font-bold text-purple-600">{stats.wishlistCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <p className="text-gray-500 text-sm">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/customer/orders" className="text-orange-600 hover:text-orange-700 transition-colors">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders yet. Start shopping!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm">{order.order_id}</td>
                    <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">KES {order.total_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link 
                        href={`/customer/orders/${order.id}`} 
                        className="text-orange-600 hover:text-orange-700 text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Wishlist Preview */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Wishlist Items</h2>
          <Link href="/customer/wishlist" className="text-orange-600 hover:text-orange-700 transition-colors">
            View All →
          </Link>
        </div>
        <div className="p-6">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Your wishlist is empty. Start adding items!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md transition-all">
                  {item.product_image && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.product_name}</h3>
                    <p className="text-orange-600 font-bold">KES {item.product_price.toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/product/${item.id}`}
                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}