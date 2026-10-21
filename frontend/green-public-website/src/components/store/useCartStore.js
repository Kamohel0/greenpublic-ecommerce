import { create } from "zustand";
import { modifyCart as apiModifyCart, viewCart as apiViewCart, clearCart as apiClearCart } from "@/api/cartApi";

const LOCAL_KEY = "gp_cart";

const initialCart = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (cart) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
};

const useCartStore = create((set, get) => ({
  cart: [],

  // Local-only operations (used when user is unauthenticated)
  addToCartLocal: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      let next;
      if (existing) {
        next = state.cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + product.quantity } : item
        );
      } else {
        next = [...state.cart, product];
      }
      persist(next);
      return { cart: next };
    }),

  updateCartItemLocal: (id, quantity) =>
    set((state) => {
      const next = state.cart.map((item) => (item.id === id ? { ...item, quantity } : item));
      persist(next);
      return { cart: next };
    }),

  removeFromCartLocal: (id) =>
    set((state) => {
      const next = state.cart.filter((item) => item.id !== id);
      persist(next);
      return { cart: next };
    }),

  clearCartLocal: () => set(() => {
    persist([]);
    return { cart: [] };
  }),

  // ADDED: Universal cart functions that work with both local and server cart
  updateCartItem: (id, quantity) => {
    const state = get();
    // Use local update for now - you can enhance this to sync with server if user is authenticated
    const next = state.cart.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
    persist(next);
    set({ cart: next });
  },

  removeFromCart: (id) => {
    const state = get();
    const next = state.cart.filter((item) => item.id !== id);
    persist(next);
    set({ cart: next });
  },

  // ADDED: Calculate total price
  getTotalPrice: () => {
    const state = get();
    return state.cart.reduce((acc, item) => acc + (item.priceValue || 0) * (item.quantity || 1), 0);
  },

  // ADDED: Clear cart (universal)
  clearCart: () => {
    persist([]);
    set({ cart: [] });
  },

  // Server sync helpers (when authenticated)
  fetchServerCart: async () => {
    try {
      const data = await apiViewCart();
      // Expect server cart DTO -> transform to frontend shape if needed
      const mapped = (data?.items || []).map((it) => ({
        id: String(it.productId || it.id),
        name: it.name || it.productName,
        img: it.image || it.productImage,
        priceValue: it.price || it.unitPrice || 0,
        quantity: it.quantity || 1,
        lowStockMessage: it.lowStockMessage || null,
      }));
      set({ cart: mapped });
      persist(mapped);
      return mapped;
    } catch (err) {
      console.error("fetchServerCart failed", err);
      return get().cart;
    }
  },

  modifyServerCart: async (payload) => {
    // payload: { productId, quantity, action }
    try {
      await apiModifyCart(payload);
      // Refresh server cart
      return await get().fetchServerCart();
    } catch (err) {
      console.error("modifyServerCart failed", err);
      throw err;
    }
  },

  // Push any locally-stored cart items to the server cart. This is used before
  // creating a checkout to ensure the server has the latest items.
  pushLocalToServer: async () => {
    // Prefer the in-memory cart (current UI state). Fall back to localStorage
    // only if the in-memory cart is empty. This ensures `payment.jsx`'s cart
    // (which reads from the store) is used as the source of truth.
    const local = (get().cart && get().cart.length > 0) ? get().cart : initialCart();
    if (!local || local.length === 0) return [];

    try {
      // Reset server cart so we do not double-count when syncing.
      await apiClearCart();

      // Iterate items and call modifyServerCart for each with action 'add'
      for (const item of local) {
        const productId = Number(item.id) || item.productId || null;
        if (!productId) continue;

        const qty = Number(item.quantity) || 1;
        try {
          await apiModifyCart({ productId, quantity: qty, action: 'add' });
        } catch (err) {
          // If backend returns a 400 (e.g., not enough stock), surface the
          // backend message so the caller can abort checkout and inform user.
          const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
          const message = serverMsg || err.message || 'Failed to add item to server cart';
          const e = new Error(message);
          e.cause = err;
          throw e;
        }
      }

      // Refresh server cart to reflect new items
      const server = await get().fetchServerCart();
      return server;
    } catch (err) {
      console.error('pushLocalToServer failed', err);
      throw err;
    }
  },

  clearServerCart: async () => {
    try {
      await apiClearCart();
      set({ cart: [] });
      persist([]);
    } catch (err) {
      console.error("clearServerCart failed", err);
      throw err;
    }
  },

  // ADDED: Get cart items count
  getCartItemCount: () => {
    const state = get();
    return state.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  },

  // ADDED: Find item in cart
  getCartItem: (id) => {
    const state = get();
    return state.cart.find(item => item.id === id);
  }
}));

export default useCartStore;