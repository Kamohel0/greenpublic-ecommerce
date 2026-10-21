import client from "./client";

/**
 * Get all reviews for a specific product
 * @param {number} productId - The ID of the product
 * @returns {Promise} Array of review objects
 */
export const getReviewsByProduct = async (productId) => {
  const response = await client.get(`/api/reviews/product/${productId}`);
  return response.data;
};

/**
 * Create or update a review for a product
 * @param {Object} reviewData - { productId, rating, comment }
 * @returns {Promise} Created review object
 */
export const createReview = async (reviewData) => {
  const response = await client.post("/api/reviews/create", reviewData);
  return response.data;
};

export default {
  getReviewsByProduct,
  createReview,
};
