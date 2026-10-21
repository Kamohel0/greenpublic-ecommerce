import client from './client';

export const payWithToken = async (payload) => {
  // payload: { addressId, yocoToken }
  const res = await client.post('/api/payments/charge', payload);
  return res.data;
};

export default { payWithToken };
