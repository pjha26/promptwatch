"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = "This field is required";
    else if (!email.includes("@")) errs.email = "Please enter a valid email";
    if (!password.trim()) errs.password = "This field is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrors({ email: error.message });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogle = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex font-dm-sans text-[#0A0A0A] bg-[#FFFFFF]">
      {/* Left Column — Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 md:px-16 lg:px-20 py-10">
        {/* Logo */}
        <Link href="/" className="font-barlow-condensed font-bold text-lg mb-auto">
          ■ PROMPTWATCH
        </Link>

        {/* Form — vertically centered */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <h1 className="font-barlow-condensed text-4xl font-bold mb-2">Sign in to your account</h1>
          <p className="text-sm text-[#6B6560] mb-8">Track your AI visibility. Know who&apos;s crawling you.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-2">EMAIL ADDRESS</label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                placeholder="you@company.com"
                className={`w-full border px-4 py-3 text-sm rounded-none focus:outline-none focus:border-[#0A0A0A] ${errors.email ? "border-[#E63946]" : "border-[#0A0A0A]"}`}
              />
              {errors.email && <p className="text-xs text-[#E63946] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[#E63946] text-xs font-semibold uppercase tracking-widest mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                placeholder="••••••••"
                className={`w-full border px-4 py-3 text-sm rounded-none focus:outline-none focus:border-[#0A0A0A] ${errors.password ? "border-[#E63946]" : "border-[#0A0A0A]"}`}
              />
              {errors.password && <p className="text-xs text-[#E63946] mt-1">{errors.password}</p>}
              <div className="text-right mt-1.5">
                <button type="button" className="text-xs text-[#6B6560] underline hover:text-[#0A0A0A]">Forgot password?</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] text-white border border-[#0A0A0A] py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#333333] transition-colors rounded-none disabled:opacity-70"
            >
              {loading ? "SIGNING IN..." : (<>SIGN IN <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-[#E0DDD8]" />
            <span className="text-xs text-[#6B6560] font-dm-mono">OR</span>
            <div className="flex-1 border-t border-[#E0DDD8]" />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            className="w-full border border-[#0A0A0A] py-3 text-sm font-medium flex items-center justify-center gap-3 hover:bg-[#FAF9F7] transition-colors rounded-none"
          >
            <span className="w-5 h-5 rounded-full bg-[#4285F4] text-white text-xs font-bold flex items-center justify-center">G</span>
            Continue with Google
          </button>

          <p className="text-sm text-[#6B6560] mt-8 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#E63946] font-medium hover:underline">Sign up &rarr;</Link>
          </p>
        </div>
      </div>

      {/* Right Column — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F5F2EE] flex-col justify-between p-12 xl:p-16">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <span className="text-[#E63946] text-sm">■</span>
            <span className="font-dm-mono text-[10px] tracking-widest uppercase text-[#6B6560]">PROMPTWATCH INTELLIGENCE</span>
          </div>

          <div className="font-barlow-condensed text-8xl font-bold text-[#0A0A0A] leading-none mb-3">100,000+</div>
          <div className="font-dm-mono text-[10px] tracking-widest uppercase text-[#E63946] mb-8">AI CRAWLER VISITS TRACKED</div>

          <div className="border-t border-[#E0DDD8] pt-8 space-y-6">
            <div>
              <p className="text-sm italic text-[#6B6560]">&ldquo;Finally know which AI tools are reading our content.&rdquo;</p>
              <p className="font-dm-mono text-xs text-[#6B6560] mt-1">— Sarah K., Content Lead at Linear</p>
            </div>
            <div>
              <p className="text-sm italic text-[#6B6560]">&ldquo;Replaced 3 separate tools with just Promptwatch.&rdquo;</p>
              <p className="font-dm-mono text-xs text-[#6B6560] mt-1">— Marcus T., SEO Manager at Vercel</p>
            </div>
            <div>
              <p className="text-sm italic text-[#6B6560]">&ldquo;Our team checks this dashboard every morning.&rdquo;</p>
              <p className="font-dm-mono text-xs text-[#6B6560] mt-1">— Priya R., Growth Lead at a Series B SaaS</p>
            </div>
          </div>
        </div>

        {/* Mock traffic chart */}
        <div className="border border-[#E0DDD8] p-4 mt-8">
          <div className="font-dm-mono text-[10px] tracking-widest uppercase text-[#6B6560] mb-3">LIVE TRAFFIC SNAPSHOT</div>
          <div className="flex items-end justify-between gap-1.5 h-16">
            <div className="w-full bg-[#0A0A0A]" style={{ height: '30%' }} />
            <div className="w-full bg-[#6B6560]" style={{ height: '55%' }} />
            <div className="w-full bg-[#0A0A0A]" style={{ height: '25%' }} />
            <div className="w-full bg-[#6B6560]" style={{ height: '70%' }} />
            <div className="w-full bg-[#0A0A0A]" style={{ height: '90%' }} />
            <div className="w-full bg-[#6B6560]" style={{ height: '45%' }} />
            <div className="w-full bg-[#0A0A0A]" style={{ height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
