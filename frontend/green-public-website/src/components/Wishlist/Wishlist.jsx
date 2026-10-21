"use client";

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import Footer from "../footer/Footer";
import useWishlistStore from "@/components/store/useWishlistStore";
import useCartStore from "@/components/store/useCartStore";

const Wishlist = () => {
  const { wishlist, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addToCartLocal || state.addToCart);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleAddToCart = (item) => {
    addToCart({
      id: item.productId,
      name: item.name,
      priceValue: item.price,
      img: item.image,
      quantity: 1
    });
  };

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f8f5f2]">
      {/* Header */}
      <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border border-rose-300 rounded-full text-sm font-semibold">
              <Heart className="w-4 h-4 mr-2" />
              Your Wishlist
            </span>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Saved <span className="text-rose-500">Favorites</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {wishlist.length === 0
                ? "Your wishlist is empty. Start adding your favorite products!"
                : `You have ${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} in your wishlist`}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 lg:px-6 py-8 md:py-12 max-w-7xl mx-auto w-full">
        {wishlist.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-3xl shadow-lg border border-[#DAB6A2]/20 p-12 max-w-md mx-auto">
              <Heart className="w-16 h-16 text-rose-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Wishlist Empty</h2>
              <p className="text-gray-600 mb-8">
                Save your favorite products to view them later
              </p>
              <Link
                to="/#products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {wishlist.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-[#DAB6A2]/10"
              >
                {/* Image */}
                <Link to={`/product/${item.productId}`} className="block overflow-hidden bg-gradient-to-br from-[#f8f5f2] to-[#f1e9df] h-64">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Content */}
                <div className="p-6">
                  <Link to={`/product/${item.productId}`} className="block mb-3">
                    <h3 className="text-lg font-bold text-gray-800 hover:text-[#8B5A2B] transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-[#8B5A2B]">
                      R {typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                      className="px-4 py-2.5 rounded-xl border-2 border-rose-300 text-rose-500 hover:bg-rose-50 transition-all duration-300 flex items-center justify-center"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Wishlist;
