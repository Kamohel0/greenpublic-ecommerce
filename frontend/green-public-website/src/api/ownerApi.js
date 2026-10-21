import client from "./client";

export const getOwnerOverview = async () => {
  const res = await client.get("/api/owner/overview");
  return res.data;
};

export default { getOwnerOverview };
