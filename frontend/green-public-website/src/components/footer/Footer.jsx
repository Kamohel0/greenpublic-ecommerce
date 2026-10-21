import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaPinterest } from "react-icons/fa"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Heart, 
  Leaf, 
  Shield, 
  Truck, 
  Award,
  ChevronRight,
  Sparkles,
  Globe,
  CreditCard
} from "lucide-react"
import { motion } from "framer-motion"

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  // Enhanced scroll/navigate helper
  const handleNavigation = (sectionId) => {
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        })
      }
    } else {
      navigate(`/#${sectionId}`)
    }
  }

  // Social media links
  const socialLinks = [
    { 
      icon: FaFacebookF, 
      href: "https://facebook.com/glownaturalskincare",
      label: "Visit our Facebook page",
      color: "hover:bg-[#1877F2]"
    },
    { 
      icon: FaInstagram, 
      href: "https://instagram.com/glownaturalskincare",
      label: "Visit our Instagram page",
      color: "hover:bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]"
    },
    { 
      icon: FaPinterest, 
      href: "https://pinterest.com/glownaturalskincare",
      label: "Visit our Pinterest page",
      color: "hover:bg-[#E60023]"
    },
    { 
      icon: FaYoutube, 
      href: "https://youtube.com/glownaturalskincare",
      label: "Visit our YouTube channel",
      color: "hover:bg-[#FF0000]"
    }
  ]

  // Navigation links
  const navigationLinks = [
    { 
      category: "Shop", 
      links: [
        { id: "products", label: "All Products" },
        // { href: "/category/skincare", label: "Skincare" },
        // { href: "/category/haircare", label: "Haircare" },
        // { href: "/category/wellness", label: "Wellness" },
        // { href: "/collections/new", label: "New Arrivals" },
        // { href: "/collections/bestsellers", label: "Best Sellers" }
      ]
    },
    { 
      category: "Company", 
      links: [
        { href: "about", label: "About Us" },
        { href: "story", label: "Our Story" },
        // { href: "/values", label: "Our Values" },
        // { href: "/blog", label: "Blog & Tips" },
        // { href: "/press", label: "Press & Media" },
        // { href: "/careers", label: "Careers" }
      ]
    },
    { 
      category: "Support", 
      links: [
        { href: "#contact", label: "Contact Us" },
        // { href: "/faq", label: "FAQ" },
        // { href: "/shipping", label: "Shipping Info" },
        // { href: "/returns", label: "Returns & Exchanges" },
        // { href: "/wholesale", label: "Wholesale" },
        // { href: "/affiliate", label: "Affiliate Program" }
      ]
    }
  ]

  // Policy links
  const policyLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/accessibility", label: "Accessibility" },
    { href: "/sitemap", label: "Sitemap" }
  ]

  // Trust badges
  const trustBadges = [
    { icon: Shield, text: "Secure Payments", subtext: "256-bit SSL encryption" },
    { icon: Truck, text: "Free Shipping", subtext: "On orders over R500" },
    { icon: Leaf, text: "Cruelty-Free", subtext: "Certified vegan" },
    { icon: Award, text: "Award-Winning", subtext: "Natural beauty awards" }
  ]

  return (
    <footer className="relative bg-gradient-to-b from-white to-[#f8f5f2] border-t border-[#DAB6A2]/20" style={{ fontFamily: "'Playfair Display', serif" }}>
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#DAB6A2] to-transparent" />

      {/* Trust Badges */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 py-8 md:py-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#DAB6A2]/20 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-[#8B5A2B]" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{badge.text}</h4>
                <p className="text-xs text-gray-500">{badge.subtext}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-16">
        
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Glow</h3>
              <p className="text-gray-500 text-sm">Premium Natural Skincare</p>
            </div>
          </div>
          


          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">Connect With Us</h4>
            <div className="flex gap-3">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-full bg-white border border-[#DAB6A2]/20 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300 ${social.color}`}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Columns */}
        {navigationLinks.map((section, idx) => (
          <div key={idx} className="space-y-6">
            <h4 className="text-lg font-bold text-gray-800 border-l-4 border-[#8B5A2B] pl-3">
              {section.category}
            </h4>
            <ul className="space-y-3">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  {link.id ? (
                    <button
                      onClick={() => handleNavigation(link.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-[#8B5A2B] transition-colors duration-300 group"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-gray-600 hover:text-[#8B5A2B] transition-colors duration-300 group"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact & Payment */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-800">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#8B5A2B] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Visit Our Store</p>
                  <p className="text-sm text-gray-600">Prixley Street, Johannesburg, 8000</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#8B5A2B] flex-shrink-0" />
                <a href="tel:+27815413752" className="text-gray-600 hover:text-[#8B5A2B] transition-colors">
                  +27 (0) 81 541 3752
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#8B5A2B] flex-shrink-0" />
                <a href="mailto:greenpublic@gmail.com" className="text-gray-600 hover:text-[#8B5A2B] transition-colors">
                  greenpublic@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-800">We Accept</h4>
            <div className="flex flex-wrap gap-2">
              {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay"].map((method, idx) => (
                <div key={idx} className="px-3 py-2 bg-white rounded-lg border border-[#DAB6A2]/20">
                  <span className="text-xs font-medium text-gray-700">{method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#DAB6A2]/20 bg-gradient-to-r from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Glow Natural Skincare. All rights reserved.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Handcrafted with <Heart className="w-3 h-3 text-rose-500 inline" /> in South Africa
              </p>
            </div>

            {/* Policy Links */}
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
              {policyLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-[#8B5A2B] transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Made with badge */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5A2B]" />
              <span className="text-xs text-gray-500">Premium Natural Skincare</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative wave */}
      <div className="relative h-20 overflow-hidden">
        <div className="absolute bottom-0 w-full">
          <svg 
            className="w-full h-20" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25" 
              fill="#DAB6A2"
            />
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5" 
              fill="#DAB6A2"
            />
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              fill="#DAB6A2"
            />
          </svg>
        </div>
      </div>
    </footer>
  )
}