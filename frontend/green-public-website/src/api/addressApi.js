import client from "./client";

/**
 * Create an address for the logged-in user.
 * payload should match backend AddressRequest shape.
 */
export const createAddress = async (payload) => {
  const res = await client.post("/api/addresses/create", payload);
  return res.data; // Expect saved Address object with `id`
};

export const getMyAddresses = async () => {
  const res = await client.get("/api/addresses");
  return res.data;
};

export default { createAddress, getMyAddresses };
