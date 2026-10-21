import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Products from "./components/Products/Products";
import Reviews from "./components/Reviews/Reviews";
import Deals from "./components/Reviews/Deals";
import Footer from "./components/footer/Footer";
import ProductDetail from "./components/Products/ProductDetail";
import Cart from "./components/Cart/Cart";
import Wishlist from "./components/Wishlist/Wishlist";
import ProfilePage from "./components/Profile/ProfilePage";
import Payment from "./components/Payment/payment";
import Login from "./components/Profile/Login";
import About from "./components/About/about";
import Signup from "./components/Profile/SignUp";
import ForgotPassword from "./components/Profile/forgotpassword";
import EmailVerification from "./components/Profile/EmailVerification"; // Add this import
import Checkout from "./components/Cart/Checkout";
import DeliveryInfo from "./components/Cart/DeliveryInfo";
import TermsAndConditions from "./components/Legal/TermsAndConditions";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminOrders from "./components/Admin/AdminOrders";
import AdminOrderDetails from "./components/Admin/AdminOrderDetails";
import FulfillmentView from "./components/Admin/FulfillmentView";
import OwnerDashboard from "./components/Owner/OwnerDashboard";
import useAuthStore from "./components/store/useAuthStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot/Chatbot";

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth state on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="font-sans">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              {/* Home Section */}
              <section id="home">
                <Hero />
              </section>

              {/* Products Section */}
              <section id="products">
                <Products />
              </section>

              {/* Reviews Section */}
              <section id="reviews">
                <Reviews />
              </section>

              {/* Deals Section */}
              <section id="deals">
                <Deals />
              </section>
              
              {/* About us section */}
              <section id="about">
                <About />
              </section>
              
              {/* Contact Section */}
              <section id="contact">
                <Footer />
              </section>
            </>
          }
        />

        {/* Product detail page */}
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Cart page */}
        <Route path="/cart" element={<Cart />} />

        {/* Wishlist page */}
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Profile page - Protected */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Payment page - Protected */}
        <Route path="/payment" element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } />

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Sign Up page */}
        <Route path="/signup" element={<Signup />} />

        {/* Forgot password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ADD THIS ROUTE - Email Verification */}
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Delivery page */}
        <Route path="/delivery" element={<DeliveryInfo />} />

        {/* Checkout page */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsAndConditions />} />

        {/* Admin Routes - Protected */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRoles={["ADMIN", "OWNER"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/orders" element={
          <ProtectedRoute requiredRoles={["ADMIN", "OWNER"]}>
            <AdminOrders />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/fulfillment" element={
          <ProtectedRoute requiredRoles={["ADMIN", "OWNER"]}>
            <FulfillmentView />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/orders/:orderId" element={
          <ProtectedRoute requiredRoles={["ADMIN", "OWNER"]}>
            <AdminOrderDetails />
          </ProtectedRoute>
        } />

        <Route path="/owner" element={
          <ProtectedRoute requiredRoles={["OWNER"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        
      </Routes>
      <Chatbot />
    </div>
  );
};

export default App;