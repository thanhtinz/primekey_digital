import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { Search, Zap, Package, Grid3X3, List, SlidersHorizontal, ChevronDown, Shield } from "lucide-react";

const formatVND = (val: string | number | null | undefined) => {
  if (!val) return "0 ₫";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

const getDiscountPercent = (price: string | number, originalPrice: string | number | null | undefined) => {
  if (!originalPrice) return 0;
  const p = typeof price === "string" ? parseFloat(price) : price;
  const op = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  if (op <= p) return 0;
  return Math.round((1 - p / op) * 100);
};

type SortOption = "default" | "price_asc" | "price_desc" | "newest" | "name_az";

export default function ProductCatalog() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSort, setShowSort] = useState(false);

  const { data: products = [], isLoading } = trpc.products.listPublic.useQuery(undefined);

  // Lấy danh sách categories duy nhất
  const categories = useMemo(() => {
    const cats = new Set<string>();
    (products as any[]).forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...(products as any[])];
    if (selectedCategory !== "all") list = list.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "price_asc": list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case "price_desc": list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case "newest": list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "name_az": list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [products, selectedCategory, search, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    default: "Mặc định",
    price_asc: "Giá tăng dần",
    price_desc: "Giá giảm dần",
    newest: "Mới nhất",
    name_az: "Tên A-Z",
  };

  const getMinPrice = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      const prices = product.packages.map((pkg: any) => parseFloat(pkg.price));
      return Math.min(...prices);
    }
    return parseFloat(product.price);
  };

  const getMaxPrice = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      const prices = product.packages.map((pkg: any) => parseFloat(pkg.price));
      return Math.max(...prices);
    }
    return parseFloat(product.price);
  };

  const getMaxDiscount = (product: any) => {
    if (product.packages && product.packages.length > 0) {
      return Math.max(...product.packages.map((pkg: any) => getDiscountPercent(pkg.price, pkg.originalPrice)));
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader backHref="/" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
          <button onClick={() => setLocation("/")} className="hover:text-blue-600 transition-colors">Trang chủ</button>
          <span>›</span>
          <span className="text-gray-800 font-medium">Sản phẩm</span>
        </nav>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tất cả sản phẩm</h1>
          <p className="text-gray-500 text-sm">Khám phá bộ sưu tập sản phẩm chất lượng cao được chọn lọc dành riêng cho bạn</p>
        </div>

        {/* Search bar */}
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

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white border-transparent shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white border-transparent shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              <Package className="w-4 h-4" />
              {cat}
            </button>
          ))}
        </div>

        {/* Toolbar: count + sort + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{filtered.length}</span> sản phẩm
          </p>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {sortLabels[sortBy]}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 overflow-hidden">
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sortBy === key ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* View mode */}
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products grid/list */}
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
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-400 text-sm">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product: any) => {
              const minPrice = getMinPrice(product);
              const maxPrice = getMaxPrice(product);
              const discount = getMaxDiscount(product);
              const hasMultiPrice = product.packages && product.packages.length > 1;

              return (
                <div
                  key={product.id}
                  onClick={() => setLocation(`/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200 group"
                >
                  {/* Product image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Discount badge */}
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                      </div>
                    )}
                    {/* Category badge */}
                    {product.category && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1.5 line-clamp-2 leading-snug">{product.name}</h3>
                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-red-500 font-bold text-sm">
                        {formatVND(minPrice)}{hasMultiPrice ? ` ~ ${formatVND(maxPrice)}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Zap className="w-3 h-3" />
                        Giao ngay
                      </div>
                      {product.warrantyMonths > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Shield className="w-3 h-3" /> BH {product.warrantyMonths}th
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view
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
                  {/* Image */}
                  <div className="relative w-24 h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-red-500 font-bold text-sm">
                        {formatVND(minPrice)}{hasMultiPrice ? ` ~ ${formatVND(maxPrice)}` : ""}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Zap className="w-3 h-3" />
                        Giao ngay
                      </div>
                    </div>
                    {product.packages && product.packages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.packages.slice(0, 3).map((pkg: any) => (
                          <span key={pkg.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                            {pkg.name}
                          </span>
                        ))}
                        {product.packages.length > 3 && (
                          <span className="text-xs text-gray-400">+{product.packages.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside to close sort dropdown */}
      {showSort && <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />}
    </div>
  );
}
