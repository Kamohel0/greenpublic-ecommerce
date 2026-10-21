// checkoutApi.js
import client from './client';

/**
 * Create a checkout on the server. The backend expects `{ addressId: number }`.
 * Uses the shared `client` (withCredentials) so refresh cookie is sent and
 * Authorization header is attached automatically.
 */
export const createCheckout = async (checkoutData) => {
  try {
    const res = await client.post('/api/checkout', checkoutData);
    return res.data;
  } catch (error) {
    // Normalize error so callers can read the server message easily
    const serverMessage = error?.response?.data?.orderResponse?.message || error?.response?.data?.message || error?.message;
    console.error('Checkout API Error:', {
      status: error.response?.status,
      message: serverMessage
    });
    const e = new Error(serverMessage || 'Checkout failed');
    e.original = error;
    throw e;
  }
};

/**
 * Create a guest checkout on the server.
 */
export const createGuestCheckout = async (checkoutData) => {
  try {
    const res = await client.post('/api/checkout/guest', checkoutData);
    return res.data;
  } catch (error) {
    const serverMessage = error?.response?.data?.orderResponse?.message || error?.response?.data?.message || error?.message;
    console.error('Guest checkout API Error:', {
      status: error.response?.status,
      message: serverMessage
    });
    const e = new Error(serverMessage || 'Guest checkout failed');
    e.original = error;
    throw e;
  }
};