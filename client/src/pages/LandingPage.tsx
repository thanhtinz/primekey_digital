import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Menu, X, Search, Star, Shield, Zap,
  Clock, Package, ChevronRight,
  Mail, Phone, MapPin, Building2, Send, ListOrdered,
  Trophy, ShoppingBag, Flame, Gift, HelpCircle,
  MessageSquare, Tag, ArrowRight, Sparkles, TrendingUp,
  Wrench, FileText, BarChart3, CheckCircle, Heart, User, LogIn
} from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatPrice(amount: number, currency = "VND") {
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: activeSales = [] } = trpc.flashSale.getActive.useQuery(undefined, { staleTime: 60_000 });
  const { data: productsRaw } = trpc.products.listPublic.useQuery(undefined, { staleTime: 60_000, retry: false });
  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });

  // Normalize publicInfo fields
  const phone = publicInfo?.companyPhone;
  const email = publicInfo?.companyEmail;
  const address = publicInfo?.companyAddress;
  const description = (publicInfo as any)?.description || (publicInfo as any)?.companyDescription;

  const products: any[] = Array.isArray(productsRaw) ? productsRaw : (productsRaw as any)?.items ?? [];
  const categories: any[] = (categoriesData as any) ?? [];

  // Scroll header effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close menu on route change
  const navigate = (href: string) => {
    setMenuOpen(false);
    setLocation(href);
  };

  // Nav chính hiển thị trực tiếp trên desktop
  const navLinks = [
    { label: "Flash Sale", href: "/flash-sale", icon: Flame },
    { label: "Tra Cứu Đơn", href: "/track-order", icon: Search },
    { label: "Bảo Hành", href: "/warranty", icon: Shield },
    { label: "Tích Điểm", href: "/loyalty", icon: Gift },
    { label: "BXH", href: "/leaderboard", icon: Trophy },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
  ];

  // Nav phụ trong dropdown "Thêm"
  const moreLinks = [
    { label: "So Sánh Sản Phẩm", href: "/compare", icon: BarChart3 },
    { label: "Hàng Chờ", href: "/queue", icon: ListOrdered },
    { label: "Đánh Giá Sản Phẩm", href: "/feedbacks-public", icon: Star },
  ];

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  // Quick access cards
  const quickCards = [
    {
      label: "Tra Cứu Đơn Hàng",
      desc: "Nhập email để xem trạng thái tất cả đơn hàng của bạn",
      href: "/track-order",
      icon: Search,
      color: "from-blue-500 to-blue-700",
      bg: "bg-blue-500/10 hover:bg-blue-500/20",
      border: "border-blue-500/30",
    },
    {
      label: "Flash Sale",
      desc: "Sản phẩm đang giảm giá sốc, số lượng có hạn",
      href: "/flash-sale",
      icon: Flame,
      color: "from-orange-500 to-red-600",
      bg: "bg-orange-500/10 hover:bg-orange-500/20",
      border: "border-orange-500/30",
      badge: activeSales.length > 0 ? `${activeSales.length} đang sale` : null,
    },
    {
      label: "Bảo Hành Online",
      desc: "Tra cứu thông tin bảo hành và gửi yêu cầu bảo hành",
      href: "/warranty",
      icon: Shield,
      color: "from-green-500 to-emerald-700",
      bg: "bg-green-500/10 hover:bg-green-500/20",
      border: "border-green-500/30",
    },
    {
      label: "Tích Điểm Thành Viên",
      desc: "Kiểm tra điểm thưởng và đổi điểm lấy ưu đãi hấp dẫn",
      href: "/loyalty",
      icon: Gift,
      color: "from-purple-500 to-violet-700",
      bg: "bg-purple-500/10 hover:bg-purple-500/20",
      border: "border-purple-500/30",
    },
    {
      label: "Hàng Chờ Đơn Hàng",
      desc: "Xem thứ tự xử lý đơn hàng theo thời gian thực",
      href: "/queue",
      icon: ListOrdered,
      color: "from-cyan-500 to-teal-700",
      bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
      border: "border-cyan-500/30",
    },
    {
      label: "BXH Chi Tiêu",
      desc: "Bảng xếp hạng khách hàng chi tiêu nhiều nhất",
      href: "/leaderboard",
      icon: Trophy,
      color: "from-yellow-500 to-amber-600",
      bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
      border: "border-yellow-500/30",
    },
    {
      label: "Yêu Cầu Bảo Hành",
      desc: "Gửi yêu cầu bảo hành sản phẩm kèm hình ảnh mô tả",
      href: "/warranty-request",
      icon: Wrench,
      color: "from-rose-500 to-pink-700",
      bg: "bg-rose-500/10 hover:bg-rose-500/20",
      border: "border-rose-500/30",
    },
    {
      label: "Hỏi Đáp (FAQ)",
      desc: "Câu hỏi thường gặp và giải đáp chi tiết",
      href: "/faq",
      icon: HelpCircle,
      color: "from-indigo-500 to-blue-700",
      bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
      border: "border-indigo-500/30",
    },
    {
      label: "Đánh Giá Sản Phẩm",
      desc: "Xem đánh giá từ khách hàng đã mua sản phẩm",
      href: "/feedbacks-public",
      icon: Star,
      color: "from-amber-400 to-yellow-600",
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
      border: "border-amber-500/30",
    },
  ];

  // Filter products
  const filteredProducts = products.filter((p: any) => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !selectedCategory || (p as any).categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  // Flash sale map
  const saleMap = new Map(activeSales.map((s: any) => [s.productId, s]));

  const companyName = publicInfo?.companyName || "Invoice Prime";
  const logoUrl = publicInfo?.logoUrl || publicInfo?.companyLogo;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0d1117]/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{companyName}</span>
            )}
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
              >
                <link.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {link.label}
              </button>
            ))}
            {/* Dropdown “Thêm” */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <Menu className="h-3.5 w-3.5" />
                Thêm
                <ChevronRight className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-90" : ""}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  {moreLinks.map(link => (
                    <button
                      key={link.href}
                      onClick={() => { setMoreOpen(false); navigate(link.href); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      <link.icon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {activeSales.length > 0 && (
              <button onClick={() => navigate("/flash-sale")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold animate-pulse">
                <Flame className="h-3.5 w-3.5" />
                {activeSales.length} Sale
              </button>
            )}
            {/* Nút Tài Khoản cho khách hàng */}
            {typeof window !== "undefined" && localStorage.getItem("customerToken") ? (
              <button
                onClick={() => navigate("/my-account")}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                Tài Khoản
              </button>
            ) : (
              <button
                onClick={() => navigate("/client-login")}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20"
              >
                <User className="h-4 w-4" />
                Đăng Nhập
              </button>
            )}
            {/* Burger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div
          ref={menuRef}
          className={`lg:hidden absolute top-full left-0 right-0 bg-[#161b22] border-b border-white/10 shadow-2xl transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="p-4 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <link.icon className="h-4 w-4 text-blue-400" />
                <span className="font-medium">{link.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
              </button>
            ))}
            <div className="pt-2 border-t border-white/10 space-y-2">
              {typeof window !== "undefined" && localStorage.getItem("customerToken") ? (
                <button
                  onClick={() => navigate("/my-account")}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Tài Khoản Của Tôi
                </button>
              ) : (
                <button
                  onClick={() => navigate("/client-login")}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Đăng Nhập Tài Khoản
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== FLASH SALE BANNER ===== */}
      {activeSales.length > 0 && (
        <div className="pt-16">
          <button
            onClick={() => navigate("/flash-sale")}
            className="w-full bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 py-3 px-4 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Flame className="h-5 w-5 animate-bounce text-yellow-300" />
            <span className="font-bold text-sm sm:text-base">
              🔥 FLASH SALE ĐANG DIỄN RA — {activeSales.length} sản phẩm giảm giá sốc!
            </span>
            <span className="hidden sm:flex items-center gap-1 text-yellow-200 text-sm font-medium">
              Xem ngay <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* ===== HERO + SEARCH ===== */}
      <section className={`${activeSales.length > 0 ? "" : "pt-16"} py-12 px-4`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm mb-6">
            <Sparkles className="h-3.5 w-3.5" />
              {description || "Nền tảng mua sắm & quản lý đơn hàng chuyên nghiệp"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            {logoUrl ? (
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Chào mừng đến với
              </span>
            ) : (
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {companyName}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Khám phá sản phẩm, tra cứu đơn hàng, bảo hành và nhiều tiện ích khác
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 rounded-xl focus:border-blue-500"
              />
            </div>
            <Button
              onClick={() => navigate(`/catalog${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`)}
              className="h-11 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium"
            >
              Tìm
            </Button>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!selectedCategory ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
              >
                Tất cả
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.id ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== PRODUCTS GRID ===== */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-400" />
                  {selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name ?? "Sản Phẩm" : "Tất Cả Sản Phẩm"}
                  <span className="text-sm font-normal text-slate-400">({filteredProducts.length})</span>
                </h2>
                <button onClick={() => navigate("/catalog")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                  Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {filteredProducts.slice(0, 24).map((product: any) => {
                  const sale = saleMap.get(product.id) as any;
                  const salePrice = sale ? product.price * (1 - sale.discountPercent / 100) : null;
                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="group bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
                    >
                      {/* Product image placeholder */}
                      <div className="aspect-square bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center relative overflow-hidden">
                        {(product as any).imageUrl ? (
                          <img src={(product as any).imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="h-10 w-10 text-slate-600" />
                        )}
                        {sale && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            -{sale.discountPercent}%
                          </div>
                        )}
                        {(product as any).warrantyMonths > 0 && (
                          <div className="absolute bottom-2 right-2 bg-green-600/80 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Shield className="h-2.5 w-2.5" />
                            {(product as any).warrantyMonths}T
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-white line-clamp-2 mb-1 group-hover:text-blue-300 transition-colors">{product.name}</p>
                        <div className="flex items-baseline gap-1.5">
                          {salePrice !== null ? (
                            <>
                              <span className="text-sm font-bold text-orange-400">{formatPrice(salePrice, product.currency ?? "VND")}</span>
                              <span className="text-xs text-slate-500 line-through">{formatPrice(product.price, product.currency ?? "VND")}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-blue-400">{formatPrice(product.price, product.currency ?? "VND")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredProducts.length > 24 && (
                <div className="text-center mt-6">
                  <Button onClick={() => navigate("/catalog")} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
                    Xem thêm {filteredProducts.length - 24} sản phẩm
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchQuery ? `Không tìm thấy sản phẩm cho "${searchQuery}"` : "Chưa có sản phẩm nào"}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
                  Xóa tìm kiếm
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== QUICK ACCESS CARDS ===== */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Tiện Ích Dành Cho Bạn</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickCards.map(card => (
              <button
                key={card.href}
                onClick={() => navigate(card.href)}
                className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${card.bg} ${card.border}`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{card.label}</span>
                    {card.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium border border-orange-500/30">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{card.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-[#0d1117] px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-8 w-auto max-w-[140px] object-contain mb-3" />
              ) : (
                <span className="text-lg font-bold text-white mb-3 block">{companyName}</span>
              )}
              <p className="text-slate-500 text-sm leading-relaxed">
                {description || "Nền tảng quản lý hóa đơn và thanh toán chuyên nghiệp"}
              </p>
              <div className="flex gap-3 mt-4">
                {email && (
                  <a href={`mailto:${email}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Mua sắm */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Mua Sắm</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tất Cả Sản Phẩm", href: "/catalog" },
                  { label: "Flash Sale", href: "/flash-sale" },
                  { label: "So Sánh Sản Phẩm", href: "/compare" },
                  { label: "Đánh Giá Sản Phẩm", href: "/feedbacks-public" },
                ].map(l => (
                  <li key={l.href}>
                    <button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hỗ trợ */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Hỗ Trợ</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tra Cứu Đơn Hàng", href: "/track-order" },
                  { label: "Tra Cứu Bảo Hành", href: "/warranty" },
                  { label: "Yêu Cầu Bảo Hành", href: "/warranty-request" },
                  { label: "Hỏi Đáp (FAQ)", href: "/faq" },
                ].map(l => (
                  <li key={l.href}>
                    <button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Thành viên */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Thành Viên</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tích Điểm Thành Viên", href: "/loyalty" },
                  { label: "Hàng Chờ Đơn Hàng", href: "/queue" },
                  { label: "BXH Chi Tiêu", href: "/leaderboard" },
                  { label: "Đăng Nhập Dashboard", href: "/login" },
                ].map(l => (
                  <li key={l.href}>
                    <button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact info */}
          {(address || phone || email) && (
            <div className="flex flex-wrap gap-4 py-4 border-t border-white/5 mb-4">
              {address && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  {address}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  {phone}
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-white/5">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-slate-600 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Thanh toán an toàn 256-bit SSL
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
