"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, ShieldAlert, Sparkles, LineChart, Target, EyeOff } from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 selection:bg-indigo-500/30 font-sans bg-grid-pattern relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-navy-900/80 backdrop-blur-md border-b border-navy-700" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse-slow" />
            <span className="text-xl font-semibold text-white tracking-tight">Promptwatch</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button type="button" className="text-slate-300 hover:text-white transition-colors">
              Product
            </button>
            <button type="button" className="text-slate-300 hover:text-white transition-colors">
              Pricing
            </button>
            <button type="button" className="text-slate-300 hover:text-white transition-colors">
              Docs
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
              Login
            </button>
            <button type="button" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>New: Perplexity tracking now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 opacity-0 translate-y-4 animate-fade-in-up delay-100">
            Know exactly when AI <br className="hidden md:block" /> reads your website
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 opacity-0 translate-y-4 animate-fade-in-up delay-200">
            Promptwatch tracks every AI crawler visit, surfaces missed citations, and tells you exactly what to do next.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 opacity-0 translate-y-4 animate-fade-in-up delay-300">
            <button type="button" className="relative group w-full sm:w-auto">
              <div className="absolute -inset-0.5 bg-indigo-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-200"></div>
              <div className="relative bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                Start for free
              </div>
            </button>
            <button type="button" className="w-full sm:w-auto px-6 py-3 rounded-lg border border-navy-700 bg-navy-800/50 hover:bg-navy-800 text-white font-medium transition-colors">
              See how it works
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs text-slate-500 opacity-0 translate-y-4 animate-fade-in-up delay-400">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-500" /> No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-500" /> Setup in 2 minutes</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-indigo-500" /> Cancel anytime</span>
          </div>

          {/* Mockup Window */}
          <div className="mt-20 w-full max-w-4xl mx-auto rounded-xl border border-navy-700 bg-navy-900/80 backdrop-blur-xl shadow-2xl overflow-hidden opacity-0 translate-y-4 animate-fade-in-up delay-[500ms]">
            <div className="h-10 border-b border-navy-700 bg-navy-800/50 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />
              </div>
              <div className="ml-4 flex-1 h-6 bg-navy-900 rounded-md border border-navy-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                app.promptwatch.com/traffic
              </div>
              <div className="w-12" />
            </div>
            <div className="p-6 md:p-8 relative h-[300px] md:h-[400px]">
              <div className="absolute inset-0 flex flex-col justify-end p-8 gap-4 animate-float">
                {/* Mock Chart Bars */}
                <div className="flex items-end h-48 gap-2 border-b border-navy-700 pb-2">
                  {[40, 60, 30, 80, 50, 90, 70, 45, 85, 35, 65, 55].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                      <div className="w-full bg-indigo-500/20 rounded-t-sm transition-all duration-300 group-hover:bg-indigo-500/40" style={{ height: `${h * 0.4}%` }} />
                      <div className="w-full bg-indigo-600 rounded-t-sm transition-all duration-300 group-hover:bg-indigo-500" style={{ height: `${h * 0.6}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-navy-800/50">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold tracking-wider text-xs uppercase animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">Why Promptwatch</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
              The AI shift is happening blind
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: EyeOff,
                title: "Invisible in Analytics",
                desc: "AI traffic is filtered out by Google Analytics by default. You can't improve what you can't see."
              },
              {
                icon: Target,
                title: "Losing Mindshare",
                desc: "Your competitors are getting cited in ChatGPT and Claude while your content is ignored."
              },
              {
                icon: ShieldAlert,
                title: "No Action Plan",
                desc: "Knowing you missed a citation isn't enough. You need prioritized steps to fix it."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-navy-700 bg-navy-800/20 hover:bg-navy-800/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 animate-on-scroll opacity-0 translate-y-8" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 rounded-lg bg-navy-700 border border-navy-600 flex items-center justify-center mb-6 text-indigo-400">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-navy-800/50">
          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
              <div className="flex-1 lg:pr-12">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                  <LineChart className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">AI Traffic Dashboard</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  See exactly which bots are crawling your site, when they visit, and what content they're indexing. Differentiate between Claude, ChatGPT, and Perplexity in real-time.
                </p>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Granular bot filtering</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Historical trends</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Top crawled pages</li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-6 w-1/3 bg-navy-700 rounded-md mb-6" />
                  <div className="flex items-end gap-2 h-32 mb-4">
                    {[3, 5, 4, 7, 5, 8, 6, 9].map((h, i) => (
                      <div key={i} className="flex-1 bg-indigo-600 rounded-t-sm" style={{ height: `${h * 10}%` }} />
                    ))}
                  </div>
                  <div className="h-2 w-full bg-navy-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-6 shadow-2xl space-y-4 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-1/4 bg-red-500/20 rounded border border-red-500/30" />
                    <div className="h-6 w-6 rounded bg-navy-700" />
                  </div>
                  <div className="h-5 w-3/4 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-navy-700 rounded" />
                  <div className="h-4 w-5/6 bg-navy-700 rounded" />
                  <div className="pt-4 flex gap-2">
                    <div className="h-8 w-24 bg-indigo-600 rounded-md" />
                    <div className="h-8 w-24 bg-navy-700 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex-1 lg:pl-12">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Action Centre</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  Don't just look at data. Get a prioritized triage queue of derived recommendations to improve AI visibility, performance, and coverage.
                </p>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Severity-based prioritization</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Accept or dismiss workflows</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Persistent state tracking</li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
              <div className="flex-1 lg:pr-12">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 mb-6">
                  Coming soon
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 text-slate-500">Competitor Intelligence</h2>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Track when competitors are cited instead of you. Identify content gaps and understand exactly what the AI models prefer about their structure.
                </p>
              </div>
              <div className="flex-1 w-full opacity-50 grayscale">
                <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-700" />
                        <div className="h-4 w-24 bg-navy-700 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-green-500/20 rounded border border-green-500/30" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-700" />
                        <div className="h-4 w-32 bg-navy-700 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-red-500/20 rounded border border-red-500/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-navy-800/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 mt-4 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
              Start tracking your AI visibility today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-2xl border border-navy-700 bg-navy-800/30 p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300 animate-on-scroll opacity-0 translate-y-8">
              <h3 className="text-lg font-semibold text-white mb-2">Explore</h3>
              <div className="text-3xl font-bold text-white mb-6">Free</div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> 1 domain</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Up to 10k visits/mo</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Basic AI traffic dashboard</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> 7-day data retention</li>
              </ul>
              <button type="button" className="w-full py-2.5 rounded-lg border border-navy-600 bg-navy-700 hover:bg-navy-600 text-white font-medium transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-navy-800/50 p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300 relative shadow-2xl shadow-indigo-500/10 animate-on-scroll opacity-0 translate-y-8 delay-100">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Growth</h3>
              <div className="text-3xl font-bold text-white mb-6">$49<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> 5 domains</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Unlimited visits</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Full Action Centre</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> 90-day data retention</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Priority support</li>
              </ul>
              <button type="button" className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
                Start 14-day trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="rounded-2xl border border-navy-700 bg-navy-800/30 p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300 animate-on-scroll opacity-0 translate-y-8 delay-200">
              <h3 className="text-lg font-semibold text-white mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-white mb-6">Custom</div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Unlimited domains</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Custom data retention</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Competitor Intelligence</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> SLA & SSO</li>
              </ul>
              <button type="button" className="w-full py-2.5 rounded-lg border border-navy-600 bg-navy-700 hover:bg-navy-600 text-white font-medium transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800/80 bg-navy-900 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xl font-semibold text-white tracking-tight">Promptwatch</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Made for content teams who take AI seriously. We help you measure, analyze, and optimize your brand's presence across the AI landscape.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><button type="button" className="hover:text-white transition-colors">Features</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Pricing</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Changelog</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Documentation</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><button type="button" className="hover:text-white transition-colors">About</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Blog</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Careers</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Contact</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><button type="button" className="hover:text-white transition-colors">Privacy Policy</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Terms of Service</button></li>
                  <li><button type="button" className="hover:text-white transition-colors">Cookie Policy</button></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-navy-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Promptwatch, Inc. All rights reserved.</p>
            <p>Designed with precision.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
