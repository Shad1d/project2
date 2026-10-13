import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Check,
  Bookmark,
  User,
  LogOut,
  Briefcase,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/*
  Palette
  Navy (ink) ... #0B1F3A   Teal (accent) ... #0F8B8D   Mint (on dark) ... #5EEAD4
*/

// Self-contained animation styles (no Tailwind config changes needed)
const NAV_STYLES = `
@keyframes nf-down { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: none; } }
@keyframes nf-menu { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
@keyframes nf-item { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@keyframes nf-pop  { 0% { transform: scale(.4) rotate(-20deg); opacity: 0; } 70% { transform: scale(1.15) rotate(4deg); } 100% { transform: none; opacity: 1; } }
@keyframes nf-ring { 0% { box-shadow: 0 0 0 0 rgba(15,139,141,.45); } 100% { box-shadow: 0 0 0 10px rgba(15,139,141,0); } }

.nf-enter { animation: nf-down .7s cubic-bezier(.22,1,.36,1) both; }
.nf-menu  { animation: nf-menu .3s cubic-bezier(.22,1,.36,1) both; }
.nf-item  { animation: nf-item .4s cubic-bezier(.22,1,.36,1) both; }
.nf-pop   { animation: nf-pop .7s cubic-bezier(.22,1,.36,1) .35s both; }
.nf-ring:hover { animation: nf-ring .9s ease-out; }

.nf-underline { position: relative; }
.nf-underline::after {
  content: ""; position: absolute; left: 4px; right: 4px; bottom: -5px; height: 2px;
  border-radius: 2px; background: #0F8B8D; transform: scaleX(0); transform-origin: left;
  transition: transform .35s cubic-bezier(.22,1,.36,1);
}
.nf-underline:hover::after, .nf-underline[data-active="true"]::after { transform: scaleX(1); }

.nf-shine { position: relative; overflow: hidden; isolation: isolate; }
.nf-shine::after {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(110deg, transparent 30%, rgba(94,234,212,.35) 50%, transparent 70%);
  transform: translateX(-130%); transition: transform .8s cubic-bezier(.22,1,.36,1);
}
.nf-shine:hover::after { transform: translateX(130%); }

@media (prefers-reduced-motion: reduce) {
  .nf-enter, .nf-menu, .nf-item, .nf-pop { animation: none !important; opacity: 1 !important; transform: none !important; }
  .nf-ring:hover { animation: none !important; }
  .nf-underline::after, .nf-shine::after { transition: none !important; }
}
`;

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Visual only: compact the bar slightly once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdminOrMod = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const isHomePage = location.pathname === "/";

  const handleScrollTo = (id) => {
    if (isHomePage) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(`/#${id}`);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]";

  const linkClass = (path) =>
    `nf-underline flex items-center gap-1.5 text-sm font-medium transition-colors rounded-md px-1 py-1 ${focusRing} ${
      location.pathname === path
        ? "text-[#0F8B8D]"
        : "text-slate-600 hover:text-[#0B1F3A]"
    }`;

  const scrollBtnClass = `nf-underline text-sm font-medium text-slate-600 hover:text-[#0B1F3A] transition-colors cursor-pointer rounded-md px-1 py-1 ${focusRing}`;

  const mobileLinkClass =
    "nf-item block py-2.5 px-3 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-[#0B1F3A] hover:pl-4 transition-all";

  const stagger = (i) => ({ animationDelay: `${i * 45}ms` });

  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav
        className={`nf-enter sticky top-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/95 border-slate-200 shadow-lg shadow-slate-900/5"
            : "bg-white/80 border-slate-200/70 shadow-none"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white shadow-sm ring-1 ring-[#0B1F3A]/10 group-hover:bg-[#12305c] group-hover:-rotate-6 group-hover:scale-110 transition-all duration-300">
              <Check className="nf-pop w-4 h-4 stroke-[3.25] text-[#5EEAD4]" />
            </div>
            <span className="font-bold text-[#0B1F3A] text-base sm:text-lg tracking-tight">
              Opportunity Finder
            </span>
          </Link>

          {/* Center / Right Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleScrollTo("closing-soon")}
              className={scrollBtnClass}
            >
              Closing soon
            </button>
            <button
              onClick={() => handleScrollTo("categories")}
              className={scrollBtnClass}
            >
              Categories
            </button>
            <button
              onClick={() => handleScrollTo("features")}
              className={scrollBtnClass}
            >
              Why it's different
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-4 pl-5 ml-1 border-l border-slate-200">
                <Link
                  to="/dashboard"
                  data-active={location.pathname === "/dashboard"}
                  className={linkClass("/dashboard")}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/opportunities"
                  data-active={location.pathname === "/opportunities"}
                  className={linkClass("/opportunities")}
                >
                  Explore
                </Link>
                <Link
                  to="/saved"
                  data-active={location.pathname === "/saved"}
                  className={linkClass("/saved")}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Saved</span>
                </Link>
                <Link
                  to="/applications"
                  data-active={location.pathname === "/applications"}
                  className={linkClass("/applications")}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Applications</span>
                </Link>
                {isAdminOrMod && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:-translate-y-0.5 border border-rose-200/70 rounded-full px-3 py-1 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="nf-ring flex items-center gap-2 pl-1.5 pr-3.5 py-1 text-sm font-medium text-[#0B1F3A] bg-slate-50 hover:bg-white hover:border-[#0F8B8D]/40 border border-slate-200 rounded-full transition-colors"
                >
                  {user?.profile?.profilePicture ? (
                    <img
                      src={user.profile.profilePicture}
                      alt={user.displayName || "Profile"}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#0F8B8D]/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    </span>
                  )}
                  <span>{user?.displayName || "Profile"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 p-2 text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 hover:rotate-6 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-5 ml-1 border-l border-slate-200">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 px-3 py-2 rounded-full transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={`nf-shine px-5 py-2 text-sm font-semibold text-white bg-[#0B1F3A] rounded-full hover:bg-[#12305c] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0B1F3A]/25 transition-all shadow-sm ${focusRing}`}
                >
                  Create free account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-[#0B1F3A] rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label="Toggle menu"
            >
              <span
                key={mobileMenuOpen ? "x" : "menu"}
                className="nf-pop block"
                style={{ animationDelay: "0ms", animationDuration: ".35s" }}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="nf-menu md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-1 shadow-xl">
            <button
              onClick={() => {
                handleScrollTo("closing-soon");
                setMobileMenuOpen(false);
              }}
              className={`${mobileLinkClass} w-full text-left`}
              style={stagger(0)}
            >
              Closing soon
            </button>
            <button
              onClick={() => {
                handleScrollTo("categories");
                setMobileMenuOpen(false);
              }}
              className={`${mobileLinkClass} w-full text-left`}
              style={stagger(1)}
            >
              Categories
            </button>
            <button
              onClick={() => {
                handleScrollTo("features");
                setMobileMenuOpen(false);
              }}
              className={`${mobileLinkClass} w-full text-left`}
              style={stagger(2)}
            >
              Why it's different
            </button>
            <Link
              to="/opportunities"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
              style={stagger(3)}
            >
              Explore All Opportunities
            </Link>

            {isLoggedIn ? (
              <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                  style={stagger(4)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                  style={stagger(5)}
                >
                  Saved Opportunities
                </Link>
                <Link
                  to="/applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                  style={stagger(6)}
                >
                  Application Tracker
                </Link>
                {isAdminOrMod && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nf-item block py-2.5 px-3 text-sm font-semibold text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                    style={stagger(7)}
                  >
                    Admin Portal
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${mobileLinkClass} flex items-center gap-2.5`}
                  style={stagger(8)}
                >
                  {user?.profile?.profilePicture ? (
                    <img
                      src={user.profile.profilePicture}
                      alt={user.displayName}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <User className="w-4 h-4 text-[#0F8B8D]" />
                  )}
                  <span>Profile ({user?.displayName})</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="nf-item block w-full text-left py-2.5 px-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  style={stagger(9)}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nf-item text-center py-2.5 text-sm font-semibold text-[#0B1F3A] border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                  style={stagger(4)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nf-item nf-shine text-center py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-[#12305c] rounded-xl shadow-sm transition-colors"
                  style={stagger(5)}
                >
                  Create free account
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
