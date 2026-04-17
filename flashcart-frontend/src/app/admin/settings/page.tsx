"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_description: string;
  store_logo: string;
  free_shipping_threshold: string;
  shipping_cost: string;
  tax_rate: string;
  payment_methods: string[];
  currency: string;
  order_prefix: string;
  auto_confirm_order: boolean;
  send_order_confirmation: boolean;
  send_payment_confirmation: boolean;
  send_shipping_update: boolean;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { token } = useAuth();

  const fetchSettings = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/settings/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/settings/`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Fixed: Replaced 'any' with proper union type
  const updateSetting = (key: string, value: string | number | boolean | string[]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const togglePaymentMethod = (method: string) => {
    if (!settings) return;
    const current = settings.payment_methods;
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    updateSetting("payment_methods", updated);
  };

  if (loading || !settings) {
    return (
      <AdminLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: "general", label: "🏪 General", icon: "🏪" },
    { id: "shipping", label: "🚚 Shipping", icon: "🚚" },
    { id: "payment", label: "💳 Payment", icon: "💳" },
    { id: "notifications", label: "📧 Notifications", icon: "📧" },
    { id: "social", label: "📱 Social Media", icon: "📱" },
  ];

  return (
    <AdminLayout title="Store Settings">
      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-2 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* General Settings Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Store Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => updateSetting("store_name", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Store Email</label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => updateSetting("store_email", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Store Phone</label>
                  <input
                    type="text"
                    value={settings.store_phone}
                    onChange={(e) => updateSetting("store_phone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting("currency", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Store Address</label>
                  <textarea
                    rows={2}
                    value={settings.store_address}
                    onChange={(e) => updateSetting("store_address", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Store Description</label>
                  <textarea
                    rows={3}
                    value={settings.store_description}
                    onChange={(e) => updateSetting("store_description", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Brief description of your store..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Store Logo URL</label>
                  <input
                    type="url"
                    value={settings.store_logo}
                    onChange={(e) => updateSetting("store_logo", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shipping Settings Tab */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Shipping Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Free Shipping Threshold (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => updateSetting("free_shipping_threshold", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Standard Shipping Cost (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shipping_cost}
                    onChange={(e) => updateSetting("shipping_cost", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting("tax_rate", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order ID Prefix</label>
                  <input
                    type="text"
                    value={settings.order_prefix}
                    onChange={(e) => updateSetting("order_prefix", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.auto_confirm_order}
                      onChange={(e) => updateSetting("auto_confirm_order", e.target.checked)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm">Auto-confirm orders after payment</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings Tab */}
          {activeTab === "payment" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes("paystack")}
                    onChange={() => togglePaymentMethod("paystack")}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">Paystack</span>
                  <span className="text-sm text-gray-500">Card payments, Bank transfers, Mobile money</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes("mpesa")}
                    onChange={() => togglePaymentMethod("mpesa")}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">M-Pesa</span>
                  <span className="text-sm text-gray-500">Direct M-Pesa payments (Kenya)</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment_methods.includes("card")}
                    onChange={() => togglePaymentMethod("card")}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">Credit/Debit Card</span>
                  <span className="text-sm text-gray-500">Visa, Mastercard, Amex</span>
                </label>
              </div>
            </div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.send_order_confirmation}
                    onChange={(e) => updateSetting("send_order_confirmation", e.target.checked)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">Order Confirmation</span>
                  <span className="text-sm text-gray-500">Send email when customer places an order</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.send_payment_confirmation}
                    onChange={(e) => updateSetting("send_payment_confirmation", e.target.checked)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">Payment Confirmation</span>
                  <span className="text-sm text-gray-500">Send email when payment is confirmed</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.send_shipping_update}
                    onChange={(e) => updateSetting("send_shipping_update", e.target.checked)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium">Shipping Updates</span>
                  <span className="text-sm text-gray-500">Send email when order is shipped</span>
                </label>
              </div>
            </div>
          )}

          {/* Social Media Settings Tab */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={settings.facebook_url}
                    onChange={(e) => updateSetting("facebook_url", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="https://facebook.com/yourstore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Twitter URL</label>
                  <input
                    type="url"
                    value={settings.twitter_url}
                    onChange={(e) => updateSetting("twitter_url", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="https://twitter.com/yourstore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) => updateSetting("instagram_url", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="https://instagram.com/yourstore"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}