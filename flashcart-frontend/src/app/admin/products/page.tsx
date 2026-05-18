"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  stock: number;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    stock: "",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      let url = `${apiUrl}/api/products/`;
      let method = "POST";
      
      if (editingProduct) {
        url = `${apiUrl}/api/products/${editingProduct.id}/`;
        method = "PUT";
      } else {
        url = `${apiUrl}/api/products/`;
        method = "POST";
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          image: formData.image,
          category: formData.category,
          stock: parseInt(formData.stock),
        }),
      });
      
      if (response.ok) {
        toast.success(editingProduct ? "Product updated" : "Product created");
        await fetchProducts();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/products/${id}/`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      price: "", 
      description: "", 
      image: "", 
      category: "", 
      stock: "" 
    });
    setEditingProduct(null);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      category: product.category || "",
      stock: product.stock.toString(),
    });
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <AdminLayout title="Products">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Products Management">
      <div className="mb-4">
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          + Add New Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4">Image</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Stock</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No products found. Click &quot;Add New Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-12">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                     </td>
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">KES {parseFloat(product.price).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock < 10 ? 'bg-red-100 text-red-800' : 
                        product.stock < 20 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => editProduct(product)} 
                        className="text-blue-600 hover:text-blue-800 hover:underline mr-3 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)} 
                        className="text-red-600 hover:text-red-800 hover:underline transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <button 
                  onClick={() => { setShowModal(false); resetForm(); }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price (KES) *</label>
                  <input 
                    type="number" 
                    name="price"
                    step="0.01" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea 
                    name="description"
                    rows={3} 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL *</label>
                  <input 
                    type="url" 
                    name="image"
                    value={formData.image} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    required 
                  />
                  {formData.image && (
                    <div className="mt-2 relative w-20 h-20">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    name="category"
                    value={formData.category} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    placeholder="Electronics, Clothing, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input 
                    type="number" 
                    name="stock"
                    value={formData.stock} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    required 
                    min="0"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}