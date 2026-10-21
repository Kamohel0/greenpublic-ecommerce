import client from "./client";

export const getProducts = async (params) => {
  // params can include { name }
  const res = await client.get("/api/products", { params });
  return res.data; // Expect array of product DTOs
};

export const getProductById = async (id) => {
  const res = await client.get(`/api/products/${id}`);
  return res.data; // Expect product DTO
};

export default { getProducts, getProductById };
