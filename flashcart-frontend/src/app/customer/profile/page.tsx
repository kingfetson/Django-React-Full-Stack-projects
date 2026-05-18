"use client";

import { useState, useEffect } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Extended User type to include optional date fields
interface ExtendedUser {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_joined?: string;
  created_at?: string;
  role?: string;
}

export default function CustomerProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Cast user to ExtendedUser type for type safety
  const extendedUser = user as ExtendedUser | null;

  // Initialize form data when user loads
  useEffect(() => {
    if (extendedUser) {
      setFormData({
        first_name: extendedUser.first_name || "",
        last_name: extendedUser.last_name || "",
        phone: extendedUser.phone || "",
      });
    }
  }, [extendedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Safe way to get member since date without TypeScript errors
  const getMemberSince = () => {
    if (!extendedUser) return "Recently joined";
    
    // Check for date_joined
    if (extendedUser.date_joined && typeof extendedUser.date_joined === 'string') {
      const date = new Date(extendedUser.date_joined);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    }
    
    // Check for created_at
    if (extendedUser.created_at && typeof extendedUser.created_at === 'string') {
      const date = new Date(extendedUser.created_at);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    }
    
    // Default fallback
    return "Recently joined";
  };

  if (!extendedUser) {
    return (
      <CustomerLayout title="Profile">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile information...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Profile">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-orange-600 hover:text-orange-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={extendedUser.email || ""}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="+254 XXX XXX XXX"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +254)</p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original user data
                  if (extendedUser) {
                    setFormData({
                      first_name: extendedUser.first_name || "",
                      last_name: extendedUser.last_name || "",
                      phone: extendedUser.phone || "",
                    });
                  }
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <p className="text-sm text-gray-500 mb-1">Email Address</p>
              <p className="font-medium text-gray-900">{extendedUser.email || "Not provided"}</p>
            </div>
            
            <div className="border-b pb-3">
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="font-medium text-gray-900">
                {extendedUser.first_name || extendedUser.last_name 
                  ? `${extendedUser.first_name || ""} ${extendedUser.last_name || ""}`.trim()
                  : "Not provided"}
              </p>
            </div>
            
            <div className="border-b pb-3">
              <p className="text-sm text-gray-500 mb-1">Phone Number</p>
              <p className="font-medium text-gray-900">{extendedUser.phone || "Not provided"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Member Since</p>
              <p className="font-medium text-gray-900">{getMemberSince()}</p>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}