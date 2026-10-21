import React, { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Truck, Shield, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../footer/Footer";
import useCartStore from "@/components/store/useCartStore";

const Cart = () => {
  const navigate = useNavigate();
  const cartStore = useCartStore();

  const cartItems = cartStore.cart || [];
  const updateCartItem = cartStore.updateCartItem || (() => {});
  const removeFromCart = cartStore.removeFromCart || (() => {});
  const getTotalPrice = cartStore.getTotalPrice || (() => 0);
  const fetchServerCart = cartStore.fetchServerCart;
  const modifyServerCart = cartStore.modifyServerCart;

  const [isUpdating, setIsUpdating] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"));

    if (token && typeof fetchServerCart === "function") {
      fetchServerCart();
    }
  }, [fetchServerCart]);

  const handleQuantityChange = async (id, delta) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    
    const currentQty = item.quantity || 1;
    const nextQty = Math.max(1, currentQty + delta);
    
    
    // Don't update if quantity hasn't actually changed
    if (nextQty === currentQty) return;
    
    setIsUpdating(prev => ({ ...prev, [id]: true }));

    const hasToken =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"));

    if (hasToken && typeof modifyServerCart === "function") {
      try {
        const action = delta > 0 ? 'add' : 'subtract';
        await modifyServerCart({
          productId: Number(item.id),
          quantity: Math.abs(delta),
          action: action,
        });
      } catch (err) {
        console.error("Failed to update quantity on server", err);
        // Fallback to local update
        updateCartItem(id, nextQty);
      }
    } else {
      updateCartItem(id, nextQty);
    }

    setTimeout(() => {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }, 300);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      navigate("/delivery");
      setIsProcessing(false);
    }, 500);
  };

  const total = getTotalPrice();
  const shipping = total > 500 ? 0 : 30;
  const finalTotal = total + shipping;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f8f5f2]">
      <main className="flex-1 px-4 lg:px-6 py-8 md:py-12 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Your Shopping Bag
          </span>
          
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Review Your <span className="text-[#8B5A2B]">Cart</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Almost there! Review your items before proceeding to checkout
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <motion.div
              className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <ShoppingBag className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Shopping Cart
                  </h2>
                  <p className="text-gray-600">
                    {cartItems.length} {cartItems.length === 0 ? 'item' : 'items'} in your cart
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <div className="inline-flex p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-6 border border-gray-200">
                      <ShoppingBag className="text-gray-400" size={64} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Your cart is empty
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                      Add some of our premium sea moss products to begin your wellness journey
                    </p>
                    <button
                      onClick={() => navigate("/#products")}
                      className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Browse Products
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        layout
                        exit="exit"
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 bg-white group"
                      >
                        {/* Product Info */}
                        <div className="flex items-start gap-5 flex-1 mb-4 sm:mb-0">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                            {item.img ? (
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag size={32} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-[#8B5A2B] transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-2xl font-bold text-[#8B5A2B] mb-1">
                              R{(item.priceValue || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              In stock • Ready to ship
                            </p>
                            {item.lowStockMessage && (
                              <p className="text-xs text-red-600 font-semibold mt-1">
                                {item.lowStockMessage}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 border border-gray-200">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={item.quantity <= 1 || isUpdating[item.id]}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#8B5A2B] hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {isUpdating[item.id] && item.quantity > 1 ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </motion.button>
                            
                            <span className="w-12 text-center font-bold text-gray-800 text-lg">
                              {item.quantity || 1}
                            </span>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleQuantityChange(item.id, 1)}
                              disabled={isUpdating[item.id]}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#8B5A2B] hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {isUpdating[item.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                          
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemove(item.id)}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Trust Badges */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <Truck className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Free Shipping</h4>
                <p className="text-sm text-gray-600">On orders over R500</p>
              </div>
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <RefreshCw className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Easy Returns</h4>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <Shield className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">100% secure checkout</p>
              </div>
            </motion.div> */}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-96"
          >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200 sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <Sparkles className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Order Summary
                  </h2>
                  <p className="text-gray-600">
                    Review your order details
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-gray-800">R{total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <span className="text-gray-600">Shipping</span>
                    <p className="text-sm text-gray-500 mt-1">
                      {total > 500 ? "Free shipping on orders over R500" : "Standard shipping"}
                    </p>
                  </div>
                  <span className={`text-lg font-semibold ${shipping === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {shipping === 0 ? 'FREE' : `R${shipping.toFixed(2)}`}
                  </span>
                </div>
                
                {total > 500 && (
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-medium">Free Shipping Unlocked!</span>
                    </div>
                    <span className="text-green-800 font-bold">-R50.00</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#8B5A2B]">
                      R{finalTotal.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Including VAT</p>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={cartItems.length === 0 || isProcessing}
                onClick={handleCheckout}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  cartItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-lg hover:shadow-xl"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Delivery
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {/* Secure Checkout Note */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4" />
                  <p className="text-sm">Secure checkout • Encrypted payment</p>
                </div>
              </div>

              {/* Continue Shopping */}
              <button
                onClick={() => navigate("/#products")}
                className="w-full mt-4 py-3 border-2 border-gray-300 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5 text-gray-700 hover:text-[#8B5A2B] rounded-xl font-medium transition-all duration-300"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;