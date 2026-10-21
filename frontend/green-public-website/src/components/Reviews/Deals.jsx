"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaGift, FaTag, FaRocket, FaEnvelope, FaCheckCircle } from "react-icons/fa";
import { Sparkles, Mail, Gift, Zap, Shield } from "lucide-react";

const Deals = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail("");
    
    // Reset success message after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section 
      className="bg-gradient-to-br from-[#DAB6A2] via-[#e9d6c5] to-[#f8f5f2] py-16 md:py-20 lg:py-24 relative overflow-hidden"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B5A2B' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Floating decorative elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-[#DAB6A2]/20 to-[#8B5A2B]/10"
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: Math.random() * 30 + 10,
            height: Math.random() * 30 + 10,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header with badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-white text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Exclusive Community
            </span>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 leading-tight">
              Join Our <span className="text-[#8B5A2B]">Glow Circle</span>
            </h2>
            
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "120px" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] mx-auto rounded-full"
            />
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <p className="text-xl text-gray-600 text-center mb-10 leading-relaxed max-w-2xl mx-auto">
              Be the first to receive exclusive offers, early access to new products, 
              and insider skincare tips from our experts.
            </p>

            {/* Benefits Grid */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto">
              {[
                { 
                  icon: Gift, 
                  title: "Welcome Gift", 
                  description: "Get a free skincare sample with your first subscription"
                },
                { 
                  icon: Zap, 
                  title: "Early Access", 
                  description: "Be the first to try our latest innovations"
                },
                { 
                  icon: FaTag, 
                  title: "Members-Only Deals", 
                  description: "Exclusive discounts available only to subscribers"
                },
                { 
                  icon: Shield, 
                  title: "Expert Advice", 
                  description: "Personalized skincare tips from our specialists"
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#DAB6A2]/20"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#DAB6A2]/20 to-[#e9d6c5]/20 flex items-center justify-center mb-4">
                        <Icon className="text-[#8B5A2B] text-2xl" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div> */}
          </motion.div>

          {/* Newsletter Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-10 shadow-2xl border border-[#DAB6A2]/30"
          >
            <div className="max-w-2xl mx-auto">
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Mail className="text-[#8B5A2B] text-2xl" />
                  <h3 className="text-2xl font-bold text-gray-800">Join Our Exclusive List</h3>
                </div>
                <p className="text-gray-600">
                  Enter your email below to unlock premium benefits and skincare insights
                </p>
              </div>

              {/* Email Form */}
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your best email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 bg-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl group"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </motion.div>
                    ) : isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <FaCheckCircle className="text-xl" />
                        <span>Successfully Joined!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <FaPaperPlane className="text-lg group-hover:translate-x-1 transition-transform" />
                        <span>Join The Glow Circle</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.form>

              {/* Success Message */}
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-green-700 text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Sparkles className="text-green-600" />
                      <span className="font-semibold">Welcome to the Glow Family!</span>
                    </div>
                    <p className="text-sm">
                      Check your inbox for a special welcome gift. Your skincare journey starts now!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trust & Privacy */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="text-[#8B5A2B] w-4 h-4" />
                    <span>Your privacy is our priority</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center sm:text-right">
                    <p>No spam, ever • Secure data handling</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#e9d6c5] border-2 border-white" />
                  ))}
                </div>
                <span>Join 500+ Glow Members</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                <div className="text-[#8B5A2B] font-semibold">4.9/5</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaPaperPlane key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span>Newsletter Satisfaction</span>
              </div>
            </div>
          </motion.div> */}
        </motion.div>
      </div>
    </section>
  );
};

export default Deals;