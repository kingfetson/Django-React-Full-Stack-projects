"use client";

import { useState } from "react";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function CustomerSecurity() {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (formData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (formData.old_password === formData.new_password) {
      toast.error("New password must be different from current password");
      return;
    }
    
    setLoading(true);
    try {
      await changePassword(formData.old_password, formData.new_password);
      setFormData({ old_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
      // Error handled in auth context, but we can show additional message
      const errorMessage = err instanceof Error ? err.message : "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <CustomerLayout title="Security">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.old_password}
                onChange={(e) => handleInputChange("old_password", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => handleInputChange("new_password", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
            {formData.new_password && formData.new_password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">
                Password is too short (minimum 8 characters)
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
                autoComplete="new-password"
              />
            </div>
            {formData.confirm_password && formData.new_password !== formData.confirm_password && (
              <p className="text-xs text-red-500 mt-1">
                Passwords do not match
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={toggleShowPassword}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="showPassword" className="text-sm text-gray-600 cursor-pointer">
              Show passwords
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading || 
              !formData.old_password || 
              !formData.new_password || 
              !formData.confirm_password ||
              formData.new_password !== formData.confirm_password ||
              formData.new_password.length < 8
            }
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Password Requirements:</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ At least 8 characters long</li>
            <li>✓ Cannot be the same as your current password</li>
            <li>✓ Should be unique and not easily guessable</li>
          </ul>
        </div>
      </div>
    </CustomerLayout>
  );
}