"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  stock: number;
  price?: string;
}

interface SalesDataPoint {
  date: string;
  amount: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  salesData: SalesDataPoint[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
    lowStockProducts: [],
    salesData: [],
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Fetch orders
      const ordersRes = await fetch(`${apiUrl}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const orders: Order[] = await ordersRes.json();
      
      // Fetch products
      const productsRes = await fetch(`${apiUrl}/api/products/`);
      const products: Product[] = await productsRes.json();
      
      // Calculate stats
      const totalRevenue = orders.reduce((sum: number, order: Order) => sum + parseFloat(order.total_amount), 0);
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const totalCustomers = [...new Set(orders.map((o: Order) => o.customer_email))].length;
      
      // Recent orders (last 5)
      const recentOrders = orders.slice(0, 5);
      
      // Low stock products (stock < 10)
      const lowStockProducts = products.filter((p: Product) => p.stock < 10).slice(0, 5);
      
      // Sales data for chart (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const salesData: SalesDataPoint[] = last7Days.map(date => ({
        date,
        amount: orders
          .filter((order: Order) => order.created_at?.split('T')[0] === date)
          .reduce((sum: number, order: Order) => sum + parseFloat(order.total_amount), 0)
      }));
      
      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        recentOrders,
        lowStockProducts,
        salesData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon="💰" color="text-green-600" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon="📦" color="text-blue-600" />
        <StatCard title="Total Products" value={stats.totalProducts} icon="🛍️" color="text-purple-600" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon="👥" color="text-orange-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Last 7 Days Sales</h3>
          <div className="h-64 flex items-end gap-2">
            {stats.salesData.map((data, index) => {
              const maxAmount = Math.max(...stats.salesData.map(d => d.amount), 1);
              const height = (data.amount / maxAmount) * 200;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-orange-100 rounded-t" style={{ height: `${height}px` }}>
                    <div className="w-full bg-orange-500 rounded-t h-full" style={{ height: `${(data.amount / maxAmount) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-xs font-semibold">KES {data.amount.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span>⚠️</span> Low Stock Products
          </h3>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All products have sufficient stock</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock} units</p>
                  </div>
                  <button className="text-orange-600 text-sm hover:underline">Restock</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Order ID</th>
                <th className="text-left py-3">Customer</th>
                <th className="text-left py-3">Total</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.order_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-mono text-sm">{order.order_id}</td>
                  <td className="py-3">{order.customer_name}</td>
                  <td className="py-3">KES {parseFloat(order.total_amount).toLocaleString()}</td>
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
                  <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <button className="text-orange-600 hover:underline text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}