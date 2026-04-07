/**
 * ClientHeader - Header dùng chung cho tất cả trang client (public-facing)
 * Đồng bộ với header trang chính LandingPage: logo + nav + cart + hamburger
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Menu, X, User, ShoppingCart, ChevronRight,
  Flame, Package, HelpCircle, BarChart3, ListOrdered
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientHeaderProps {
  maxWidth?: string;
}

export function ClientHeader({ maxWidth = "max-w-7xl" }: ClientHeaderProps) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const companyName = publicInfo?.companyName || "Invoice Prime";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  const go = (href: string) => { setMenuOpen(false); setMoreOpen(false); navigate(href); };

  const navLinks = [
    { label: "Flash Sale", href: "/flash-sale", icon: Flame },
    { label: "Sản Phẩm", href: "/catalog", icon: Package },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
  ];

  const moreLinks = [
    { label: "So Sánh Sản Phẩm", href: "/compare", icon: BarChart3 },
    { label: "Hàng Chờ", href: "/queue", icon: ListOrdered },
  ];

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("customerToken");

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-white/80 backdrop-blur-sm"}`}>
      <div className={`${maxWidth} mx-auto px-4 h-14 flex items-center justify-between gap-3`}>
        {/* Logo */}
        <button onClick={() => go("/")} className="flex items-center gap-2 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 w-auto max-w-[140px] object-contain" />
          ) : (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{companyName}</span>
          )}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map(link => (
            <button key={link.href} onClick={() => go(link.href)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all whitespace-nowrap">
              <link.icon className="h-3.5 w-3.5 flex-shrink-0" />{link.label}
            </button>
          ))}
          <div ref={moreRef} className="relative">
            <button onClick={() => setMoreOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Menu className="h-3.5 w-3.5" /> Thêm <ChevronRight className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-90" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                {moreLinks.map(link => (
                  <button key={link.href} onClick={() => go(link.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all text-left">
                    <link.icon className="h-4 w-4 text-blue-500 flex-shrink-0" />{link.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Cart + Account + Hamburger */}
        <div className="flex items-center gap-2">
          <button onClick={() => go("/cart")} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </button>
          {isLoggedIn ? (
            <button onClick={() => go("/my-account")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition-colors border border-blue-200">
              <User className="h-4 w-4" /> Tài Khoản
            </button>
          ) : (
            <button onClick={() => go("/client-login")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              <User className="h-4 w-4" /> Đăng Nhập
            </button>
          )}
          <button onClick={() => setMenuOpen(v => !v)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div ref={menuRef}
        className={`lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-4 space-y-1">
          {[...navLinks, ...moreLinks].map(link => (
            <button key={link.href} onClick={() => go(link.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all text-left">
              <link.icon className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{link.label}</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100">
            {isLoggedIn ? (
              <button onClick={() => go("/my-account")}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                <User className="h-4 w-4" /> Tài Khoản Của Tôi
              </button>
            ) : (
              <button onClick={() => go("/client-login")}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                <User className="h-4 w-4" /> Đăng Nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
