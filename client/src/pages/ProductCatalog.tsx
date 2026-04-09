import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import {
  Search, Package, Grid3X3, List, Shield, Star,
  Home, ChevronRight, ShoppingBag, Filter, RotateCcw, Zap
} from "lucide-react";

const formatVND = (val: string | number | null | undefined) => {
  if (!val) return "0 ₫";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
};

type SortOption = "default" | "price_asc" | "price_desc" | "newest" | "name_az";

export default function ProductCatalog() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const initialCatId = params.get("category") ? Number(params.get("category")) : null;
  const initialQ = params.get("q") || "";

  const [search, setSearch] = useState(initialQ);
  const [selectedParentCat, setSelectedParentCat] = useState<number | null>(null);
  const [selectedChildCat, setSelectedChildCat] = useState<number | null>(initialCatId);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const { data: productsRaw = [], isLoading } = trpc.products.listPublic.useQuery(undefined);
  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });
  const productIds = useMemo(() => (Array.isArray(productsRaw) ? productsRaw : []).map((p: any) => p.id), [productsRaw]);
  const { data: tagMappings = [] } = trpc.productTags.getForProducts.useQuery(
    { productIds },
    { enabled: productIds.length > 0, staleTime: 60_000 }
  );

  const products: any[] = Array.isArray(productsRaw) ? productsRaw : (productsRaw as any)?.items ?? [];
  const categories: any[] = (categoriesData as any) ?? [];

  const parentCats = categories.filter((c: any) => !c.parentId);
  const getChildCats = (pid: number) => categories.filter((c: any) => c.parentId === pid);

  // Auto-select parent when child is pre-selected from URL
  useEffect(() => {
    if (initialCatId && categories.length > 0) {
      const cat = categories.find((c: any) => c.id === initialCatId);
      if (cat) {
        if (cat.parentId) {
          setSelectedParentCat(cat.parentId);
          setSelectedChildCat(cat.id);
        } else {
          setSelectedParentCat(cat.id);
          setSelectedChildCat(null);
        }
        setFiltersApplied(true);
      }
    }
  }, [initialCatId, categories.length]);

  const getMinPrice = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      return Math.min(...product.packages.map((pkg: any) => parseFloat(pkg.price)));
    }
    return parseFloat(product.price) || 0;
  };

  const getMaxPrice = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      return Math.max(...product.packages.map((pkg: any) => parseFloat(pkg.price)));
    }
    return parseFloat(product.price) || 0;
  };

  const getMaxDiscount = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      return Math.max(...product.packages.map((pkg: any) => {
        const p = parseFloat(pkg.price);
        const op = parseFloat(pkg.originalPrice);
        if (!op || op <= p) return 0;
        return Math.round((1 - p / op) * 100);
      }));
    }
    return 0;
  };

  // Apply filters
  const filtered = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedParentCat) {
      if (selectedChildCat) {
        list = list.filter(p => p.categoryId === selectedChildCat);
      } else {
        const childIds = getChildCats(selectedParentCat).map((c: any) => c.id);
        list = list.filter(p => p.categoryId === selectedParentCat || childIds.includes(p.categoryId));
      }
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }

    // Price range
    if (filtersApplied) {
      if (priceFrom) {
        const min = parseFloat(priceFrom);
        list = list.filter(p => getMinPrice(p) >= min);
      }
      if (priceTo) {
        const max = parseFloat(priceTo);
        list = list.filter(p => getMinPrice(p) <= max);
      }
    }

    // Sort
    switch (sortBy) {
      case "price_asc": list.sort((a, b) => getMinPrice(a) - getMinPrice(b)); break;
      case "price_desc": list.sort((a, b) => getMinPrice(b) - getMinPrice(a)); break;
      case "newest": list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "name_az": list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [products, selectedParentCat, selectedChildCat, search, priceFrom, priceTo, sortBy, filtersApplied]);

  const sortLabels: Record<SortOption, string> = {
    default: "Mặc định",
    price_asc: "Giá tăng dần",
    price_desc: "Giá giảm dần",
    newest: "Mới nhất",
    name_az: "Tên A-Z",
  };

  const handleApplyFilter = () => setFiltersApplied(true);

  const handleResetFilter = () => {
    setSelectedParentCat(null);
    setSelectedChildCat(null);
    setPriceFrom("");
    setPriceTo("");
    setSortBy("default");
    setSearch("");
    setFiltersApplied(false);
  };

  const childCats = selectedParentCat ? getChildCats(selectedParentCat) : [];

  return (
    <div className="min-h-screen pt-14 bg-gray-50">
      <ClientHeader />

      {/* ===== BREADCRUMB ===== */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm">
          <button onClick={() => setLocation("/")} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </button>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-800 font-semibold">Sản phẩm</span>
        </nav>
      </div>

      {/* ===== HEADER GRADIENT ===== */}
      <div className="mx-4 mb-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-slate-700 via-slate-600 to-teal-600 rounded-2xl px-6 py-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="h-6 w-6" />
            <h1 className="text-2xl sm:text-3xl font-bold">Tất cả sản phẩm</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-base">
            Khám phá bộ sưu tập sản phẩm chất lượng cao được chọn lọc dành riêng cho bạn
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* ===== FILTER PANEL (compact) ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-5">
          {/* Row 1: Danh mục + Thể loại */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Danh mục</label>
              <select
                value={selectedParentCat ?? ""}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedParentCat(val);
                  setSelectedChildCat(null);
                }}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">Tất cả</option>
                {parentCats.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Thể loại</label>
              <select
                value={selectedChildCat ?? ""}
                onChange={e => setSelectedChildCat(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedParentCat || childCats.length === 0}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả</option>
                {childCats.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Mức giá + Sắp xếp */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Mức giá</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceFrom}
                  onChange={e => setPriceFrom(e.target.value)}
                  className="w-0 flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-300 text-xs flex-shrink-0">~</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceTo}
                  onChange={e => setPriceTo(e.target.value)}
                  className="w-0 flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Sắp xếp</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Filter className="h-3.5 w-3.5" /> Lọc
            </button>
            <button
              onClick={handleResetFilter}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-xs sm:text-sm transition-colors"
              title="Đặt lại"
            >
              <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* ===== TOOLBAR ===== */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{filtered.length}</span> sản phẩm
          </p>
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>


        {/* ===== PRODUCTS GRID ===== */}
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="bg-gray-200 aspect-[4/3]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-400 text-sm mb-4">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            <button onClick={handleResetFilter} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product: any) => {
              const minPrice = getMinPrice(product);
              const maxPrice = getMaxPrice(product);
              const discount = getMaxDiscount(product);
              const hasMultiPrice = product.packages && product.packages.length > 1;
              const maxWarranty = (product.packages || []).length > 0
                ? Math.max(...(product.packages || []).map((p: any) => p.warrantyMonths || 0))
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => setLocation(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</div>
                    )}
                    {product.categoryName && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {product.categoryName}
                      </div>
                    )}
                    {/* Product tags */}
                    {(() => {
                      const ptags = (tagMappings as any[]).filter((m: any) => m.productId === product.id).slice(0, 2);
                      return ptags.length > 0 ? (
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {ptags.map((m: any) => (
                            <span key={m.tag.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shadow" style={{ backgroundColor: m.tag.color || '#3b82f6' }}>{m.tag.name}</span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <div className="mb-1">
                      <span className="text-red-500 font-bold text-sm">
                        {formatVND(minPrice)}{hasMultiPrice ? ` ~ ${formatVND(maxPrice)}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                        <Zap className="w-3 h-3" /> Giao ngay
                      </span>
                      {(product.packages || []).length > 0 && (
                        <span className="text-gray-400">{(product.packages || []).length} gói</span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((product: any) => {
              const minPrice = getMinPrice(product);
              const maxPrice = getMaxPrice(product);
              const discount = getMaxDiscount(product);
              const hasMultiPrice = product.packages && product.packages.length > 1;

              return (
                <div
                  key={product.id}
                  onClick={() => setLocation(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200 flex gap-4 p-3"
                >
                  <div className="relative w-24 h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">-{discount}%</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                    {product.description && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-red-500 font-bold text-sm">
                        {formatVND(minPrice)}{hasMultiPrice ? ` ~ ${formatVND(maxPrice)}` : ""}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Zap className="w-3 h-3" /> Giao ngay
                      </div>
                    </div>
                    {product.packages && product.packages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.packages.slice(0, 3).map((pkg: any) => (
                          <span key={pkg.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{pkg.name}</span>
                        ))}
                        {product.packages.length > 3 && <span className="text-xs text-gray-400">+{product.packages.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ClientFooter />
    </div>
  );
}
