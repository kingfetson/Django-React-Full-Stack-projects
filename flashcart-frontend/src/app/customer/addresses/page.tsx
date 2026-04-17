"use client";

import { useState } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import toast from "react-hot-toast";

interface Address {
  id: number;
  name: string;
  street: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    postal_code: "",
    is_default: false,
  });

  // For now, show placeholder
  return (
    <CustomerLayout title="Saved Addresses">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Addresses</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-orange-600 hover:underline"
          >
            + Add New Address
          </button>
        </div>

        {addresses.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <p className="text-gray-500 mb-4">No saved addresses yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Add Your First Address
            </button>
          </div>
        )}

        {showForm && (
          <form className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Address Name</label>
              <input
                type="text"
                placeholder="Home, Work, etc."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">Set as default address</span>
            </label>
            <div className="flex gap-3">
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                Save Address
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{address.name}</p>
                <p className="text-gray-600">{address.street}</p>
                <p className="text-gray-600">{address.city}, {address.postal_code}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-orange-600 hover:underline text-sm">Edit</button>
                <button className="text-red-600 hover:underline text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CustomerLayout>
  );
}