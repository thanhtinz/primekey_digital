import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, ShoppingBag, Shield, X, Plus, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export default function ProductCompare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialIds = (params.get("ids") || "").split(",").filter(Boolean).map(Number).slice(0, 3);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: allProducts = [] } = trpc.products.list.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);

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

  const availableToAdd = (allProducts as any[]).filter(p => !selectedIds.includes(p.id));

  const compareFields = [
    { key: "price", label: "Giá bán", render: (p: any) => <span className="text-blue-600 font-bold">{formatVND(Number(p.price))}</span> },
    { key: "warrantyMonths", label: "Bảo hành", render: (p: any) => p.warrantyMonths > 0 ? <span className="text-green-600 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{p.warrantyMonths} tháng</span> : <span className="text-slate-400">Không có</span> },
    { key: "category", label: "Danh mục", render: (p: any) => <span className="text-slate-600">{p.category || "—"}</span> },
    { key: "description", label: "Mô tả", render: (p: any) => <span className="text-slate-500 text-sm">{p.description || "—"}</span> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ClientHeader maxWidth="max-w-7xl" backHref="/products" backLabel="Catalog" />

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
                    <p className="text-blue-600 font-bold mt-1">{formatVND(Number(product.price))}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Thêm sản phẩm</p>
                    {availableToAdd.length > 0 && (
                      <select onChange={e => addProduct(Number(e.target.value))} defaultValue="" className="mt-2 bg-white border border-slate-200 rounded text-slate-600 text-xs px-2 py-1 focus:outline-none focus:border-blue-500">
                        <option value="" disabled>Chọn sản phẩm...</option>
                        {availableToAdd.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
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
