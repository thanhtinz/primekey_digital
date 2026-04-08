import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Search, Star, Shield, Zap,
  Package, ChevronRight, ChevronLeft,
  Mail, Phone, MapPin,
  Trophy, Flame, Gift, HelpCircle,
  ArrowRight, Sparkles, CheckCircle, User,
  ShoppingCart, Heart, ListOrdered, BarChart3
} from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatPrice(amount: number | string, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (currency === "USD") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedParentCat, setSelectedParentCat] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("bannerDismissed") === "1"; } catch { return false; }
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: activeSales = [] } = trpc.flashSale.getActive.useQuery(undefined, { staleTime: 60_000 });
  const { data: productsRaw } = trpc.products.listPublic.useQuery(undefined, { staleTime: 60_000, retry: false });
  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });
  const { data: bannersData = [] } = trpc.banner.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  const phone = publicInfo?.companyPhone;
  const email = publicInfo?.companyEmail;
  const address = publicInfo?.companyAddress;
  const description = (publicInfo as any)?.description || (publicInfo as any)?.companyDescription;

  const products: any[] = Array.isArray(productsRaw) ? productsRaw : (productsRaw as any)?.items ?? [];
  const categories: any[] = (categoriesData as any) ?? [];

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

  const navigate = (href: string) => { setMenuOpen(false); setLocation(href); };

  const navLinks = [
    { label: "Flash Sale", href: "/flash-sale", icon: Flame },
    { label: "Sản Phẩm", href: "/catalog", icon: Package },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
  ];

  const moreLinks = [
    { label: "So Sánh Sản Phẩm", href: "/compare", icon: BarChart3 },
    { label: "Hàng Chờ", href: "/queue", icon: ListOrdered },
  ];

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  // Category tree
  const parentCats = categories.filter((c: any) => !c.parentId);
  const getChildCats = (pid: number) => categories.filter((c: any) => c.parentId === pid);

  // Featured products
  const featuredProducts = products.filter((p: any) => p.isFeatured);

  // Filter by parent category
  const filteredByParent = selectedParentCat
    ? products.filter((p: any) => {
        const childIds = getChildCats(selectedParentCat).map((c: any) => c.id);
        return p.categoryId === selectedParentCat || childIds.includes(p.categoryId);
      })
    : products;

  const saleMap = new Map(activeSales.map((s: any) => [s.productId, s]));
  const companyName = publicInfo?.companyName || "Invoice Prime";
  const logoUrl = publicInfo?.logoUrl || publicInfo?.companyLogo;

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { sessionStorage.setItem("bannerDismissed", "1"); } catch {}
  };

  const scrollCats = (dir: "left" | "right") => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  // Product card component
  const ProductCard = ({ product }: { product: any }) => {
    const sale = saleMap.get(product.id) as any;
    const pkgPrices = (product.packages || []).map((p: any) => parseFloat(p.price));
    const minPkgPrice = pkgPrices.length > 0 ? Math.min(...pkgPrices) : null;
    const maxPkgPrice = pkgPrices.length > 0 ? Math.max(...pkgPrices) : null;
    const hasMultiPkg = pkgPrices.length > 1;
    const maxWarranty = (product.packages || []).length > 0
      ? Math.max(...(product.packages || []).map((p: any) => p.warrantyMonths || 0))
      : 0;
    const avgRating = product.avgRating || 0;

    return (
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
          )}
          {sale && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              GIẢM {sale.discountPercent}%
            </div>
          )}
          {maxWarranty > 0 && (
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-green-600 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <Shield className="h-2.5 w-2.5" /> BH {maxWarranty}T
            </div>
          )}
        </div>
        {/* Body */}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors leading-tight">{product.name}</p>
          <div className="mb-1.5">
            {minPkgPrice !== null ? (
              <div className="text-sm font-bold text-red-500">
                {hasMultiPkg ? `${formatPrice(minPkgPrice)} ~ ${formatPrice(maxPkgPrice!)}` : formatPrice(minPkgPrice)}
              </div>
            ) : product.price ? (
              <div className="text-sm font-bold text-red-500">{formatPrice(product.price)}</div>
            ) : null}
          </div>
          {avgRating > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-white/80 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 w-auto max-w-[140px] object-contain" />
            ) : (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{companyName}</span>
            )}
          </button>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => (
              <button key={link.href} onClick={() => navigate(link.href)}
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
                    <button key={link.href} onClick={() => { setMoreOpen(false); navigate(link.href); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all text-left">
                      <link.icon className="h-4 w-4 text-blue-500 flex-shrink-0" />{link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/cart")} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </button>
            {typeof window !== "undefined" && localStorage.getItem("customerToken") ? (
              <button onClick={() => navigate("/my-account")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition-colors border border-blue-200">
                <User className="h-4 w-4" /> Tài Khoản
              </button>
            ) : (
              <button onClick={() => navigate("/client-login")}
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
              <button key={link.href} onClick={() => navigate(link.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all text-left">
                <link.icon className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{link.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100">
              {typeof window !== "undefined" && localStorage.getItem("customerToken") ? (
                <button onClick={() => navigate("/my-account")}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                  <User className="h-4 w-4" /> Tài Khoản Của Tôi
                </button>
              ) : (
                <button onClick={() => navigate("/client-login")}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                  <User className="h-4 w-4" /> Đăng Nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* ===== WELCOME BANNER (dismissable) ===== */}
        {!bannerDismissed && (
          <div className="mx-4 mt-4 mb-2">
            <div className="max-w-7xl mx-auto bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl px-5 py-4 flex items-start gap-3 text-white relative">
              <div className="flex-shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {description || `Chào mừng bạn đến với ${companyName}! Khám phá sản phẩm chất lượng cao với giá tốt nhất.`}
                </p>
              </div>
              <button onClick={dismissBanner} className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== IMAGE BANNER CAROUSEL ===== */}
        {bannersData.length > 0 && (
          <div className="mx-4 mt-3 mb-2 relative overflow-hidden rounded-2xl" style={{maxWidth: "100%"}}>
            <div className="max-w-7xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden" style={{height: "180px"}}>
                {bannersData.map((banner: any, idx: number) => (
                  <a
                    key={banner.id}
                    href={banner.linkUrl || undefined}
                    className={"absolute inset-0 transition-opacity duration-700 " + (idx === currentBannerIdx ? "opacity-100" : "opacity-0 pointer-events-none")}
                  >
                    <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white font-bold text-sm">{banner.title}</p>
                        {banner.subtitle && <p className="text-white/80 text-xs">{banner.subtitle}</p>}
                      </div>
                    )}
                  </a>
                ))}
                {bannersData.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {bannersData.map((_: any, idx: number) => (
                      <button key={idx} onClick={() => setCurrentBannerIdx(idx)}
                        className={"w-2 h-2 rounded-full transition-all " + (idx === currentBannerIdx ? "bg-white w-4" : "bg-white/50")} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ===== FLASH SALE BANNER ===== */}
        {activeSales.length > 0 && (
          <div className="mx-4 mt-2 mb-2">
            <button onClick={() => navigate("/flash-sale")}
              className="w-full max-w-7xl mx-auto block bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl py-3 px-5 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity text-white">
              <Flame className="h-5 w-5 animate-bounce text-yellow-200" />
              <span className="font-bold text-sm">FLASH SALE — {activeSales.length} sản phẩm giảm giá!</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===== PARENT CATEGORY FILTER TABS ===== */}
        <section className="px-4 mt-4 mb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedParentCat(null)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedParentCat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Package className="h-4 w-4" /> Tất cả
              </button>
              {parentCats.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedParentCat(cat.id === selectedParentCat ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedParentCat === cat.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.icon && (cat.icon.startsWith("fa-") ? <i className={`${cat.icon} text-base`} /> : <span className="text-base">{cat.icon}</span>)}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CHILD CATEGORIES ICON SCROLL ===== */}
        {(() => {
          // "Tất cả" → hiển thị tất cả danh mục con (có parentId)
          // Chọn danh mục lớn → chỉ hiển thị danh mục con của nó
          const allChildCats = categories.filter((c: any) => !!c.parentId);
          const displayCats = selectedParentCat
            ? getChildCats(selectedParentCat)
            : allChildCats;
          if (displayCats.length === 0) return null;
          return (
            <section className="px-4 mb-6">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="relative">
                    {displayCats.length > 5 && (
                      <button onClick={() => scrollCats("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-slate-600 -ml-2">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    <div ref={catScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                      {displayCats.map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => navigate(`/catalog?category=${cat.id}`)}
                          className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-all min-w-[80px] group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-2xl group-hover:border-blue-300 group-hover:shadow-sm transition-all">
                            {cat.icon ? (cat.icon.startsWith("fa-") ? <i className={`${cat.icon} text-2xl text-blue-500`} /> : <span>{cat.icon}</span>) : <Package className="h-6 w-6 text-slate-400" />}
                          </div>
                          <span className="text-xs font-medium text-slate-700 text-center line-clamp-1 max-w-[80px]">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {displayCats.length > 5 && (
                      <button onClick={() => scrollCats("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-slate-600 -mr-2">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ===== FEATURED PRODUCTS SECTION ===== */}
        {featuredProducts.length > 0 && !selectedParentCat && (
          <section className="px-4 mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">🔥</span> Sản phẩm nổi bật
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Khám phá bộ sưu tập sản phẩm chất lượng cao được chọn lọc dành riêng cho bạn</p>
                </div>
                <Button onClick={() => navigate("/catalog")} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 gap-1.5 flex-shrink-0">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {featuredProducts.slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== FILTERED BY CATEGORY or ALL PRODUCTS ===== */}
        {selectedParentCat && (
          <section className="px-4 mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  {parentCats.find((c: any) => c.id === selectedParentCat)?.name || "Sản phẩm"}
                  <span className="text-sm font-normal text-slate-400">({filteredByParent.length})</span>
                </h2>
                <button onClick={() => navigate(`/catalog?category=${selectedParentCat}`)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium">
                  Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {filteredByParent.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {filteredByParent.slice(0, 12).map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Chưa có sản phẩm trong danh mục này</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== ALL PRODUCTS (when no filter) ===== */}
        {!selectedParentCat && featuredProducts.length === 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" /> Tất cả sản phẩm
                  <span className="text-sm font-normal text-slate-400">({products.length})</span>
                </h2>
                <button onClick={() => navigate("/catalog")}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium">
                  Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {products.slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.length > 8 && (
                <div className="text-center mt-6">
                  <Button onClick={() => navigate("/catalog")} variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 px-8 gap-2 rounded-xl">
                    <Package className="h-4 w-4" /> Xem tất cả {products.length} sản phẩm
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== VIEW ALL CTA (when featured shown) ===== */}
        {!selectedParentCat && featuredProducts.length > 0 && products.length > featuredProducts.length && (
          <section className="px-4 mb-8">
            <div className="max-w-7xl mx-auto text-center">
              <Button onClick={() => navigate("/catalog")} variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 px-8 gap-2 rounded-xl">
                <Package className="h-4 w-4" /> Xem tất cả {products.length} sản phẩm
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-8 w-auto max-w-[140px] object-contain mb-3" />
              ) : (
                <span className="text-lg font-bold text-slate-800 mb-3 block">{companyName}</span>
              )}
              <p className="text-slate-500 text-sm leading-relaxed">
                {description || "Nền tảng mua sắm & quản lý đơn hàng chuyên nghiệp"}
              </p>
              <div className="flex gap-3 mt-4">
                {email && <a href={`mailto:${email}`} className="text-slate-400 hover:text-blue-500 transition-colors"><Mail className="h-4 w-4" /></a>}
                {phone && <a href={`tel:${phone}`} className="text-slate-400 hover:text-blue-500 transition-colors"><Phone className="h-4 w-4" /></a>}
              </div>
            </div>
            <div>
              <h4 className="text-slate-800 font-semibold mb-3 text-sm">Mua Sắm</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tất Cả Sản Phẩm", href: "/catalog" },
                  { label: "Flash Sale", href: "/flash-sale" },
                  { label: "So Sánh Sản Phẩm", href: "/compare" },
                ].map(l => (
                  <li key={l.href}><button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-slate-800 font-semibold mb-3 text-sm">Hỗ Trợ</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tra Cứu Đơn Hàng", href: "/track-order" },
                  { label: "Tra Cứu Bảo Hành", href: "/warranty" },
                  { label: "Yêu Cầu Bảo Hành", href: "/warranty-request" },
                  { label: "Hỏi Đáp (FAQ)", href: "/faq" },
                ].map(l => (
                  <li key={l.href}><button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-slate-800 font-semibold mb-3 text-sm">Thành Viên</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tích Điểm Thành Viên", href: "/loyalty" },
                  { label: "BXH Chi Tiêu", href: "/leaderboard" },
                  { label: "Giới Thiệu Bạn Bè", href: "/referral" },
                  { label: "Đăng Nhập Dashboard", href: "/login" },
                ].map(l => (
                  <li key={l.href}><button onClick={() => navigate(l.href)} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">{l.label}</button></li>
                ))}
              </ul>
            </div>
          </div>

          {(address || phone || email) && (
            <div className="flex flex-wrap gap-4 py-4 border-t border-slate-100 mb-4">
              {address && <div className="flex items-center gap-2 text-slate-500 text-xs"><MapPin className="h-3.5 w-3.5" />{address}</div>}
              {phone && <div className="flex items-center gap-2 text-slate-500 text-xs"><Phone className="h-3.5 w-3.5" />{phone}</div>}
              {email && <div className="flex items-center gap-2 text-slate-500 text-xs"><Mail className="h-3.5 w-3.5" />{email}</div>}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100">
            <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" /> Thanh toán an toàn 256-bit SSL
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
