import { create } from "zustand";
import { addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist, getWishlist as apiGetWishlist } from "@/api/wishlistApi";

const LOCAL_KEY = "wishlist";

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const readLocalWishlist = () => {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Failed to read local wishlist", err);
    return [];
  }
};

const persistLocalWishlist = (items) => {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to persist local wishlist", err);
  }
};

const hasAuthToken = () => {
  if (!canUseStorage()) return false;
  return Boolean(localStorage.getItem("token") || localStorage.getItem("accessToken"));
};

const normalizeItem = (item) => ({
  id: item.id || item.productId,
  productId: item.productId || item.id,
  name: item.name || item.productName,
  price: item.price || item.priceValue,
  image: item.image || item.productImage,
  addedAt: item.addedAt || new Date().toISOString(),
});

const useWishlistStore = create((set, get) => ({
  wishlist: [],
  isLoading: false,
  error: null,

  // Fetch wishlist from server or local storage
  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      if (!hasAuthToken()) {
        const localItems = readLocalWishlist();
        set({ wishlist: localItems, isLoading: false });
        return;
      }

      const data = await apiGetWishlist();
      const items = Array.isArray(data) ? data : data?.items || [];
      const normalized = items.map(normalizeItem);
      set({ wishlist: normalized, isLoading: false });
      persistLocalWishlist(normalized);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      if (!hasAuthToken()) {
        const localItems = readLocalWishlist();
        set({ wishlist: localItems, isLoading: false, error: null });
        return;
      }
      set({ error: err.message, isLoading: false });
    }
  },

  // Add to wishlist
  addToWishlist: async (product) => {
    try {
      if (!product?.id) return;
      const { wishlist } = get();
      
      // Check if already in wishlist
      if (wishlist.some(item => item.productId === product.id)) {
        return;
      }

      if (!hasAuthToken()) {
        const next = [...wishlist, {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.priceValue || product.price,
          image: product.img || product.image,
          addedAt: new Date().toISOString()
        }];
        persistLocalWishlist(next);
        set({ wishlist: next });
        return;
      }

      // Call API
      await apiAddToWishlist(product.id);

      // Add to local state
      set(state => {
        const next = [...state.wishlist, {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.priceValue || product.price,
          image: product.img || product.image,
          addedAt: new Date().toISOString()
        }];
        persistLocalWishlist(next);
        return { wishlist: next };
      });
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      set({ error: err.message });
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const { wishlist } = get();
      const next = wishlist.filter(item => item.productId !== productId);

      if (!hasAuthToken()) {
        persistLocalWishlist(next);
        set({ wishlist: next });
        return;
      }

      // Call API
      await apiRemoveFromWishlist(productId);

      // Remove from local state
      persistLocalWishlist(next);
      set({ wishlist: next });
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      set({ error: err.message });
    }
  },

  // Check if product is in wishlist
  isInWishlist: (productId) => {
    if (!productId) return false;
    const { wishlist } = get();
    return wishlist.some(item => item.productId === productId);
  },

  // Get wishlist count
  getWishlistCount: () => {
    const { wishlist } = get();
    return wishlist.length;
  },

  // Clear wishlist
  clearWishlist: () => {
    set({ wishlist: [] });
  }
}));

export default useWishlistStore;
