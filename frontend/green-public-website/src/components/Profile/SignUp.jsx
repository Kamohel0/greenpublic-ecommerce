"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/api/authApi";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Sparkles,
  UserPlus,
  Shield
} from "lucide-react";

const Signup = ({ onSuccess, showHeader = true }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6) return { strength: 1, text: "Too short", color: "text-red-500" };
    if (password.length < 8) return { strength: 2, text: "Weak", color: "text-orange-500" };
    if (password.length < 10) return { strength: 3, text: "Good", color: "text-yellow-600" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      return { strength: 5, text: "Excellent", color: "text-green-600" };
    }
    return { strength: 4, text: "Strong", color: "text-green-500" };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    // Validate all fields
    if (!validateName(formData.name) || !validateEmail(formData.email) || !validatePassword(formData.password)) {
      setErrorMsg("Please fill in all fields correctly");
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      setSuccessMsg("Account created successfully! Please check your email to verify your account.");
      setFormData({ name: "", email: "", password: "" });
      setTouched({ name: false, email: false, password: false });
      
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const containerClasses = showHeader 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5f2] to-[#f1e9df] px-4 py-8"
    : "w-full";

  const cardClasses = `shadow-2xl border-0 ${
    showHeader ? "rounded-3xl" : "rounded-2xl"
  } overflow-hidden bg-gradient-to-b from-white to-gray-50 border border-gray-200`;

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, y: showHeader ? 50 : 0, scale: showHeader ? 0.95 : 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={showHeader ? "w-full max-w-md" : "w-full"}
      >
        <Card className={cardClasses}>
          {showHeader && (
            <CardHeader className="text-center pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                    <UserPlus className="text-[#8B5A2B]" size={28} />
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-2 mb-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join Our Community
                </span>
                <CardTitle 
                  className="text-3xl font-bold text-gray-800 mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Create Your Account
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Start your journey to natural wellness today
                </CardDescription>
              </motion.div>
            </CardHeader>
          )}

          <CardContent className={showHeader ? "pb-6" : "pt-6"}>
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Messages */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl text-red-800 text-sm font-medium"
                  >
                    <AlertCircle size={18} className="text-red-600" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl text-green-800 text-sm font-medium"
                  >
                    <CheckCircle size={18} className="text-green-600" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                  />
                  {touched.name && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {validateName(formData.name) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.name && !validateName(formData.name) && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    Name must be at least 2 characters long
                  </motion.p>
                )}
              </motion.div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                  />
                  {touched.email && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {validateEmail(formData.email) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.email && !validateEmail(formData.email) && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    Please enter a valid email address
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#8B5A2B] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <motion.div
                          key={level}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: level * 0.05 }}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength
                              ? level <= 2
                                ? "bg-gradient-to-r from-red-400 to-orange-400"
                                : level <= 3
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </p>
                      <div className="flex items-center gap-1">
                        <Shield className={`w-3 h-3 ${
                          passwordStrength.strength >= 4 ? "text-green-500" : "text-gray-400"
                        }`} />
                        <span className="text-xs text-gray-500">
                          {passwordStrength.strength >= 4 ? "Secure" : "Needs improvement"}
                        </span>
                      </div>
                    </div>
                    <ul className="grid grid-cols-2 gap-2 mt-2">
                      <li className="flex items-center gap-1.5 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">8+ characters</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">Uppercase</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">Number</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">Special char</span>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </motion.div>

              {/* Terms Agreement */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex items-start gap-2"
              >
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#8B5A2B] focus:ring-[#8B5A2B]/20 focus:ring-2"
                  required
                />
                <Label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the{" "}
                  <Link to="/terms" className="text-[#8B5A2B] hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-[#8B5A2B] hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={loading || !validateName(formData.name) || !validateEmail(formData.email) || !validatePassword(formData.password)}
                  className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white text-base font-semibold rounded-xl py-3.5 h-12 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium">Creating Account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus size={18} />
                      Create Account
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          {showHeader && (
            <CardFooter className="flex flex-col gap-6 pt-8 pb-8 border-t border-gray-200">
              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center"
              >
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login">
                    <Button
                      variant="link"
                      className="text-[#8B5A2B] font-semibold hover:text-[#9C6B3C] hover:underline p-0 h-auto text-sm"
                    >
                      Sign in here
                    </Button>
                  </Link>
                </span>
              </motion.div>

              {/* Trust Badge */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xs text-gray-500 text-center mt-2"
              >
                <span className="flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Your information is encrypted and secure
                </span>
              </motion.p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;