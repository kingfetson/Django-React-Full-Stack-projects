"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";

interface Order {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  payment_status: string;
  created_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();

  useEffect(() => {
    const customerEmail = localStorage.getItem("customerEmail");
    if (!customerEmail) {
      router.push("/orders/login");
      return;
    }
    fetchOrders(customerEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // router is stable, no need to include

  const fetchOrders = async (customerEmail: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiUrl}/api/orders/?email=${encodeURIComponent(customerEmail)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/`);
      
      if (!response.ok) throw new Error("Failed to fetch order details");
      
      const data = await response.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error("Error fetching order details:", err);
      alert("Failed to load order details");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid" ? "bg-green-500" : "bg-yellow-500";
  };

  const handleLogout = () => {
    localStorage.removeItem("customerEmail");
    localStorage.removeItem("customerName");
    router.push("/orders/login");
  };

  const customerName = localStorage.getItem("customerName");

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <div className="flex gap-4 items-center">
            {customerName && (
              <span className="text-gray-600">Welcome, {customerName}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-orange-600 hover:text-orange-700 text-sm"
            >
              Change Email
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-mono font-semibold">{order.order_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold text-green-600">KES {order.total_amount}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => fetchOrderDetails(order.order_id)}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono font-semibold">{selectedOrder.order_id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Customer Information</p>
                    <p>{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.customer_email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <div className="space-y-2 mt-2">
                      {selectedOrder.items?.map((item: OrderItem, index: number) => (
                        <div key={index} className="flex justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">KES {item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-green-600">KES {selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}