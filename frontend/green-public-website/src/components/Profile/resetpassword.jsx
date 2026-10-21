import React, { useState } from "react";
import { resetPassword } from "@/api/authApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false
  });

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const passwordsMatch = formData.newPassword === formData.confirmPassword;
  const isNewPasswordValid = validatePassword(formData.newPassword);
  const isFormValid = isNewPasswordValid && passwordsMatch && formData.confirmPassword;

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "" };
    if (password.length < 6) return { strength: 1, text: "Too short" };
    if (password.length < 8) return { strength: 2, text: "Weak" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      return { strength: 4, text: "Strong" };
    }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, text: "Good" };
    }
    return { strength: 2, text: "Weak" };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // Dynamic password requirements
  const passwordRequirements = [
    { text: "At least 6 characters", met: formData.newPassword.length >= 6 },
    { text: "8+ characters for better security", met: formData.newPassword.length >= 8 },
    { text: "Includes uppercase letter", met: /[A-Z]/.test(formData.newPassword) },
    { text: "Includes number", met: /[0-9]/.test(formData.newPassword) },
    { text: "Includes special character", met: /[!@#$%^&*]/.test(formData.newPassword) },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (message.text) setMessage({ text: "", type: "" });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    if (!token) {
      setMessage({ 
        text: "Invalid or expired reset link. Please request a new password reset.", 
        type: "error" 
      });
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setMessage({ 
        text: "Passwords do not match. Please make sure both passwords are identical.", 
        type: "error" 
      });
      setLoading(false);
      return;
    }

    if (!isNewPasswordValid) {
      setMessage({ 
        text: "Password must be at least 6 characters long.", 
        type: "error" 
      });
      setLoading(false);
      return;
    }

    try {
      await resetPassword({ 
        token, 
        newPassword: formData.newPassword, 
        confirmPassword: formData.confirmPassword 
      });
      
      setMessage({ 
        text: "Password reset successfully! Redirecting to login...", 
        type: "success" 
      });
      
      // Clear form
      setFormData({ newPassword: "", confirmPassword: "" });
      setTouched({ newPassword: false, confirmPassword: false });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { message: "Password reset successful! You can now log in with your new password." }
        });
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      
      let errorMessage = "Failed to reset password. ";
      if (err.response?.status === 400) {
        errorMessage += "The link may have expired or is invalid.";
      } else if (err.response?.status === 401) {
        errorMessage += "Invalid or expired reset token.";
      } else {
        errorMessage += "Please try again.";
      }
      
      setMessage({ 
        text: err.response?.data?.message || errorMessage, 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DAB6A2] to-[#e9d6c5] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="absolute left-4 top-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={18} className="mr-1" />
              Back
            </Button>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                Reset Password
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create a new password for your account
              </CardDescription>
            </motion.div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pb-6">
              {/* Message Alert */}
              <AnimatePresence>
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                      message.type === "success" 
                        ? "bg-green-50 border border-green-200 text-green-700" 
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <span>{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Token Missing Warning */}
              {!token && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm"
                >
                  <AlertCircle size={18} />
                  <span>Invalid reset link. Please request a new password reset.</span>
                </motion.div>
              )}

              {/* New Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="pl-10 pr-10 py-3 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                    disabled={!token}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={!token}
                  >
                    {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength
                              ? level <= 1
                                ? "bg-red-400"
                                : level <= 2
                                ? "bg-yellow-400"
                                : level <= 3
                                ? "bg-blue-400"
                                : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs ${
                        passwordStrength.strength <= 1 ? "text-red-500" :
                        passwordStrength.strength <= 2 ? "text-yellow-500" :
                        passwordStrength.strength <= 3 ? "text-blue-500" :
                        "text-green-500"
                      }`}>
                        {passwordStrength.text}
                      </p>
                      {touched.newPassword && (
                        <div>
                          {isNewPasswordValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10 py-3 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                    disabled={!token}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={!token}
                  >
                    {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 text-xs">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-500 text-xs">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Password Requirements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-50 p-3 rounded-lg"
              >
                <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={req.met ? "text-green-600" : "text-gray-600"}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </CardContent>

            <CardFooter className="pt-6 border-t border-gray-100 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  disabled={loading || !isFormValid || !token}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 h-12 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </motion.div>

              {/* Resend option for expired tokens */}
              {message.type === "error" && message.text.includes("expired") && (
                <div className="text-center w-full">
                  <span className="text-sm text-gray-600">
                    Need a new reset link?{" "}
                    <Link to="/forgot-password">
                      <Button
                        variant="link"
                        className="text-green-600 font-semibold hover:text-green-700 hover:underline p-0 h-auto text-sm"
                      >
                        Request a new one
                      </Button>
                    </Link>
                  </span>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;