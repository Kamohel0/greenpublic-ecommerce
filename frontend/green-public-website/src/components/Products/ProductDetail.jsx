import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaMinus, 
  FaPlus, 
  FaHeart, 
  FaShoppingBag, 
  FaStar,
  FaCheck,
  FaTruck,
  FaShieldAlt,
  FaLeaf,
  FaShareAlt,
  FaTag,
  FaBox,
  FaRecycle
} from "react-icons/fa";
import { Sparkles, Shield, Clock, Package, Award, ChevronRight } from "lucide-react";
import Footer from "../footer/Footer";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import { Link } from "react-router-dom";
import Slider from "react-slick";

// Product images
import SeaMossGelImg from "../../assets/sea_moss_gel.jpg";
import SeaMossBodyButterImg from "../../assets/sea_moss_body_butter.jpg";
import CastorOilImg from "../../assets/castor_oil.jpg";
import BalmImg from "../../assets/balm.jpg";

const getProductImageByName = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("gel")) return SeaMossGelImg;
  if (n.includes("butter")) return SeaMossBodyButterImg;
  if (n.includes("oil") || n.includes("castor")) return CastorOilImg;
  if (n.includes("balm") || n.includes("lip")) return BalmImg;
  return SeaMossGelImg;
};
import { getProductById, getProducts } from "@/api/productApi";
import { createReview, getReviewsByProduct } from "@/api/reviewApi";

// Enhanced product data
const items = [
  { 
    img: SeaMossGelImg, 
    name: "Sea Moss Gel", 
    price: "R 250", 
    priceValue: 250, 
    desc: "Our premium Sea Moss Gel is packed with 92 essential minerals and vitamins. Perfect for boosting immunity, improving digestion, and enhancing skin health. Made from 100% organic Irish sea moss.",
    benefits: ["Boosts Immunity", "Improves Digestion", "Enhances Skin Health", "Rich in Minerals"],
    ingredients: ["Organic Irish Sea Moss", "Spring Water", "Lemon Juice", "Natural Preservatives"],
    usage: ["Take 1-2 tablespoons daily", "Add to smoothies or juices", "Use as a face mask", "Store in refrigerator"],
    id: "1",
    category: "wellness"
  },
  { 
    img: SeaMossBodyButterImg, 
    name: "Sea Moss Body Butter", 
    price: "R 180", 
    priceValue: 180, 
    desc: "Luxurious body butter infused with sea moss extract. Provides deep hydration, improves skin elasticity, and leaves your skin feeling silky smooth with a natural glow.",
    benefits: ["Deep Hydration", "Improves Elasticity", "Natural Glow", "Non-Greasy"],
    ingredients: ["Shea Butter", "Sea Moss Extract", "Coconut Oil", "Vitamin E"],
    usage: ["Apply daily after shower", "Focus on dry areas", "Use as a hand cream", "Massage until absorbed"],
    id: "2",
    category: "skincare"
  },
  { 
    img: CastorOilImg, 
    name: "Sea Moss Castor Oil", 
    price: "R 180", 
    priceValue: 180, 
    desc: "Powerful hair growth blend combining sea moss nutrients with Jamaican black castor oil. Strengthens hair follicles and promotes healthy hair growth.",
    benefits: ["Promotes Hair Growth", "Strengthens Follicles", "Nourishes Scalp", "Reduces Breakage"],
    ingredients: ["Jamaican Black Castor Oil", "Sea Moss Extract", "Rosemary Oil", "Peppermint Oil"],
    usage: ["Apply to scalp nightly", "Massage for 5 minutes", "Leave overnight", "Wash in morning"],
    id: "3",
    category: "haircare"
  },
  { 
    img: BalmImg, 
    name: "Sea Moss Lip Balm", 
    price: "R 80", 
    priceValue: 80, 
    desc: "Soothing lip balm enriched with sea moss and natural oils. Provides long-lasting moisture and protection for dry, chapped lips.",
    benefits: ["Long-lasting Moisture", "Natural Protection", "Soothes Dry Lips", "Vegan Formula"],
    ingredients: ["Beeswax", "Sea Moss Extract", "Coconut Oil", "Vanilla Extract"],
    usage: ["Apply as needed", "Use before outdoor activities", "Carry in purse", "Reapply after meals"],
    id: "4",
    category: "skincare"
  },
];

const getFallbackProductImage = (productId, productName) => {
  return getProductImageByName(productName);
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState(items);

  // All hooks should be grouped here
  const addToCart = useCartStore((state) => state.addToCartLocal || state.addToCart);
  const modifyServerCart = useCartStore((state) => state.modifyServerCart);

  // Real catalogue for "Complete Your Wellness Ritual"; the static list is only a fallback
  useEffect(() => {
    let mounted = true;
    getProducts()
      .then((data) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        setCatalog(data.map((p) => ({
          id: String(p.id),
          name: p.name,
          desc: p.description || "",
          price: `R ${p.price}`,
          category: typeof p.category === "string" ? p.category : p.category?.name || "general",
          img: getFallbackProductImage(p.id, p.name),
        })));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getProductById(id);
        const p = data?.id || data?.product ? data : data;
        if (!mounted) return;

        const rawCategory = p.category;
        const category = typeof rawCategory === "string"
          ? rawCategory
          : (rawCategory && (rawCategory.name || rawCategory.title || String(rawCategory))) || "general";

        setProduct({
          id: p.id ? String(p.id) : String(p.productId || id),
          name: p.name || p.productName || "Product",
          desc: p.description || p.longDescription || "",
          benefits: p.benefits || ["Premium Quality", "Natural Ingredients", "Sustainable Sourcing", "Effective Results"],
          ingredients: p.ingredients || ["Organic Sea Moss", "Natural Oils", "Botanical Extracts", "Essential Vitamins"],
          usage: p.usage || ["Daily Use", "Morning & Night", "Apply Generously", "Massage In"],
          price: p.price ? `R ${p.price}` : p.displayPrice || "",
          priceValue: p.price || p.priceValue || 0,
          stockQuantity: Number(p.stockQuantity ?? 0),
          reservedQuantity: Number(p.reservedQuantity ?? 0),
          availableStock: Number(p.availableStock ?? p.stockQuantity ?? 0),
          lowStock: Boolean(p.lowStock),
          weight: p.weight || "",
          img: p.image
            ? (p.image.startsWith("http") ? p.image : `${import.meta.env.VITE_API_BASE_URL}${p.image}`)
            : getFallbackProductImage(p.id || p.productId || id, p.name),
          category,
        });
      } catch {
        const local = items.find((p) => p.id === id);
        if (mounted) setProduct(local || null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [id]);

  const [quantity, setQuantity] = useState(1);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Wishlist integration
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product?.id);

  useEffect(() => {
    let mounted = true;
    const loadReviews = async () => {
      if (!product?.id) return;
      setIsLoadingReviews(true);
      try {
        const data = await getReviewsByProduct(product.id);
        if (mounted) {
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setIsLoadingReviews(false);
      }
    };

    loadReviews();
    return () => {
      mounted = false;
    };
  }, [product]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f8f5f2]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Premium Product</h2>
          <p className="text-gray-600">Preparing your natural wellness experience...</p>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f8f5f2]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-[#DAB6A2]/30"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been moved.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (Number(product?.availableStock || 0) <= 0) {
      return;
    }

    if (quantity > Number(product?.availableStock || 0)) {
      setQuantity(Math.max(1, Number(product?.availableStock || 1)));
      return;
    }

    const payload = { ...product, quantity };
  
    const hasToken =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"));
  
    if (hasToken && typeof modifyServerCart === "function") {
      try {
        await modifyServerCart({
          productId: Number(product.id),
          quantity,
          action: "add",
        });
      } catch (err) {
        // If server fails, fall back to local cart so the user still sees items
        console.error("modifyServerCart failed, falling back to local cart", err);
        addToCart(payload);
      }
    } else {
      addToCart(payload);
    }
  
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 2000);
  };

  const toggleWishlist = async () => {
    if (!product) return;
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist({
          id: product.id,
          name: product.name || product.desc,
          priceValue: product.priceValue,
          img: product.img,
          price: product.price
        });
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim() || rating === 0) return;

    setIsSubmittingReview(true);
    try {
      const newReview = await createReview({
        productId: Number(product.id),
        rating,
        comment: reviewText,
      });
      setReviews((prev) => [newReview, ...prev]);
      setReviewText("");
      setRating(0);
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Please login to submit a review");
      } else {
        alert("Failed to submit review. Please try again.");
      }
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const formatReviewDate = (dateValue) => {
    if (!dateValue) return "Just now";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "Just now";
    return parsed.toLocaleDateString();
  };

  // Same category first, then the rest of the range
  const relatedProducts = catalog
    .filter((p) => String(p.id) !== String(product.id))
    .sort((a, b) => (b.category === product.category) - (a.category === product.category));

  return (
    <div className="bg-gradient-to-b from-white to-[#f8f5f2] min-h-screen" style={{ fontFamily: "'Playfair Display', serif" }}>
      {/* Success Notification */}
      <AnimatePresence>
        {showAddedToCart && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3"
          >
            <FaCheck className="text-white text-lg" />
            <div>
              <p className="font-semibold">Added to cart successfully!</p>
              <p className="text-sm text-white/90">Continue shopping or view your cart</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 md:gap-16 items-start"
        >
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg bg-[#f4ece4]">
              {/* Premium Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center px-3 py-1.5 bg-white/90 backdrop-blur text-[#8B5A2B] text-xs font-semibold rounded-full shadow-md">
                  <FaTag className="w-3 h-3 mr-2" />
                  Premium Quality
                </span>
              </div>
              
              {/* Share Button */}
              {/* <button className="absolute top-6 right-6 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <FaShareAlt className="text-[#8B5A2B] w-4 h-4" />
              </button> */}
              
              <img 
                src={product.img} 
                alt={product.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
              />
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 text-center border border-[#DAB6A2]/20 shadow-sm">
                <FaLeaf className="text-[#8B5A2B] text-lg mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">100% Natural</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-[#DAB6A2]/20 shadow-sm">
                <Shield className="text-[#8B5A2B] text-lg mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">Cruelty Free</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-[#DAB6A2]/20 shadow-sm">
                <Award className="text-[#8B5A2B] text-lg mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700">Award Winning</p>
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#8B5A2B] transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/#products" className="hover:text-[#8B5A2B] transition-colors">Products</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-800 font-medium">{product.name}</span>
            </nav>

            {/* Product Header */}
            <div>
              <span className="inline-flex items-center px-4 py-2 mb-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
                {product.category}
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar key={i} className={`w-5 h-5 ${i < Math.round(Number(avgRating)) ? "text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-gray-600">
                  {reviews.length > 0
                    ? `${avgRating} • (${reviews.length} verified review${reviews.length !== 1 ? 's' : ''})`
                    : "No reviews yet"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-4xl font-bold text-[#8B5A2B]">{product.price}</p>
              {product.availableStock <= 0 ? (
                <span className="text-sm bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full font-medium">
                  Out of Stock
                </span>
              ) : product.lowStock ? (
                <span className="text-sm bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-full font-medium">
                  Only {product.availableStock} left
                </span>
              ) : (
                <span className="text-sm bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-full font-medium">
                  In Stock
                </span>
              )}
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-3">
              {product.benefits?.slice(0, 4).map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#DAB6A2]/20">
                  <FaCheck className="text-green-500 text-sm" />
                  <span className="text-sm font-medium text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border-2 border-[#DAB6A2]/30 rounded-xl overflow-hidden">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="p-4 hover:bg-[#DAB6A2]/10 transition-colors text-[#8B5A2B]"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <FaMinus className="text-sm" />
                  </motion.button>
                  <span className="px-6 py-3 min-w-[70px] text-center text-lg font-bold text-gray-800">{quantity}</span>
                  <motion.button
                    disabled={quantity >= Number(product?.availableStock || 0)}
                    whileTap={{ scale: 0.9 }}
                    className="p-4 hover:bg-[#DAB6A2]/10 transition-colors text-[#8B5A2B] disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(q + 1, Number(product?.availableStock || q + 1)))}
                  >
                    <FaPlus className="text-sm" />
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: product?.availableStock > 0 ? 1.02 : 1 }}
                  whileTap={{ scale: product?.availableStock > 0 ? 0.98 : 1 }}
                  disabled={!product?.availableStock || product.availableStock <= 0}
                  className={`flex-1 px-8 py-5 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl text-lg ${
                    product?.availableStock > 0
                      ? "bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white hover:shadow-2xl"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleAddToCart}
                >
                  <FaShoppingBag className="text-xl" />
                  {product?.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                    isWishlisted 
                      ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-500 shadow-lg" 
                      : "bg-white border-[#DAB6A2] text-gray-600 hover:border-red-300 hover:text-red-500 hover:shadow-lg"
                  }`}
                  onClick={toggleWishlist}
                >
                  <FaHeart className={`text-xl ${isWishlisted ? "fill-current" : ""}`} />
                </motion.button>
              </div>
            </div>

            {/* Premium Features */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-[#DAB6A2]/20">
              {/* <div className="text-center p-4 bg-white rounded-xl border border-[#DAB6A2]/20">
                <FaTruck className="mx-auto text-[#8B5A2B] mb-3 text-xl" />
                <p className="text-xs font-medium text-gray-700">Free Shipping</p>
                <p className="text-xs text-gray-500">Over R150</p>
              </div> */}
              {/* <div className="text-center p-4 bg-white rounded-xl border border-[#DAB6A2]/20">
                <FaShieldAlt className="mx-auto text-[#8B5A2B] mb-3 text-xl" />
                <p className="text-xs font-medium text-gray-700">60-Day Return</p>
                <p className="text-xs text-gray-500">Guarantee</p>
              </div> */}
              <div className="text-center p-4 bg-white rounded-xl border border-[#DAB6A2]/20">
                <FaLeaf className="mx-auto text-[#8B5A2B] mb-3 text-xl" />
                <p className="text-xs font-medium text-gray-700">100% Natural</p>
                <p className="text-xs text-gray-500">Ingredients</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-[#DAB6A2]/20">
                <Clock className="mx-auto text-[#8B5A2B] mb-3 text-xl" />
                <p className="text-xs font-medium text-gray-700">Fast Delivery</p>
                <p className="text-xs text-gray-500">2-4 Days</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-[#DAB6A2]/20 overflow-hidden"
        >
          <div className="border-b border-[#DAB6A2]/20">
            <nav className="flex flex-wrap gap-2 md:gap-8 px-6 md:px-8">
              {[
                { id: "description", label: "Description", icon: Sparkles },
                { id: "ingredients", label: "Ingredients", icon: Package },
                { id: "usage", label: "How to Use", icon: FaBox },
                { id: "benefits", label: "Benefits", icon: Award },
                { id: "reviews", label: "Reviews", icon: FaStar }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center gap-2 pb-4 px-1 font-medium text-base capitalize transition-colors ${
                      activeTab === tab.id
                        ? "text-[#8B5A2B] border-b-2 border-[#8B5A2B]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="prose max-w-none"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">About This Product</h3>
                  <p className="text-gray-700 leading-relaxed text-lg mb-8">{product.desc}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-gradient-to-r from-[#f8f5f2] to-[#f1e9df] rounded-2xl p-6">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Sparkles className="text-[#8B5A2B]" />
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {product.benefits?.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-[#f8f5f2] to-[#f1e9df] rounded-2xl p-6">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Package className="text-[#8B5A2B]" />
                        Product Details
                      </h4>
                      <ul className="space-y-2">
                        {product.weight && (
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-600">Net weight: {product.weight}</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-600">Premium eco-friendly packaging</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-600">Usage guide included</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "ingredients" && (
                <motion.div
                  key="ingredients"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Natural Ingredients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.ingredients?.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#DAB6A2]/20">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#DAB6A2]/20 to-[#e9d6c5]/20 flex items-center justify-center">
                          <FaLeaf className="text-[#8B5A2B]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{ingredient}</h4>
                          <p className="text-sm text-gray-600">100% Natural • Sustainably Sourced</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "usage" && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">How to Use</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.usage?.map((step, index) => (
                      <div key={index} className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-[#DAB6A2]/20">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] text-white flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800">Step {index + 1}</h4>
                        </div>
                        <p className="text-gray-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "benefits" && (
                <motion.div
                  key="benefits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Health & Wellness Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.benefits?.map((benefit, index) => (
                      <div key={index} className="p-6 bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                            <FaCheck className="text-green-600 text-xl" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">{benefit}</h4>
                            <p className="text-gray-600 text-sm">
                              Experience the transformative effects of this premium ingredient blend
                              for optimal wellness and natural beauty.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Customer Reviews</h3>
                  
                  {/* Average Rating */}
                  <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-[#f8f5f2] to-[#f1e9df] rounded-2xl">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#8B5A2B] mb-2">{avgRating}</div>
                      <div className="flex gap-1 mb-2 flex-nowrap">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.round(avgRating) ? "text-yellow-400" : "text-gray-300"} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Review Form */}
                  <div className="mb-12 p-8 bg-white rounded-2xl border border-[#DAB6A2]/20">
                    <h4 className="text-xl font-bold text-gray-800 mb-6">Share Your Experience</h4>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Your Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-2 hover:scale-125 transition-transform"
                            >
                              <FaStar 
                                className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Your Review</label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this product..."
                          className="w-full px-4 py-3 border border-[#DAB6A2]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent resize-none"
                          rows="5"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isSubmittingReview || !reviewText.trim() || rating === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                      </motion.button>
                    </form>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {isLoadingReviews ? (
                      <div className="text-center py-12 text-gray-600">
                        <p className="text-lg">Loading reviews...</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-600">
                        <p className="text-lg">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-white rounded-2xl border border-[#DAB6A2]/20"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-800">{review.userName || "Customer"}</p>
                              <p className="text-sm text-gray-500">{formatReviewDate(review.createdAt)}</p>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={i < review.rating ? "text-yellow-400" : "text-gray-300"} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  Complete Your <span className="text-[#8B5A2B]">Wellness Ritual</span>
                </h3>
                <p className="text-gray-600">Discover more products from our premium collection</p>
              </div>
              <Link 
                to="/#products" 
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View All Products
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.slice(0, 3).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-[#DAB6A2]/25"
                >
                  <Link to={`/product/${item.id}`} className="block group">
                    <div className="relative aspect-square overflow-hidden bg-[#f4ece4]">
                      <img 
                        src={item.img} 
                        alt={item.name} 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[#8B5A2B] uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-xl font-bold text-[#8B5A2B]">{item.price}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h4>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.desc}</p>
                      <button className="w-full bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] hover:from-[#DAB6A2]/20 hover:to-[#e9d6c5]/20 px-4 py-3 rounded-xl font-medium transition-all duration-300">
                        View Product
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}