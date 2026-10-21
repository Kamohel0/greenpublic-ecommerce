import React, { useEffect, useState } from "react";
import Footer from "../footer/Footer";
import useCartStore from "../store/useCartStore";
import useAuthStore from "@/components/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Truck, ShoppingCart, CreditCard, Home, MapPin, Phone, User, Building, Package, Lock, Sparkles, CheckCircle, Mail, AlertCircle } from "lucide-react";
import { createAddress } from "@/api/addressApi";
import Toast from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape"
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SA_PHONE_REGEX = /^\+27\d{9}$/;
const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'address', 'city', 'province', 'postalCode', 'phone'];
const FIELD_LABELS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  address: 'Street Address',
  city: 'City',
  province: 'Province',
  postalCode: 'Postal Code',
  phone: 'Phone Number'
};

const DeliveryInfo = () => {
  const GUEST_CHECKOUT_KEY = "gp_guest_checkout";
  const navigate = useNavigate();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    address: "",
    apartment: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    country: "South Africa"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Cart state from Zustand
  const cartStore = useCartStore();
  const cartItems = cartStore.cart || [];
  const pushLocalToServer = cartStore.pushLocalToServer;

  const authUser = useAuthStore((state) => state.user);

  const validateDeliveryInfo = (info) => {
    const errors = {};

    REQUIRED_FIELDS.forEach((field) => {
      const value = info[field]?.toString().trim();
      if (!value) {
        errors[field] = `${FIELD_LABELS[field]} is required`;
      }
    });

    if (info.email?.trim() && !isValidEmail(info.email)) {
      errors.email = "Enter a valid email address";
    }

    if (info.phone?.trim() && !isValidSouthAfricanPhone(info.phone)) {
      errors.phone = "Enter a valid SA phone number";
    }

    if (info.province?.trim() && !SA_PROVINCES.includes(info.province.trim())) {
      errors.province = "Select a valid province";
    }

    return errors;
  };

  const handleInputChange = (field, value) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = value.toString().trim();
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    if (hasAttemptedSubmit) {
      const nextInfo = {
        ...deliveryInfo,
        [field]: sanitizedValue
      };
      setFieldErrors(validateDeliveryInfo(nextInfo));
    }
  };

  const handlePhoneInputChange = (value) => {
    let cleaned = (value || "").replace(/\D/g, "");

    if (cleaned.startsWith("27")) {
      cleaned = cleaned.slice(2);
    }

    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }

    cleaned = cleaned.slice(0, 9);
    handleInputChange("phone", cleaned);
  };

  const isValidEmail = (email) => EMAIL_REGEX.test((email || "").trim());

  const normalizeSouthAfricanPhone = (phone) => {
    const cleaned = (phone || "").replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+27") && cleaned.length === 12) return cleaned;
    if (cleaned.startsWith("27") && cleaned.length === 11) return `+${cleaned}`;
    if (cleaned.startsWith("0") && cleaned.length === 10) return `+27${cleaned.slice(1)}`;
    if (/^\d{9}$/.test(cleaned)) return `+27${cleaned}`;

    return null;
  };

  const isValidSouthAfricanPhone = (phone) => {
    const normalized = normalizeSouthAfricanPhone(phone);
    return normalized ? SA_PHONE_REGEX.test(normalized) : false;
  };

  const handleCheckboxChange = (event) => {
    setAcceptedTerms(event.target.checked);
  };

  // Calculate delivery fee based on method and cart total
  const calculateDeliveryFee = () => {
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.priceValue || 0) * (item.quantity || 1), 0);
    if (deliveryMethod === 'pickup') {
      return 0; // FREE for pickup
    }
    // For delivery: R50 if total < R500, FREE if >= R500
    return cartTotal >= 500 ? 0 : 50;
  };

  // Update delivery fee whenever delivery method or cart items change
  useEffect(() => {
    const newFee = calculateDeliveryFee();
    setDeliveryFee(newFee);
  }, [deliveryMethod, cartItems]);

  useEffect(() => {
    if (authUser?.email && !deliveryInfo.email) {
      setDeliveryInfo((prev) => ({ ...prev, email: authUser.email }));
    }
  }, [authUser, deliveryInfo.email]);

  const handleProceedToPayment = async () => {
    setHasAttemptedSubmit(true);

    if (!acceptedTerms) {
      setToast({ visible: true, message: "You must accept the terms and conditions.", type: 'error' });
      return;
    }

    const errors = validateDeliveryInfo(deliveryInfo);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ visible: true, message: "Please fix the highlighted fields.", type: 'error' });
      return;
    }

    const normalizedPhone = normalizeSouthAfricanPhone(deliveryInfo.phone);

    const isLoggedIn = typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("accessToken"));

    if (cartItems.length === 0) {
      setToast({ visible: true, message: "Your cart is empty.", type: 'info' });
      return;
    }

    setIsLoading(true);
    try {
      if (isLoggedIn) {
        // Sync cart to server
        if (pushLocalToServer && typeof pushLocalToServer === "function") {
          try {
            await pushLocalToServer();
          } catch (syncErr) {
            console.warn("Failed to sync cart", syncErr);
            setToast({ visible: true, message: 'Failed to sync cart. Please try again.', type: 'error' });
            setIsLoading(false);
            return;
          }
        }

        // Create address
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
          phoneNo: normalizedPhone,
        };

        const saved = await createAddress(addressPayload);
        const addressId = saved?.id || saved?.addressId;

        if (!addressId) {
          setToast({ visible: true, message: 'Could not save address. Please try again.', type: 'error' });
          throw new Error("No address ID returned");
        }

        navigate("/checkout", { state: { addressId, deliveryMethod, deliveryFee } });
      } else {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              GUEST_CHECKOUT_KEY,
              JSON.stringify({
                guestCheckout: true,
                guestEmail: deliveryInfo.email,
                deliveryInfo: { ...deliveryInfo, phone: normalizedPhone },
                deliveryMethod,
                deliveryFee,
                savedAt: Date.now()
              })
            );
          } catch (err) {
            console.warn("Failed to persist guest checkout state", err);
          }
        }
        navigate("/checkout", {
          state: {
            guestCheckout: true,
            guestEmail: deliveryInfo.email,
            deliveryInfo: { ...deliveryInfo, phone: normalizedPhone },
            deliveryMethod,
            deliveryFee
          }
        });
      }
    } catch (err) {
      console.error("Error saving address:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save address.";
      setToast({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'province', 'postalCode', 'phone'];
    const allFieldsFilled = requiredFields.every(field => {
      const value = deliveryInfo[field]?.toString().trim();
      return value && value.length > 0;
    });
    return (
      acceptedTerms &&
      allFieldsFilled &&
      isValidEmail(deliveryInfo.email) &&
      isValidSouthAfricanPhone(deliveryInfo.phone) &&
      !isLoading
    );
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
              <Truck className="w-4 h-4 mr-2" />
              Delivery Information
            </span>
            
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Where Should We <span className="text-[#8B5A2B]">Deliver?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Enter your delivery address to continue to secure payment
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
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#8B5A2B]">Delivery</span>
              </div>
              
              <div className="w-16 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Payment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-4 lg:px-6 py-8 md:py-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Delivery Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <MapPin className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Delivery Information
                  </h2>
                  <p className="text-gray-600">
                    Enter your delivery address details
                  </p>
                </div>
              </div>

              <fieldset disabled={isLoading} aria-busy={isLoading} className="space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        First Name *
                        {fieldErrors.firstName && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.firstName ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                      placeholder="Enter your first name"
                    />
                    {fieldErrors.firstName && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.firstName}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Last Name *
                        {fieldErrors.lastName && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.lastName ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                      placeholder="Enter your last name"
                    />
                    {fieldErrors.lastName && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                      {fieldErrors.email && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </span>
                  </label>
                  <input
                    type="email"
                    value={deliveryInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    autoComplete="email"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.email}</p>}
                  <p className="text-xs text-gray-500">Use a valid email address for order updates.</p>
                </div>

                {/* Company */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Company name (optional)"
                  />
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Street Address *
                      {fieldErrors.address && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.address ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                    placeholder="123 Main Street"
                  />
                  {fieldErrors.address && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.address}</p>}
                </div>

                {/* Apartment */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Apartment, Suite, etc. (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.apartment}
                    onChange={(e) => handleInputChange('apartment', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>

                {/* City, Province, Postal Code */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      City *
                      {fieldErrors.city && <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.city ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                      placeholder="City"
                    />
                    {fieldErrors.city && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.city}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Province *
                      {fieldErrors.province && <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                    </label>
                    <select
                      value={deliveryInfo.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.province ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                    >
                      <option value="">Select province</option>
                      {SA_PROVINCES.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                    {fieldErrors.province && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.province}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Postal Code *
                      {fieldErrors.postalCode && <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.postalCode ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                      placeholder="Postal code"
                    />
                    {fieldErrors.postalCode && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.postalCode}</p>}
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.country}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed text-gray-600"
                    readOnly
                  />
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                      {fieldErrors.phone && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">+27</span>
                    <input
                      type="tel"
                      value={deliveryInfo.phone}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      autoComplete="tel"
                      className={`w-full pl-14 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 placeholder:text-gray-400 ${fieldErrors.phone ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20'}`}
                      placeholder="821234567"
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldErrors.phone}</p>}
                  <p className="text-xs text-gray-500">Enter your number without the leading zero. Example: +27 82 123 4567.</p>
                </div>
              </fieldset>

                {/* Delivery Method Selection */}
                <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Delivery Method *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Delivery Option */}
                    <div
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        deliveryMethod === 'delivery'
                          ? 'border-[#8B5A2B] bg-gradient-to-br from-[#DAB6A2]/10 to-[#e9d6c5]/10'
                          : 'border-gray-200 bg-white hover:border-[#8B5A2B]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                            deliveryMethod === 'delivery'
                              ? 'border-[#8B5A2B] bg-[#8B5A2B]'
                              : 'border-gray-300'
                          }`}
                        >
                          {deliveryMethod === 'delivery' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Home Delivery</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Delivery to your address via The Courier Guy
                          </p>
                          <p className="text-sm font-medium text-[#8B5A2B] mt-2">
                            From R50
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pickup Option */}
                    <div
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        deliveryMethod === 'pickup'
                          ? 'border-[#8B5A2B] bg-gradient-to-br from-[#DAB6A2]/10 to-[#e9d6c5]/10'
                          : 'border-gray-200 bg-white hover:border-[#8B5A2B]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                            deliveryMethod === 'pickup'
                              ? 'border-[#8B5A2B] bg-[#8B5A2B]'
                              : 'border-gray-300'
                          }`}
                        >
                          {deliveryMethod === 'pickup' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">Pickup</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Pickup at FNB Bank City, Bedfordview
                          </p>
                          <p className="text-sm font-medium text-green-600 mt-2">
                            FREE
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location Details */}
                  {deliveryMethod === 'pickup' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl"
                    >
                      <h5 className="font-semibold text-green-900 mb-3">Pickup Location</h5>
                      <div className="space-y-2 text-sm text-green-800">
                        <p>
                          <span className="font-medium">Location:</span> FNB Bank City
                        </p>
                        <p>
                          <span className="font-medium">Address:</span> 158 Main Road, Bedfordview, 2008
                        </p>
                        <p>
                          <span className="font-medium">Hours:</span> Monday - Friday: 9:00 AM - 5:00 PM
                        </p>
                        <p>
                          <span className="font-medium">Note:</span> Orders will be ready for pickup within 2-3 business days
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Terms & Conditions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex items-start h-6">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={handleCheckboxChange}
                      className="w-5 h-5 text-[#8B5A2B] bg-gray-100 border-2 border-gray-300 rounded focus:ring-[#8B5A2B] focus:ring-2 mt-0.5"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                    I have read and agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8B5A2B] hover:underline font-medium"
                    >
                      Terms & Conditions
                    </a>{" "}
                    of GreenPublic Store. Your personal data will be used to process your order, 
                    support your experience throughout this website, and for other purposes described 
                    in our privacy policy.
                  </label>
                </div>
              </div>

              {/* Proceed to Payment Button */}
              <motion.button
                onClick={handleProceedToPayment}
                disabled={!isFormValid()}
                whileHover={isFormValid() ? { scale: 1.02 } : {}}
                whileTap={isFormValid() ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 mt-8 flex items-center justify-center gap-3 ${
                  isFormValid()
                    ? "bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Information...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </motion.button>
            </div>

            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 bg-gradient-to-r from-[#DAB6A2]/5 to-[#e9d6c5]/5 border border-[#DAB6A2]/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl">
                  <Truck className="text-[#8B5A2B]" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {deliveryMethod === 'pickup' ? 'Pickup Information' : 'Delivery Information'}
                  </h4>
                  {deliveryMethod === 'pickup' ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        • Pickup at FNB Bank City, Bedfordview
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        • Ready for pickup in 2-3 business days
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        • FREE pickup (no delivery fee)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        • Delivered via The Courier Guy Bedfordview
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        • 2-5 business days delivery time
                      </p>
                      <p className="text-sm text-gray-600">
                        • All packages are tracked and insured
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-96"
          >
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-200 sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                  <Lock className="text-[#8B5A2B]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Need Help?
                  </h2>
                  <p className="text-gray-600">
                    We're here to assist you
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Contact Information</h4>
                  <p className="text-sm text-gray-600">
                    For any questions about delivery, contact our support team at:
                  </p>
                  <p className="text-[#8B5A2B] font-medium mt-2">
                    support@greenpublic.store
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Return Policy</h4>
                  <p className="text-sm text-gray-600">
                    We offer a 30-day return policy. If you're not satisfied with your purchase, 
                    you can return it for a full refund.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Free Shipping Available</h4>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Orders over R500 qualify for free standard shipping!
                  </p>
                </div>

                {/* Back to Cart */}
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full py-3 border-2 border-gray-300 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5 text-gray-700 hover:text-[#8B5A2B] rounded-xl font-medium transition-all duration-300 mt-4"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeliveryInfo;