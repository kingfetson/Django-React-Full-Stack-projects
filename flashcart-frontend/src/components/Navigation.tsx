"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "../store/cartStore";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Check if user has admin access
  const isAdmin = user?.role?.toLowerCase() === 'admin' || 
                  user?.is_superuser === true || 
                  user?.is_staff === true;
  
  // Get admin URL
  const adminUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + '/admin/';

  return (
    <nav className="bg-orange-600 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-white hover:text-orange-100 transition-colors animate-titleReveal"
            aria-label="Home"
          >
            FlashCart Pro 🛒
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/" 
              className="text-white hover:text-orange-100 transition-colors font-medium"
            >
              Home
            </Link>
            
            {user && (
              <Link 
                href="/orders" 
                className="text-white hover:text-orange-100 transition-colors font-medium"
              >
                My Orders
              </Link>
            )}
            
            <Link 
              href="/contact" 
              className="text-white hover:text-orange-100 transition-colors font-medium"
            >
              Contact
            </Link>
            
            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-white hover:text-orange-100 transition-colors focus:outline-none"
                  aria-label="User menu"
                >
                  <span className="text-lg">👤</span>
                  <span className="font-medium">
                    {user.first_name || user.email?.split('@')[0]}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      📦 My Orders
                    </Link>
                    {isAdmin && (
                      <a
                        href={adminUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        ⚙️ Admin Dashboard
                      </a>
                    )}
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-all hover:scale-105"
              >
                Login
              </Link>
            )}

            {/* Cart Button */}
            <Link
              href="/cart"
              className="bg-white text-orange-600 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold hover:bg-orange-50 transition-all hover:scale-105 relative"
            >
              🛒 Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounceIn">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white focus:outline-none hover:text-orange-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-500 animate-slideDown" ref={mobileMenuRef}>
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-white hover:text-orange-100 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link 
                href="/cart" 
                className="text-white hover:text-orange-100 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🛒 Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
              {user && (
                <>
                  <Link 
                    href="/orders" 
                    className="text-white hover:text-orange-100 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📦 My Orders
                  </Link>
                  <Link 
                    href="/profile" 
                    className="text-white hover:text-orange-100 py-2 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    👤 My Profile
                  </Link>
                  {isAdmin && (
                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-orange-100 py-2 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      ⚙️ Admin Dashboard
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-red-300 hover:text-red-100 text-left py-2 transition-colors"
                  >
                    🚪 Logout
                  </button>
                </>
              )}
              <Link 
                href="/contact" 
                className="text-white hover:text-orange-100 py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📞 Contact
              </Link>
              {!user && (
                <Link 
                  href="/login" 
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg text-center font-semibold hover:bg-orange-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}