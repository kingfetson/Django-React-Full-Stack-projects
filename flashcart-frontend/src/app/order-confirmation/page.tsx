"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// Remove unused Image import
import Layout from "@/components/Layout";
// Remove unused useAuth import
// import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
  product?: {
    id: number;
    image: string;
  };
}

interface Order {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Remove unused user variable
  // const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${apiUrl}/api/orders/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to load order details. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const getEstimatedDeliveryDate = () => {
    if (!order) return 'Processing...';
    
    const createdDate = new Date(order.created_at);
    const deliveryDate = new Date(createdDate);
    
    switch (order.status) {
      case 'pending':
        deliveryDate.setDate(createdDate.getDate() + 5);
        break;
      case 'processing':
        deliveryDate.setDate(createdDate.getDate() + 3);
        break;
      case 'shipped':
        deliveryDate.setDate(createdDate.getDate() + 2);
        break;
      case 'delivered':
        return 'Delivered';
      default:
        deliveryDate.setDate(createdDate.getDate() + 7);
    }
    
    return deliveryDate.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrackingInfo = () => {
    if (!order) return null;
    
    switch (order.status) {
      case 'pending':
        return {
          status: 'Order Confirmed',
          message: 'Your order has been confirmed and is being processed.',
          steps: ['Order Placed', 'Processing', 'Shipped', 'Delivered'],
          currentStep: 0,
        };
      case 'processing':
        return {
          status: 'Processing',
          message: 'Your order is being prepared for shipment.',
          steps: ['Order Placed', 'Processing', 'Shipped', 'Delivered'],
          currentStep: 1,
        };
      case 'shipped':
        return {
          status: 'Shipped',
          message: 'Your order has been shipped and is on its way.',
          trackingNumber: `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          carrier: 'FlashCart Logistics',
          steps: ['Order Placed', 'Processing', 'Shipped', 'Delivered'],
          currentStep: 2,
        };
      case 'delivered':
        return {
          status: 'Delivered',
          message: 'Your order has been delivered successfully.',
          steps: ['Order Placed', 'Processing', 'Shipped', 'Delivered'],
          currentStep: 3,
        };
      default:
        return null;
    }
  };

  const downloadInvoice = async () => {
    if (!order) return;
    
    setDownloadingInvoice(true);
    
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.order_id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f97316;
          }
          .invoice-title {
            font-size: 28px;
            color: #f97316;
            margin-bottom: 5px;
          }
          .invoice-subtitle {
            color: #666;
            font-size: 14px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .info-section h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .info-section p {
            margin: 5px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
          }
          .totals {
            width: 300px;
            margin-left: auto;
          }
          .totals tr td {
            border: none;
            padding: 8px;
          }
          .totals tr:last-child td {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #f97316;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">FlashCart Pro</div>
          <div class="invoice-subtitle">Invoice #${order.order_id}</div>
        </div>
        
        <div class="order-info">
          <div class="info-section">
            <h3>Bill To:</h3>
            <p>${order.customer_name}</p>
            <p>${order.customer_email}</p>
            <p>${order.customer_phone || 'No phone'}</p>
          </div>
          <div class="info-section">
            <h3>Ship To:</h3>
            <p>${order.shipping_address}</p>
            <p>${order.city}, ${order.postal_code || ''}</p>
          </div>
          <div class="info-section">
            <h3>Order Details:</h3>
            <p>Order Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            <p>Payment Method: ${order.payment_method}</p>
            <p>Payment Status: ${order.payment_status}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>KES ${parseFloat(item.price).toLocaleString()}</td>
                <td>KES ${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <table class="totals">
          <tr><td>Subtotal:</td><td>KES ${(parseFloat(order.total_amount) / 1.16).toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>
          <tr><td>Shipping:</td><td>${parseFloat(order.total_amount) > 5000 ? 'Free' : 'KES 299'}</td></tr>
          <tr><td>Tax (16% VAT):</td><td>KES ${(parseFloat(order.total_amount) - (parseFloat(order.total_amount) / 1.16)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>
          <tr><td><strong>Total:</strong></td><td><strong>KES ${parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td></tr>
        </table>
        
        <div class="footer">
          <p>Thank you for shopping with FlashCart Pro!</p>
          <p>For any inquiries, please contact support@flashcartpro.com</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${order.order_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadingInvoice(false);
  };

  const trackingInfo = getTrackingInfo();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold mb-4">Unable to Load Order</h1>
          <p className="text-gray-600 mb-8">{error || 'Order not found'}</p>
          <Link href="/" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            Continue Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Order ID: <span className="font-mono font-semibold">{order.order_id}</span>
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-orange-600 px-6 py-3">
              <h2 className="text-white font-semibold">Order Summary</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-semibold text-gray-700">Product</th>
                      <th className="text-center py-3 font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 font-semibold text-gray-700">Price</th>
                      <th className="text-right py-3 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                              📦
                            </div>
                            <span className="font-medium">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3">{item.quantity}</td>
                        <td className="text-right py-3">KES {parseFloat(item.price).toLocaleString()}</td>
                        <td className="text-right py-3 font-medium">
                          KES {(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tbody className="border-t">
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">Subtotal:</td>
                      <td className="text-right py-2">KES {(parseFloat(order.total_amount) / 1.16).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">Shipping:</td>
                      <td className="text-right py-2">{parseFloat(order.total_amount) > 5000 ? 'Free' : 'KES 299'}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">Tax (16% VAT):</td>
                      <td className="text-right py-2">KES {(parseFloat(order.total_amount) - (parseFloat(order.total_amount) / 1.16)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr className="border-t-2 border-orange-600">
                      <td colSpan={3} className="text-right py-3 font-bold text-lg">Total:</td>
                      <td className="text-right py-3 font-bold text-lg text-green-600">
                        KES {parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Delivery & Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>🚚</span> Delivery Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Estimated Delivery Date</p>
                  <p className="font-medium text-green-600">{getEstimatedDeliveryDate()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">{order.shipping_address}</p>
                  <p className="text-gray-600">{order.city}, {order.postal_code}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>📦</span> Tracking Information
              </h3>
              {trackingInfo ? (
                <div>
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trackingInfo.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">{trackingInfo.message}</p>
                  </div>
                  
                  {trackingInfo.trackingNumber && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-mono font-medium">{trackingInfo.trackingNumber}</p>
                      <p className="text-sm text-gray-500 mt-1">Carrier: {trackingInfo.carrier}</p>
                    </div>
                  )}

                  {/* Tracking Steps */}
                  <div className="mt-4">
                    <div className="flex justify-between">
                      {trackingInfo.steps.map((step, index) => (
                        <div key={step} className="flex-1 text-center">
                          <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                            index <= trackingInfo.currentStep ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {index < trackingInfo.currentStep ? '✓' : index + 1}
                          </div>
                          <p className={`text-xs mt-2 ${
                            index <= trackingInfo.currentStep ? 'text-orange-600 font-medium' : 'text-gray-400'
                          }`}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Tracking information will be available soon.</p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span>👤</span> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{order.customer_phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={downloadInvoice}
              disabled={downloadingInvoice}
              className="flex items-center justify-center gap-2 bg-white border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition disabled:opacity-50"
            >
              {downloadingInvoice ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                  Generating...
                </>
              ) : (
                <>
                  📄 Download Invoice
                </>
              )}
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              🛒 Continue Shopping
            </Link>
            {order.status !== 'delivered' && (
              <Link
                href={`/track-order?order_id=${order.order_id}`}
                className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                📍 Track Order
              </Link>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help with your order?</p>
            <Link href="/contact" className="text-orange-600 hover:underline">
              Contact Customer Support
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}