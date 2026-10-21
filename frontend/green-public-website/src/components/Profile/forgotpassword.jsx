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
import { forgotPassword } from "@/api/authApi";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  Shield, 
  KeyRound,
  Sparkles,
  HelpCircle
} from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    // Validate email
    if (!email.trim()) {
      setMessage({ 
        text: "Please enter your email address.", 
        type: "error" 
      });
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ 
        text: "Please enter a valid email address.", 
        type: "error" 
      });
      setLoading(false);
      return;
    }

    try {
      await forgotPassword({ email: email.trim() });
      setEmailSent(true);
      setMessage({ 
        text: "Password reset instructions have been sent to your email!", 
        type: "success" 
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage({ 
        text: err.response?.data?.message || "Failed to send reset email. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5f2] to-[#f1e9df] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-gradient-to-b from-white to-gray-50 border border-gray-200">
          <CardHeader className="text-center pb-8 relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute left-6 top-6"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-[#8B5A2B] hover:bg-[#DAB6A2]/10 rounded-lg px-3 py-2 transition-all duration-300"
              >
                <ArrowLeft size={18} className="mr-1.5" />
                Back to Login
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-8"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-2xl border border-[#DAB6A2]/20">
                  {emailSent ? (
                    <CheckCircle className="h-10 w-10 text-[#8B5A2B]" />
                  ) : (
                    <KeyRound className="h-10 w-10 text-[#8B5A2B]" />
                  )}
                </div>
              </div>
              
              <span className="inline-flex items-center px-4 py-2 mb-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                {emailSent ? "Email Sent" : "Password Reset"}
              </span>
              
              <CardTitle 
                className="text-3xl font-bold text-gray-800 mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {emailSent ? "Check Your Inbox" : "Forgot Password?"}
              </CardTitle>
              
              <CardDescription className="text-gray-600 text-base max-w-sm mx-auto">
                {emailSent 
                  ? "We've sent password reset instructions to your email" 
                  : "Enter your email address and we'll send you a reset link"
                }
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-8">
            <AnimatePresence mode="wait">
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium mb-8 ${
                    message.type === "success" 
                      ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-800" 
                      : "bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800"
                  }`}
                  role="alert"
                >
                  {message.type === "success" ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600" />
                  )}
                  <span>{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!emailSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setTouched(true);
                      }}
                      onBlur={() => setTouched(true)}
                      className={`pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        touched && !validateEmail(email) && email.length > 0
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                      }`}
                    />
                    {touched && email.length > 0 && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {validateEmail(email) ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched && !validateEmail(email) && email.length > 0 && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      Please enter a valid email address
                    </motion.p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
                    <HelpCircle size={14} className="text-gray-400" />
                    We'll send a reset link to this email address
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={loading || !validateEmail(email)}
                    className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white text-base font-semibold rounded-xl py-3.5 h-12 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium">Sending Reset Link...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Mail size={18} />
                        Send Reset Instructions
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-8"
              >
                {/* Success Animation */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: 0.2 
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-[#DAB6A2]/20 to-[#e9d6c5]/20 rounded-2xl border-2 border-[#DAB6A2] flex items-center justify-center"
                  >
                    <CheckCircle className="h-10 w-10 text-[#8B5A2B]" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h3 
                    className="text-2xl font-bold text-gray-800"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Reset Link Sent!
                  </h3>
                  <p className="text-gray-600">
                    We've sent password reset instructions to:
                  </p>
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <p className="font-semibold text-[#8B5A2B] text-lg break-all">
                      {email}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                    <Shield size={14} />
                    The reset link will expire in 1 hour for security
                  </p>
                </div>
                
                {/* Helpful Tips */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-left"
                >
                  <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <HelpCircle size={16} />
                    Didn't receive the email?
                  </p>
                  <ul className="text-xs text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800">•</span>
                      Check your spam or junk folder
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800">•</span>
                      Make sure you entered the correct email address
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800">•</span>
                      Wait a few minutes and check again
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-800">•</span>
                      Add noreply@yourdomain.com to your contacts
                    </li>
                  </ul>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      setMessage({ text: "", type: "" });
                      setTouched(false);
                    }}
                    className="flex-1 border-2 border-gray-300 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/5 text-gray-700 hover:text-[#8B5A2B] rounded-xl py-3 font-medium transition-all duration-300"
                  >
                    Try Different Email
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="flex-1 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white rounded-xl py-3 font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Back to Login
                  </Button>
                </div>

                {/* Resend Option */}
                <div className="pt-2">
                  <Button
                    variant="link"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm text-[#8B5A2B] hover:text-[#9C6B3C] font-medium p-0 h-auto"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Resending...
                      </span>
                    ) : (
                      "Click here to resend the email"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>

          {!emailSent && (
            <CardFooter className="pt-4 pb-8 border-t border-gray-200">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center w-full"
              >
                <span className="text-sm text-gray-600">
                  Remember your password?{" "}
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
            </CardFooter>
          )}

          {/* Security Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="px-6 pb-6"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield size={14} />
              <span>Your information is encrypted and secure</span>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;