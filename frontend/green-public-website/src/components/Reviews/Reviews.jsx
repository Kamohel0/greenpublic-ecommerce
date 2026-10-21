import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaStar, FaQuoteLeft, FaPaperPlane, FaCheckCircle, FaUser, FaCalendar, FaHeart, FaAward, FaSmile } from "react-icons/fa";
import { Sparkles, Star, Shield, Users } from "lucide-react";
import swirl from "../../assets/swirl.svg";
import { createReview, getReviewsByProduct } from "../../api/reviewApi";
import { getProducts } from "../../api/productApi";

const Reviews = ({ productId }) => {
  const [resolvedProductId, setResolvedProductId] = useState(productId || null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProducts, setHasProducts] = useState(true);

  useEffect(() => {
    setResolvedProductId(productId || null);
  }, [productId]);

  useEffect(() => {
    let mounted = true;
    const resolveProduct = async () => {
      if (productId) return;
      try {
        const products = await getProducts();
        const first = Array.isArray(products) ? products[0] : null;
        if (mounted) {
          if (first?.id) {
            setResolvedProductId(first.id);
          } else {
            setHasProducts(false);
          }
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        if (mounted) setHasProducts(false);
      }
    };

    resolveProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    let mounted = true;
    const loadReviews = async () => {
      if (!resolvedProductId) return;
      setIsLoading(true);
      try {
        const data = await getReviewsByProduct(resolvedProductId);
        if (mounted) {
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadReviews();
    return () => {
      mounted = false;
    };
  }, [resolvedProductId]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 8000,
    pauseOnHover: true,
    arrows: false,
    fade: true,
    adaptiveHeight: true,
    appendDots: (dots) => (
      <div className="mt-8 md:mt-10">
        <ul className="flex justify-center space-x-3">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] opacity-30 transition-all duration-300 hover:opacity-100" />
    ),
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim() || rating === 0 || !resolvedProductId) return;

    setIsSubmitting(true);
    try {
      const newReview = await createReview({
        productId: resolvedProductId,
        rating,
        comment: reviewText,
      });
      setReviews((prev) => [newReview, ...prev]);
      setReviewText("");
      setRating(0);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (error) {
      if (error?.response?.status === 401) {
        alert("Please login to submit a review");
      } else {
        alert("Failed to submit review. Please try again.");
      }
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatReviewDate = (dateValue) => {
    if (!dateValue) return "Just now";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "Just now";
    return parsed.toLocaleDateString();
  };

  const getDisplayName = (name) => (name || "Customer").trim();

  return (
    <section 
      className="bg-gradient-to-b from-white to-[#f8f5f2] py-16 md:py-24 relative overflow-hidden"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B5A2B' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            Trusted Reviews
          </span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 leading-tight">
            Loved By <span className="text-[#8B5A2B]">Our Community</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real stories from customers who have experienced the Glow difference
          </p>
        </motion.div>

        {/* Reviews Slider Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 md:p-10 shadow-2xl border border-[#DAB6A2]/20">
            {!hasProducts ? (
              <div className="text-center py-16 text-gray-600">No products found to display reviews.</div>
            ) : isLoading ? (
              <div className="text-center py-16 text-gray-600">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No reviews yet. Be the first to share your experience!</div>
            ) : (
            <Slider {...settings}>
              {reviews.map((review, idx) => (
                <div key={review.id || idx} className="outline-none focus:outline-none">
                  <div className="flex flex-col items-center text-center px-4 md:px-8 lg:px-16">
                    {/* Animated Swirl */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="mb-8"
                    >
                      <img 
                        src={swirl} 
                        alt="decorative swirl" 
                        className="w-20 md:w-24 opacity-80"
                      />
                    </motion.div>
                    
                    {/* Quote Icon */}
                    <div className="text-4xl md:text-5xl text-[#8B5A2B] mb-6 opacity-60">
                      <FaQuoteLeft />
                    </div>

                    {/* Review Text */}
                    <p className="text-xl md:text-2xl lg:text-3xl text-gray-800 mb-8 leading-relaxed italic px-2 sm:px-0 max-w-4xl font-medium">
                      "{review.comment}"
                    </p>

                    {/* Rating & Product */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-5 h-5 md:w-6 md:h-6 ${
                                starIdx < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Perfect Score</span>
                      </div>
                      
                      {review.verified && (
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 px-3 py-1.5 rounded-full border border-[#DAB6A2]/30">
                          <Shield className="w-3 h-3 text-[#8B5A2B]" />
                          <span className="text-xs font-medium text-[#8B5A2B]">Verified Purchase</span>
                        </div>
                      )}
                    </div>

                    {/* Customer Profile */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] text-white flex items-center justify-center text-lg font-semibold border-4 border-white shadow-xl">
                            {getDisplayName(review.userName).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] flex items-center justify-center">
                            <FaUser className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-gray-800 text-lg md:text-xl">{getDisplayName(review.userName)}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <FaCalendar className="w-3 h-3" />
                              <span>{formatReviewDate(review.createdAt)}</span>
                            </div>
                            <div className="hidden sm:block">•</div>
                            {review.skinType && (
                            <div className="hidden sm:flex items-center gap-1">
                              <FaSmile className="w-3 h-3" />
                              <span>{review.skinType}</span>
                            </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Product Used */}
                      {review.product && (
                        <div className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f8f5f2] to-[#f1e9df] rounded-xl border border-[#DAB6A2]/30">
                          <span className="text-sm font-medium text-[#8B5A2B]">Used: {review.product}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
            )}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16"
        >
          {[
            { value: "4.9★", label: "Average Rating", icon: Star, color: "text-yellow-500" },
            { value: "500+", label: "Happy Customers", icon: Users, color: "text-[#8B5A2B]" },
            { value: "98%", label: "Would Recommend", icon: FaHeart, color: "text-rose-500" },
            { value: "100+", label: "Verified Reviews", icon: FaAward, color: "text-emerald-500" }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-[#DAB6A2]/20 text-center"
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Leave Review Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-12 shadow-2xl border border-[#DAB6A2]/20"
        >
          <div className="max-w-3xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Share Your <span className="text-[#8B5A2B]">Glow Experience</span>
              </h3>
              <p className="text-gray-600">
                We value your feedback. Help others discover the power of natural skincare.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-8">
              {/* Star Rating */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-lg font-medium text-gray-700 mb-2">How would you rate your experience?</div>
                  <div className="flex gap-2 md:gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-3xl md:text-4xl transition-all duration-300 active:scale-95 hover:scale-110"
                      >
                        <FaStar
                          className={`${
                            star <= (hoverRating || rating)
                              ? "text-yellow-400 fill-current drop-shadow-lg"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {rating > 0 ? `Selected: ${rating} star${rating > 1 ? 's' : ''}` : "Click to rate"}
                  </div>
                </div>
              </div>

              {/* Review Input */}
              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700 text-center">
                  Tell us about your experience
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Share your story... What did you love about our products? How has your skin transformed?"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 bg-white resize-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  />
                  <div className="absolute top-4 right-4 text-gray-400">
                    <FaQuoteLeft />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={!reviewText.trim() || rating === 0 || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full md:w-auto md:mx-auto bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed text-lg shadow-xl hover:shadow-2xl group"
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
                        <span>Submitting...</span>
                      </motion.div>
                    ) : isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <FaCheckCircle className="text-xl" />
                        <span>Review Submitted!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <FaPaperPlane className="text-lg group-hover:translate-x-1 transition-transform" />
                        <span>Share Your Experience</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>

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
                    <span className="font-semibold">Thank You for Your Review!</span>
                  </div>
                  <p className="text-sm">
                    Your feedback helps us improve and inspires others on their skincare journey.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Privacy Note */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                <Shield className="text-[#8B5A2B] w-4 h-4" />
                <span>All reviews are verified before publishing. Your privacy is protected.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slick-dots li.slick-active div {
          opacity: 1 !important;
          transform: scale(1.2);
          background: linear-gradient(135deg, #DAB6A2, #8B5A2B) !important;
        }
        
        .slick-dots li:hover div {
          opacity: 0.6;
        }
        
        /* Smooth slider transitions */
        .slick-slider {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .slick-slide {
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        
        .slick-active {
          opacity: 1;
        }
        
        /* Remove outline on focus */
        .slick-slide:focus {
          outline: none;
        }
      `}</style>
    </section>
  );
};

export default Reviews;