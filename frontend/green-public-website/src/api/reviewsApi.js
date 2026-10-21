import client from "./client";

export const getProductReviews = async (productId) => {
  const res = await client.get(`/api/reviews/product/${productId}`);
  return res.data;
};

export const submitReview = async (productId, reviewData) => {
  const res = await client.post(`/api/reviews/product/${productId}`, reviewData);
  return res.data;
};

export const updateReview = async (reviewId, reviewData) => {
  const res = await client.put(`/api/reviews/${reviewId}`, reviewData);
  return res.data;
};

export const deleteReview = async (reviewId) => {
  const res = await client.delete(`/api/reviews/${reviewId}`);
  return res.data;
};

export const getProductRating = async (productId) => {
  const res = await client.get(`/api/reviews/product/${productId}/rating`);
  return res.data;
};

export default { getProductReviews, submitReview, updateReview, deleteReview, getProductRating };
