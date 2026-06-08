"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Stats counter state
  const [stats, setStats] = useState({
    visits: 0,
    engines: 0,
    actions: 0,
    latency: 0,
  });

  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimatedStats = useRef(false);

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
            
            // Check if it's the stats section to trigger counter
            if (entry.target.id === "stats-section" && !hasAnimatedStats.current) {
              hasAnimatedStats.current = true;
              animateCounter('visits', 100, 2000);
              animateCounter('engines', 4, 1000);
              animateCounter('actions', 30, 1500);
              animateCounter('latency', 500, 1500);
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
    <div className="min-h-screen bg-editorial-white text-editorial-black font-sans selection:bg-editorial-black selection:text-editorial-white">
      
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 bg-editorial-white transition-colors duration-300 ${
          scrolled ? "border-b-2 border-editorial-red" : "border-b-2 border-editorial-black"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-editorial-red" />
            <span className="text-2xl font-condensed font-bold tracking-tight text-editorial-black mt-1">PROMPTWATCH</span>
          </div>
          <div className="flex items-center gap-8">
            <button type="button" className="text-sm font-bold font-condensed uppercase tracking-wider text-editorial-black hover:text-editorial-red transition-colors hidden sm:block">
              Login
            </button>
            <button type="button" className="btn-editorial text-sm font-bold font-condensed uppercase tracking-wider bg-editorial-black text-editorial-white px-6 py-3 border border-editorial-black">
              GET STARTED &rarr;
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        
        {/* Hero Section */}
        <section className="border-b-[4px] border-editorial-black flex flex-col md:flex-row min-h-[85vh]">
          {/* Left Column (60%) */}
          <div className="w-full md:w-[60%] px-6 py-20 md:py-32 md:pr-20 lg:pl-[max(1.5rem,calc((100vw-1400px)/2+1.5rem))]">
            <div className="inline-block bg-editorial-red text-editorial-white font-condensed font-bold uppercase text-sm px-2 py-1 mb-10">
              ISSUE 001 &mdash; AI VISIBILITY INTELLIGENCE
            </div>
            
            <h1 className="font-condensed font-bold uppercase text-6xl md:text-[96px] leading-[0.9] text-editorial-black tracking-tight mb-8">
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>YOUR BRAND</span></span>
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>IS INVISIBLE TO AI.</span></span>
              <span className="block overflow-hidden"><span className="block animate-slide-up opacity-0 text-editorial-red" style={{ animationDelay: '300ms' }}>FIX THAT.</span></span>
            </h1>
            
            <p className="text-xl md:text-2xl font-sans text-editorial-grey max-w-2xl mb-12 animate-slide-up opacity-0" style={{ animationDelay: '400ms' }}>
              Promptwatch tracks every AI crawler visit to your site, surfaces where competitors are cited instead of you, and gives you a prioritized action plan.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 animate-slide-up opacity-0" style={{ animationDelay: '500ms' }}>
              <button type="button" className="btn-editorial w-full sm:w-auto font-condensed font-bold uppercase text-lg tracking-wider bg-editorial-black text-editorial-white px-8 py-4 border-2 border-editorial-black">
                START FOR FREE
              </button>
              <button type="button" className="w-full sm:w-auto font-condensed font-bold uppercase text-lg tracking-wider text-editorial-black border-b-2 border-editorial-black pb-1 hover:text-editorial-red hover:border-editorial-red transition-colors">
                SEE THE DATA &rarr;
              </button>
            </div>
            
            <div className="font-mono text-sm text-editorial-grey animate-slide-up opacity-0" style={{ animationDelay: '600ms' }}>
              No credit card required &middot; 2 min setup
            </div>
          </div>
          
          {/* Right Column (40%) */}
          <div className="w-full md:w-[40%] border-t-[4px] md:border-t-0 md:border-l-[4px] border-editorial-black bg-[#FAFAFA] flex flex-col justify-center p-12 lg:pr-[max(1.5rem,calc((100vw-1400px)/2+1.5rem))]">
            <div className="mb-16">
              <div className="font-mono font-bold text-6xl md:text-8xl tracking-tighter text-editorial-black mb-4">100,000+</div>
              <div className="font-condensed font-bold uppercase text-xl text-editorial-red tracking-wider">AI CRAWLER VISITS TRACKED DAILY</div>
            </div>
            
            <div>
              <div className="border-b border-editorial-black pb-4 mb-4">
                <div className="font-mono font-bold text-4xl text-editorial-black">7 ENGINES</div>
              </div>
              <div className="border-b border-editorial-black pb-4">
                <div className="font-mono font-bold text-4xl text-editorial-black">30 ACTIONS</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-24 max-w-[1400px] mx-auto px-6 border-b border-editorial-light">
          <div className="mb-20 animate-on-scroll opacity-0 clip-hide">
            <div className="font-condensed font-bold text-editorial-red text-lg uppercase tracking-widest mb-4">
              01 &mdash; THE PROBLEM
            </div>
            <h2 className="font-condensed font-bold text-5xl md:text-7xl text-editorial-black uppercase tracking-tight max-w-4xl">
              Google Analytics doesn't show you this.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              { num: "01", title: "INVISIBLE TRAFFIC", desc: "AI bots are filtered out by GA. You can't improve what you can't see." },
              { num: "02", title: "LOST MINDSHARE", desc: "Your competitors are getting cited in AI answers while your content is ignored." },
              { num: "03", title: "NO ACTION PLAN", desc: "Knowing you missed a citation isn't enough. You need steps to fix it." }
            ].map((col, i) => (
              <div key={i} className="animate-on-scroll opacity-0" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="font-mono text-6xl font-bold text-editorial-red mb-6">{col.num}</div>
                <h3 className="font-condensed font-bold text-2xl uppercase mb-4 text-editorial-black">{col.title}</h3>
                <p className="font-sans text-editorial-grey text-lg leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="pt-24 pb-0 max-w-[1400px] mx-auto px-6">
          <div className="font-condensed font-bold text-editorial-red text-lg uppercase tracking-widest mb-16 animate-on-scroll opacity-0">
            02 &mdash; WHAT YOU GET
          </div>
          
          {/* Feature 1 */}
          <div className="border-t-[4px] border-editorial-black py-20 flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 pr-0 lg:pr-12 animate-on-scroll opacity-0">
              <h2 className="font-condensed font-bold text-5xl md:text-6xl uppercase tracking-tight text-editorial-black mb-6">
                AI TRAFFIC DASHBOARD
              </h2>
              <p className="text-xl text-editorial-grey mb-8 font-sans leading-relaxed">
                See exactly which bots are crawling your site, when they visit, and what content they index. Differentiate between Claude, ChatGPT, and Perplexity.
              </p>
              <ul className="space-y-4 font-sans text-editorial-black font-medium text-lg">
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Granular bot filtering</li>
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Historical trends mapping</li>
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Top crawled pages analysis</li>
              </ul>
            </div>
            
            <div className="w-full lg:w-1/2 animate-on-scroll opacity-0" style={{ animationDelay: '200ms' }}>
              <div className="border-2 border-editorial-black p-6 bg-editorial-white shadow-[12px_12px_0px_0px_rgba(10,10,10,1)]">
                <div className="border-b-2 border-editorial-black pb-4 mb-8 flex justify-between items-end">
                  <div className="font-condensed font-bold text-2xl uppercase">Traffic Volume</div>
                  <div className="font-mono text-sm">Last 90 Days</div>
                </div>
                <div className="flex items-end h-64 gap-3">
                  {[4, 7, 3, 8, 5, 9, 6, 4, 8, 5, 7].map((h, i) => (
                    <div key={i} className="flex-1 bg-editorial-black" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="border-t-[4px] border-editorial-black py-20 flex flex-col-reverse lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 animate-on-scroll opacity-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                {/* Mock Card 1 */}
                <div className="border-2 border-editorial-black p-6 bg-editorial-white hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(230,57,70,1)] transition-all duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-editorial-red rounded-full" />
                    <div className="font-mono text-xs font-bold uppercase">HIGH PRIORITY</div>
                  </div>
                  <div className="font-condensed font-bold text-xl uppercase mb-2">Update Missing Citation</div>
                  <div className="h-2 w-full bg-editorial-light mb-2" />
                  <div className="h-2 w-2/3 bg-editorial-light mb-6" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-editorial-black" />
                    <div className="h-8 w-20 border border-editorial-black" />
                  </div>
                </div>
                {/* Mock Card 2 */}
                <div className="border-2 border-editorial-black p-6 bg-[#FAFAFA] sm:translate-y-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-editorial-black rounded-full" />
                    <div className="font-mono text-xs font-bold uppercase">MEDIUM PRIORITY</div>
                  </div>
                  <div className="font-condensed font-bold text-xl uppercase mb-2">Competitor Overlap</div>
                  <div className="h-2 w-full bg-editorial-light mb-2" />
                  <div className="h-2 w-3/4 bg-editorial-light mb-6" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-editorial-black" />
                    <div className="h-8 w-20 border border-editorial-black" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 pl-0 lg:pl-12 animate-on-scroll opacity-0" style={{ animationDelay: '200ms' }}>
              <h2 className="font-condensed font-bold text-5xl md:text-6xl uppercase tracking-tight text-editorial-black mb-6">
                ACTION CENTRE
              </h2>
              <p className="text-xl text-editorial-grey mb-8 font-sans leading-relaxed">
                Don't just look at data. Get a prioritized triage queue of derived recommendations to improve AI visibility, performance, and coverage.
              </p>
              <ul className="space-y-4 font-sans text-editorial-black font-medium text-lg">
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Severity-based prioritization</li>
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Accept or dismiss workflows</li>
                <li className="flex items-start gap-3"><div className="mt-2 w-2 h-2 bg-editorial-red rounded-none shrink-0" /> Persistent state tracking</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Proof Section */}
        <section id="stats-section" className="border-t border-b border-editorial-light bg-[#FAFAFA] py-24 animate-on-scroll opacity-0">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="font-condensed font-bold text-editorial-red text-lg uppercase tracking-widest mb-16">
              03 &mdash; BY THE NUMBERS
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-editorial-black">
              {[
                { value: `${stats.visits}K+`, label: "AI VISITS TRACKED" },
                { value: stats.engines, label: "ENGINE TYPES MONITORED" },
                { value: stats.actions, label: "ACTIONS PER AUDIT" },
                { value: `<${stats.latency}ms`, label: "AGGREGATION TIME" }
              ].map((stat, i) => (
                <div key={i} className="border-r border-editorial-black p-8 md:p-12">
                  <div className="font-mono font-bold text-5xl xl:text-6xl text-editorial-black mb-4 tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="font-condensed font-bold text-lg text-editorial-grey uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 max-w-[1400px] mx-auto px-6">
          <div className="font-condensed font-bold text-editorial-red text-lg uppercase tracking-widest mb-16 animate-on-scroll opacity-0">
            04 &mdash; PRICING
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="border-2 border-editorial-black p-10 flex flex-col animate-on-scroll opacity-0">
              <h3 className="font-condensed font-bold text-3xl uppercase mb-2">Explore</h3>
              <div className="font-mono font-bold text-5xl mb-8">Free</div>
              <ul className="space-y-4 mb-10 flex-1 font-sans text-editorial-black">
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> 1 domain</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> Up to 10k visits/mo</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> Basic AI traffic dashboard</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> 7-day data retention</li>
              </ul>
              <button type="button" className="btn-editorial w-full font-condensed font-bold uppercase text-lg tracking-wider bg-editorial-white text-editorial-black px-8 py-4 border-2 border-editorial-black">
                GET STARTED
              </button>
            </div>

            {/* Growth */}
            <div className="border-2 border-editorial-black bg-editorial-black text-editorial-white p-10 flex flex-col relative animate-on-scroll opacity-0" style={{ animationDelay: '100ms' }}>
              <h3 className="font-condensed font-bold text-3xl uppercase mb-2 text-editorial-red">Growth</h3>
              <div className="font-mono font-bold text-5xl mb-8">$49<span className="text-2xl text-editorial-grey">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1 font-sans text-editorial-white">
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0 text-editorial-red" /> 5 domains</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0 text-editorial-red" /> Unlimited visits</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0 text-editorial-red" /> Full Action Centre</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0 text-editorial-red" /> 90-day data retention</li>
              </ul>
              <button type="button" className="btn-editorial w-full font-condensed font-bold uppercase text-lg tracking-wider bg-editorial-red text-editorial-white px-8 py-4 border-2 border-editorial-red hover:bg-editorial-white hover:text-editorial-black hover:border-editorial-black transition-colors">
                START 14-DAY TRIAL
              </button>
            </div>

            {/* Enterprise */}
            <div className="border-2 border-editorial-black p-10 flex flex-col animate-on-scroll opacity-0" style={{ animationDelay: '200ms' }}>
              <h3 className="font-condensed font-bold text-3xl uppercase mb-2">Enterprise</h3>
              <div className="font-mono font-bold text-5xl mb-8">Custom</div>
              <ul className="space-y-4 mb-10 flex-1 font-sans text-editorial-black">
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> Unlimited domains</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> Custom data retention</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> Competitor Intelligence</li>
                <li className="flex gap-3"><ArrowRight className="w-5 h-5 shrink-0" /> SLA & SSO</li>
              </ul>
              <button type="button" className="btn-editorial w-full font-condensed font-bold uppercase text-lg tracking-wider bg-editorial-white text-editorial-black px-8 py-4 border-2 border-editorial-black">
                CONTACT SALES
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-[4px] border-editorial-black">
        <div className="max-w-[1400px] mx-auto px-6 py-16 flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-editorial-black" />
              <span className="text-2xl font-condensed font-bold tracking-tight text-editorial-black mt-1">PROMPTWATCH</span>
            </div>
            <p className="font-sans text-editorial-grey font-medium leading-relaxed">
              Intelligence for the AI-first web.
            </p>
          </div>
          
          <div className="flex gap-16 md:gap-24 font-sans">
            <div>
              <h4 className="font-condensed font-bold text-editorial-black uppercase tracking-wider mb-6">PRODUCT</h4>
              <ul className="space-y-4 text-editorial-grey font-medium">
                <li><button type="button" className="hover:text-editorial-black transition-colors">Features</button></li>
                <li><button type="button" className="hover:text-editorial-black transition-colors">Pricing</button></li>
                <li><button type="button" className="hover:text-editorial-black transition-colors">Documentation</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed font-bold text-editorial-black uppercase tracking-wider mb-6">COMPANY</h4>
              <ul className="space-y-4 text-editorial-grey font-medium">
                <li><button type="button" className="hover:text-editorial-black transition-colors">About</button></li>
                <li><button type="button" className="hover:text-editorial-black transition-colors">Blog</button></li>
                <li><button type="button" className="hover:text-editorial-black transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed font-bold text-editorial-black uppercase tracking-wider mb-6">LEGAL</h4>
              <ul className="space-y-4 text-editorial-grey font-medium">
                <li><button type="button" className="hover:text-editorial-black transition-colors">Privacy Policy</button></li>
                <li><button type="button" className="hover:text-editorial-black transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-editorial-black py-6 px-6">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-editorial-light/70 uppercase tracking-widest">
            <div>&copy; 2026 PROMPTWATCH</div>
            <div>BUILT FOR CONTENT TEAMS WHO TAKE AI SERIOUSLY</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
