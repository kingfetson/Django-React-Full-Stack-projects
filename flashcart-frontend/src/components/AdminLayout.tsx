"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'admin' && !user?.is_superuser) {
      router.push('/');
    }
  }, [user, router]);

  const menuItems = [
    { icon: "📊", label: "Dashboard", href: "/admin" },
    { icon: "📦", label: "Orders", href: "/admin/orders" },
    { icon: "🛍️", label: "Products", href: "/admin/products" },
    { icon: "👥", label: "Customers", href: "/admin/customers" },
    { icon: "💰", label: "Revenue", href: "/admin/revenue" },
    { icon: "🏷️", label: "Coupons", href: "/admin/coupons" },
    { icon: "⚙️", label: "Settings", href: "/admin/settings" },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-100">
        {/* Top Navigation */}
        <nav className="bg-white shadow-md sticky top-0 z-20">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`bg-white shadow-lg min-h-screen transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
            <nav className="mt-6">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition group"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            </div>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}