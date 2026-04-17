"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_discount: string | null;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "0",
    max_discount: "",
    valid_from: "",
    valid_to: "",
    usage_limit: "1",
    per_user_limit: "1",
    is_active: true,
  });

  const fetchCoupons = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/coupons/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = editingCoupon 
        ? `${apiUrl}/api/coupons/${editingCoupon.id}/` 
        : `${apiUrl}/api/coupons/`;
      const method = editingCoupon ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          min_order_amount: parseFloat(formData.min_order_amount),
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to,
          usage_limit: parseInt(formData.usage_limit),
          per_user_limit: parseInt(formData.per_user_limit),
          is_active: formData.is_active,
        }),
      });
      
      if (response.ok) {
        toast.success(editingCoupon ? "Coupon updated" : "Coupon created");
        fetchCoupons();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Failed to save coupon");
    }
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/coupons/${id}/`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        toast.error("Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "0",
      max_discount: "",
      valid_from: "",
      valid_to: "",
      usage_limit: "1",
      per_user_limit: "1",
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount: coupon.max_discount || "",
      valid_from: coupon.valid_from.split('Z')[0].slice(0, 16),
      valid_to: coupon.valid_to.split('Z')[0].slice(0, 16),
      usage_limit: coupon.usage_limit.toString(),
      per_user_limit: coupon.per_user_limit.toString(),
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/coupons/${coupon.id}/`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...coupon, is_active: !coupon.is_active }),
      });
      
      if (response.ok) {
        toast.success(`Coupon ${!coupon.is_active ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        toast.error("Failed to update coupon status");
      }
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("Failed to update coupon status");
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <AdminLayout title="Coupons">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Coupon Management">
      <div className="mb-4">
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          + Add New Coupon
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-left py-3 px-4">Discount</th>
                <th className="text-left py-3 px-4">Min Order</th>
                <th className="text-left py-3 px-4">Valid Period</th>
                <th className="text-left py-3 px-4">Uses</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold">{coupon.code}</td>
                  <td className="py-3 px-4">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}% OFF`
                      : `KES ${parseFloat(coupon.discount_value).toLocaleString()} OFF`}
                  </td>
                  <td className="py-3 px-4">
                    {parseFloat(coupon.min_order_amount) > 0 
                      ? `KES ${parseFloat(coupon.min_order_amount).toLocaleString()}`
                      : 'No minimum'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(coupon.valid_from).toLocaleDateString()} - <br/>
                    {new Date(coupon.valid_to).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {coupon.used_count} / {coupon.usage_limit}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCouponStatus(coupon)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(coupon.is_active)}`}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => editCoupon(coupon)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => deleteCoupon(coupon.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{editingCoupon ? "Edit Coupon" : "Add Coupon"}</h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    placeholder="SAVE20"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Type</label>
                    <select 
                      value={formData.discount_type} 
                      onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (KES)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Value *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.discount_value} 
                      onChange={(e) => setFormData({...formData, discount_value: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.min_order_amount} 
                      onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Discount (Optional)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.max_discount} 
                      onChange={(e) => setFormData({...formData, max_discount: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Valid From *</label>
                    <input 
                      type="datetime-local" 
                      value={formData.valid_from} 
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valid To *</label>
                    <input 
                      type="datetime-local" 
                      value={formData.valid_to} 
                      onChange={(e) => setFormData({...formData, valid_to: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Usage Limit</label>
                    <input 
                      type="number" 
                      value={formData.usage_limit} 
                      onChange={(e) => setFormData({...formData, usage_limit: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Per User Limit</label>
                    <input 
                      type="number" 
                      value={formData.per_user_limit} 
                      onChange={(e) => setFormData({...formData, per_user_limit: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium">Active</label>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition"
                >
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}