"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: number;
  order_id: string;
  total_amount: string;
  status: string;
  created_at: string;
}

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export default function CustomerDashboard() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const orders: Order[] = await response.json();
      
      // Calculate stats
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      
      setStats({ totalOrders, totalSpent, pendingOrders, deliveredOrders });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <CustomerLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Dashboard">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 mb-8 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name || 'Customer'}!
        </h3>
        <p className="opacity-90">
          Track your orders, manage your account, and discover new products.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Orders" value={stats.totalOrders} icon="📦" color="text-blue-600" />
        <StatCard title="Total Spent" value={`KES ${stats.totalSpent.toLocaleString()}`} icon="💰" color="text-green-600" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon="⏳" color="text-yellow-600" />
        <StatCard title="Delivered" value={stats.deliveredOrders} icon="✅" color="text-purple-600" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <Link href="/customer/orders" className="text-orange-600 hover:underline text-sm">
            View All →
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet. Start shopping!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Order ID</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-right py-3">Total</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.order_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-mono text-sm">{order.order_id}</td>
                    <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">KES {parseFloat(order.total_amount).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link href={`/order-confirmation?order_id=${order.order_id}`} className="text-orange-600 hover:underline text-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/customer/profile" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
          <div className="text-3xl mb-2">👤</div>
          <h4 className="font-semibold">Update Profile</h4>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
        </Link>
        <Link href="/customer/addresses" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
          <div className="text-3xl mb-2">📍</div>
          <h4 className="font-semibold">Saved Addresses</h4>
          <p className="text-sm text-gray-500 mt-1">Add or edit shipping addresses</p>
        </Link>
        <Link href="/" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
          <div className="text-3xl mb-2">🛒</div>
          <h4 className="font-semibold">Continue Shopping</h4>
          <p className="text-sm text-gray-500 mt-1">Discover new products</p>
        </Link>
      </div>
    </CustomerLayout>
  );
}