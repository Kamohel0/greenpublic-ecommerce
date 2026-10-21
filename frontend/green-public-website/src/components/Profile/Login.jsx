import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles, LogIn } from "lucide-react";

// UI Components
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

// API & State Management
import { login } from "@/api/authApi";
import useAuthStore from "@/components/store/useAuthStore";
import { Link } from "react-router-dom";

/**
 * Login Component
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback executed on successful login
 * @param {boolean} props.showHeader - Controls visibility of header/footer sections
 */
const Login = ({ onSuccess, showHeader = true }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Email and password are required.");
      return false;
    }
    return true;
  };

  const extractAuthData = (response) => {
    return {
      accessToken: response.data?.accessToken || response.data?.data?.accessToken,
      userData: response.data?.user || response.data?.data?.user || null
    };
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setErrorMessage("");
      setIsLoading(true);

      const credentials = {
        email: formData.email.trim(),
        password: formData.password.trim()
      };

      const response = await login(credentials);
      const { accessToken, userData } = extractAuthData(response);

      if (!accessToken || !userData) {
        throw new Error("Invalid server response");
      }

      // Update authentication store
      authLogin(accessToken, userData);

      // Execute success flow
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Authentication error:", error);
      
      if (error.response?.status === 400 || error.response?.status === 401) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error.message === "Invalid server response") {
        setErrorMessage("Unable to process login. Please contact support.");
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = showHeader 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5f2] to-[#f1e9df] px-5"
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
          {/* Header Section */}
          {showHeader && (
            <CardHeader className="text-center pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-xl border border-[#DAB6A2]/20">
                    <LogIn className="text-[#8B5A2B]" size={28} />
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-2 mb-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Welcome Back
                </span>
                <CardTitle 
                  className="text-3xl font-bold text-gray-800 mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Sign In to Your Account
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Continue your journey to natural wellness
                </CardDescription>
              </motion.div>
            </CardHeader>
          )}

          {/* Form Section */}
          <CardContent className={showHeader ? "pb-6" : "pt-6"}>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Display */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl text-red-800 text-sm font-medium"
                    role="alert"
                  >
                    <AlertCircle size={18} className="text-red-600" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  {showHeader && (
                    <Link
                      to="/forgot-password"
                      className="text-sm text-[#8B5A2B] hover:underline font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#8B5A2B] transition-colors p-1"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
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
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white text-base font-semibold rounded-xl py-3.5 h-12 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div 
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" 
                        aria-hidden="true"
                      />
                      <span className="font-medium">Authenticating...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn size={18} />
                      Sign In
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          {/* Footer Section (Registration & Social Login) */}
          {showHeader && (
            <CardFooter className="flex flex-col gap-6 pt-8 pb-8 border-t border-gray-200">
              {/* Registration Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <span className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/signup">
                    <Button
                      variant="link"
                      className="text-[#8B5A2B] font-semibold hover:text-[#9C6B3C] hover:underline p-0 h-auto text-sm"
                    >
                      Create Account
                    </Button>
                  </Link>
                </span>
              </motion.div>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;