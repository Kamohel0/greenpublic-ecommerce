import client from "./client";

export const getOrders = async (params) => {
  // params: { page, size }
  const res = await client.get("/api/orders/by-user", { params });
  return res.data; // Expect paged response
};

export const getOrderById = async (id) => {
  const res = await client.get(`/api/orders/${id}`);
  return res.data;
};

export default { getOrders, getOrderById };
