"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, User, Search, Menu, X, Heart, Leaf, Sparkles, ChevronDown, Home, Info, Package, Star, Phone, Shield, BarChart3 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useCartStore from "@/components/store/useCartStore";
import useWishlistStore from "@/components/store/useWishlistStore";
import useAuthStore from "@/components/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get cart count
  const cartCount = useCartStore((s) => (s.cart || []).reduce((t, i) => t + (i.quantity || 1), 0));
  
  // Get wishlist count and fetch function
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  // Get user data for admin check
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  // Initialize wishlist on component mount (server when authenticated, local otherwise)
  useEffect(() => {
    if (typeof fetchWishlist === "function") {
      fetchWishlist().catch(err => console.warn("Failed to load wishlist", err));
    }
  }, [fetchWishlist]);

  // Enhanced navigation items with icons and submenus
  const navItems = [
    { 
      id: "home", 
      label: "Home", 
      icon: Home,
      href: "/"
    },
    { 
      id: "about", 
      label: "About", 
      icon: Info,
      href: "/#about"
    },
    { 
      id: "products", 
      label: "Products", 
      icon: Package,
      href: "/#products",
      hasDropdown: true,
      subItems: [
        { label: "Sea Moss Gel", href: "/#products" },
        { label: "Body Butter", href: "/#products" },
        { label: "Essential Oils", href: "/#products" },
        { label: "Lip Care", href: "/#products" }
      ]
    },
    { 
      id: "reviews", 
      label: "Reviews", 
      icon: Star,
      href: "/#reviews"
    },
    { 
      id: "contact", 
      label: "Contact", 
      icon: Phone,
      href: "#contact"
    },
  ];

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      if (showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showSearch]);

  // Enhanced scroll/navigation helper
  const handleNavigation = useCallback((href) => {
    if (href.startsWith('/#')) {
      const path = href.split('#')[0];
      const targetId = href.split('#')[1];
      
      if (location.pathname === path || location.pathname === "/") {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ 
            behavior: "smooth",
            block: "start"
          });
        }
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
  }, [location.pathname, navigate]);

  // Search handler
  const handleSearch = useCallback((e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false);
      setSearchTerm("");
    }
  }, [searchTerm, navigate]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && !event.target.closest('.search-container')) {
        setShowSearch(false);
      }
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch, activeDropdown]);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-lg shadow-xl border-b border-[#DAB6A2]/20" 
          : "bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md shadow-lg border-b border-[#DAB6A2]/10"
      }`}
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      <div className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            aria-label="Go to homepage"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Leaf className="w-6 h-6 text-green-500" />
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 group-hover:text-[#8B5A2B] transition-colors duration-300">
                GreenPublic
              </span>
              <span className="text-xs text-gray-500">Natural Products</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <div 
                key={item.id} 
                className="relative dropdown-container"
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.id)}
                onMouseLeave={() => item.hasDropdown && setActiveDropdown(null)}
              >
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(item.href, item.id)}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#8B5A2B] hover:bg-[#DAB6A2]/10 px-4 py-2 rounded-xl transition-all duration-300 group font-medium"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      activeDropdown === item.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </Button>

                {/* Dropdown Menu */}
                {item.hasDropdown && activeDropdown === item.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#DAB6A2]/20 backdrop-blur-xl overflow-hidden"
                  >
                    <div className="p-2">
                      {item.subItems.map((subItem, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleNavigation(subItem.href, item.id)}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:text-[#8B5A2B] hover:bg-[#DAB6A2]/10 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                        >
                          <Sparkles className="w-3 h-3 text-[#8B5A2B] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-medium">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative search-container">
              <motion.div
                animate={{ width: showSearch ? "280px" : "40px" }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search our collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  onFocus={() => setShowSearch(true)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-full border border-[#DAB6A2]/30 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/30 focus:border-[#DAB6A2] transition-all duration-300 ${
                    showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  aria-label="Search products"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(prev => !prev)}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 hover:bg-[#DAB6A2]/10"
                  aria-label={showSearch ? "Close search" : "Open search"}
                >
                  {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
              </motion.div>
            </div>

            {/* Wishlist */}
            {/* <Link
              to="/wishlist"
              className="relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-[#DAB6A2]/10"
              >
                <Heart className="h-5 w-5 text-gray-700 hover:text-rose-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Button>
            </Link> */}

            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative"
              aria-label={`Shopping cart (${cartCount} items)`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-[#DAB6A2]/10 group"
              >
                <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-[#8B5A2B] transition-colors" />
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white text-xs rounded-full h-6 min-w-[24px] px-1.5 flex items-center justify-center font-bold shadow-lg"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* Admin Panel (only for admins) */}
            {(isAdmin || isOwner) && (
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#DAB6A2]/10 group"
                  aria-label="Admin panel"
                >
                  <Shield className="h-5 w-5 text-amber-600 hover:text-amber-700 transition-colors" />
                </Button>
              </Link>
            )}

            {isOwner && (
              <Link to="/owner">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#DAB6A2]/10 group"
                  aria-label="Owner dashboard"
                >
                  <BarChart3 className="h-5 w-5 text-purple-600 hover:text-purple-700 transition-colors" />
                </Button>
              </Link>
            )}

            {/* Profile */}
            <Link to="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#DAB6A2]/10"
                aria-label="User profile"
              >
                <User className="h-5 w-5 text-gray-700 hover:text-[#8B5A2B] transition-colors" />
              </Button>
            </Link>

            {/* CTA Button */}
            <Button
              onClick={() => handleNavigation("/#products", "products")}
              className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
            >
              Shop Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(prev => !prev)}
              className="hover:bg-[#DAB6A2]/10"
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Cart (Mobile) */}
            <Link to="/cart" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#DAB6A2]/10"
                aria-label={`Shopping cart (${cartCount} items)`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#DAB6A2]/10"
                  aria-label="Open main menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[85vw] sm:w-[400px] border-l border-[#DAB6A2]/20">
                <SheetHeader className="text-left mb-8">
                  <SheetTitle className="text-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-500" />
                    </div>
                    <span>Menu</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.id}>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation(item.href, item.id)}
                        className="justify-start h-14 text-lg hover:bg-[#DAB6A2]/10 hover:text-[#8B5A2B] transition-colors rounded-xl gap-3"
                      >
                        {item.icon && <item.icon className="w-5 h-5" />}
                        {item.label}
                        {item.hasDropdown && <ChevronDown className="w-4 h-4 ml-auto" />}
                      </Button>
                    </SheetClose>
                  ))}

                  {/* Admin Panel (admins + owners) */}
                  {(isAdmin || isOwner) && (
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/admin")}
                        className="justify-start h-14 text-lg hover:bg-amber-50 hover:text-amber-700 transition-colors rounded-xl gap-3 border-2 border-amber-200 bg-amber-50/50"
                      >
                        <Shield className="w-5 h-5 text-amber-600" />
                        Admin Panel
                      </Button>
                    </SheetClose>
                  )}

                  {isOwner && (
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/owner")}
                        className="justify-start h-14 text-lg hover:bg-purple-50 hover:text-purple-700 transition-colors rounded-xl gap-3 border-2 border-purple-200 bg-purple-50/50"
                      >
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Owner Dashboard
                      </Button>
                    </SheetClose>
                  )}

                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/profile")}
                      className="justify-start h-14 text-lg hover:bg-[#DAB6A2]/10 hover:text-[#8B5A2B] transition-colors rounded-xl gap-3"
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Button>
                  </SheetClose>
                </nav>

                <div className="mt-8 pt-8 border-t border-[#DAB6A2]/20">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Premium Member</p>
                      <p className="text-xs text-gray-500">Enjoy exclusive benefits</p>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#DAB6A2]/20 to-[#e9d6c5]/20 text-[#8B5A2B] border border-[#DAB6A2] rounded-full font-semibold text-sm">
                      Gold
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white mb-4"
                    onClick={() => {
                      handleNavigation("/#products", "products");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Shop Premium Collection
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 overflow-hidden"
            >
              <div className="relative bg-white rounded-2xl shadow-xl border border-[#DAB6A2]/20 p-2">
                <div className="flex items-center gap-2">
                  <Search className="ml-3 text-gray-400 h-5 w-5 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products, ingredients, benefits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                    className="flex-1 py-3 px-2 focus:outline-none text-base"
                    autoFocus={true}
                    aria-label="Search products"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(false)}
                    className="hover:bg-[#DAB6A2]/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Quick search suggestions */}
                {searchTerm.length === 0 && (
                  <div className="mt-2 px-3 pb-2">
                    <p className="text-xs text-gray-500 mb-2">Popular searches:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Sea Moss", "Body Butter", "Skincare", "Natural", "Organic"].map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchTerm(term)}
                          className="text-xs px-3 py-1.5 bg-[#DAB6A2]/10 text-[#8B5A2B] rounded-full hover:bg-[#DAB6A2]/20 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;