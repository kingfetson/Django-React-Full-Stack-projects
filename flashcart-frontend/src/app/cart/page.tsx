"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "../../store/cartStore";
import PaystackPayment from "@/components/PaystackPayment";

// Define the order type
interface Order {
  id: string;
  email: string;
  amount: number;
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    clearCart,
    loadCart,
    getTotalPrice,
  } = useCartStore();

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const totalPrice = getTotalPrice();
  const shipping = totalPrice > 5000 ? 0 : 299;
  const tax = totalPrice * 0.16;
  const grandTotal = totalPrice + shipping + tax;

  const createOrder = async () => {
    // Validate shipping info
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city) {
      alert("Please fill in all required fields");
      return false;
    }

    setIsCreatingOrder(true);

    const orderData = {
      customer_name: shippingInfo.name,
      customer_email: shippingInfo.email,
      customer_phone: shippingInfo.phone,
      shipping_address: shippingInfo.address,
      city: shippingInfo.city,
      postal_code: shippingInfo.postalCode,
      payment_method: "paystack",
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Store customer email and name for orders page
        localStorage.setItem("customerEmail", shippingInfo.email);
        localStorage.setItem("customerName", shippingInfo.name);
        
        setCurrentOrder({
          id: result.order_id,
          email: shippingInfo.email,
          amount: grandTotal
        });
        setShowPayment(true);
        return true;
      } else {
        alert(`Failed to create order: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Error creating order. Please try again.");
      return false;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/verify-payment/?reference=${reference}`);
      const result = await response.json();
      
      if (result.success) {
        alert(`Payment successful! Your order ${result.order_id} is now being processed.`);
        clearCart();
        setShowPayment(false);
        setCurrentOrder(null);
        // Reset shipping form
        setShippingInfo({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          postalCode: "",
        });
        // Redirect to order confirmation page
        window.location.href = `/order-confirmation?order_id=${result.order_id}`;
      } else {
        alert("Payment verification failed. Please contact support.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Error verifying payment. Please contact support.");
    }
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setCurrentOrder(null);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
            ← Back to Shopping
          </Link>
          
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Looks like you haven&apos;t added any items yet</p>
            <Link
              href="/"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition inline-block"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Shopping
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow flex gap-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold text-lg">{item.name}</h2>
                  <p className="text-green-600 font-bold">KES {item.price}</p>
                  <p className="text-sm text-gray-500">
                    Subtotal: KES {(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(item.id)}
                      className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 transition text-sm"
            >
              Clear All Items
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-2 border-b pb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>KES {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `KES ${shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (16% VAT)</span>
                  <span>KES {tax.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-4 text-xl font-bold">
                <span>Total</span>
                <span className="text-green-600">KES {grandTotal.toFixed(2)}</span>
              </div>

              {/* Show payment component if order is created */}
              {showPayment && currentOrder ? (
                <PaystackPayment
                  orderId={currentOrder.id}
                  email={currentOrder.email}
                  amount={currentOrder.amount}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                />
              ) : (
                <>
                  {/* Shipping Info Form */}
                  <div className="mt-6 space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="text"
                      placeholder="Delivery Address *"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <button
                    onClick={createOrder}
                    disabled={isCreatingOrder || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city}
                    className={`mt-6 w-full bg-green-600 text-white py-3 rounded-lg transition ${
                      isCreatingOrder || !shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-700"
                    }`}
                  >
                    {isCreatingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Order...
                      </span>
                    ) : (
                      "Proceed to Pay"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}