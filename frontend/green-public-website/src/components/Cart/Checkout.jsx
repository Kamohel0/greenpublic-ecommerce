import React, { useEffect, useState } from "react";
import Footer from "../footer/Footer";
import useCartStore from "../store/useCartStore";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Truck, CreditCard, Shield, Plus, Minus, Sparkles, Package, CheckCircle, Lock } from "lucide-react";
import { createCheckout, createGuestCheckout } from "@/api/checkoutApi";
import Toast from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

const Checkout = () => {
  const GUEST_CHECKOUT_KEY = "gp_guest_checkout";
  const navigate = useNavigate();
  const location = useLocation();
  const addressId = location.state?.addressId;
  const storedGuestState = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(GUEST_CHECKOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("Failed to read guest checkout state", err);
      return null;
    }
  })();
  const effectiveState = location.state || storedGuestState || {};
  const deliveryMethod = effectiveState?.deliveryMethod || "delivery";
  const deliveryFee = effectiveState?.deliveryFee ?? 0;
  const guestCheckout = Boolean(effectiveState?.guestCheckout);
  const guestEmail = effectiveState?.guestEmail || "";
  const guestDeliveryInfo = effectiveState?.deliveryInfo || null;
  
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Cart state from Zustand
  const cartStore = useCartStore();
  const cartItems = cartStore.cart || [];
  const getTotalPrice = cartStore.getTotalPrice;
  const modifyServerCart = cartStore.modifyServerCart;
  const updateCartItem = cartStore.updateCartItem;
  
  // Calculate total safely
  const totalAmount = getTotalPrice ? getTotalPrice() : 
    cartItems.reduce((acc, item) => acc + (item.priceValue || 0) * (item.quantity || 1), 0);

  // Use delivery fee from state, fallback to calculation
  const finalDeliveryFee = deliveryFee || (deliveryMethod === 'pickup' ? 0 : (totalAmount >= 500 ? 0 : 50.00));
  const grandTotal = totalAmount + finalDeliveryFee;

  useEffect(() => {
    const hasAddress = Boolean(addressId);
    const hasGuestInfo = guestCheckout && guestDeliveryInfo && guestEmail;

    if (!hasAddress && !hasGuestInfo) {
      setToast({ visible: true, message: 'Please complete delivery information first', type: 'info' });
      setTimeout(() => navigate("/delivery"), 1500);
    }
  }, [addressId, guestCheckout, guestDeliveryInfo, guestEmail, navigate]);

  useEffect(() => {
    if (addressId && typeof window !== "undefined") {
      sessionStorage.removeItem(GUEST_CHECKOUT_KEY);
    }
  }, [addressId]);

  const canPay = cartItems.length > 0 && (Boolean(addressId) || (guestCheckout && guestDeliveryInfo && guestEmail));

  const handleQuantityChange = async (id, delta) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    
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
        setToast({ visible: true, message: 'Failed to update quantity', type: 'error' });
        updateCartItem(id, nextQty);
      }
    } else {
      updateCartItem(id, nextQty);
    }
  };

  const handlePayNow = async () => {
    if (!addressId && !(guestCheckout && guestDeliveryInfo && guestEmail)) {
      setToast({ visible: true, message: 'Missing delivery information', type: 'error' });
      return;
    }

    if (cartItems.length === 0) {
      setToast({ visible: true, message: "Your cart is empty.", type: 'info' });
      return;
    }

    setPaymentLoading(true);
    try {
      const hasToken =
        typeof window !== "undefined" &&
        (localStorage.getItem("token") || localStorage.getItem("accessToken"));

      const guestItems = cartItems
        .map((item) => ({
          productId: Number(item.id || item.productId),
          quantity: Number(item.quantity || 1)
        }))
        .filter((item) => Number.isFinite(item.productId) && item.productId > 0);

      const checkoutResp = hasToken
        ? await createCheckout({ addressId, deliveryMethod })
        : await createGuestCheckout({
            guestEmail,
            deliveryMethod,
            address: {
              name: guestDeliveryInfo?.firstName,
              surname: guestDeliveryInfo?.lastName,
              companyName: guestDeliveryInfo?.company || null,
              addressLine1: guestDeliveryInfo?.address,
              addressLine2: guestDeliveryInfo?.apartment || null,
              country: guestDeliveryInfo?.country,
              city: guestDeliveryInfo?.city,
              province: guestDeliveryInfo?.province,
              postalCode: guestDeliveryInfo?.postalCode,
              phoneNo: guestDeliveryInfo?.phone
            },
            items: guestItems
          });
      const paymentUrl = checkoutResp?.paymentUrl || checkoutResp?.checkoutUrl || checkoutResp?.redirectUrl;
      
      if (paymentUrl) {
        setToast({ visible: true, message: 'Redirecting to secure payment...', type: 'info' });
        if (guestCheckout && typeof window !== "undefined") {
          sessionStorage.removeItem(GUEST_CHECKOUT_KEY);
        }
        
        window.location.href = paymentUrl;
        
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            window.location.replace(paymentUrl);
          }
        }, 100);
      } else {
        setToast({ visible: true, message: 'Checkout failed: missing payment URL from server.', type: 'error' });
        setPaymentLoading(false);
      }
    } catch (err) {
      console.error("❌ Checkout error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Checkout failed. Please try again.";
      setToast({ visible: true, message: `Payment failed: ${errorMessage}`, type: 'error' });
      setPaymentLoading(false);
    }
  };

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f8f5f2]">
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
              <Lock className="w-4 h-4 mr-2" />
              Secure Checkout
            </span>
            
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Complete Your <span className="text-[#8B5A2B]">Purchase</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Review your order and proceed to secure payment
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div 
            className="flex justify-center mt-8 md:mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-6 md:gap-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#8B5A2B]">Cart</span>
              </div>
              
              <div className="w-16 h-1 bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] rounded-full" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#8B5A2B]">Delivery</span>
              </div>
              
              <div className="w-16 h-1 bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] rounded-full" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#8B5A2B]">Payment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-4 lg:px-6 py-8 md:py-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <Package className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Order Summary
                  </h2>
                  <p className="text-gray-600">
                    Review items in your cart
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
                      <ShoppingCart className="text-gray-400" size={64} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Your cart is empty
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                      Add some premium sea moss products to begin your wellness journey
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
                        whileHover={{ y: -5 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 bg-white group"
                      >
                        {/* Product Info */}
                        <div className="flex items-start gap-5 flex-1 mb-4 sm:mb-0">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-[#DAB6A2] transition-colors">
                            {item.img ? (
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={32} />
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

                        {/* Quantity Controls & Total */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 border border-gray-200">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#8B5A2B] hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            
                            <span className="w-12 text-center font-bold text-gray-800 text-lg">
                              {item.quantity || 1}
                            </span>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#8B5A2B] hover:bg-white rounded-lg transition-all duration-200"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#8B5A2B]">
                              R{((item.priceValue || 0) * (item.quantity || 1)).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trust Badges */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <Shield className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">256-bit SSL encryption</p>
              </div>
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <Truck className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Fast Delivery</h4>
                <p className="text-sm text-gray-600">2-5 business days</p>
              </div>
              <div className="bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-5 text-center">
                <CheckCircle className="w-8 h-8 text-[#8B5A2B] mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-1">Quality Guarantee</h4>
                <p className="text-sm text-gray-600">Premium products</p>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-96"
          >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200 sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <CreditCard className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Payment Summary
                  </h2>
                  <p className="text-gray-600">
                    Complete your purchase
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-gray-800">R{totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <span className="text-gray-600">
                      {deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {deliveryMethod === 'pickup' 
                        ? "Pickup at FNB Bank City" 
                        : (totalAmount >= 500 ? "Free shipping on orders over R500" : "The Courier Guy delivery")
                      }
                    </p>
                  </div>
                  <span className={`text-lg font-semibold ${finalDeliveryFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {finalDeliveryFee === 0 ? 'FREE' : `R${finalDeliveryFee.toFixed(2)}`}
                  </span>
                </div>
                
                {totalAmount >= 500 && deliveryMethod === 'delivery' && (
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
                      R{grandTotal.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Including VAT</p>
                  </div>
                </div>
              </div>

              {/* Pay Now Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={paymentLoading || !canPay}
                onClick={handlePayNow}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  !paymentLoading && canPay
                    ? "bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {paymentLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay R {grandTotal.toFixed(2)}
                  </>
                )}
              </motion.button>

              {/* Secure Checkout Note */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-3 text-gray-600 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <Shield className="w-5 h-5 text-[#8B5A2B]" />
                  <div>
                    <p className="text-sm font-medium">Secure checkout powered by Yoco</p>
                    <p className="text-xs text-gray-500 mt-1">Your payment information is encrypted</p>
                  </div>
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

export default Checkout;