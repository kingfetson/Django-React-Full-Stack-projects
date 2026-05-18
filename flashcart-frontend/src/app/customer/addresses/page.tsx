"use client";

import { useState, useEffect, useCallback } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Address {
  id: number;
  name: string;
  street: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressFormData {
  name: string;
  street: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    street: "",
    city: "",
    postal_code: "",
    is_default: false,
  });

  // Fetch addresses on mount
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/addresses/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAddresses();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [fetchAddresses]);

  const resetForm = () => {
    setFormData({
      name: "",
      street: "",
      city: "",
      postal_code: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/addresses/${addressId}/`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success("Address deleted successfully");
        fetchAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.street || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const method = editingAddress ? "PUT" : "POST";
      const url = editingAddress 
        ? `${apiUrl}/api/addresses/${editingAddress.id}/`
        : `${apiUrl}/api/addresses/`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success(editingAddress ? "Address updated" : "Address added");
        resetForm();
        setShowForm(false);
        fetchAddresses();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/addresses/${addressId}/set_default/`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success("Default address updated");
        fetchAddresses();
      } else {
        toast.error("Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  if (loading) {
    return (
      <CustomerLayout title="Saved Addresses">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Saved Addresses">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Addresses</h3>
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="text-orange-600 hover:underline"
            >
              + Add New Address
            </button>
          )}
        </div>

        {addresses.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <p className="text-gray-500 mb-4">No saved addresses yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Add Your First Address
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Address Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Home, Work, etc."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Set as default address</span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{address.name}</p>
                  {address.is_default && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{address.street}</p>
                <p className="text-gray-600">{address.city}</p>
                {address.postal_code && (
                  <p className="text-gray-500 text-sm">{address.postal_code}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-orange-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CustomerLayout>
  );
}