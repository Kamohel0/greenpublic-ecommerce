"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import video from "../../assets/hero-bg.mp4";
import { useEffect, useRef, useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Force video to play on mount (especially needed for iOS)
  useEffect(() => {
    const video = videoRef.current;
    if (video && !showLoadingOverlay) {
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [showLoadingOverlay]);

  const handleStartExperience = () => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }
    setShowLoadingOverlay(false);
  };


  const handleScroll = (id) => {
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#8B5A2B]">
      {/* 🍃 PREMIUM LOADING OVERLAY - Brand-first, not technical */}
      <AnimatePresence>
        {showLoadingOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 bg-[#8B5A2B] flex items-center justify-center cursor-pointer"
            onClick={handleStartExperience}
          >
            <div className="text-center px-6">
              {/* Animated Logo Mark */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.2
                }}
                className="flex justify-center mb-8"
              >
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#DAB6A2] to-[#8B5A2B] flex items-center justify-center shadow-2xl">
                    <Leaf className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
                  </div>
                  {/* Ripple effect */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1.8],
                      opacity: [0.5, 0.3, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full bg-[#DAB6A2]/30 -z-10"
                  />
                </div>
              </motion.div>

              {/* Brand Name */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-white text-3xl md:text-4xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                GreenPublic
              </motion.h2>

              {/* Elegant Loading Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.2,
                        delay: i * 0.15,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 rounded-full bg-[#DAB6A2]"
                    />
                  ))}
                </div>
                
                {/* Tap to Enter - More subtle, less "loading" */}
                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white/70 text-sm uppercase tracking-[0.3em] font-light"
                >
                  Tap to Enter
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Background – Full bleed, cinematic */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          x-webkit-airplay="deny"
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          defaultMuted
          className="w-full h-full object-cover pointer-events-none"
          style={{ 
            objectFit: 'cover',
            WebkitBackfaceVisibility: 'hidden',
            MozBackfaceVisibility: 'hidden'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onLoadedData={(e) => {
            // iOS needs user interaction - handled by overlay
            if (!showLoadingOverlay) {
              e.target.play().catch(() => {});
            }
          }}
        >
          <source src={video} type="video/mp4" />
        </video>
        {/* Sheer gradient overlay – barely there, adds depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
      </div>

      {/* Centered content – minimal, bold */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {/* Main headline – one singular idea */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
            Glow From Within
          </span>
        </motion.h1>

        {/* Brief descriptor – barely a whisper, not an essay */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-white/80 text-base sm:text-lg md:text-xl font-light max-w-md"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Sea moss, elevated.
        </motion.p>

        {/* Single CTA – clean, purposeful */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <button
            onClick={() => handleScroll("products")}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-[#8B5A2B] rounded-full text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Subtle scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-[2px] h-12 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-3 bg-white/80 rounded-full"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;