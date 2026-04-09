import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scale, ShoppingBag, Shield, X, Plus, CheckCircle2, XCircle, ArrowLeft, Search } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export default function ProductCompare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialIds = (params.get("ids") || "").split(",").filter(Boolean).map(Number).slice(0, 3);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: allProducts = [], isLoading: productsLoading } = trpc.products.listPublic.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState<number | null>(null); // which slot is adding

  const logo = publicInfo?.logoUrl;
  const siteName = publicInfo?.companyName || "Invoice Prime";

  const selectedProducts = useMemo(() => {
    return selectedIds.map(id => (allProducts as any[]).find(p => p.id === id)).filter(Boolean);
  }, [selectedIds, allProducts]);

  function removeProduct(id: number) {
    setSelectedIds(prev => prev.filter(x => x !== id));
  }

  function addProduct(id: number) {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
  }

  const availableToAdd = useMemo(() => {
    const filtered = (allProducts as any[]).filter(p => !selectedIds.includes(p.id) && p.isPublished !== false);
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter(p => p.name?.toLowerCase().includes(q));
  }, [allProducts, selectedIds, searchQuery]);

  const compareFields = [
    { key: "price", label: "Giá bán", render: (p: any) => <span className="text-blue-600 font-bold">{formatVND(Number(p.minPrice || p.price || 0))}</span> },
    { key: "warrantyMonths", label: "Bảo hành", render: (p: any) => p.warrantyMonths > 0 ? <span className="text-green-600 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{p.warrantyMonths} tháng</span> : <span className="text-slate-400">Không có</span> },
    { key: "category", label: "Danh mục", render: (p: any) => <span className="text-slate-600">{p.category || "—"}</span> },
    { key: "description", label: "Mô tả", render: (p: any) => <span className="text-slate-500 text-sm">{p.description || "—"}</span> },
  ];

  return (
    <div className="min-h-screen pt-20 bg-slate-50 text-slate-800">
      <ClientHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-blue-600 text-sm mb-4">
            <Scale className="w-4 h-4" /> So Sánh Sản Phẩm
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">So Sánh Chi Tiết</h1>
          <p className="text-slate-500">Chọn tối đa 3 sản phẩm để so sánh</p>
        </div>

        {/* Product slots */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map(idx => {
            const product = selectedProducts[idx];
            return (
              <div key={idx} className={`border rounded-xl p-4 min-h-[160px] flex flex-col items-center justify-center transition-all ${product ? "bg-white border-slate-200 shadow-sm" : "border-dashed border-slate-300 bg-slate-100/50"}`}>
                {product ? (
                  <div className="w-full text-center relative">
                    <button onClick={() => removeProduct(product.id)} className="absolute top-0 right-0 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    {product.imageUrl ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden mx-auto mb-2 bg-slate-100">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <ShoppingBag className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    <h3 className="text-slate-800 font-semibold text-sm">{product.name}</h3>
                    <p className="text-blue-600 font-bold mt-1">{formatVND(Number(product.minPrice || product.price || 0))}</p>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    {showAddPanel === idx ? (
                      <div className="w-full text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                              placeholder="Tìm sản phẩm..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="pl-8 h-8 text-xs"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => { setShowAddPanel(null); setSearchQuery(""); }} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {productsLoading ? (
                            <p className="text-xs text-slate-400 text-center py-4">Đang tải...</p>
                          ) : availableToAdd.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy sản phẩm</p>
                          ) : (
                            availableToAdd.slice(0, 20).map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => { addProduct(p.id); setShowAddPanel(null); setSearchQuery(""); }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors text-left"
                              >
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                                  <p className="text-[10px] text-blue-600">{formatVND(Number(p.minPrice || p.price || 0))}</p>
                                </div>
                                <Plus className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddPanel(idx)} className="flex flex-col items-center gap-2 w-full py-4 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="w-12 h-12 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center">
                          <Plus className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Thêm sản phẩm</p>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        {selectedProducts.length >= 2 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-slate-50">
              <div className="p-4 text-slate-500 text-sm font-medium border-r border-slate-200">Tiêu chí</div>
              {selectedProducts.map((p: any, i) => (
                <div key={i} className={`p-4 text-slate-800 text-sm font-semibold text-center ${i < selectedProducts.length - 1 ? "border-r border-slate-200" : ""}`}>{p.name}</div>
              ))}
              {selectedProducts.length < 3 && <div className="p-4" />}
            </div>
            {compareFields.map(field => (
              <div key={field.key} className="grid grid-cols-4 border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="p-4 text-slate-500 text-sm border-r border-slate-200">{field.label}</div>
                {selectedProducts.map((p: any, i) => (
                  <div key={i} className={`p-4 text-center flex items-center justify-center ${i < selectedProducts.length - 1 ? "border-r border-slate-200" : ""}`}>
                    {field.render(p)}
                  </div>
                ))}
                {selectedProducts.length < 3 && <div className="p-4" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-xl">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chọn ít nhất 2 sản phẩm để so sánh</p>
            <Link href="/products">
              <Button variant="outline" className="mt-4 border-slate-300 text-slate-600 hover:bg-slate-100">
                <ShoppingBag className="w-4 h-4 mr-2" /> Xem catalog sản phẩm
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
