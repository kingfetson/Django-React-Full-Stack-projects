import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import toast from "react-hot-toast";

type Product = {
  id: number;
  name: string;
  price: string;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

type CartStore = {
  cart: CartItem[];
  loadCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  increaseQty: (id: number) => void;
  decreaseQty: (id: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      loadCart: () => {
        // Handled by persist middleware
      },

      addToCart: (product) => {
        const existing = get().cart.find((item) => item.id === product.id);
        let updatedCart;
        
        if (existing) {
          updatedCart = get().cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          toast.success(`Added another ${product.name} to cart`);
        } else {
          updatedCart = [...get().cart, { ...product, quantity: 1 }];
          toast.success(`${product.name} added to cart`);
        }
        
        set({ cart: updatedCart });
      },

      removeFromCart: (id) => {
        const product = get().cart.find((item) => item.id === id);
        const updatedCart = get().cart.filter((item) => item.id !== id);
        set({ cart: updatedCart });
        
        if (product) {
          toast.error(`${product.name} removed from cart`);
        }
      },

      increaseQty: (id) => {
        const updatedCart = get().cart.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ cart: updatedCart });
        const product = get().cart.find((item) => item.id === id);
        if (product) {
          toast.success(`${product.name} quantity increased`);
        }
      },

      decreaseQty: (id) => {
        const product = get().cart.find((item) => item.id === id);
        const updatedCart = get().cart
          .map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0);
        set({ cart: updatedCart });
        
        if (product && product.quantity > 1) {
          toast.success(`${product.name} quantity decreased`);
        } else if (product && product.quantity === 1) {
          toast.error(`${product.name} removed from cart`);
        }
      },

      clearCart: () => {
        set({ cart: [] });
        toast.success("Cart cleared");
      },

      getTotalItems: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().cart.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage), // Fixed storage configuration
    }
  )
);