import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, Shield, Package, ChevronRight, ChevronLeft, Flame, ArrowRight, Sparkles, X, CheckCircle, Trophy, Tag } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { AnnouncementInline, AnnouncementBanner } from "@/components/AnnouncementBanner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

function formatPrice(amount: number | string, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (currency === "USD") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
}

function LeaderboardMiniSection({ navigate }: { navigate: (href: string) => void }) {
  const { data: leaderboard = [] } = trpc.leaderboard.getTop.useQuery({ period: "month" }, { staleTime: 60_000 });
  const top3 = (leaderboard as any[]).slice(0, 3);
  if (top3.length === 0) return null;
  const rankColors = [
    { bg: "bg-yellow-100", text: "text-yellow-700", badge: "bg-yellow-400", icon: "🥇" },
    { bg: "bg-slate-100", text: "text-slate-600", badge: "bg-slate-400", icon: "🥈" },
    { bg: "bg-orange-100", text: "text-orange-700", badge: "bg-orange-400", icon: "🥉" },
  ];
  return (
    <section className="px-4 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <h3 className="font-bold text-slate-800 text-sm">Khách hàng VIP tháng này</h3>
            </div>
            <button onClick={() => navigate("/leaderboard")} className="text-blue-600 text-xs font-medium hover:text-blue-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-2">
            {top3.map((entry: any, idx: number) => {
              const color = rankColors[idx];
              return (
                <div key={entry.rank} className={`flex-1 ${color.bg} rounded-xl p-3 text-center`}>
                  <div className="text-lg mb-1">{color.icon}</div>
                  <p className={`font-semibold text-xs ${color.text} truncate`}>{entry.name}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{entry.orderCount} đơn</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [selectedParentCat, setSelectedParentCat] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("bannerDismissed") === "1"; } catch { return false; }
  });
  const catScrollRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: activeSales = [] } = trpc.flashSale.getActive.useQuery(undefined, { staleTime: 60_000 });
  const { data: productsRaw } = trpc.products.listPublic.useQuery(undefined, { staleTime: 60_000, retry: false });
  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });
  const { data: bannersData = [] } = trpc.banner.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const { isEnabled } = useFeatureFlags();

  const description = (publicInfo as any)?.description || (publicInfo as any)?.companyDescription;
  const companyName = publicInfo?.companyName || "ShopKey";

  const products: any[] = Array.isArray(productsRaw) ? productsRaw : (productsRaw as any)?.items ?? [];
  const categories: any[] = (categoriesData as any) ?? [];

  const navigate = (href: string) => { setLocation(href); };

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

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { sessionStorage.setItem("bannerDismissed", "1"); } catch {}
  };

  const scrollCats = (dir: "left" | "right") => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  // Auto-advance banner
  useEffect(() => {
    if ((bannersData as any[]).length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % (bannersData as any[]).length);
    }, 4000);
    return () => clearInterval(timer);
  }, [(bannersData as any[]).length]);

  // Product card component
  const ProductCard = ({ product }: { product: any }) => {
    const sale = saleMap.get(product.id) as any;
    const pkgPrices = (product.packages || []).map((p: any) => parseFloat(p.price));
    const minPkgPrice = pkgPrices.length > 0 ? Math.min(...pkgPrices) : null;
    const maxPkgPrice = pkgPrices.length > 0 ? Math.max(...pkgPrices) : null;
    const hasMultiPkg = pkgPrices.length > 1;
    const productTags = (product.tags || []) as any[];
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
          {/* Hiển thị tag sản phẩm (tối đa 2 tag) */}
          {productTags.length > 0 && (
            <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
              {productTags.slice(0, 2).map((tag: any) => (
                <div
                  key={tag.id}
                  className="bg-white/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm font-medium"
                  style={{ color: tag.color || "#3b82f6" }}
                >
                  {tag.icon ? (tag.icon.startsWith("fa-") ? <i className={`${tag.icon} text-[10px]`} /> : <span className="text-[10px]">{tag.icon}</span>) : null}
                  {tag.name}
                </div>
              ))}
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
    <div className="min-h-screen bg-gray-50 text-slate-800 flex flex-col">
      {/* ===== HEADER ===== */}
      <ClientHeader />
      {/* ===== ANNOUNCEMENT POPUP ===== */}
      <AnnouncementBanner />
      <div className="pt-14 flex-1">
        {/* ===== IMAGE BANNER CAROUSEL ===== */}
        {(bannersData as any[]).length > 0 && (
          <div className="mx-4 mt-3 mb-2 relative overflow-hidden rounded-2xl" style={{maxWidth: "100%"}}>
            <div className="max-w-7xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden" style={{height: "180px"}}>
                {(bannersData as any[]).map((banner: any, idx: number) => (
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
                {(bannersData as any[]).length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {(bannersData as any[]).map((_: any, idx: number) => (
                      <button key={idx} onClick={() => setCurrentBannerIdx(idx)}
                        className={"w-2 h-2 rounded-full transition-all " + (idx === currentBannerIdx ? "bg-white w-4" : "bg-white/50")} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== ANNOUNCEMENT INLINE CARDS ===== */}
        <AnnouncementInline />

        {/* ===== FLASH SALE BANNER ===== */}
        {isEnabled("flash_sale") && (activeSales as any[]).length > 0 && (
          <div className="mx-4 mt-2 mb-2">
            <button onClick={() => navigate("/flash-sale")}
              className="w-full max-w-7xl mx-auto block bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl py-3 px-5 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity text-white">
              <Flame className="h-5 w-5 animate-bounce text-yellow-200" />
              <span className="font-bold text-sm">FLASH SALE — {(activeSales as any[]).length} sản phẩm giảm giá!</span>
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
          const allChildCats = categories.filter((c: any) => !!c.parentId);
          const displayCats = selectedParentCat ? getChildCats(selectedParentCat) : allChildCats;
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

        {/* ===== FILTERED BY CATEGORY ===== */}
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

        {/* ===== ALL PRODUCTS (when no filter, no featured) ===== */}
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

        {/* Leaderboard mini section ẩn khỏi trang chính */}



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
      <ClientFooter />
    </div>
  );
}
