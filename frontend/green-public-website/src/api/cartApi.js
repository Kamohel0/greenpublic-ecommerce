import client from "./client";

export const viewCart = async () => {
  const res = await client.get("/api/cart/view");
  return res.data;
};

export const modifyCart = async (payload) => {
  // payload: { productId, quantity, action }
  const res = await client.post("/api/cart/modify", payload);
  return res.data;
};

export const clearCart = async () => {
  const res = await client.delete("/api/cart/clear");
  return res.data;
};

export default { viewCart, modifyCart, clearCart };
