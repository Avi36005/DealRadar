"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useAnimate,
  useInView,
} from "framer-motion";

export default function Home() {
  // Scroll reveal observer
  const revealRefs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Step number scroll highlight
  useEffect(() => {
    const handleScroll = () => {
      const steps = document.querySelectorAll(".step-num");
      const triggerHeight = window.innerHeight * 0.8;
      steps.forEach((step) => {
        const rect = step.getBoundingClientRect();
        if (rect.top < triggerHeight) {
          step.classList.add("bg-accent-green", "text-white", "border-accent-green");
          step.classList.remove("bg-white", "text-on-surface", "border-[#E4E4E7]");
        } else {
          step.classList.remove("bg-accent-green", "text-white", "border-accent-green");
          step.classList.add("bg-white", "text-on-surface", "border-[#E4E4E7]");
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addReveal = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  // ── Headline scroll-out effect ──────────────────────────────────────────
  const { scrollY } = useScroll();
  // Hero height is roughly 500px before the pipeline card; 0–300px covers ~30%
  const headlineOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const headlineBlurRaw = useTransform(scrollY, [0, 300], [0, 10]);
  const headlineY = useTransform(scrollY, [0, 300], [0, -30]);
  const headlineFilter = useMotionTemplate`blur(${headlineBlurRaw}px)`;

  // ── Entrance animation variants ─────────────────────────────────────────
  const easeOutExpo = [0.22, 1, 0.36, 1];

  const part1Variants = {
    hidden: { opacity: 0, filter: "blur(14px)", y: 48 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.9, ease: easeOutExpo, delay: 0.1 },
    },
  };

  const part2Variants = {
    hidden: { opacity: 0, filter: "blur(14px)", y: 48 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.9, ease: easeOutExpo, delay: 0.22 },
    },
  };

  // Container for "disappears." — handles opacity/blur/y/scale as a unit
  const part3Variants = {
    hidden: { opacity: 0, filter: "blur(20px)", y: 60, scale: 0.92 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      scale: 1,
      transition: { duration: 1.1, ease: easeOutExpo, delay: 0.38 },
    },
  };

  // SVG underline draws after Part 3 lands: delay = 0.38 + 1.1 = 1.48s
  const underlineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 1.48 },
        opacity: { duration: 0.01, delay: 1.48 },
      },
    },
  };

  const disappearsChars = "disappears.".split("");

  return (
    <div className="min-h-screen bg-white text-[#18181B] selection:bg-accent-green/30">

      {/* ─── TOP NAV ─── */}
      <nav className="fixed top-0 w-full h-[64px] bg-white/80 backdrop-blur-md border-b border-[#E4E4E7]/50 z-50">
        <div className="flex justify-between items-center h-full px-6 max-w-[1280px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-[#09090B] flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
            </div>
            DealRadar
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#09090B] font-medium border-b-2 border-[#09090B] text-sm">Product</a>
            <a href="#how-it-works" className="text-[#71717A] hover:text-[#09090B] transition-colors text-sm">Solutions</a>
            <a href="#" className="text-[#71717A] hover:text-[#09090B] transition-colors text-sm">About</a>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/search" className="text-[#71717A] text-sm hover:text-[#09090B] transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/search" className="bg-[#09090B] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-accent-green transition-all duration-300">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <header className="relative pt-[120px] pb-[80px] overflow-hidden bg-white">
        {/* Radar Background Pulse Rings */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[800px] aspect-square -z-10 opacity-30">
          <div className="pulse-ring" style={{ animationDelay: "0s" }}></div>
          <div className="pulse-ring" style={{ animationDelay: "1s" }}></div>
          <div className="pulse-ring" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 text-center">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-[12px] font-medium mb-6 hero-badge-reveal">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
            </span>
            LIVE PRICING ACROSS 7 SUPPLIERS
          </div>

          {/* Animated Headline */}
          <h1 className="font-bold text-[48px] leading-[1.1] tracking-[-0.02em] text-[#09090B] max-w-4xl mx-auto mb-6">
            <span className="headline-part animate-part-1">Hit the best deal</span>{" "}
            <span className="headline-part animate-part-2">before it</span>{" "}
            <span className="headline-part animate-part-3-container relative inline-block animate-underline">
              <span className="font-[var(--font-instrument-serif)] italic font-normal text-[52px]">
                {"disappears.".split("").map((char, i) => (
                  <span
                    key={i}
                    className="headline-char"
                    style={{ animation: `cinematicChar 0.8s cubic-bezier(0.16,1,0.3,1) ${0.44 + i * 0.035}s forwards` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <svg className="absolute bottom-[-4px] left-0 w-full h-[12px] z-[-1]" fill="none" preserveAspectRatio="none" viewBox="0 0 200 20">
                <path className="svg-underline-path" d="M2 15.5C30 15.5 50 2 100 2C150 2 170 15.5 198 15.5" stroke="#16A34A" strokeLinecap="round" strokeWidth="3" />
              </svg>
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-[18px] leading-[1.6] text-[#71717A] max-w-2xl mx-auto mb-10">
            {"AI-powered arbitrage scanner that monitors global inventory in real-time. Catch price gaps and inventory fluctuations before the market reacts."
              .split(" ")
              .map((word, i) => (
                <span
                  key={i}
                  className="tagline-word"
                  style={{ animationDelay: `${0.6 + i * 0.025}s` }}
                >
                  {word}
                </span>
              ))
              .reduce((acc, curr, i) => i === 0 ? [curr] : [...acc, " ", curr], [])}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 hero-ctas-reveal">
            <Link href="/dashboard/search" className="w-full sm:w-auto bg-[#09090B] text-white px-8 py-4 rounded-full font-semibold text-[16px] hover:bg-accent-green transition-all duration-300 flex items-center justify-center gap-2 group">
              Start for free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a href="#live-opportunities" className="w-full sm:w-auto bg-white border border-[#E4E4E7] text-[#09090B] px-8 py-4 rounded-full font-semibold text-[16px] hover:bg-[#F4F4F5] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">play_circle</span>
              Watch demo
            </a>
          </div>

          {/* Pipeline Card */}
          <div className="mt-20 mx-auto max-w-[860px] text-center pipeline-card">
            <p className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-3">HOW IT WORKS UNDER THE HOOD</p>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden text-left">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2 relative z-10">
                {/* Background Connectors */}
                <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[2px] z-[-1]">
                  <svg height="2" preserveAspectRatio="none" width="100%">
                    <line className="dash-line" stroke="#E4E4E7" strokeWidth="2" x1="0" x2="100%" y1="1" y2="1"></line>
                    <circle cx="0" cy="1" fill="#16A34A" r="3">
                      <animateMotion dur="1.5s" path="M 0 0 L 250 0" repeatCount="indefinite"></animateMotion>
                    </circle>
                  </svg>
                </div>

                {/* Stage 1 */}
                <div className="flex flex-col items-center text-center w-full md:w-auto z-10 bg-white">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#F4F4F5] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#71717A] text-[20px]">search</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#18181B] mb-0.5">Your Query</h4>
                  <p className="text-[11px] text-[#71717A] mb-2">SKU or product name</p>
                  <div className="text-[10px] font-mono text-[#18181B] bg-[#F4F4F5] px-2 py-1 rounded w-24 h-6 flex items-center justify-center overflow-hidden whitespace-nowrap border border-[#E4E4E7]">
                    <span className="typing-text"></span>
                  </div>
                </div>

                {/* Stage 2 — Anakin Wire */}
                <div className="flex flex-col items-center text-center w-full md:w-auto z-10 bg-white scale-110 md:mx-4">
                  <div className="relative w-[56px] h-[56px] mb-3">
                    <div className="absolute inset-0 rounded-full border-2 border-[#BBF7D0] bg-[#F0FDF4] flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-accent-green text-[28px]">bolt</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-accent-green subtle-pulse z-0"></div>
                  </div>
                  <h4 className="text-[14px] font-bold text-[#18181B] mb-0.5">Anakin Wire</h4>
                  <p className="text-[11px] text-[#71717A] mb-2">Parallel fetch engine</p>
                  <div className="flex flex-wrap justify-center gap-1 w-32 h-10 relative overflow-hidden">
                    {["Amazon","Flipkart","Walmart","Target"].map((s, i) => (
                      <span key={s} className="text-[9px] bg-[#F4F4F5] px-1.5 py-0.5 rounded text-[#71717A] absolute" style={{ top: i < 2 ? 0 : "20px", left: i % 2 === 0 ? 0 : "auto", right: i % 2 === 1 ? 0 : "auto", animation: `staggerChip 3s infinite ${i * 0.2}s` }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Stage 3 — Structured Data */}
                <div className="flex flex-col items-center text-center w-full md:w-auto z-10 bg-white">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#2563EB] text-[20px]">grid_view</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#18181B] mb-0.5">Structured Data</h4>
                  <p className="text-[11px] text-[#71717A] mb-2">Price · Stock · ETA</p>
                  <div className="flex flex-col gap-1 text-[10px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded w-24 border border-[#BFDBFE]">
                    <span className="font-bold">$1,242</span>
                    <span>14 sources</span>
                    <span>98/100 AI</span>
                  </div>
                </div>

                {/* Stage 4 — AI */}
                <div className="flex flex-col items-center text-center w-full md:w-auto z-10 bg-white">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#D97706] text-[20px]">auto_awesome</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#18181B] mb-0.5">GPT-4o + Gemini</h4>
                  <p className="text-[11px] text-[#71717A] mb-2">Arbitrage · Predict</p>
                  <div className="relative w-24 h-6">
                    <div className="absolute inset-0 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-[9px] font-bold flex items-center justify-center rounded" style={{ animation: "fadeSeq 6s infinite 0s" }}>⚡ Alert</div>
                    <div className="absolute inset-0 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[9px] font-bold flex items-center justify-center rounded" style={{ animation: "fadeSeq 6s infinite 2s" }}>✉ Email</div>
                    <div className="absolute inset-0 bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-[9px] font-bold flex items-center justify-center rounded" style={{ animation: "fadeSeq 6s infinite 4s" }}>📈 Predict</div>
                  </div>
                </div>

                {/* Stage 5 — Decision */}
                <div className="flex flex-col items-center text-center w-full md:w-auto z-10 bg-white">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-accent-green text-[20px]">check_circle</span>
                  </div>
                  <h4 className="text-[13px] font-bold text-[#18181B] mb-0.5">Your Decision</h4>
                  <p className="text-[11px] text-[#71717A] mb-2">Buy · Wait · Negotiate</p>
                  <div className="text-[10px] font-bold bg-[#FAFAFA] border border-[#E4E4E7] px-2 py-1 rounded w-24 h-6 flex items-center justify-center verdict-badge"></div>
                </div>
              </div>

              {/* Pipeline Footer */}
              <div className="mt-8 pt-4 border-t border-[#E4E4E7] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                  </span>
                  Pipeline active · Avg response time: 3.2s
                </div>
                <div className="text-[11px] font-bold text-[#18181B] flex items-center gap-1">
                  <span className="material-symbols-outlined text-accent-green text-[14px]">bolt</span>
                  Powered by Anakin Wire
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#E4E4E7]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#E4E4E7]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#E4E4E7]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── SUPPLIER STRIP (MARQUEE) ─── */}
      <section className="py-6 border-y border-[#E4E4E7]/50 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-center text-[12px] font-medium text-[#A1A1AA] mb-6 uppercase tracking-widest">Live data from</p>
          <div className="marquee">
            {[1, 2].map((dup) => (
              <div key={dup} className="marquee-content items-center" aria-hidden={dup === 2}>
                {["Amazon", "Flipkart", "Walmart", "IndiaMART", "eBay", "Target", "BestBuy"].map((s) => (
                  <span key={s} className="text-2xl font-bold text-[#09090B]/30 grayscale hover:grayscale-0 hover:text-[#09090B] transition-all cursor-pointer">{s}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="py-12 bg-[#FAFAFA]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "hub", title: "7 Global Suppliers", body: "Instant connectivity to the world's largest marketplaces. Aggregate inventory, pricing, and shipping data into a single unified stream." },
              { icon: "auto_awesome", title: "AI Margin Gaps", body: "Our neural network identifies price discrepancies across regions before they normalize. Be the first to exploit arbitrage opportunities.", delay: "100ms" },
              { icon: "notifications_active", title: "Precision Alerts", body: "Set custom triggers for target prices or margin percentages. Receive instant notifications via Slack, Telegram, or Webhook.", delay: "200ms" },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white p-8 rounded-2xl border border-[#E4E4E7] hover:border-[#09090B] transition-all duration-300 hover:-translate-y-2 reveal active shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                ref={addReveal}
                style={{ transitionDelay: card.delay }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#09090B]">{card.icon}</span>
                </div>
                <h3 className="text-[24px] font-semibold mb-4 text-[#09090B] leading-tight">{card.title}</h3>
                <p className="text-[14px] text-[#71717A] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 className="text-[30px] font-semibold text-center mb-20 text-[#09090B] reveal active" ref={addReveal}>
            Unfair advantage in 3 steps
          </h2>
          <div className="relative">
            <div className="absolute top-8 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-[#E4E4E7] hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                { num: 1, title: "Search", desc: "Input any SKU or category into the AI scanner.", delay: "" },
                { num: 2, title: "Watch", desc: "Monitor live price movements and inventory depth.", delay: "150ms" },
                { num: 3, title: "Act", desc: "Execute trades and capture profit automatically.", delay: "300ms" },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center reveal active" ref={addReveal} style={{ transitionDelay: step.delay }}>
                  <div className="step-num w-[64px] h-[64px] rounded-full border-4 border-[#E4E4E7] bg-white shadow-sm flex items-center justify-center font-bold text-2xl transition-colors duration-500 z-10 mb-6 text-[#09090B]">
                    {step.num}
                  </div>
                  <h4 className="text-[24px] font-semibold text-[#09090B] mb-2">{step.title}</h4>
                  <p className="text-[14px] text-[#71717A]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE OPPORTUNITIES TABLE ─── */}
      <section id="live-opportunities" className="py-12 bg-[#FAFAFA]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="bg-white rounded-[32px] border border-[#E4E4E7] shadow-xl overflow-hidden reveal active" ref={addReveal}>
            <div className="p-8 border-b border-[#E4E4E7] flex flex-col md:flex-row justify-between items-center gap-6">
              <h3 className="text-[24px] font-semibold text-[#09090B]">Live Opportunities</h3>
              <div className="flex bg-[#F4F4F5] rounded-full p-1">
                <button className="px-6 py-2 rounded-full bg-white shadow-sm text-[#09090B] font-medium text-sm">Price</button>
                <button className="px-6 py-2 rounded-full text-[#71717A] font-medium text-sm hover:text-[#09090B] transition-all">Margin</button>
                <button className="px-6 py-2 rounded-full text-[#71717A] font-medium text-sm hover:text-[#09090B] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>AI Insights
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7]/50 text-[#71717A] text-[11px] shadow-sm animate-bounce">
                <span className="material-symbols-outlined text-accent-green text-[14px]">bolt</span>
                Powered by Anakin Intelligence
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F4F4F5] text-left">
                    <th className="px-8 py-4 text-[12px] font-semibold text-[#71717A] uppercase tracking-wider">Product Name</th>
                    <th className="px-8 py-4 text-[12px] font-semibold text-[#71717A] uppercase tracking-wider text-right">Market Low</th>
                    <th className="px-8 py-4 text-[12px] font-semibold text-[#71717A] uppercase tracking-wider text-right">Target High</th>
                    <th className="px-8 py-4 text-[12px] font-semibold text-[#71717A] uppercase tracking-wider text-center">Net Margin</th>
                    <th className="px-8 py-4 text-[12px] font-semibold text-[#71717A] uppercase tracking-wider">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]/30">
                  <tr className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-8 py-6 font-medium text-[#09090B]">Pro Camera Lens 85mm f/1.4</td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$1,240.00</td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$1,599.00</td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-accent-green/10 text-accent-green rounded-full text-[12px] font-bold">22.4%</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-2 text-[#71717A] text-sm">
                        <span className="w-2 h-2 rounded-full bg-accent-green"></span>High Volatility
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-accent-green/5 border-l-4 border-l-accent-green">
                    <td className="px-8 py-6 font-medium text-[#09090B] flex items-center gap-3">
                      Wireless Headphones V2
                      <span className="px-2 py-0.5 bg-accent-green text-white text-[10px] rounded uppercase font-bold">Best Deal</span>
                    </td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$185.00</td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$329.00</td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-accent-green text-white rounded-full text-[12px] font-bold">43.7%</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-2 text-accent-green font-bold text-sm">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>Flash Buy
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-8 py-6 font-medium text-[#09090B]">Smart Fitness Watch Pro</td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$210.00</td>
                    <td className="px-8 py-6 font-mono font-semibold text-right text-[#09090B]">$299.00</td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-accent-green/10 text-accent-green rounded-full text-[12px] font-bold">29.7%</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-2 text-[#71717A] text-sm">
                        <span className="w-2 h-2 rounded-full bg-[#09090B]"></span>Moderate Risk
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-[#E4E4E7]/50 py-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="font-bold text-lg text-[#09090B] mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#09090B] flex items-center justify-center rounded-lg">
                  <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
                </div>
                DealRadar
              </div>
              <p className="text-[14px] text-[#71717A] max-w-sm mb-6">
                Professional arbitrage infrastructure for high-volume traders. Real-time data, AI-driven insights, and millisecond execution.
              </p>
              <div className="flex items-center gap-2 text-[#09090B] font-semibold text-sm">
                <span className="material-symbols-outlined text-accent-green text-[18px]">bolt</span>
                Powered by Anakin Intelligence
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-[#E4E4E7]/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[14px] text-[#71717A]">© 2026 DealRadar. Built at Anakin Build-a-Thon 2026.</p>
            <div className="flex gap-6">
              <a href="#" className="text-[#71717A] hover:text-[#09090B] transition-all">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a href="#" className="text-[#71717A] hover:text-[#09090B] transition-all">
                <span className="material-symbols-outlined">share</span>
              </a>
              <a href="#" className="text-[#71717A] hover:text-[#09090B] transition-all">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Typing text animation style */}
      <style>{`
        @keyframes typeText {
          0%, 10%  { content: "S|"; }
          20%      { content: "So|"; }
          30%      { content: "Son|"; }
          40%      { content: "Sony|"; }
          50%      { content: "Sony A|"; }
          60%      { content: "Sony A7|"; }
          70%,100% { content: "Sony A7 IV..."; }
        }
        .typing-text::after {
          content: "";
          animation: typeText 4s infinite step-start;
        }
      `}</style>
    </div>
  );
}
