import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { getProducts } from "@/api/productApi";
import useWishlistStore from "@/components/store/useWishlistStore";
import { Search, Filter, Star, Heart, Sparkles, ShoppingBag, Tag, TrendingUp } from "lucide-react";

const staticItems = [
  { 
    img: SeaMossGelImg, 
    name: "Sea Moss Gel", 
    price: "R 120", 
    priceValue: 120,
    id: "1",
    category: "gels",
    description: "Pure Irish sea moss gel packed with 92 essential minerals for daily wellness and vitality.",
    rating: 4.9,
    reviewCount: 128,
    tags: ["Best Seller", "Organic"]
  },
  { 
    img: SeaMossBodyButterImg, 
    name: "Sea Moss Body Butter", 
    price: "R 180", 
    priceValue: 180,
    id: "2",
    category: "skincare",
    description: "Luxuriously rich body butter with shea butter and sea moss for silky smooth, deeply nourished skin.",
    rating: 4.8,
    reviewCount: 94,
    tags: ["New", "Premium"]
  },
  { 
    img: CastorOilImg, 
    name: "Sea Moss Oil", 
    price: "R 100", 
    priceValue: 100,
    id: "3",
    category: "oils",
    description: "Nourishing blend of sea moss and essential oils for hair growth and skin radiance.",
    rating: 4.7,
    reviewCount: 76,
    tags: ["Hair Care", "Multi-Purpose"]
  },
  { 
    img: BalmImg, 
    name: "Sea Moss Lip Balm", 
    price: "R 80", 
    priceValue: 80,
    id: "4",
    category: "skincare",
    description: "Soothing lip care infused with sea moss and natural moisturizers for soft, hydrated lips.",
    rating: 4.9,
    reviewCount: 52,
    tags: ["Travel Size", "Vegan"]
  },
];

const Products = ({ searchTerm }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchTerm || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [, setHoveredProduct] = useState(null);
  const [items, setItems] = useState(staticItems);
  const { isInWishlist, addToWishlist, removeFromWishlist, fetchWishlist } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getProducts();
        if (!mounted) return;
        
        const mapped = (data || []).map((p) => {
          const rawCategory = p.category;
          const category = typeof rawCategory === "string"
            ? rawCategory
            : (rawCategory && (rawCategory.name || rawCategory.title || String(rawCategory))) || "general";

          return {
            id: p.id ? String(p.id) : String(p.productId || p._id || Math.random()),
            name: p.name || p.productName || "",
            description: p.description || p.shortDescription || "",
            priceValue: p.price || p.priceValue || 0,
            price: p.price ? `R ${p.price}` : p.displayPrice || "",
            category,
            reviewCount: Array.isArray(p.reviews) ? p.reviews.length : (p.reviewCount || 0),
            rating: Array.isArray(p.reviews) && p.reviews.length > 0
              ? parseFloat((p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1))
              : (p.rating || 0),
            tags: p.tags || [],
            stockQuantity: Number(p.stockQuantity ?? 0),
            reservedQuantity: Number(p.reservedQuantity ?? 0),
            availableStock: Number(p.availableStock ?? p.stockQuantity ?? 0),
            lowStock: Boolean(p.lowStock),
            img: p.image
              ? (p.image.startsWith("http") ? p.image : `${import.meta.env.VITE_API_BASE_URL}${p.image}`)
              : getProductImageByName(p.name),
          };
        });
        
        if (mapped.length > 0) setItems(mapped);
      } catch (err) {
        console.warn("Failed to load products from API, using static items", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchProducts();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    if (typeof fetchWishlist === "function") {
      fetchWishlist().catch((err) => console.warn("Failed to load wishlist", err));
    }
  }, [fetchWishlist]);

  // Toggle wishlist
  const toggleWishlist = (product) => {
    if (!product?.id) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // Extract unique categories
  const categories = [
    "all",
    ...new Set(
      items.map((item) => (typeof item.category === "string" ? item.category : (item.category && item.category.name) || String(item.category)))
    ),
  ];

  // Filter items based on search and category
  const filteredItems = items.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCategory === "all" || p.category === selectedCategory)
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    hover: {
      y: -10,
      scale: 1.03,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="bg-gradient-to-b from-white to-[#f8f5f2] py-20 md:py-28" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            Premium Collection
          </span>
          
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Discover Our <span className="text-[#8B5A2B]">Natural Treasures</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Handcrafted sea moss products designed to nourish your skin and elevate your wellness routine
          </p>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Search Input */}
          <div className="w-full lg:w-96">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search our premium collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all duration-300 bg-white shadow-sm"
                style={{ fontFamily: "'Playfair Display', serif" }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-gray-600 font-medium">
              <Filter className="w-4 h-4" />
              <span>Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-[#DAB6A2] hover:text-[#8B5A2B]"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-[#DAB6A2] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600">Loading our premium collection...</p>
              </div>
            </div>
          ) : (
            <motion.div
              key={`${search}-${selectedCategory}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    layout
                    whileHover="hover"
                    onHoverStart={() => setHoveredProduct(product.id)}
                    onHoverEnd={() => setHoveredProduct(null)}
                    className="relative group"
                  >
                    <Link to={`/product/${product.id}`}>
                      <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-[#DAB6A2]/20">
                        {/* Product Image Container */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#f8f5f2] to-[#f1e9df] p-4 md:p-5 h-64 flex items-center justify-center">
                          {/* Tags */}
                          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                            {product.tags.slice(0, 2).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] text-white text-xs font-semibold rounded-full shadow-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          >
                            <Heart 
                              className={`w-5 h-5 transition-colors duration-300 ${
                                isInWishlist(product.id) 
                                  ? "text-red-500 fill-current" 
                                  : "text-gray-400 hover:text-red-500"
                              }`}
                            />
                          </button>
                          
                          {/* Product Image */}
                          <motion.img
                            src={product.img}
                            alt={product.name}
                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700"
                            whileHover={{ scale: 1.15 }}
                          />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Product Info */}
                        <div className="p-6">
                          {/* Category */}
                          <div className="mb-3">
                            <span className="text-xs font-medium text-[#8B5A2B] uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                          
                          {/* Name */}
                          <h3 
                            className="font-bold text-xl text-gray-800 mb-3 line-clamp-2 leading-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {product.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[60px] leading-relaxed">
                            {product.description}
                          </p>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(product.rating)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {product.reviewCount > 0
                                ? `${product.rating} (${product.reviewCount} review${product.reviewCount !== 1 ? 's' : ''})`
                                : "No reviews yet"}
                            </span>
                          </div>
                          
                          {/* Price & Action */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <span className="text-2xl font-bold text-[#8B5A2B]">
                                {product.price}
                              </span>
                              {product.lowStock && (
                                <p className="text-xs mt-1 text-red-600 font-semibold">
                                  Low stock — only {product.availableStock} left
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-xl flex items-center gap-2 group"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/product/${product.id}`);
                              }}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              View Details
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-16"
                >
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 max-w-2xl mx-auto border border-gray-200">
                    <div className="text-gray-400 mb-6">
                      <Search className="w-20 h-20 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-3">
                      No Products Found
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      We couldn't find any products matching your criteria. Try adjusting your search or filter.
                    </p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("all");
                      }}
                      className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Products Banner */}
        {/* {filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-20 bg-gradient-to-r from-[#f8f5f2] to-[#f1e9df] rounded-3xl p-8 border border-[#DAB6A2]/30"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-1">Premium Quality Guaranteed</h4>
                  <p className="text-gray-600 text-sm">
                    All products are ethically sourced and crafted with care
                  </p>
                </div>
              </div>
              <Link 
                to="/products"
                className="bg-white text-[#8B5A2B] hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all duration-300 border border-[#DAB6A2] hover:shadow-lg flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                View All Products
              </Link>
            </div>
          </motion.div>
        )} */}
      </div>
    </section>
  );
};

export default Products;