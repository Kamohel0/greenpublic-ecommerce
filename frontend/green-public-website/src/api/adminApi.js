import client from "./client";

/**
 * Admin API client for order management
 */

/**
 * Get dashboard statistics
 */
export const getAdminStats = async () => {
  const res = await client.get("/api/admin/stats");
  return res.data;
};

/**
 * Get all orders with filtering and pagination
 */
export const getAdminOrders = async (params) => {
  // params: { status, paymentStatus, shippingStatus, fulfillmentStatus, deliveryMethod, search, page, size, sortBy, sortDirection }
  const res = await client.get("/api/admin/orders", { params });
  return res.data;
};

/**
 * Get order by ID
 */
export const getAdminOrderById = async (orderId) => {
  const res = await client.get(`/api/admin/orders/${orderId}`);
  return res.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, statusData) => {
  // statusData: { orderStatus, paymentStatus, shippingStatus, fulfillmentStatus, trackingNumber, internalNotes }
  const res = await client.put(`/api/admin/orders/${orderId}/status`, statusData);
  return res.data;
};

/**
 * Update shipping info
 */
export const updateShippingInfo = async (orderId, shippingStatus, trackingNumber) => {
  const res = await client.put(`/api/admin/orders/${orderId}/shipping`, null, {
    params: { shippingStatus, trackingNumber }
  });
  return res.data;
};

/**
 * Add internal notes
 */
export const addInternalNotes = async (orderId, notes) => {
  const res = await client.put(`/api/admin/orders/${orderId}/notes`, notes, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return res.data;
};

export const markReadyForPickup = async (orderId) => {
  const res = await client.put(`/api/admin/orders/${orderId}/ready-for-pickup`);
  return res.data;
};

/**
 * Update order fulfillment status
 */
export const updateOrderFulfillment = async (orderId, fulfillmentStatus) => {
  const res = await client.put(`/api/admin/orders/${orderId}/status`, {
    fulfillmentStatus
  });
  return res.data;
};

export const getInventoryOverview = async (params) => {
  const res = await client.get("/api/admin/inventory", { params });
  return res.data;
};

export const updateInventoryStock = async (productId, stockQuantity) => {
  const res = await client.put(`/api/admin/inventory/${productId}`, null, {
    params: { stockQuantity }
  });
  return res.data;
};

export default {
  getAdminStats,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updateShippingInfo,
  addInternalNotes,
  markReadyForPickup,
  updateOrderFulfillment,
  getInventoryOverview,
  updateInventoryStock
};
