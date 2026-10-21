import client from "./client";

export const addToWishlist = async (productId) => {
  const res = await client.post(`/api/wishlist/add/${productId}`);
  return res.data;
};

export const removeFromWishlist = async (productId) => {
  const res = await client.delete(`/api/wishlist/remove/${productId}`);
  return res.data;
};

export const getWishlist = async () => {
  const res = await client.get("/api/wishlist");
  return res.data;
};

export const isInWishlist = async (productId) => {
  const res = await client.get(`/api/wishlist/check/${productId}`);
  return res.data;
};

export default { addToWishlist, removeFromWishlist, getWishlist, isInWishlist };
