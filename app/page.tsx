"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

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
          scrolled ? "bg-surface shadow-sm border-b border-primary" : "bg-surface border-b border-primary"
        } flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20`}
      >
        <div className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary uppercase">
          ■ PROMPTWATCH
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:border-b-2 hover:border-primary transition-all duration-75 pb-1"
            href="#"
          >
            FEATURES
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:border-b-2 hover:border-primary transition-all duration-75 pb-1"
            href="#"
          >
            INTELLIGENCE
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:border-b-2 hover:border-primary transition-all duration-75 pb-1"
            href="#"
          >
            PRICING
          </a>
        </div>
        <Link href="/overview" className="hidden md:block font-label-caps text-label-caps text-on-primary bg-primary border border-primary px-6 py-3 brutalist-hover text-center">
          SIGN IN
        </Link>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row min-h-[870px] border-b border-primary">
          {/* Left 60% */}
          <div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center gap-8 border-b md:border-b-0 border-primary">
            <h1 className="font-display-xl text-[64px] md:text-[100px] leading-[0.9] uppercase tracking-tight max-w-[90%]">
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>YOUR BRAND</span></span>
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>IS INVISIBLE TO AI.</span></span>
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0 text-secondary" style={{ animationDelay: '300ms' }}>FIX THAT.</span></span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl border-l-2 border-primary pl-4 animate-slide-up opacity-0" style={{ animationDelay: '400ms' }}>
              Promptwatch tracks every AI crawler visit to your site, surfaces where competitors are cited instead of you, and gives you a prioritized action plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-slide-up opacity-0" style={{ animationDelay: '500ms' }}>
              <Link href="/overview" className="bg-primary text-on-primary border border-primary px-8 py-4 font-label-caps text-label-caps brutalist-hover w-fit inline-block text-center">
                GET STARTED
              </Link>
              <button className="bg-transparent text-primary border border-primary px-8 py-4 font-label-caps text-label-caps brutalist-hover w-fit">
                READ WHITE PAPER
              </button>
            </div>
          </div>
          {/* Right 40% */}
          <div
            id="hero-stats"
            className="w-full md:w-[40%] md:border-l-[4px] border-primary p-margin-mobile md:p-margin-desktop flex flex-col justify-center relative overflow-hidden animate-on-scroll opacity-0"
            style={{ backgroundColor: "#F8F7F5" }}
          >
            {/* Grid background simulation */}
            <div
              className="absolute inset-0 opacity-100 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#E8E6E2 1px, transparent 1px), linear-gradient(90deg, #E8E6E2 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            ></div>
            <div className="relative z-10 flex flex-col gap-16">
              <div>
                <div className="font-label-caps text-label-caps text-secondary mb-2">
                  01 — AI VISITS TRACKED
                </div>
                <div className="font-display-xl text-display-xl">{stats.visits},000+</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  CRAWLER VISITS PER DAY
                </div>
              </div>
              <div className="border-t border-primary pt-8">
                <div className="font-label-caps text-label-caps text-secondary mb-2">
                  02 — ENGINES MONITORED
                </div>
                <div className="font-display-xl text-display-xl">{stats.engines} ENGINES</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  CHATGPT · CLAUDE · PERPLEXITY · GEMINI
                </div>
              </div>
              <div className="border-t border-primary pt-8">
                <div className="font-label-caps text-label-caps text-secondary mb-2">
                  03 — ACTIONS GENERATED
                </div>
                <div className="font-display-xl text-display-xl">{stats.actions} ACTIONS</div>
                <div className="font-data-mono text-data-mono text-on-surface-variant">
                  PER MONITORING AUDIT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01 — THE AUDIT */}
        <section className="border-b border-primary bg-surface-container-lowest">
          <div className="px-margin-mobile md:px-margin-desktop py-8 border-b border-primary animate-on-scroll opacity-0">
            <h2 className="font-section-header text-section-header">
              <span className="text-secondary mr-2">01 —</span> THE AUDIT
            </h2>
          </div>
          <div id="audit-stats" className="grid grid-cols-1 md:grid-cols-4 animate-on-scroll opacity-0">
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary flex flex-col gap-2">
              <span className="font-display-xl text-[48px]">{stats.bandwidth}%</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Bandwidth Recovery
              </span>
            </div>
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary flex flex-col gap-2">
              <span className="font-display-xl text-[48px]">{stats.latency}ms</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                P99 Latency
              </span>
            </div>
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary flex flex-col gap-2">
              <span className="font-display-xl text-[48px]">{stats.nodes / 10}k</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Nodes Deployed
              </span>
            </div>
            <div className="p-8 flex flex-col gap-2">
              <span className="font-display-xl text-[48px]">{stats.revenue}%</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant uppercase">
                Revenue Lift
              </span>
            </div>
          </div>
        </section>

        {/* Section 02 — THE PRODUCT */}
        <section className="border-b border-primary p-margin-mobile md:p-margin-desktop">
          <h2 className="font-section-header text-section-header mb-12 animate-on-scroll opacity-0">
            <span className="text-secondary mr-2">02 —</span> THE PRODUCT
          </h2>
          <div className="w-full border border-primary bg-surface-dim relative group cursor-pointer h-[500px] md:h-[700px] overflow-hidden animate-on-scroll opacity-0" style={{ animationDelay: '100ms' }}>
            <img
              alt="Brutalist UI Dashboard"
              className="w-full h-full object-cover grayscale contrast-125 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTwzG8K62EJ57uzT05FYhOkaM3xjBicbo1mJLI1PeBgIrhr6uEFsiTglFk_pXIkC_LN3Pma0YmEvm8gxFvr_IlOulCl6BNlHQLxgUL0onpMkVrHu3gZg-eQ9w3CjwsC4px6oGfkMNFttlfyRctJnLkNMXXZult3-XmLWfi-EZtx0FiBiO17v2ockhCjOIing8P16oGg4ftHew-w3Zd0CKXpXDxGzxoSssKsO8X97P4FRGCsp0FeyJ1CNF4XfIpA6sBBfQzVvZWq_yG"
            />
            <div className="absolute bottom-0 left-0 w-full bg-surface-container-lowest border-t border-primary p-4 flex justify-between items-center">
              <span className="font-data-mono text-data-mono">FIG 1. CORE VISUALIZER</span>
              <ArrowRight className="text-primary w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Section 03 — SUBSCRIPTION */}
        <section className="border-b border-primary p-margin-mobile md:p-margin-desktop bg-surface">
          <h2 className="font-section-header text-section-header mb-12 animate-on-scroll opacity-0">
            <span className="text-secondary mr-2">03 —</span> SUBSCRIPTION
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic -> EXPLORE */}
            <div className="border border-primary p-8 bg-surface-container-lowest flex flex-col justify-between min-h-[400px] animate-on-scroll opacity-0">
              <div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4">
                  EXPLORE
                </h3>
                <div className="font-data-mono text-data-mono text-on-surface-variant mb-8">
                  Free forever
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-primary pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    Standard Ruleset
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    24h Data Retention
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    Community Support
                  </li>
                </ul>
              </div>
              <button className="w-full border border-primary py-4 font-label-caps text-label-caps brutalist-hover mt-8">
                START FREE
              </button>
            </div>
            {/* Professional -> GROWTH (Inverted) */}
            <div className="border border-primary p-8 bg-primary text-on-primary flex flex-col justify-between min-h-[400px] relative transform md:-translate-y-4 shadow-[8px_8px_0px_0px_#e6e1df] animate-on-scroll opacity-0" style={{ animationDelay: '100ms' }}>
              <div>
                <div className="absolute top-0 right-0 bg-[#0A0A0A] text-white font-label-caps text-[10px] px-3 py-1 border-l border-b border-primary">
                  MOST POPULAR
                </div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4">
                  GROWTH
                </h3>
                <div className="font-display-xl text-[48px] text-secondary mb-2">
                  $49
                  <span className="font-data-mono text-[14px] text-on-primary-container">
                    /mo
                  </span>
                </div>
                <div className="font-data-mono text-data-mono text-on-primary-container mb-8">
                  $49/mo
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-on-primary-container pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-primary-container" />{" "}
                    Advanced Heuristics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-primary-container" />{" "}
                    30-Day Retention
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-primary-container" />{" "}
                    Priority Email Support
                  </li>
                </ul>
              </div>
              <button className="w-full bg-surface-container-lowest text-primary border border-surface-container-lowest py-4 font-label-caps text-label-caps brutalist-hover mt-8 hover:shadow-[2px_2px_0px_0px_#fff]">
                UPGRADE NOW
              </button>
            </div>
            {/* Enterprise */}
            <div className="border border-primary p-8 bg-surface-container-lowest flex flex-col justify-between min-h-[400px] animate-on-scroll opacity-0" style={{ animationDelay: '200ms' }}>
              <div>
                <h3 className="font-headline-lg text-headline-lg uppercase mb-4">
                  ENTERPRISE
                </h3>
                <div className="font-data-mono text-data-mono text-on-surface-variant mb-8">
                  Custom pricing
                </div>
                <ul className="flex flex-col gap-3 font-body-md text-body-md border-t border-primary pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    Custom Integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    Unlimited Retention
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-on-surface-variant" />{" "}
                    Dedicated SLA
                  </li>
                </ul>
              </div>
              <button className="w-full border border-primary py-4 font-label-caps text-label-caps brutalist-hover mt-8">
                CONTACT SALES
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-primary w-full px-margin-mobile md:px-margin-desktop py-16 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="font-headline-lg text-headline-lg font-bold text-primary uppercase">
          ■ PROMPTWATCH
        </div>
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            PRIVACY POLICY
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            TERMS OF SERVICE
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            CONTACT
          </a>
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
      {/* Final 40px Black Strip */}
      <div className="h-[40px] w-full bg-primary border-t border-primary"></div>
    </>
  );
}
