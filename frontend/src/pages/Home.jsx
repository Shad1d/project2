import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  ClipboardCheck,
  Lock,
  Info,
} from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

/*
  Palette
  Navy (ink) ........ #0B1F3A  headings, primary buttons, dark CTA
  Teal (accent) ..... #0F8B8D  links, focus, icons, highlights
  Mint (on dark) .... #5EEAD4  accents on navy surfaces
  Canvas ............ #F5F7FA  alternating section background
  Status ............ amber = deadline urgency, emerald = verified
*/

// Self-contained animation styles (no Tailwind config changes needed).
// Everything is disabled automatically for users who prefer reduced motion.
const HOME_STYLES = `
@keyframes of-rise     { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes of-slide-in { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes of-card-in  { from { opacity: 0; transform: translateY(40px) rotate(2deg) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes of-float    { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes of-drift    { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(36px,28px,0) scale(1.1); } }
@keyframes of-drift-b  { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-30px,34px,0) scale(1.12); } }
@keyframes of-gradient { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
@keyframes of-underline{ from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes of-blink    { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

.of-rise     { animation: of-rise 0.9s cubic-bezier(.22,1,.36,1) both; }
.of-slide-in { animation: of-slide-in 0.6s cubic-bezier(.22,1,.36,1) both; }
.of-card-in  { animation: of-card-in 1.1s cubic-bezier(.22,1,.36,1) .25s both; }
.of-float    { animation: of-float 7s ease-in-out 1.4s infinite; }
.of-drift    { animation: of-drift 14s ease-in-out infinite; }
.of-drift-b  { animation: of-drift-b 17s ease-in-out infinite; }
.of-blink    { animation: of-blink 2.4s ease-in-out infinite; }

.of-gradient-text {
  background-image: linear-gradient(90deg, #0F8B8D, #2DD4BF, #0F8B8D);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  color: transparent; -webkit-text-fill-color: transparent;
  animation: of-gradient 4.5s ease-in-out infinite alternate;
}
.of-underline-sweep {
  position: absolute; left: 0; right: 0; bottom: -2px; height: 7px; border-radius: 4px;
  background: linear-gradient(90deg, rgba(15,139,141,.28), rgba(45,212,191,.2));
  transform-origin: left; animation: of-underline .9s cubic-bezier(.22,1,.36,1) 1s both; z-index: -1;
}

/* Scroll reveal */
.of-reveal {
  opacity: 0; transform: translateY(28px);
  transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1);
  will-change: opacity, transform;
}
.of-reveal[data-visible="true"] { opacity: 1; transform: none; }

/* Button shine sweep */
.of-shine { position: relative; overflow: hidden; isolation: isolate; }
.of-shine::after {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(110deg, transparent 30%, var(--shine, rgba(255,255,255,.35)) 50%, transparent 70%);
  transform: translateX(-130%); transition: transform .9s cubic-bezier(.22,1,.36,1);
}
.of-shine:hover::after { transform: translateX(130%); }

@media (prefers-reduced-motion: reduce) {
  .of-rise, .of-slide-in, .of-card-in, .of-float, .of-drift, .of-drift-b,
  .of-blink, .of-gradient-text, .of-underline-sweep {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
  .of-gradient-text { background-position: 0% 50%; }
  .of-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .of-shine::after { transition: none !important; }
}
`;

// Fades & slides content in once it scrolls into view
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={`of-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Animates a number from 0 up to `target`
function useCountUp(target, duration = 1500, delay = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf;
    let start;
    const timer = setTimeout(() => {
      const step = (t) => {
        if (!start) start = t;
        const p = Math.min((t - start) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}

// Canonical categories defined directly from Homepage design reference
// Ensures categories ALWAYS show immediately with zero delay or blank state
const EXPLORE_CATEGORIES = [
  {
    title: "Internships",
    description: "Hands-on experience, paid and unpaid",
    slug: "internship",
  },
  {
    title: "Jobs",
    description: "Entry-level and part-time roles",
    slug: "job",
  },
  {
    title: "Scholarships",
    description: "Funding for your education",
    slug: "scholarship",
  },
  {
    title: "Hackathons",
    description: "Build something in a weekend",
    slug: "hackathon",
  },
  {
    title: "Competitions",
    description: "Test your skills against others",
    slug: "competition",
  },
  {
    title: "Fellowships",
    description: "Structured programs with mentorship",
    slug: "fellowship",
  },
  {
    title: "Grants",
    description: "Funding for projects and research",
    slug: "grant",
  },
  {
    title: "Research",
    description: "Labs and programs open to students",
    slug: "research",
  },
  {
    title: "Conferences",
    description: "Events, travel funding and networking",
    slug: "conference",
  },
];

// Showcase sample listings matching Homepage@2x.png design reference
const SHOWCASE_CLOSING_SOON = [
  {
    id: "sample-1",
    tag: "Research · Hybrid - Boston, US",
    matchScore: "71% match",
    title: "Summer Research Fellowship",
    organization: "Northfield Demo University",
    deadlineLabel: "Closing tomorrow",
    deadlineStyle: "bg-amber-50 text-amber-800 border border-amber-200/70",
    verifiedLabel: "Verified 2 days ago",
    verifiedStyle:
      "bg-emerald-50 text-emerald-800 border border-emerald-200/70",
    link: "/opportunities?search=Research",
  },
  {
    id: "sample-2",
    tag: "Hackathon · Remote",
    matchScore: "64% match",
    title: "Open Data for Climate Hackathon",
    organization: "Demo Climate Lab",
    deadlineLabel: "Closing in 3 days",
    deadlineStyle: "bg-amber-50 text-amber-800 border border-amber-200/70",
    verifiedLabel: "Reviewed 5 days ago",
    verifiedStyle: "bg-slate-100 text-slate-700 border border-slate-200/70",
    link: "/opportunities?search=Hackathon",
  },
  {
    id: "sample-3",
    tag: "Scholarship · Fully funded",
    matchScore: "58% match",
    title: "Undergraduate STEM Scholarship",
    organization: "Example Foundation",
    deadlineLabel: "Closing in 6 days",
    deadlineStyle: "bg-teal-50 text-teal-800 border border-teal-200/70",
    verifiedLabel: "Verified today",
    verifiedStyle:
      "bg-emerald-50 text-emerald-800 border border-emerald-200/70",
    link: "/opportunities?search=Scholarship",
  },
];

const chipClass =
  "text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-[#0F8B8D]/50 hover:text-[#0B1F3A] hover:bg-teal-50/60 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/5 active:translate-y-0 rounded-full px-3.5 py-1.5 transition-all duration-200 shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]";

const featureIconWrap =
  "w-11 h-11 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center mb-4 ring-1 ring-[#0F8B8D]/15 group-hover:bg-[#0F8B8D] group-hover:text-white group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-lg group-hover:shadow-[#0F8B8D]/30 transition-all duration-300";

const delayStyle = (ms) => ({ animationDelay: `${ms}ms` });

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(EXPLORE_CATEGORIES);
  // Adjusted from 88 to 68 to realistically match 3 of 5 skills and missing experience preference
  const matchScore = useCountUp(68);

  // Attempt to enrich categories count or slugs from backend API seamlessly
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          const apiCats = res.data.data;
          // Merge API data with friendly descriptions
          const merged = EXPLORE_CATEGORIES.map((cat) => {
            const found = apiCats.find(
              (c) => c.slug?.toLowerCase() === cat.slug.toLowerCase(),
            );
            return found ? { ...cat, _id: found._id } : cat;
          });
          setCategories(merged);
        }
      })
      .catch(() => {
        // Fallback remains EXPLORE_CATEGORIES
      });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(
      q ? `/opportunities?search=${encodeURIComponent(q)}` : "/opportunities",
    );
  };

  return (
    <div className="w-full bg-white text-slate-900 selection:bg-teal-100 selection:text-[#0B1F3A]">
      <style>{HOME_STYLES}</style>

      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#F5F7FA] via-white to-white">
        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(11,31,58,0.09) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          }}
        />
        {/* Drifting glows */}
        <div
          aria-hidden="true"
          className="of-drift pointer-events-none absolute -top-32 right-[-10%] w-[520px] h-[520px] rounded-full bg-[#0F8B8D]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="of-drift-b pointer-events-none absolute -top-24 left-[-8%] w-[380px] h-[380px] rounded-full bg-[#0B1F3A]/[0.07] blur-3xl"
        />

        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Pill Badge */}
              <div
                className="of-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-[#0B1F3A] border border-slate-200 shadow-2xs mb-7"
                style={delayStyle(0)}
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#0F8B8D] opacity-40 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-[#0F8B8D]" />
                </span>
                Opportunity intelligence for students
              </div>

              {/* Main Headline */}
              <h1
                className="of-rise font-serif text-4xl sm:text-5xl lg:text-[60px] font-bold tracking-tight text-[#0B1F3A] leading-[1.08] mb-6"
                style={delayStyle(120)}
              >
                Stop missing the <br className="hidden sm:inline" />
                opportunities <br />
                <span className="relative inline-block">
                  <span className="of-gradient-text">meant for you.</span>
                  <span aria-hidden="true" className="of-underline-sweep" />
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="of-rise text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8"
                style={delayStyle(260)}
              >
                Internships, scholarships, research, hackathons and more –
                structured, verified and matched to your profile, with every
                deadline in view.
              </p>

              {/* Search Input Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="of-rise group/search w-full max-w-lg flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 pl-4 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 focus-within:ring-2 focus-within:ring-[#0F8B8D] focus-within:border-transparent focus-within:shadow-xl focus-within:shadow-[#0F8B8D]/10 focus-within:-translate-y-0.5 transition-all duration-300 mb-4"
                style={delayStyle(380)}
              >
                <Search className="w-4 h-4 text-slate-400 group-focus-within/search:text-[#0F8B8D] shrink-0 mr-2.5 transition-colors" />
                <input
                  type="text"
                  placeholder='Try "machine learning", "react" or "scholarship"'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm outline-none pr-2"
                />
                <button
                  type="submit"
                  className="of-shine px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#12305c] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                  style={{ "--shine": "rgba(94,234,212,.4)" }}
                >
                  Search
                </button>
              </form>

              {/* Quick Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-7">
                {[
                  {
                    to: "/opportunities?sort=deadline",
                    label: "Closing this week",
                  },
                  { to: "/opportunities?remote=REMOTE", label: "Remote" },
                  {
                    to: "/opportunities?education=UNDERGRADUATE",
                    label: "No experience required",
                  },
                  { to: "/opportunities?search=funded", label: "Fully funded" },
                ].map((chip, i) => (
                  <Link
                    key={chip.label}
                    to={chip.to}
                    className={`of-rise ${chipClass}`}
                    style={delayStyle(500 + i * 90)}
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>

              {/* Unauthenticated notice */}
              {!isLoggedIn && (
                <div
                  className="of-rise inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 mb-5"
                  style={delayStyle(700)}
                >
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Note:</strong> Personalized match percentages won't be shown if you are not logged in.
                  </span>
                </div>
              )}

              {/* Micro footnote */}
              <p
                className="of-rise text-xs text-slate-500 flex items-center gap-1.5"
                style={delayStyle(900)}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />
                Every listing shows where it came from and when a person last
                checked it.
              </p>
            </div>

            {/* Right Column: Interactive Hero Match Preview Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="of-card-in w-full max-w-md">
                <div className="of-float relative w-full">
                  {/* Offset layered card behind for depth */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-[#0B1F3A]/[0.06] border border-[#0B1F3A]/5"
                  />
                  <div className="relative w-full bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 p-6 sm:p-7 hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(11,31,58,0.25)] transition-all duration-300">
                    {/* Top Demo Tag */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F8B8D] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200/60">
                        <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                        Interactive Demo Preview
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Sample calculation
                      </span>
                    </div>

                    {/* Card Top: Org info & Match Score Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs text-slate-500 font-medium tracking-tight">
                          Brightside Demo Labs · Internship · Remote
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight mt-1">
                          Frontend Engineering Internship
                        </h3>
                      </div>
                      <div className="shrink-0 bg-[#0B1F3A] text-white rounded-xl px-3 py-2 text-center min-w-[84px] shadow-md shadow-[#0B1F3A]/20">
                        <div className="text-[9px] uppercase tracking-wider text-[#5EEAD4] font-bold">
                          Demo
                        </div>
                        <div className="text-lg font-black leading-none text-[#5EEAD4] tabular-nums mt-0.5">
                          {matchScore}%
                        </div>
                        <div className="text-[10px] text-slate-300 font-normal mt-1 tracking-tight">
                          Good match
                        </div>
                      </div>
                    </div>

                    {/* Match strength meter (follows the counter) */}
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mt-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0F8B8D] to-[#2DD4BF]"
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    {/* Urgency & Verification Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 mb-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                        <Clock className="of-blink w-3.5 h-3.5 text-amber-600" />
                        Closing in 3 days
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified 2 days ago
                      </span>
                    </div>

                    {/* "Why this matches" Breakdown */}
                    <div className="rounded-xl bg-[#F5F7FA] border border-slate-200/70 p-4">
                      <h4 className="text-xs font-bold text-[#0B1F3A] mb-3 tracking-tight">
                        Why this matches
                      </h4>
                      <ul className="space-y-2.5 text-xs text-slate-700">
                        <li
                          className="of-slide-in flex items-center gap-2.5"
                          style={delayStyle(900)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Education requirement matches</span>
                        </li>
                        <li
                          className="of-slide-in flex items-center gap-2.5"
                          style={delayStyle(1050)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>3 of 5 skills match</span>
                        </li>
                        <li
                          className="of-slide-in flex items-center gap-2.5"
                          style={delayStyle(1200)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Remote preference matches</span>
                        </li>
                        <li
                          className="of-slide-in flex items-center gap-2.5 text-amber-800 font-medium"
                          style={delayStyle(1350)}
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Opportunity prefers: some experience (under 1 year)
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Logged-out Notice */}
                    {!isLoggedIn && (
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Notice:</strong> Match percentages won't be shown if you are not logged in. This card shows a sample demonstration (68% Good Match demo).
                        </span>
                      </div>
                    )}

                    {/* Card Footer Disclaimer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 leading-normal">
                      <span>Sample listing · Demo data</span>
                      {!isLoggedIn && (
                        <Link
                          to="/login"
                          className="text-[#0F8B8D] font-semibold hover:underline"
                        >
                          Sign in to match →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. "CLOSING SOON" SECTION */}
      <section
        id="closing-soon"
        className="scroll-mt-16 border-t border-slate-200/80 bg-white py-16 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
                  Closing soon
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Don't find a great opportunity the day after it closes.
                </p>
              </div>
              <Link
                to="/opportunities"
                className="group/link text-sm font-semibold text-[#0F8B8D] hover:text-[#0B1F3A] inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                Browse all opportunities
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
              </Link>
            </div>

            {!isLoggedIn && (
              <div className="mb-8 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start sm:items-center gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Match percentage notice:</strong> Match percentages are personalized to your student profile and won't be shown if you are not logged in.
                </span>
              </div>
            )}
          </Reveal>

          {/* 3 Showcase Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SHOWCASE_CLOSING_SOON.map((card, i) => (
              <Reveal key={card.id} delay={i * 120} className="h-full">
                <Link
                  to={card.link}
                  className="relative h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xl hover:shadow-slate-900/10 hover:border-[#0F8B8D]/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                >
                  {/* Accent bar sweeps in on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0B1F3A] to-[#0F8B8D] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
                  />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-slate-500 font-medium">
                        {card.tag}
                      </span>
                      {isLoggedIn ? (
                        <span className="bg-[#0B1F3A] group-hover:bg-[#0F8B8D] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 transition-colors duration-300">
                          {card.matchScore}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                          <Lock className="w-3 h-3 text-slate-400" />
                          Sign in to view match %
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-[#0B1F3A] group-hover:text-[#0F8B8D] transition-colors mb-1 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      {card.organization}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium ${card.deadlineStyle}`}
                    >
                      <Clock className="w-3 h-3" />
                      {card.deadlineLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium ${card.verifiedStyle}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {card.verifiedLabel}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-5">
            Sample listings - demo data, not real opportunities.
          </p>
        </div>
      </section>

      {/* 3. "EXPLORE BY CATEGORY" SECTION */}
      <section
        id="categories"
        className="scroll-mt-16 border-t border-slate-200/80 bg-[#F5F7FA] py-16 sm:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
                Explore by category
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                It's not just jobs. Every kind of opportunity gets equal
                footing.
              </p>
            </div>
          </Reveal>

          {/* 9-Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <Reveal key={cat.slug} delay={(i % 3) * 90} className="h-full">
                <Link
                  to={`/opportunities?category=${cat.slug}`}
                  className="h-full bg-white border border-slate-200 hover:border-[#0F8B8D]/50 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 rounded-xl p-5 transition-all duration-300 group cursor-pointer flex items-start justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-[#0B1F3A] group-hover:text-[#0F8B8D] transition-colors text-base">
                      {cat.title || cat.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 leading-normal">
                      {cat.description ||
                        "Browse curated listings in this category"}
                    </p>
                  </div>
                  <span className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0F8B8D] text-slate-400 group-hover:text-white group-hover:scale-110 flex items-center justify-center shrink-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. "BUILT FOR DECISIONS, NOT ENDLESS SCROLLING" SECTION */}
      <section
        id="features"
        className="scroll-mt-16 border-t border-slate-200/80 bg-white py-16 sm:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1F3A] tracking-tight leading-tight">
                Built for decisions, not endless <br />
                scrolling
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <Reveal delay={0} className="h-full">
              <div className="group h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-[#0F8B8D]/30 transition-all duration-300">
                <div className={featureIconWrap}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[#0B1F3A] font-bold text-base mb-2">
                  Matches that explain themselves
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  See a score and the exact reasons behind it once signed in with
                  your profile. Match percentages won't be shown to visitors who
                  are not logged in.
                </p>
              </div>
            </Reveal>

            {/* Feature 2 */}
            <Reveal delay={110} className="h-full">
              <div className="group h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-[#0F8B8D]/30 transition-all duration-300">
                <div className={featureIconWrap}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-[#0B1F3A] font-bold text-base mb-2">
                  Trust you can see
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every listing shows its source and when it was last checked.
                  Verified means checked against the source, never guaranteed
                  open.
                </p>
              </div>
            </Reveal>

            {/* Feature 3 */}
            <Reveal delay={220} className="h-full">
              <div className="group h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-[#0F8B8D]/30 transition-all duration-300">
                <div className={featureIconWrap}>
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-[#0B1F3A] font-bold text-base mb-2">
                  Deadline-first
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A dashboard for what closes today and this week, plus email
                  reminders before it's too late.
                </p>
              </div>
            </Reveal>

            {/* Feature 4 */}
            <Reveal delay={330} className="h-full">
              <div className="group h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-[#0F8B8D]/30 transition-all duration-300">
                <div className={featureIconWrap}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h3 className="text-[#0B1F3A] font-bold text-base mb-2">
                  Track what you apply for
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Save, mark Interested, Applied or Interview, and keep notes.
                  We never submit applications for you.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. DARK CALL-TO-ACTION CONTAINER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <Reveal>
          <div className="relative overflow-hidden bg-[#0B1F3A] rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl shadow-[#0B1F3A]/25">
            <div
              aria-hidden="true"
              className="of-drift pointer-events-none absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-[#0F8B8D]/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="of-drift-b pointer-events-none absolute -left-20 -bottom-32 w-[320px] h-[320px] rounded-full bg-[#5EEAD4]/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                maskImage: "linear-gradient(to left, black, transparent 70%)",
                WebkitMaskImage:
                  "linear-gradient(to left, black, transparent 70%)",
              }}
            />
            <div className="relative max-w-2xl">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                Tell us about you. See what fits, <br />
                and why.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-9 max-w-lg">
                Build a profile in minutes and get an explainable match score on
                every opportunity. Personalized match percentages are only
                unlocked and shown when you are logged in.
              </p>

              <div className="flex flex-wrap items-center gap-3.5">
                <Link
                  to="/register"
                  className="of-shine group/cta inline-flex items-center gap-2 bg-white text-[#0B1F3A] hover:bg-teal-50 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 active:translate-y-0 font-semibold px-7 py-3 rounded-full text-sm transition-all shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EEAD4]"
                  style={{ "--shine": "rgba(15,139,141,.25)" }}
                >
                  Create your free profile
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                </Link>
                <Link
                  to="/opportunities"
                  className="bg-white/5 text-white border border-white/25 hover:border-white/60 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 font-semibold px-7 py-3 rounded-full text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EEAD4]"
                >
                  Browse opportunities
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-200 bg-[#F5F7FA] py-10">
        <Reveal>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-slate-500">
            <p className="max-w-xl text-center md:text-left leading-relaxed">
              Opportunity Finder helps you discover and plan. It does not submit
              applications or guarantee eligibility. Always confirm details on
              the official source.
            </p>
            <div className="flex items-center gap-6 shrink-0 font-medium">
              <Link
                to="/opportunities"
                className="hover:text-[#0F8B8D] hover:-translate-y-0.5 transition-all"
              >
                About
              </Link>
              <Link
                to="/opportunities"
                className="hover:text-[#0F8B8D] hover:-translate-y-0.5 transition-all"
              >
                Report a listing
              </Link>
              <Link
                to="/opportunities"
                className="hover:text-[#0F8B8D] hover:-translate-y-0.5 transition-all"
              >
                Privacy
              </Link>
            </div>
          </div>
        </Reveal>
      </footer>
    </div>
  );
}
