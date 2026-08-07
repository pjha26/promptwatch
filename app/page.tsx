"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Stats counter state
  const [stats, setStats] = useState({
    visits: 0,
    engines: 0,
    actions: 0,
    bandwidth: 0,
    latency: 0,
    nodes: 0,
    revenue: 0,
  });

  const hasAnimatedHeroStats = useRef(false);
  const hasAnimatedAuditStats = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for slide up/in elements
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            entry.target.classList.remove("opacity-0");

            // Check if it's the hero stats section to trigger counter
            if (entry.target.id === "hero-stats" && !hasAnimatedHeroStats.current) {
              hasAnimatedHeroStats.current = true;
              animateCounter('visits', 100, 2000);
              animateCounter('engines', 7, 1000);
              animateCounter('actions', 30, 1500);
            }
            // Check if it's the audit stats section to trigger counter
            if (entry.target.id === "audit-stats" && !hasAnimatedAuditStats.current) {
              hasAnimatedAuditStats.current = true;
              animateCounter('bandwidth', 84, 1500);
              animateCounter('latency', 12, 1000);
              animateCounter('nodes', 42, 1500); // 4.2k
              animateCounter('revenue', 18, 1500);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const animateCounter = (key: keyof typeof stats, target: number, duration: number) => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setStats(prev => ({
        ...prev,
        [key]: Math.floor(easeProgress * target)
      }));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  return (
    <>
      {/* TopNavBar */}
      <nav
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-surface-container-lowest/80 backdrop-blur-md shadow-sm border-b border-outline-variant" : "bg-surface-container-lowest border-b border-outline-variant"
        } flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20`}
      >
        <div className="font-headline-lg text-headline-lg font-bold tracking-tighter text-on-surface flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-sm animate-pulse"></div> PROMPTWATCH
        </div>
        <div className="hidden md:flex gap-8 items-center">
          {/* TODO: Add real destination for FEATURES link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors pb-1"
            href="#"
          >
            FEATURES
          </a>
          {/* TODO: Add real destination for INTELLIGENCE link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors pb-1"
            href="#"
          >
            INTELLIGENCE
          </a>
          {/* TODO: Add real destination for PRICING link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors pb-1"
            href="#"
          >
            PRICING
          </a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="hidden md:block font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-6 py-3 hover:scale-105 transition-transform text-center shadow-lg shadow-primary/20">
            SIGN IN
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row min-h-[870px] border-b border-outline-variant relative overflow-hidden bg-surface-container-lowest">
          {/* subtle background glow */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Left 60% */}
          <div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center gap-8 border-b md:border-b-0 md:border-r border-outline-variant relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display-xl text-[64px] md:text-[100px] leading-[0.9] uppercase tracking-tight max-w-[90%] text-on-surface"
            >
              YOUR SITE IS BEING <br/>
              CRAWLED BLIND. <br/>
              <span className="text-secondary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">FIX THAT.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-body-md text-body-md text-on-surface-variant max-w-xl border-l-2 border-primary/30 pl-4"
            >
              Promptwatch tracks every AI crawler that hits your site, shows you exactly who&apos;s taking the most, and lets you throttle or block them before they cost you bandwidth — automatically.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Link href="/signup" className="bg-primary text-on-primary rounded-full px-8 py-4 font-label-caps text-label-caps hover:scale-105 transition-all w-fit inline-block text-center shadow-lg shadow-primary/20">
                GET STARTED
              </Link>
              <Link href="/signup" className="bg-surface-variant text-on-surface rounded-full px-8 py-4 font-label-caps text-label-caps hover:bg-outline-variant transition-colors w-fit inline-block text-center">
                READ WHITE PAPER
              </Link>
            </motion.div>
          </div>
          {/* Right 40% */}
          <div
            id="hero-stats"
            className="w-full md:w-[40%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center relative overflow-hidden bg-surface-container"
          >
            {/* Grid background simulation */}
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            ></div>
            <div className="relative z-10 flex flex-col gap-16">
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="font-label-caps text-label-caps text-secondary mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  01 — CRAWLER VISITS TRACKED
                </div>
                <div className="font-display-xl text-display-xl text-on-surface">{stats.visits},000+</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  BOT REQUESTS LOGGED (DEMO DATA)
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="border-t border-outline-variant pt-8">
                <div className="font-label-caps text-label-caps text-secondary mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  02 — BOTS RECOGNIZED
                </div>
                <div className="font-display-xl text-display-xl text-on-surface">{stats.engines} CRAWLERS</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  GPTBOT · CLAUDEBOT · PERPLEXITYBOT · CCBOT
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="border-t border-outline-variant pt-8">
                <div className="font-label-caps text-label-caps text-secondary mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary/40"></div>
                  03 — REQUESTS THROTTLED
                </div>
                <div className="font-display-xl text-display-xl text-on-surface/50">[PLACEHOLDER]</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  AUTO-BLOCKED BEFORE THEY COST YOU
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 01 — THE AUDIT */}
        <section className="border-b border-outline-variant bg-surface-container-lowest">
          <div className="px-margin-mobile md:px-margin-desktop py-8 border-b border-outline-variant">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-section-header text-section-header text-on-surface">
              <span className="text-secondary mr-2">01 —</span> THE AUDIT
            </motion.h2>
          </div>
          <div id="audit-stats" className="grid grid-cols-1 md:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }} className="p-8 border-b md:border-b-0 md:border-r border-outline-variant flex flex-col gap-2 hover:bg-surface-variant transition-colors">
              <span className="font-display-xl text-[48px] text-on-surface">{stats.bandwidth}%</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Bandwidth Recovery
              </span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 border-b md:border-b-0 md:border-r border-outline-variant flex flex-col gap-2 hover:bg-surface-variant transition-colors">
              <span className="font-display-xl text-[48px] text-on-surface">{stats.latency}ms</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                P99 Latency
              </span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-8 border-b md:border-b-0 md:border-r border-outline-variant flex flex-col gap-2 hover:bg-surface-variant transition-colors">
              <span className="font-display-xl text-[48px] text-on-surface">{stats.nodes / 10}k</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Nodes Deployed
              </span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="p-8 flex flex-col gap-2 hover:bg-surface-variant transition-colors">
              <span className="font-display-xl text-[48px] text-on-surface">{stats.revenue}%</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Revenue Lift
              </span>
            </motion.div>
          </div>
        </section>

        {/* Section 02 — THE PRODUCT */}
        <section className="border-b border-outline-variant p-margin-mobile md:p-margin-desktop bg-surface">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-section-header text-section-header mb-12 text-on-surface">
            <span className="text-secondary mr-2">02 —</span> THE PRODUCT
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full border border-outline-variant rounded-2xl bg-surface-container relative group cursor-pointer h-[500px] md:h-[700px] overflow-hidden shadow-2xl shadow-primary/5"
          >
            <img
              alt="Dashboard Preview"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTwzG8K62EJ57uzT05FYhOkaM3xjBicbo1mJLI1PeBgIrhr6uEFsiTglFk_pXIkC_LN3Pma0YmEvm8gxFvr_IlOulCl6BNlHQLxgUL0onpMkVrHu3gZg-eQ9w3CjwsC4px6oGfkMNFttlfyRctJnLkNMXXZult3-XmLWfi-EZtx0FiBiO17v2ockhCjOIing8P16oGg4ftHew-w3Zd0CKXpXDxGzxoSssKsO8X97P4FRGCsp0FeyJ1CNF4XfIpA6sBBfQzVvZWq_yG"
            />
            <div className="absolute bottom-0 left-0 w-full bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant p-6 flex justify-between items-center transition-transform translate-y-2 group-hover:translate-y-0">
              <span className="font-data-mono text-data-mono text-on-surface">FIG 1. CORE VISUALIZER</span>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight className="text-on-primary w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 03 — SUBSCRIPTION */}
        <section className="border-b border-outline-variant p-margin-mobile md:p-margin-desktop bg-surface-container-lowest">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-section-header text-section-header mb-12 text-on-surface">
            <span className="text-secondary mr-2">03 —</span> SUBSCRIPTION
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic -> EXPLORE */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }} className="border border-outline-variant rounded-2xl p-8 bg-surface-container flex flex-col justify-between min-h-[400px] hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4 text-on-surface">
                  EXPLORE
                </h3>
                <div className="font-data-mono text-data-mono text-on-surface-variant mb-8">
                  Free forever
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-outline-variant pt-6">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">Standard Ruleset</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">24h Data Retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">Community Support</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full rounded-full border border-outline-variant py-4 font-label-caps text-label-caps hover:bg-surface-variant transition-colors mt-8 text-center text-on-surface">
                START FREE
              </Link>
            </motion.div>
            {/* Professional -> GROWTH */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="border border-primary rounded-2xl p-8 bg-primary text-on-primary flex flex-col justify-between min-h-[400px] relative transform md:-translate-y-4 shadow-2xl shadow-primary/20">
              <div>
                <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-secondary text-white font-label-caps text-[10px] px-3 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4 text-on-primary">
                  GROWTH
                </h3>
                <div className="font-display-xl text-[48px] text-secondary mb-2">
                  $49
                  <span className="font-data-mono text-[14px] text-on-primary/60">
                    /mo
                  </span>
                </div>
                <div className="font-data-mono text-data-mono text-on-primary/60 mb-8">
                  $49/mo
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-on-primary/20 pt-6">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-primary">Advanced Heuristics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-primary">30-Day Retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-primary">Priority Email Support</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full rounded-full bg-surface-container-lowest text-primary py-4 font-label-caps text-label-caps hover:scale-105 transition-transform mt-8 text-center shadow-lg">
                UPGRADE NOW
              </Link>
            </motion.div>
            {/* Enterprise */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="border border-outline-variant rounded-2xl p-8 bg-surface-container flex flex-col justify-between min-h-[400px] hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4 text-on-surface">
                  ENTERPRISE
                </h3>
                <div className="font-data-mono text-data-mono text-on-surface-variant mb-8">
                  Custom pricing
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-outline-variant pt-6">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">Custom Integration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">Unlimited Retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center"><Check className="w-3 h-3 text-secondary" /></div>
                    <span className="text-on-surface">Dedicated SLA</span>
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full rounded-full border border-outline-variant py-4 font-label-caps text-label-caps hover:bg-surface-variant transition-colors mt-8 text-center text-on-surface">
                CONTACT SALES
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant w-full px-margin-mobile md:px-margin-desktop py-16 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="font-headline-lg text-headline-lg font-bold text-on-surface uppercase flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-sm animate-pulse"></div> PROMPTWATCH
        </div>
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          {/* TODO: Add real destination for PRIVACY POLICY link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            PRIVACY POLICY
          </a>
          {/* TODO: Add real destination for TERMS OF SERVICE link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            TERMS OF SERVICE
          </a>
          {/* TODO: Add real destination for CONTACT link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            CONTACT
          </a>
          {/* TODO: Add real destination for DOCUMENTATION link or remove */}
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            DOCUMENTATION
          </a>
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant w-full md:w-auto text-left md:text-right uppercase">
          © 2026 PROMPTWATCH. BUILT FOR CONTENT TEAMS WHO TAKE AI SERIOUSLY.
        </div>
      </footer>
      {/* Final 40px Strip */}
      <div className="h-[40px] w-full bg-primary border-t border-outline-variant"></div>
    </>
  );
}
