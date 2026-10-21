"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Star, Shield, CheckCircle, Heart, Leaf, Globe, Sparkles } from "lucide-react";

// shadcn/ui components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Import assets
import Logo from "../../assets/logo.png";
import video1 from "../../assets/video1.mp4";
import video2 from "../../assets/video2.mp4";
import video3 from "../../assets/video3.mp4";

const About = () => {
  const videos = [video1, video2, video3];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [muted, setMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const videoRefs = useRef([]);

  // Customer testimonials data
  const testimonials = [
    {
      name: "Anele M.",
    },
    {
      name: "Sol P.",
    },
    {
      name: "Anonymous",
    },
  ];

  // Handle video play/pause
  const handleVideoControl = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  // Preload videos for better performance
  useEffect(() => {
    const preloadVideos = async () => {
      const promises = videos.map((src) => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => resolve(true);
          video.src = src;
        });
      });
      
      await Promise.all(promises);
      setIsLoading(false);
    };
    
    preloadVideos();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-gray-900 overflow-hidden"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      {/* Hero Section - Clean Professional Design */}
      <section className="relative bg-gradient-to-br from-[#DAB6A2] via-[#e9d6c5] to-[#f8f5f2] text-gray-800 py-20 md:py-32 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <span className="inline-flex items-center px-5 py-2.5 bg-white text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Premium Healthcare Revolution
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2]">
              Glow From
            </span>
            <br />
            <span className="text-gray-800">Within</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed mb-12 text-gray-600"
          >
            Where nature's wisdom meets luxury skincare. Experience the transformative power of Sea Moss.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl group"
            >
              Explore Our Collection
              <Sparkles className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-12 py-6 text-lg font-semibold border-2 border-[#DAB6A2] text-[#8B5A2B] hover:bg-[#DAB6A2]/10 rounded-xl"
            >
              Learn Our Story
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-white py-10 border-y border-[#DAB6A2]/20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Happy Customers", icon: Heart },
              { number: "4.9★", label: "Average Rating", icon: Star },
              { number: "100%", label: "Natural Ingredients", icon: Leaf },
              { number: "Global", label: "Sustainable Sourcing", icon: Globe }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Icon className="w-6 h-6 text-[#DAB6A2]" />
                    <div className="text-3xl md:text-4xl font-bold text-gray-800 group-hover:scale-110 transition-transform duration-300">
                      {stat.number}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Our Story - Professional Edition */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="flex-1 relative"
        >
          <div className="relative max-w-lg mx-auto">
            <img
              src={Logo}
              alt="Glow Sea Moss Products"
              className="rounded-3xl shadow-2xl object-cover w-full h-auto z-10 relative border-8 border-white"
            />
            {/* Decorative elements */}
            <motion.div
              className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#DAB6A2] to-[#8B5A2B] rounded-2xl -z-10"
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-tr from-[#E8D0B9] to-[#F5E6D9] rounded-full -z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="flex-1"
        >
          <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
            Our Heritage
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800 leading-tight">
            Crafting <span className="text-[#8B5A2B]">Timeless Beauty</span><br />
            Through Nature
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <p className="text-lg leading-relaxed">
              Born from a quest for <span className="font-semibold text-[#8B5A2B]">authentic wellness</span>, 
              Glow emerged as a response to the synthetic overload in modern skincare. 
              Our founder's journey began with a simple sea moss discovery that would 
              revolutionize natural beauty.
            </p>
            <p className="text-lg leading-relaxed">
              Today, each product represents a <span className="font-semibold text-[#8B5A2B]">harmonious blend</span> 
              of ancient wisdom and modern science, crafted to nourish not just your 
              skin, but your entire being.
            </p>
            <p className="text-lg leading-relaxed">
              We believe true radiance comes from within, and our mission is to help 
              you <span className="font-semibold text-[#8B5A2B]">unlock your natural glow</span> through the purest 
              ingredients nature provides.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gradient-to-r from-white to-[#f8f5f2] rounded-3xl border border-[#DAB6A2]/20 shadow-lg"
          >
            <div className="flex items-start gap-5">
              <div className="p-4 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 rounded-2xl">
                <Sparkles className="w-7 h-7 text-[#8B5A2B]" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Our Craftsmanship Promise</h4>
                <p className="text-gray-600">
                  Every formulation is handcrafted with precision, ensuring optimal potency 
                  and purity. We never compromise on quality, because your skin deserves 
                  nothing but the best.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Mission & Values - Professional Redesign */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-20 bg-gradient-to-b from-white to-[#f8f5f2]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-white text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
              <Shield className="w-4 h-4 mr-2" />
              Our Guiding Principles
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              Values That Define <span className="text-[#8B5A2B]">Excellence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              These core principles shape every decision, every formulation, and every 
              interaction in our pursuit of radiant living.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Purity First",
                text: "We source only the purest, ethically harvested ingredients, free from synthetic additives and harsh chemicals.",
                icon: "🌿",
                bg: "from-emerald-50 to-green-50",
                border: "border-emerald-100"
              },
              {
                title: "Holistic Wellness",
                text: "Your well-being extends beyond skin deep. We create products that nurture mind, body, and spirit in harmony.",
                icon: "💚",
                bg: "from-rose-50 to-pink-50",
                border: "border-rose-100"
              },
              {
                title: "Sustainable Future",
                text: "Our commitment to the planet guides every step, from eco-friendly packaging to carbon-neutral initiatives.",
                icon: "🌍",
                bg: "from-sky-50 to-cyan-50",
                border: "border-sky-100"
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <Card className={`rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 ${item.border} bg-gradient-to-br ${item.bg}`}>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-[#8B5A2B] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {/* Floating decorative element */}
                <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${item.bg} rounded-xl -z-10 transform group-hover:scale-125 transition-transform duration-300`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Video Review Carousel - Professional Edition */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-white to-[#f8f5f2] relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center px-5 py-2.5 mb-6 bg-gradient-to-r from-[#DAB6A2]/10 to-[#e9d6c5]/10 text-[#8B5A2B] border border-[#DAB6A2] rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" />
              High-Quality Testimonials
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-800 leading-tight">
              Real People, <span className="text-[#8B5A2B]">Real Results</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Watch authentic stories of transformation. Each video showcases real journeys to radiant, healthier skin.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <Carousel
              opts={{
                align: "center",
                loop: true,
                duration: 50,
              }}
              plugins={[
                Autoplay({ 
                  delay: 8000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                  playOnInit: autoplayEnabled,
                })
              ]}
              className="w-full max-w-6xl mx-auto"
              onSelect={(index) => setCurrentSlide(index)}
            >
              <CarouselContent className="h-auto">
                {videos.map((video, index) => (
                  <CarouselItem key={index} className="basis-full md:basis-2/3 lg:basis-1/2">
                    <div className="p-2 md:p-6">
                      <Card className="rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 border-0 group relative bg-white">
                        {/* Premium Video Container */}
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-t-3xl overflow-hidden">
                          {/* Loading skeleton */}
                          {isLoading && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-t-3xl" />
                          )}
                          
                          {/* Video with high-quality optimization */}
                          <video
                            ref={(el) => (videoRefs.current[index] = el)}
                            className={`w-full aspect-[9/16] object-cover transition-opacity duration-500 ${
                              isLoading ? 'opacity-0' : 'opacity-100'
                            }`}
                            autoPlay
                            loop
                            muted={muted}
                            playsInline
                            preload="metadata"
                            onClick={() => handleVideoControl(index)}
                            onLoadedData={() => {
                              if (videoRefs.current[index]) {
                                videoRefs.current[index].play().catch(() => {
                                  // Handle autoplay restrictions
                                });
                              }
                            }}
                          >
                            <source src={video} type="video/mp4" />
                            <track
                              kind="captions"
                              srcLang="en"
                              label="English"
                              default
                            />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Video Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                          
                          {/* Quality Badge */}
                          <div className="absolute top-6 left-6 z-20">
                            <span className="inline-flex items-center bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] text-white font-semibold px-4 py-2 rounded-full text-xs shadow-xl">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                VIDEO REVIEW
                              </div>
                            </span>
                          </div>
                          
                          {/* Video Controls Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                            <Button
                              size="icon"
                              className="rounded-full bg-white hover:bg-white/90 w-20 h-20 shadow-2xl transform group-hover:scale-110 transition-transform duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoControl(index);
                              }}
                            >
                              <Play className="w-8 h-8 text-gray-800 ml-1" />
                            </Button>
                          </div>
                          
                          {/* Customer Profile */}
                          <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#DAB6A2] to-[#e9d6c5] flex items-center justify-center shadow-xl border-2 border-white">
                                <span className="font-bold text-gray-800 text-xl">
                                  {testimonials[index].name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-white mb-1">
                                  {testimonials[index].name}
                                </h4>
                                {/* <div className="flex items-center gap-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                  <span className="text-white/80 text-sm ml-2">Verified Customer</span>
                                </div> */}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Testimonial Quote */}
                        {/* <CardContent className="p-8 bg-white rounded-b-3xl">
                          <div className="relative">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-white rounded-t-full" />
                            <div className="text-center">
                              <p className="text-gray-600 italic text-lg leading-relaxed mb-6">
                                "My skin transformation has been incredible. The natural glow is real and people constantly compliment my complexion!"
                              </p>
                              <div className="inline-flex items-center gap-2 text-[#8B5A2B] font-semibold">
                                <Shield className="w-4 h-4" />
                                Real Results • Natural Ingredients
                              </div>
                            </div>
                          </div>
                        </CardContent> */}
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Professional Navigation Arrows */}
              <CarouselPrevious className="hidden md:flex -left-10 lg:-left-14 w-16 h-16 bg-white border-2 border-[#DAB6A2] text-[#8B5A2B] hover:bg-white hover:scale-110 hover:shadow-xl transition-all duration-300 shadow-lg" />
              <CarouselNext className="hidden md:flex -right-10 lg:-right-14 w-16 h-16 bg-white border-2 border-[#DAB6A2] text-[#8B5A2B] hover:bg-white hover:scale-110 hover:shadow-xl transition-all duration-300 shadow-lg" />
            </Carousel>

            {/* Professional Controls & Indicators */}
            <div className="flex flex-col items-center gap-8 mt-14">
              {/* Progress Bar with Time */}
              <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 font-medium">Now Playing</span>
                  <span className="text-sm text-[#8B5A2B] font-semibold">Video {currentSlide + 1} of {videos.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentSlide + 1) / videos.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* Control Center */}
              <div className="flex items-center justify-center gap-8">
                {/* Auto-play Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-[#DAB6A2] hover:text-[#8B5A2B] transition-all duration-300"
                  onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                >
                  {autoplayEnabled ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Slideshow
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Slideshow
                    </>
                  )}
                </Button>
                
                {/* Volume Control */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-[#DAB6A2] hover:text-[#8B5A2B] transition-all duration-300"
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Unmute Audio
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Mute Audio
                    </>
                  )}
                </Button>
              </div>

              {/* Navigation Dots */}
              <div className="flex gap-3">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-gradient-to-r from-[#DAB6A2] to-[#8B5A2B] w-10 shadow-lg"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Navigate to video ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* Stats Counter */}
              <div className="text-center">
                <div className="text-sm text-gray-500 font-medium mb-1">
                  Customer Testimonials Collection
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  <span className="text-[#8B5A2B]">{currentSlide + 1}</span>
                  <span className="mx-2 text-gray-400">/</span>
                  <span>{videos.length} Authentic Stories</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Trust Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 p-10 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-[#DAB6A2]/30 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div className="relative">
                <div className="text-4xl font-bold text-[#8B5A2B] mb-3">4.9★</div>
                <div className="text-gray-600 font-medium">Average Rating</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#DAB6A2] to-[#e9d6c5] rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="relative">
                <div className="text-4xl font-bold text-[#8B5A2B] mb-3">94%</div>
                <div className="text-gray-600 font-medium">Visible Results in 2 Weeks</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#DAB6A2] to-[#e9d6c5] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="relative">
                <div className="text-4xl font-bold text-[#8B5A2B] mb-3">98%</div>
                <div className="text-gray-600 font-medium">Customer Satisfaction</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#DAB6A2] to-[#e9d6c5] rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professional Call to Action */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-[#DAB6A2] via-[#e9d6c5] to-[#f8f5f2] text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            {/* <span className="inline-flex items-center px-6 py-3 bg-white text-[#8B5A2B] border-2 border-[#DAB6A2] rounded-full text-base font-bold shadow-xl">
              <Sparkles className="w-5 h-5 mr-2" />
              Exclusive Offer
            </span> */}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-10 text-gray-800 leading-tight"
          >
            Begin Your<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2]">
              Radiant Journey
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join hundreds of customers who have transformed their skin with Glow. 
            Experience natural skincare backed by our 60-day satisfaction guarantee.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button
              size="xl"
              className="px-14 py-7 text-xl font-bold bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] hover:from-[#9C6B3C] hover:to-[#E9C6B5] text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl group"
            >
              <span className="flex items-center">
                Discover Your Glow
                <Sparkles className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
              </span>
            </Button>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-16 p-10 bg-white rounded-3xl border border-[#DAB6A2]/30 shadow-xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-left">
                <h4 className="text-xl font-bold text-gray-800 mb-3">Premium Benefits Included</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#8B5A2B]" />
                    Free Worldwide Shipping
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#8B5A2B]" />
                    60-Day Money-Back Guarantee
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#8B5A2B]" />
                    Luxury Gift Packaging
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-[#8B5A2B] mb-2">Limited Time</div>
                <div className="text-gray-600">Premium Starter Kit Available</div>
              </div>
            </div>
          </motion.div> */}
        </div>
      </section>
    </div>
  );
};

export default About;