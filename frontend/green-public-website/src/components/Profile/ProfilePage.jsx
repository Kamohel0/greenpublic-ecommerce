import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Heart,
  ShoppingBag,
  Bell,
  LogOut,
  MapPin,
  Shield,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  Sparkles,
  Package,
  Truck,
  CreditCard,
  Settings
} from "lucide-react";

// UI Components
import Footer from "../footer/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// API Services
import { updateProfile, changePassword } from "@/api/authApi";
import { getOrders } from "@/api/orderApi";

// State Management
import useAuthStore from "@/components/store/useAuthStore";

// Authentication Components
import Signup from "./SignUp";
import Login from "./Login";

// Constants
const ORDER_STATUS_COLORS = {
  'pending': 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
  'paid': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
  'completed': 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
  'confirmed': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
  'shipped': 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200',
  'delivered': 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
  'cancelled': 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
};

const FULFILLMENT_STAGES = [
  'PLACED',
  'PACKAGING',
  'READY_FOR_HANDOFF',
  'HANDED_TO_COURIER',
  'READY_FOR_PICKUP'
];

const FULFILLMENT_LABELS = {
  PLACED: 'Placed',
  PACKAGING: 'Packaging',
  READY_FOR_HANDOFF: 'Ready for Handoff',
  HANDED_TO_COURIER: 'Handed to Courier',
  READY_FOR_PICKUP: 'Ready for Pickup'
};

const SIDEBAR_NAV_ITEMS = {
  PROFILE: 'profile',
  ADDRESS: 'address',
  WISHLIST: 'wishlist',
  ORDERS: 'orders',
  PASSWORD: 'password',
  PREFERENCES: 'preferences',
  AUTH: 'auth'
};

/**
 * Sidebar Navigation Link Component
 */
const SidebarLink = ({ icon: Icon, label, value, active, onClick, badge }) => (
  <motion.div
    whileHover={{ scale: 1.02, x: 4 }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center justify-between p-4 cursor-pointer rounded-xl transition-all duration-300 ${
      active 
        ? "bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 border border-[#DAB6A2] text-[#8B5A2B] font-semibold shadow-sm" 
        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700 border border-transparent hover:border-gray-200"
    }`}
    onClick={() => onClick(value)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick(value)}
  >
    <div className="flex items-center">
      <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white text-xs px-2.5 py-1 rounded-full min-w-6 text-center font-semibold shadow-sm">
        {badge}
      </span>
    )}
  </motion.div>
);

/**
 * Status Message Component
 */
const StatusMessage = ({ message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`p-4 rounded-xl mb-6 flex items-center justify-between border shadow-sm ${
      message.type === "success" 
        ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800" 
        : message.type === "error"
        ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800"
        : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800"
    }`}
    role="alert"
  >
    <div className="flex items-center gap-3">
      {message.type === "error" && <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message.text}</span>
    </div>
    <button 
      onClick={onDismiss}
      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
      aria-label="Dismiss message"
    >
      <X size={16} />
    </button>
  </motion.div>
);

/**
 * Password Field Component
 */
const PasswordField = ({ id, label, value, onChange, showPassword, onToggleVisibility, disabled, helperText }) => (
  <div className="space-y-3">
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 disabled:bg-gray-50 disabled:opacity-70"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        disabled={disabled}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#8B5A2B] disabled:opacity-50 transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    {helperText && (
      <p className="text-xs text-gray-500 mt-2">{helperText}</p>
    )}
  </div>
);

/**
 * Empty State Component
 */
const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <div className="text-center py-12 px-4">
    <div className="inline-flex p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-6 border border-gray-200">
      <Icon className="text-gray-400" size={64} />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
      {title}
    </h3>
    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
      {description}
    </p>
    <Button 
      onClick={onAction} 
      className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
    >
      {actionText}
    </Button>
  </div>
);

/**
 * Wishlist View Component
 */
const WishlistView = ({ wishlist, onRemove, onNavigate }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <Card className="border border-gray-200 rounded-3xl shadow-lg overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
            <Heart className="text-[#8B5A2B]" size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Wishlist
            </CardTitle>
            <CardDescription className="text-gray-600">
              Products you've saved for later
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {wishlist.length > 0 ? (
          <div className="space-y-4">
            {wishlist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 bg-white group"
              >
                <div className="flex items-start gap-5 flex-1">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-[#DAB6A2] transition-colors">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Heart size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-[#8B5A2B] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-2xl font-bold text-[#8B5A2B] mb-1">
                      {item.price}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ready to ship
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <Button
                    onClick={() => onNavigate(`/product/${item.id}`)}
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5 text-gray-700 hover:text-[#8B5A2B] rounded-xl px-6 py-2.5 transition-all duration-300"
                  >
                    View Product
                  </Button>
                  <Button
                    onClick={() => onRemove(item.id)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    aria-label="Remove from wishlist"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Start adding products you love to your wishlist and save them for later"
            actionText="Browse Products"
            onAction={() => onNavigate("/#products")}
          />
        )}
      </CardContent>
    </Card>
  </motion.div>
);

/**
 * Order History View Component
 */
const OrderHistoryView = ({ orders, getStatusClass, onNavigate }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <Card className="border border-gray-200 rounded-3xl shadow-lg overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
            <Package className="text-[#8B5A2B]" size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              Order History
            </CardTitle>
            <CardDescription className="text-gray-600">
              Track your recent purchases and orders
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="p-6 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Order #{order.id}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(order.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
                  <p className="text-2xl font-bold text-[#8B5A2B]">{order.total}</p>
                  <Button 
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5 text-gray-700 hover:text-[#8B5A2B] rounded-xl px-6 py-2.5 transition-all duration-300"
                  >
                    View Details
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {FULFILLMENT_STAGES
                      .filter((stage) => order.deliveryMethod === 'pickup' || stage !== 'READY_FOR_PICKUP')
                      .map((stage) => {
                        const currentIndex = FULFILLMENT_STAGES.indexOf(order.fulfillmentStatus || 'PLACED');
                        const stageIndex = FULFILLMENT_STAGES.indexOf(stage);
                        const active = stageIndex <= currentIndex;
                        return (
                          <span
                            key={`${order.id}-${stage}`}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-[#8B5A2B] text-white' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {FULFILLMENT_LABELS[stage] || stage}
                          </span>
                        );
                      })}
                  </div>
                  <p className="text-xs text-gray-600">
                    Current stage: {FULFILLMENT_LABELS[order.fulfillmentStatus] || 'Placed'}
                    {order.fulfillmentUpdatedAt ? ` • updated ${new Date(order.fulfillmentUpdatedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Your order history will appear here once you make your first purchase"
            actionText="Start Shopping"
            onAction={() => onNavigate("/#products")}
          />
        )}
      </CardContent>
    </Card>
  </motion.div>
);

/**
 * Password Change View Component
 */
const PasswordChangeView = ({ passwordData, passwordVisibility, isLoading, onPasswordChange, onToggleVisibility, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <Card className="border border-gray-200 rounded-3xl shadow-lg overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
            <Shield className="text-[#8B5A2B]" size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              Change Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update your password to keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(value) => onPasswordChange('currentPassword', value)}
            showPassword={passwordVisibility.current}
            onToggleVisibility={() => onToggleVisibility('current')}
            disabled={isLoading}
          />
          
          <PasswordField
            id="new-password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(value) => onPasswordChange('newPassword', value)}
            showPassword={passwordVisibility.new}
            onToggleVisibility={() => onToggleVisibility('new')}
            disabled={isLoading}
            helperText="Password must be at least 8 characters long"
          />
          
          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(value) => onPasswordChange('confirmPassword', value)}
            showPassword={passwordVisibility.confirm}
            onToggleVisibility={() => onToggleVisibility('confirm')}
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </motion.div>
);

/**
 * Main Profile Page Component
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, logout: authLogout, updateUser: updateAuthUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState(SIDEBAR_NAV_ITEMS.AUTH);
  const [activeAuthTab, setActiveAuthTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "info" });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState({
    name: "",
    surname: "",
    email: "",
    address: "",
    province: "",
    phoneNumber: "",
    zip: "",
    city: "",
    marketingConsent: false,
    languagePreference: "en",
    currencyPreference: "ZAR",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [wishlist, setWishlist] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Sync authenticated user data with profile state
  useEffect(() => {
    if (isAuthenticated && authUser) {
      setProfileData(prev => ({
        ...prev,
        name: authUser.name || "",
        surname: authUser.surname || "",
        email: authUser.email || "",
        phoneNumber: authUser.phoneNumber || "",
        marketingConsent: Boolean(authUser.marketingConsent),
        languagePreference: authUser.languagePreference || "en",
        currencyPreference: authUser.currencyPreference || "ZAR",
      }));
      setActiveTab(SIDEBAR_NAV_ITEMS.PROFILE);
    } else {
      setActiveTab(SIDEBAR_NAV_ITEMS.AUTH);
    }
  }, [isAuthenticated, authUser]);

  // Load persistent data from localStorage
  useEffect(() => {
    const loadPersistentData = () => {
      try {
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        setWishlist(savedWishlist);
        setOrderHistory(savedOrders);
      } catch (error) {
        console.error("Error loading persistent data:", error);
      }
    };
    
    loadPersistentData();
  }, []);

  // Fetch user data from API
  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      // Fetch order history
      try {
        const ordersResponse = await getOrders({ page: 0, size: 20 });
        const orders = ordersResponse?.content || [];
        
        const formattedOrders = orders.map(order => ({
          id: order.orderNumber,
          date: order.createdAt,
          total: `R${order.totalAmount}`,
          status: (order.status || 'pending').toLowerCase(),
          fulfillmentStatus: order.fulfillmentStatus || 'PLACED',
          fulfillmentUpdatedAt: order.fulfillmentUpdatedAt || null,
          deliveryMethod: order.deliveryMethod || 'delivery'
        }));
        
        setOrderHistory(formattedOrders);
      } catch (error) {
        console.warn("Could not load order history:", error);
      }
    } catch {
      setStatusMessage({ 
        text: "Unable to load profile data. Please try again.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 20000);
    return () => clearInterval(intervalId);
  }, [fetchUserData, isAuthenticated]);

  // Profile Handlers
  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordFieldVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      setStatusMessage({ 
        text: "Name and email are required fields.", 
        type: "error" 
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: "", type: "info" });

    try {
      const response = await updateProfile(profileData);
      const updatedUser = response?.data?.data?.user || response?.data?.user;
      
      if (updatedUser) {
        updateAuthUser(updatedUser);
      }
      
      setStatusMessage({ 
        text: "Profile updated successfully.", 
        type: "success" 
      });
      setIsEditingProfile(false);
    } catch (error) {
      setStatusMessage({ 
        text: error.response?.data?.message || "Failed to update profile.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (event) => {
    event.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatusMessage({ 
        text: "New passwords do not match.", 
        type: "error" 
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setStatusMessage({ 
        text: "Password must be at least 8 characters.", 
        type: "error" 
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: "", type: "info" });

    try {
      await changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setStatusMessage({ 
        text: "Password updated successfully.", 
        type: "success" 
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setStatusMessage({ 
        text: error.response?.data?.message || "Failed to change password.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = () => {
    setActiveTab(SIDEBAR_NAV_ITEMS.PROFILE);
    setStatusMessage({
      text: "Welcome back! Your journey to wellness continues.",
      type: "success"
    });
  };

  const handleSignupSuccess = () => {
    setActiveAuthTab('login');
    setStatusMessage({
      text: "Account created successfully. Please sign in to continue.",
      type: "success"
    });
  };

  const handleLogout = () => {
    authLogout();
    setActiveTab(SIDEBAR_NAV_ITEMS.AUTH);
    setStatusMessage({
      text: "Signed out successfully. Come back soon!",
      type: "info"
    });
    navigate("/");
  };

  const removeWishlistItem = (productId) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    
    setStatusMessage({
      text: "Item removed from wishlist.",
      type: "info"
    });
  };

  const getOrderStatusClass = (status) => {
    return ORDER_STATUS_COLORS[status] || 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
  };

  // Memoized sidebar content
  const sidebarContent = useMemo(() => {
    if (isAuthenticated) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="space-y-2"
        >
          <SidebarLink
            icon={User}
            label="Profile Information"
            value={SIDEBAR_NAV_ITEMS.PROFILE}
            active={activeTab === SIDEBAR_NAV_ITEMS.PROFILE}
            onClick={setActiveTab}
          />
          <SidebarLink
            icon={MapPin}
            label="Address"
            value={SIDEBAR_NAV_ITEMS.ADDRESS}
            active={activeTab === SIDEBAR_NAV_ITEMS.ADDRESS}
            onClick={setActiveTab}
          />
          <SidebarLink
            icon={Heart}
            label="Wishlist"
            value={SIDEBAR_NAV_ITEMS.WISHLIST}
            active={activeTab === SIDEBAR_NAV_ITEMS.WISHLIST}
            onClick={setActiveTab}
            badge={wishlist.length}
          />
          <SidebarLink
            icon={Package}
            label="Order History"
            value={SIDEBAR_NAV_ITEMS.ORDERS}
            active={activeTab === SIDEBAR_NAV_ITEMS.ORDERS}
            onClick={setActiveTab}
            badge={orderHistory.length}
          />
          <SidebarLink
            icon={Shield}
            label="Security"
            value={SIDEBAR_NAV_ITEMS.PASSWORD}
            active={activeTab === SIDEBAR_NAV_ITEMS.PASSWORD}
            onClick={setActiveTab}
          />
          <SidebarLink
            icon={Settings}
            label="Preferences"
            value={SIDEBAR_NAV_ITEMS.PREFERENCES}
            active={activeTab === SIDEBAR_NAV_ITEMS.PREFERENCES}
            onClick={setActiveTab}
          />
          
          <div className="pt-4 border-t border-gray-200">
            <SidebarLink
              icon={LogOut}
              label="Sign Out"
              value={SIDEBAR_NAV_ITEMS.AUTH}
              active={false}
              onClick={handleLogout}
            />
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="space-y-2"
      >
        <SidebarLink
          icon={LogIn}
          label="Sign In"
          value={SIDEBAR_NAV_ITEMS.AUTH}
          active={activeTab === SIDEBAR_NAV_ITEMS.AUTH}
          onClick={() => setActiveTab(SIDEBAR_NAV_ITEMS.AUTH)}
        />
        <SidebarLink
          icon={UserPlus}
          label="Create Account"
          value={SIDEBAR_NAV_ITEMS.AUTH}
          active={activeTab === SIDEBAR_NAV_ITEMS.AUTH}
          onClick={() => {
            setActiveTab(SIDEBAR_NAV_ITEMS.AUTH);
            setActiveAuthTab('signup');
          }}
        />
      </motion.div>
    );
  }, [isAuthenticated, activeTab, wishlist.length, orderHistory.length, handleLogout]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f8f5f2]">
      <main className="flex flex-col lg:flex-row flex-grow p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Sidebar Navigation */}
        <motion.div 
          className="w-full lg:w-80 mb-6 lg:mb-0 lg:mr-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="sticky top-8 border border-gray-200 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50">
            <CardHeader className="pb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                        <User className="text-[#8B5A2B]" size={24} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Welcome, {profileData.name || 'User'}!
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage your account and wellness journey
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                        <Sparkles className="text-[#8B5A2B]" size={24} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Account Access
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Sign in or create an account to begin
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-1">
              {sidebarContent}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {statusMessage.text && (
              <StatusMessage
                message={statusMessage}
                onDismiss={() => setStatusMessage({ text: "", type: "info" })}
              />
            )}
          </AnimatePresence>

          {/* Authentication Section */}
          {!isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.AUTH && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border border-gray-200 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                      <UserPlus className="text-[#8B5A2B]" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Account Access
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Sign in to your account or create a new one
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs 
                    value={activeAuthTab} 
                    onValueChange={(value) => setActiveAuthTab(value)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 rounded-xl border border-gray-200">
                      <TabsTrigger 
                        value="login" 
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-300"
                      >
                        <LogIn size={16} />
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-300"
                      >
                        <UserPlus size={16} />
                        Create Account
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="mt-8">
                      <Login 
                        onSuccess={handleLoginSuccess}
                        showHeader={false}
                      />
                    </TabsContent>
                    
                    <TabsContent value="signup" className="mt-8">
                      <Signup 
                        onSuccess={handleSignupSuccess}
                        showHeader={false}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Profile Information */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.PROFILE && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border border-gray-200 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                      <User className="text-[#8B5A2B]" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage your personal details and contact information
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={isEditingProfile ? "outline" : "default"}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white border-0 rounded-xl px-6 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isEditingProfile ? (
                      <>
                        <X size={16} />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 size={16} />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={profileData.name}
                        onChange={(e) => handleProfileUpdate('name', e.target.value)}
                        disabled={!isEditingProfile || isLoading}
                        placeholder="Enter first name"
                        className="pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 disabled:bg-gray-50 disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={profileData.surname}
                        onChange={(e) => handleProfileUpdate('surname', e.target.value)}
                        disabled={!isEditingProfile || isLoading}
                        placeholder="Enter last name"
                        className="pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 disabled:bg-gray-50 disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileUpdate('email', e.target.value)}
                        disabled={!isEditingProfile || isLoading}
                        placeholder="your@email.com"
                        className="pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 disabled:bg-gray-50 disabled:opacity-70"
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => handleProfileUpdate('phoneNumber', e.target.value)}
                        disabled={!isEditingProfile || isLoading}
                        placeholder="+27 XXX XXX XXXX"
                        className="pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 disabled:bg-gray-50 disabled:opacity-70"
                      />
                    </div>
                  </div>
                </CardContent>
                {isEditingProfile && (
                  <CardFooter>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          )}

          {/* Address Section */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.ADDRESS && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border border-gray-200 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                      <MapPin className="text-[#8B5A2B]" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Saved Address
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Your primary delivery address
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {profileData.address ? (
                    <div className="space-y-6">
                      <div className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-white hover:border-[#DAB6A2] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl">
                            <Truck className="text-[#8B5A2B]" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-lg mb-2">{profileData.address}</p>
                            <p className="text-gray-600">
                              {profileData.city}, {profileData.province} {profileData.zip}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setIsEditingProfile(true);
                          setActiveTab(SIDEBAR_NAV_ITEMS.PROFILE);
                        }}
                        className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        Edit Address
                      </Button>
                    </div>
                  ) : (
                    <EmptyState
                      icon={MapPin}
                      title="No address saved yet"
                      description="Add your delivery address for faster checkout and shipping"
                      actionText="Add Address"
                      onAction={() => {
                        setIsEditingProfile(true);
                        setActiveTab(SIDEBAR_NAV_ITEMS.PROFILE);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Wishlist */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.WISHLIST && (
            <WishlistView
              wishlist={wishlist}
              onRemove={removeWishlistItem}
              onNavigate={navigate}
            />
          )}

          {/* Order History */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.ORDERS && (
            <OrderHistoryView
              orders={orderHistory}
              getStatusClass={getOrderStatusClass}
              onNavigate={navigate}
            />
          )}

          {/* Password Change */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.PASSWORD && (
            <PasswordChangeView
              passwordData={passwordData}
              passwordVisibility={passwordVisibility}
              isLoading={isLoading}
              onPasswordChange={handlePasswordUpdate}
              onToggleVisibility={togglePasswordFieldVisibility}
              onSubmit={handlePasswordChange}
            />
          )}

          {/* Preferences */}
          {isAuthenticated && activeTab === SIDEBAR_NAV_ITEMS.PREFERENCES && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border border-gray-200 rounded-3xl shadow-xl overflow-hidden bg-gradient-to-b from-white to-gray-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                      <Settings className="text-[#8B5A2B]" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Preferences
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Set your language, currency, and marketing choices
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="languagePreference" className="text-sm font-medium text-gray-700">
                        Language Preference
                      </Label>
                      <select
                        id="languagePreference"
                        value={profileData.languagePreference}
                        onChange={(e) => handleProfileUpdate('languagePreference', e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                      >
                        <option value="en">English</option>
                        <option value="af">Afrikaans</option>
                        <option value="zu">Zulu</option>
                        <option value="xh">Xhosa</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="currencyPreference" className="text-sm font-medium text-gray-700">
                        Currency Preference
                      </Label>
                      <select
                        id="currencyPreference"
                        value={profileData.currencyPreference}
                        onChange={(e) => handleProfileUpdate('currencyPreference', e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                      >
                        <option value="ZAR">ZAR - South African Rand</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-white">
                    <Checkbox
                      id="marketingConsent"
                      checked={profileData.marketingConsent}
                      onChange={(e) => handleProfileUpdate('marketingConsent', e.target.checked)}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <Label htmlFor="marketingConsent" className="text-sm text-gray-700">
                      I agree to receive marketing emails and special offers.
                    </Label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;