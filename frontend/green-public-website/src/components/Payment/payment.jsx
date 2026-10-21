"use client";

import React, { useEffect, useState } from "react";
import Footer from "../footer/Footer";
import useCartStore from "../store/useCartStore";
import { useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingCart, Truck, CreditCard, Shield, AlertCircle } from "lucide-react";
import { createAddress } from "@/api/addressApi";
import { createCheckout } from "@/api/checkoutApi";
import { payWithToken } from "@/api/paymentApi";
import Toast from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

const Payment = () => {
  const navigate = useNavigate();
  const [sdkReady, setSdkReady] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    apartment: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    country: "South Africa"
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Cart state from Zustand with safe destructuring
  const cartStore = useCartStore();
  
  // Safe access to store functions with fallbacks
  const cartItems = cartStore.cart || [];
  const updateCartItem = cartStore.updateCartItem || (() => console.warn("updateCartItem not available"));
  const removeFromCart = cartStore.removeFromCart || (() => console.warn("removeFromCart not available"));
  const clearCart = cartStore.clearCart || (() => console.warn("clearCart not available"));
  const pushLocalToServer = cartStore.pushLocalToServer;
  const getTotalPrice = cartStore.getTotalPrice;
  
  // Calculate total safely
  const totalAmount = getTotalPrice ? getTotalPrice() : 
    cartItems.reduce((acc, item) => acc + (item.priceValue || 0) * (item.quantity || 1), 0);

  // Load Yoco SDK with better error handling
  useEffect(() => {
    // Check if SDK is already loaded
    if (window.YocoSDK) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js";
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
    };
    script.onerror = (error) => {
      console.error("Yoco SDK failed to load:", error);
      setToast({ visible: true, message: "Payment system failed to load. Please refresh the page.", type: 'error' });
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (event) => {
    setAcceptedTerms(event.target.checked);
  };

  // Safe cart item functions
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (updateCartItem && typeof updateCartItem === "function") {
      updateCartItem(itemId, Math.max(1, newQuantity));
    } else {
      console.error("updateCartItem function not available");
    }
  };

  const handleRemoveItem = (itemId) => {
    if (removeFromCart && typeof removeFromCart === "function") {
      removeFromCart(itemId);
    } else {
      console.error("removeFromCart function not available");
    }
  };

  const handlePayNow = async () => {
    // Clear previous errors
    setSyncError(null);

    if (!acceptedTerms) {
      setToast({ visible: true, message: "You must accept the terms and conditions before paying.", type: 'error' });
      return;
    }

    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'province', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !deliveryInfo[field]?.trim());
    
    if (missingFields.length > 0) {
      setToast({ visible: true, message: `Please fill in all required fields: ${missingFields.join(', ')}`, type: 'error' });
      return;
    }

    const isLoggedIn = typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("accessToken"));
    if (!isLoggedIn) {
      setToast({ visible: true, message: 'Please log in to continue to checkout', type: 'info' });
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      setToast({ visible: true, message: "Your cart is empty. Please add items before proceeding to payment.", type: 'info' });
      return;
    }

    // Create server-side address and checkout flow
    setPaymentLoading(true);
    try {
      // Ensure server cart exists by pushing local cart to server (if any)
      if (pushLocalToServer && typeof pushLocalToServer === "function") {
        try {
          await pushLocalToServer();
        } catch (syncErr) {
          console.warn("Failed to sync local cart to server", syncErr);
          const msg = syncErr.message || 'Failed to sync cart to server. Please review your cart.';
          setSyncError(msg);
          setToast({ visible: true, message: msg, type: 'error' });
          setPaymentLoading(false);
          return; // stop checkout
        }
      }

      // Map deliveryInfo into backend AddressRequest shape
      const addressPayload = {
        name: deliveryInfo.firstName,
        surname: deliveryInfo.lastName,
        companyName: deliveryInfo.company || null,
        addressLine1: deliveryInfo.address,
        addressLine2: deliveryInfo.apartment || null,
        country: deliveryInfo.country,
        city: deliveryInfo.city,
        province: deliveryInfo.province,
        postalCode: deliveryInfo.postalCode,
        phoneNo: deliveryInfo.phone,
      };

      const saved = await createAddress(addressPayload);
      const addressId = saved?.id || saved?.addressId || null;

      if (!addressId) {
        setToast({ visible: true, message: 'Could not save address. Please try again.', type: 'error' });
        throw new Error("Could not save address - no address ID returned");
      }

      // If SDK is ready, open Yoco popup to obtain a payment token and charge server-side
      if (sdkReady && window.YocoSDK) {
        try {
          const yoco = new window.YocoSDK({
            publicKey: import.meta?.env?.VITE_YOCO_PUBLIC_KEY || "pk_test_placeholder",
          });

          const amountInCents = Math.round(totalAmount * 100);

          yoco.showPopup({
            amountInCents,
            currency: "ZAR",
            name: "GreenPublic Order",
            description: `Order payment R ${totalAmount.toFixed(2)}`,
            callback: async function (result) {
                  if (result.error) {
                    setToast({ visible: true, message: `Payment failed: ${result.error.message}`, type: 'error' });
                    setPaymentLoading(false);
                    return;
                  }

              // Try to extract token from result (support common keys)
              const token = result?.id || result?.token || result?.tokenId || result?.source?.id || result?.paymentId;
              if (!token) {
                setToast({ visible: true, message: 'Payment failed: missing payment token from provider', type: 'error' });
                setPaymentLoading(false);
                return;
              }

              try {
                await payWithToken({ addressId, yocoToken: token });
                if (clearCart && typeof clearCart === "function") clearCart();
                setToast({ visible: true, message: 'Payment successful — thank you! Redirecting to orders…', type: 'success' });
                setTimeout(() => navigate("/profile?tab=orders"), 700);
              } catch (err) {
                console.error('Server charge failed', err);
                const serverMsg = err.response?.data?.message || err.message || 'Payment processing failed on server';
                setToast({ visible: true, message: serverMsg, type: 'error' });
              } finally {
                setPaymentLoading(false);
              }
            }
          });
          } catch (err) {
          console.error('Yoco popup error', err);
          setToast({ visible: true, message: 'Payment system error: ' + err.message, type: 'error' });
          setPaymentLoading(false);
        }
      } else {
        // Fallback to hosted checkout if SDK not available
        try {
          const checkoutResp = await createCheckout({ addressId });
          const paymentUrl = checkoutResp?.paymentUrl || checkoutResp?.checkoutUrl || checkoutResp?.redirectUrl;
          if (paymentUrl) {
            setToast({ visible: true, message: 'Redirecting to secure payment...', type: 'info' });
            
            // For Safari compatibility: try multiple redirect methods
            // Method 1: Direct assignment
            window.location.href = paymentUrl;
            
            // Method 2: Fallback using setTimeout for Safari
            setTimeout(() => {
              if (document.visibilityState === 'visible') {
                window.location.replace(paymentUrl);
              }
            }, 100);
          } else {
            setToast({ visible: true, message: 'Checkout failed: missing payment URL from server.', type: 'error' });
          }
          } catch (err) {
          const msg = err.message || 'Checkout failed';
          console.error('Checkout error (fallback):', err);
          setToast({ visible: true, message: msg, type: 'error' });
          setPaymentLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Checkout error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Show user-friendly error message
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Checkout failed. Please try again.";
      setToast({ visible: true, message: `Payment failed: ${errorMessage}`, type: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'province', 'postalCode', 'phone'];
    const allFieldsFilled = requiredFields.every(field => deliveryInfo[field]?.trim());
    
    return acceptedTerms && cartItems.length > 0 && allFieldsFilled && !paymentLoading && !syncError;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'Playfair Display', serif" }}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Checkout</h1>
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <ShoppingCart size={18} />
                <span>Cart</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Truck size={18} />
                <span>Delivery</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400">
                <CreditCard size={18} />
                <span>Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6">
        {/* Sync Error Display */}
        {syncError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Cart Sync Issue</h3>
                <p className="text-sm text-red-700 mt-1">{syncError}</p>
                <p className="text-sm text-red-600 mt-2">
                  Please adjust your cart quantities and try again.
                </p>
              </div>
              <button
                onClick={() => setSyncError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Internal-only debug panel was here; removed for production. */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Delivery Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border p-6 lg:p-8 order-2 lg:order-1"
          >
            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Delivery Information</h2>
            </div>

            <fieldset disabled={paymentLoading} aria-busy={paymentLoading} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryInfo.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                  </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment, Suite, etc. (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryInfo.apartment}
                  onChange={(e) => handleInputChange('apartment', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={deliveryInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  placeholder="Country"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={deliveryInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                  placeholder="Phone number"
                />
              </div>
            </fieldset>

            {/* Terms & Conditions */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={handleCheckboxChange}
                  className="mt-1 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  I have read and agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline font-medium"
                  >
                    Terms & Conditions
                  </a>{" "}
                  of GreenPublic Store.
                </label>
              </div>
            </div>
          </motion.div>

          {/* Cart Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm border p-6 lg:p-8 order-1 lg:order-2 h-fit sticky top-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
            </div>

            <AnimatePresence>
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <ShoppingCart className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">Your cart is empty</p>
                  <button
                    onClick={() => navigate("/#products")}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={item.img || null}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                          <p className="text-green-600 font-semibold">
                            R {item.priceValue?.toFixed(2) || item.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Order Total */}
            {cartItems.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">R {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-green-600">R {totalAmount.toFixed(2)}</span>
                </div>

                {/* Pay Now Button */}
                <motion.button
                  onClick={handlePayNow}
                  disabled={!isFormValid()}
                  whileHover={isFormValid() ? { scale: 1.02 } : {}}
                  whileTap={isFormValid() ? { scale: 0.98 } : {}}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 mt-6 flex items-center justify-center gap-2 ${
                    isFormValid()
                      ? "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Shield size={20} />
                  {paymentLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Pay R ${totalAmount.toFixed(2)}`
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-3">
                  <Shield size={12} />
                  <span>Secure payment powered by Yoco</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;