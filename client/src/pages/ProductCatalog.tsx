import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, Scale, Shield, Star, ChevronRight, Flame } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export default function ProductCatalog() {
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: flashSales = [] } = trpc.flashSale.getActive.useQuery();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc">("name");
  const [compareList, setCompareList] = useState<number[]>([]);

  const flashSaleMap = useMemo(() => {
    const map = new Map<number, { discountPercent: number; salePrice: number }>();
    flashSales.forEach((fs: any) => {
      if (fs.productId) {
        const salePrice = Number(fs.originalPrice) * (1 - Number(fs.discountPercent) / 100);
        map.set(fs.productId, { discountPercent: Number(fs.discountPercent), salePrice });
      }
    });
    return map;
  }, [flashSales]);

  const filtered = useMemo(() => {
    let list = [...products] as any[];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== "all") list = list.filter(p => p.category === selectedCategory || String(p.categoryId) === selectedCategory);
    if (sortBy === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, selectedCategory, sortBy]);

  function toggleCompare(id: number) {
    setCompareList(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }

  const logo = publicInfo?.logoUrl;
  const siteName = publicInfo?.companyName || "Invoice Prime";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ClientHeader
        maxWidth="max-w-7xl"
        rightSlot={
          <div className="flex items-center gap-3">
            <Link href="/compare" className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors">
              <Scale className="w-3.5 h-3.5" /> So sánh {compareList.length > 0 && <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0">{compareList.length}</Badge>}
            </Link>
            <Link href="/track" className="text-slate-500 hover:text-slate-800 text-xs transition-colors">Tra cứu đơn</Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-blue-600 text-sm mb-4">
            <ShoppingBag className="w-4 h-4" /> Danh Mục Sản Phẩm
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">Tất Cả Sản Phẩm</h1>
          <p className="text-slate-500">Khám phá {products.length} sản phẩm chất lượng</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm sản phẩm..." className="pl-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-500 focus:border-blue-500" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-white border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-500">
            <option value="name">Tên A-Z</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setSelectedCategory("all")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}>
              Tất cả
            </button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setSelectedCategory(String(cat.id))} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === String(cat.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-64 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product: any) => {
              const sale = flashSaleMap.get(product.id);
              const isComparing = compareList.includes(product.id);
              return (
                <div key={product.id} className={`bg-white border rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group ${isComparing ? "border-blue-500" : "border-slate-200"}`}>
                  {/* Badge */}
                  {sale && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> FLASH SALE -{sale.discountPercent}%
                    </div>
                  )}
                  {/* Content */}
                  <div className="p-4">
                    {product.imageUrl ? (
                      <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-slate-100">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-3">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <h3 className="text-slate-800 font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    {product.description && <p className="text-slate-500 text-xs line-clamp-2 mb-3">{product.description}</p>}
                    <div className="mt-auto">
                      {sale ? (
                        <div>
                          <span className="text-slate-500 text-xs line-through">{formatVND(Number(product.price))}</span>
                          <p className="text-orange-500 font-bold text-base">{formatVND(sale.salePrice)}</p>
                        </div>
                      ) : (
                        <p className="text-blue-600 font-bold text-base">{formatVND(Number(product.price))}</p>
                      )}
                      {product.warrantyMonths > 0 && (
                        <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                          <Shield className="w-3 h-3" /> BH {product.warrantyMonths} tháng
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => toggleCompare(product.id)} className={`flex-1 text-xs h-7 border-slate-300 ${isComparing ? "bg-blue-50 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        <Scale className="w-3 h-3 mr-1" /> {isComparing ? "Bỏ so sánh" : "So sánh"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compare bar */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-blue-500/50 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-lg z-50">
            <span className="text-slate-800 text-sm font-medium">Đã chọn {compareList.length}/3 sản phẩm</span>
            <Link href={`/compare?ids=${compareList.join(",")}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                So Sánh <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <button onClick={() => setCompareList([])} className="text-slate-500 hover:text-slate-800 text-xs">Xóa</button>
          </div>
        )}
      </div>
    </div>
  );
}
