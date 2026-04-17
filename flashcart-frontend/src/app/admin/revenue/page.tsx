"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Order {
  id: number;
  order_id: string;
  total_amount: string;
  status: string;
  created_at: string;
}

interface RevenueData {
  daily: { date: string; amount: number }[];
  weekly: { week: string; amount: number }[];
  monthly: { month: string; amount: number }[];
  yearly: { year: string; amount: number }[];
}

interface Stats {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  topProducts: { name: string; sales: number; revenue: number }[];
}

export default function AdminRevenue() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [revenueData, setRevenueData] = useState<RevenueData>({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchRevenueData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const orders: Order[] = await response.json();

      // Process data for different periods
      const now = new Date();
      
      // Daily data (last 30 days)
      const dailyData: { [key: string]: number } = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = 0;
      }
      
      // Weekly data (last 12 weeks)
      const weeklyData: { [key: string]: number } = {};
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
        const weekKey = `Week ${Math.abs(i - 11) + 1}`;
        weeklyData[weekKey] = 0;
      }
      
      // Monthly data (last 12 months)
      const monthlyData: { [key: string]: number } = {};
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = 0;
      }
      
      // Yearly data (last 5 years)
      const yearlyData: { [key: string]: number } = {};
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        yearlyData[year.toString()] = 0;
      }

      // Calculate statistics
      let totalRevenue = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      let cancelledOrders = 0;
      
      orders.forEach(order => {
        const amount = parseFloat(order.total_amount);
        totalRevenue += amount;
        
        if (order.status === 'delivered') completedOrders++;
        if (order.status === 'pending') pendingOrders++;
        if (order.status === 'cancelled') cancelledOrders++;
        
        const orderDate = new Date(order.created_at);
        const dateStr = order.created_at.split('T')[0];
        
        // Aggregate daily
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr] += amount;
        }
        
        // Aggregate weekly
        const weekNum = Math.ceil((orderDate.getDate() + (orderDate.getDay() || 7)) / 7);
        const weekKey = `Week ${weekNum}`;
        if (weeklyData[weekKey] !== undefined) {
          weeklyData[weekKey] += amount;
        }
        
        // Aggregate monthly
        const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += amount;
        }
        
        // Aggregate yearly
        const yearKey = orderDate.getFullYear().toString();
        if (yearlyData[yearKey] !== undefined) {
          yearlyData[yearKey] += amount;
        }
      });
      
      // Calculate average order value
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      // Top products (simplified - in production, you'd need a proper endpoint)
      const topProducts = [
        { name: "Wireless Headphones", sales: 45, revenue: 15750 },
        { name: "Smart Watch", sales: 32, revenue: 12800 },
        { name: "Laptop Stand", sales: 28, revenue: 4200 },
        { name: "USB-C Hub", sales: 25, revenue: 2500 },
        { name: "Phone Case", sales: 22, revenue: 1100 },
      ];
      
      setRevenueData({
        daily: Object.entries(dailyData).map(([date, amount]) => ({ date, amount })),
        weekly: Object.entries(weeklyData).map(([week, amount]) => ({ week, amount })),
        monthly: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
        yearly: Object.entries(yearlyData).map(([year, amount]) => ({ year, amount })),
      });
      
      setStats({
        totalRevenue,
        averageOrderValue,
        totalOrders: orders.length,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        topProducts,
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const getChartData = () => {
    switch (period) {
      case 'daily':
        return {
          labels: revenueData.daily.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Revenue (KES)',
            data: revenueData.daily.map(d => d.amount),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
          }]
        };
      case 'weekly':
        return {
          labels: revenueData.weekly.map(w => w.week),
          datasets: [{
            label: 'Revenue (KES)',
            data: revenueData.weekly.map(w => w.amount),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1,
          }]
        };
      case 'monthly':
        return {
          labels: revenueData.monthly.map(m => m.month),
          datasets: [{
            label: 'Revenue (KES)',
            data: revenueData.monthly.map(m => m.amount),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
          }]
        };
      case 'yearly':
        return {
          labels: revenueData.yearly.map(y => y.year),
          datasets: [{
            label: 'Revenue (KES)',
            data: revenueData.yearly.map(y => y.amount),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1,
          }]
        };
    }
  };

  const getDonutChartData = () => ({
    labels: ['Delivered', 'Pending', 'Cancelled'],
    datasets: [{
      data: [stats.completedOrders, stats.pendingOrders, stats.cancelledOrders],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `KES ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `KES ${value.toLocaleString()}`
        }
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Revenue Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Revenue Analytics">
      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg capitalize ${
              period === p
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">KES {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-sm">Average Order Value</p>
          <p className="text-3xl font-bold text-blue-600">KES {stats.averageOrderValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-sm">Completion Rate</p>
          <p className="text-3xl font-bold text-orange-600">
            {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Revenue Trend</h3>
        <div className="h-96">
          {period === 'weekly' ? (
            <Bar data={getChartData()} options={chartOptions} />
          ) : (
            <Line data={getChartData()} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Order Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={getDonutChartData()} options={donutOptions} />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Top Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.sales} units sold</p>
                </div>
                <p className="font-semibold text-green-600">KES {product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="font-semibold text-lg p-6 border-b">Revenue Summary by Period</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4">Period</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Orders</th>
                <th className="text-right py-3 px-4">Average Order</th>
              </tr>
            </thead>
            <tbody>
              {period === 'daily' && revenueData.daily.slice(-7).map((day, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">KES {day.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                </tr>
              ))}
              {period === 'monthly' && revenueData.monthly.map((month, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{month.month}</td>
                  <td className="py-3 px-4 text-right">KES {month.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                </tr>
              ))}
              {period === 'yearly' && revenueData.yearly.map((year, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{year.year}</td>
                  <td className="py-3 px-4 text-right">KES {year.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">—</td>
                  <td className="py-3 px-4 text-right">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}