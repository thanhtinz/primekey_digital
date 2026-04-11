import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, Trash2, Loader2, Shield, Package, Settings2,
  ChevronUp, ChevronDown, Eye, EyeOff, Save, Wrench, Warehouse,
  DollarSign, Tag, AlertCircle, CheckCircle2, GripVertical
} from "@/components/Icon";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

interface PackageForm {
  id?: number;
  name: string;
  price: string;
  originalPrice: string;
  priceVip: string;
  priceWholesale: string;
  pricePartner: string;
  description: string;
  warrantyMonths: string;
  deliveryType: "manual" | "warehouse";
  sortOrder: string;
  isActive: boolean;
  _isNew?: boolean;
  _saving?: boolean;
}

const emptyPkg = (sortOrder = 0): PackageForm => ({
  name: "", price: "", originalPrice: "", priceVip: "", priceWholesale: "",
  pricePartner: "", description: "", warrantyMonths: "0",
  deliveryType: "manual", sortOrder: String(sortOrder), isActive: true, _isNew: true,
});

function formatPrice(val: string | number | null | undefined) {
  if (!val) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val));
}

// ─── Custom Fields Tab ──────────────────────────────────────────────────────
function CustomFieldsTab({ productId }: { productId: number }) {
  const { data: fields = [], refetch } = trpc.products.getCustomFields.useQuery({ productId });
  const createField = trpc.products.createCustomField.useMutation({ onSuccess: () => { toast.success("Đã thêm trường"); refetch(); } });
  const deleteField = trpc.products.deleteCustomField.useMutation({ onSuccess: () => { toast.success("Đã xóa trường"); refetch(); } });

  const [newField, setNewField] = useState({ fieldName: "", fieldValue: "", sortOrder: 0 });

  return (
    <div className="space-y-6">
      {/* Existing fields */}
      {(fields as any[]).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-500" /> Trường hiện có ({(fields as any[]).length})
          </h3>
          {(fields as any[]).map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{f.fieldName}</span>
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">Trường #{f.sortOrder || 0}</Badge>
                </div>
                {f.fieldValue && <p className="text-xs text-gray-400 mt-0.5">Giá trị mặc định: {f.fieldValue}</p>}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                onClick={() => deleteField.mutate({ id: f.id })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new field */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm trường mới
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Tên trường *</Label>
            <Input value={newField.fieldName} onChange={e => setNewField(p => ({ ...p, fieldName: e.target.value }))}
              className="mt-1 h-8 text-sm" placeholder="VD: Tên tài khoản, Mật khẩu..." />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Giá trị mặc định</Label>
            <Input value={newField.fieldValue} onChange={e => setNewField(p => ({ ...p, fieldValue: e.target.value }))}
              className="mt-1 h-8 text-sm" placeholder="Để trống nếu không có" />
          </div>
        </div>
        <Button size="sm" onClick={() => {
          if (!newField.fieldName.trim()) { toast.error("Nhập tên trường"); return; }
          createField.mutate({ productId, fieldName: newField.fieldName, fieldValue: newField.fieldValue || undefined, sortOrder: newField.sortOrder });
          setNewField({ fieldName: "", fieldValue: "", sortOrder: 0 });
        }} disabled={createField.isPending} className="bg-purple-600 hover:bg-purple-700">
          {createField.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Thêm Trường
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProductConfig() {
  const [, params] = useRoute("/products/:id/config");
  const [, navigate] = useLocation();
  const productId = params ? parseInt(params.id) : null;

  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const product = (products as any[]).find(p => p.id === productId);

  const [packages, setPackages] = useState<PackageForm[]>([]);
  const [activeTab, setActiveTab] = useState<"packages" | "inventory" | "customFields">("packages");
  const [inventoryType, setInventoryType] = useState<"manual" | "warehouse">("manual");

  const utils = trpc.useUtils();

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("Đã lưu cấu hình kho hàng"); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createPkg = trpc.products.createPackage.useMutation({
    onSuccess: () => { toast.success("Đã thêm gói"); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const updatePkg = trpc.products.updatePackage.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật gói"); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deletePkg = trpc.products.deletePackage.useMutation({
    onSuccess: () => { toast.success("Đã xóa gói"); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Load product data
  useEffect(() => {
    if (product) {
      setInventoryType((product as any).inventoryType || "manual");
      const pkgs = ((product as any).packages || []).map((p: any) => ({
        id: p.id,
        name: p.name || "",
        price: p.price || "",
        originalPrice: p.originalPrice || "",
        priceVip: p.priceVip || "",
        priceWholesale: p.priceWholesale || "",
        pricePartner: p.pricePartner || "",
        description: p.description || "",
        warrantyMonths: String(p.warrantyMonths ?? 0),
        deliveryType: ((p.deliveryType as string) === "warehouse" ? "warehouse" : "manual") as "manual" | "warehouse",
        sortOrder: String(p.sortOrder ?? 0),
        isActive: p.isActive !== false,
      }));
      setPackages(pkgs);
    }
  }, [product?.id]);

  const handleSaveInventory = () => {
    if (!productId) return;
    updateProduct.mutate({ id: productId, inventoryType });
  };

  const handleSavePackage = async (pkg: PackageForm, idx: number) => {
    if (!productId) return;
    if (!pkg.name.trim()) { toast.error("Nhập tên gói"); return; }
    if (!pkg.price || isNaN(Number(pkg.price))) { toast.error("Nhập giá hợp lệ"); return; }

    setPackages(prev => prev.map((p, i) => i === idx ? { ...p, _saving: true } : p));

    try {
      const payload = {
        name: pkg.name,
        price: Number(pkg.price),
        originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : undefined,
        priceVip: pkg.priceVip ? Number(pkg.priceVip) : undefined,
        priceWholesale: pkg.priceWholesale ? Number(pkg.priceWholesale) : undefined,
        pricePartner: pkg.pricePartner ? Number(pkg.pricePartner) : undefined,
        description: pkg.description || undefined,
        warrantyMonths: Number(pkg.warrantyMonths) || 0,
        deliveryType: pkg.deliveryType,
        sortOrder: Number(pkg.sortOrder) || 0,
        isActive: pkg.isActive,
      };

      if (pkg.id) {
        await updatePkg.mutateAsync({ id: pkg.id, ...payload });
      } else {
        await createPkg.mutateAsync({ productId, ...payload });
      }
      utils.products.list.invalidate();
    } finally {
      setPackages(prev => prev.map((p, i) => i === idx ? { ...p, _saving: false, _isNew: false } : p));
    }
  };

  const handleDeletePackage = async (pkg: PackageForm, idx: number) => {
    if (pkg.id) {
      await deletePkg.mutateAsync({ id: pkg.id });
    }
    setPackages(prev => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm</h2>
          <Button className="mt-4" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const TABS = [
    { id: "packages", label: "Gói Sản Phẩm", icon: <DollarSign className="h-4 w-4" />, count: packages.filter(p => p.id).length },
    { id: "inventory", label: "Kho Hàng", icon: <Warehouse className="h-4 w-4" /> },
    { id: "customFields", label: "Trường Tùy Chỉnh", icon: <Wrench className="h-4 w-4" /> },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Sản Phẩm
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {(product as any).imageUrl && (
              <img src={(product as any).imageUrl} alt={(product as any).name}
                className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{(product as any).name}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Settings2 className="h-3 w-3" /> Cấu hình sản phẩm
                {(product as any).categoryName && (
                  <span className="text-gray-400">· {(product as any).categoryName}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={(product as any).inventoryType === "warehouse" ? "default" : "secondary"} className="text-xs">
              {(product as any).inventoryType === "warehouse" ? "🏭 Kho tự động" : "✋ Thủ công"}
            </Badge>
            <Badge variant={packages.filter(p => p.id).length > 0 ? "default" : "outline"} className="text-xs">
              {packages.filter(p => p.id).length} gói
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-100">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                {tab.icon}
                {tab.label}
                {"count" in tab && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                  }`}>{tab.count}</span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Packages Tab ── */}
            {activeTab === "packages" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">Gói Sản Phẩm</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Thêm các gói với giá và bảo hành khác nhau. Khách hàng chọn gói khi mua.</p>
                  </div>
                  <Button size="sm" onClick={() => setPackages(prev => [...prev, emptyPkg(prev.length)])}
                    className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                    <Plus className="h-4 w-4" /> Thêm Gói
                  </Button>
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Chưa có gói nào</p>
                    <p className="text-sm text-gray-400 mt-1">Thêm gói để khách hàng có thể lựa chọn</p>
                    <Button size="sm" variant="outline" className="mt-4 gap-1.5"
                      onClick={() => setPackages([emptyPkg(0)])}>
                      <Plus className="h-4 w-4" /> Thêm gói đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                      <div key={idx} className={`border rounded-2xl overflow-hidden transition-all ${
                        pkg._isNew ? "border-blue-300 bg-blue-50/30" : "border-gray-200 bg-white"
                      }`}>
                        {/* Package Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                          <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 text-sm">
                                {pkg.name || <span className="text-gray-400 italic">Gói chưa đặt tên</span>}
                              </span>
                              {pkg.price && (
                                <span className="text-red-500 font-bold text-sm">{formatPrice(pkg.price)}</span>
                              )}
                              {pkg.originalPrice && (
                                <span className="text-gray-400 line-through text-xs">{formatPrice(pkg.originalPrice)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pkg.id && <Badge variant="outline" className="text-xs py-0 px-1.5 text-green-600 border-green-200">Đã lưu</Badge>}
                              {pkg._isNew && <Badge variant="outline" className="text-xs py-0 px-1.5 text-blue-600 border-blue-200">Mới</Badge>}
                              {!pkg.isActive && <Badge variant="secondary" className="text-xs py-0 px-1.5">Ẩn</Badge>}
                              {Number(pkg.warrantyMonths) > 0 && (
                                <span className="text-xs text-blue-500 flex items-center gap-0.5">
                                  <Shield className="h-3 w-3" /> {pkg.warrantyMonths} tháng
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                              onClick={() => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, isActive: !p.isActive } : p))}
                              title={pkg.isActive ? "Ẩn gói" : "Hiện gói"}>
                              {pkg.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                              onClick={() => handleDeletePackage(pkg, idx)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Package Fields */}
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500">Tên gói *</Label>
                              <Input value={pkg.name}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="VD: 1 tháng, 1 năm..." />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Giá bán (₫) *</Label>
                              <Input type="number" value={pkg.price}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, price: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="150000" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Giá gốc (₫)</Label>
                              <Input type="number" value={pkg.originalPrice}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, originalPrice: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="200000" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1">
                                <Shield className="h-3 w-3 text-blue-500" /> Bảo hành (tháng)
                              </Label>
                              <Input type="number" min="0" value={pkg.warrantyMonths}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, warrantyMonths: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="0" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Thứ tự</Label>
                              <Input type="number" min="0" value={pkg.sortOrder}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, sortOrder: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="0" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Mô tả gói</Label>
                              <Input value={pkg.description}
                                onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))}
                                className="mt-1 h-8 text-sm" placeholder="Mô tả ngắn..." />
                            </div>
                            <div className="col-span-full">
                              <Label className="text-xs text-gray-500 mb-1.5 block">Loại giao hàng</Label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, deliveryType: "manual" } : p))}
                                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all ${
                                    pkg.deliveryType !== "warehouse"
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-border hover:border-blue-300 text-muted-foreground"
                                  }`}
                                >
                                  <Wrench className="h-4 w-4 flex-shrink-0" />
                                  <div className="text-left">
                                    <p className="font-medium text-xs">Thủ công</p>
                                    <p className="text-[10px] opacity-70">Admin giao tay</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, deliveryType: "warehouse" } : p))}
                                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all ${
                                    pkg.deliveryType === "warehouse"
                                      ? "border-green-500 bg-green-50 text-green-700"
                                      : "border-border hover:border-green-300 text-muted-foreground"
                                  }`}
                                >
                                  <Warehouse className="h-4 w-4 flex-shrink-0" />
                                  <div className="text-left">
                                    <p className="font-medium text-xs">Kho tự động</p>
                                    <p className="text-[10px] opacity-70">Lấy từ kho</p>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Tier Pricing */}
                          <div className="border border-dashed border-purple-200 rounded-xl p-3 bg-purple-50/30">
                            <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1.5">
                              <Tag className="h-3 w-3" /> Giá theo quyền hạn (tùy chọn)
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-gray-500">Giá VIP (₫)</Label>
                                <Input type="number" value={pkg.priceVip}
                                  onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, priceVip: e.target.value } : p))}
                                  className="mt-1 h-7 text-xs" placeholder="VIP" />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Đại Lý (₫)</Label>
                                <Input type="number" value={pkg.priceWholesale}
                                  onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, priceWholesale: e.target.value } : p))}
                                  className="mt-1 h-7 text-xs" placeholder="Wholesale" />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Đối Tác (₫)</Label>
                                <Input type="number" value={pkg.pricePartner}
                                  onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, pricePartner: e.target.value } : p))}
                                  className="mt-1 h-7 text-xs" placeholder="Partner" />
                              </div>
                            </div>
                          </div>

                          {/* Save button */}
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSavePackage(pkg, idx)}
                              disabled={pkg._saving || createPkg.isPending || updatePkg.isPending}
                              className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                              {pkg._saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              {pkg.id ? "Cập nhật gói" : "Lưu gói mới"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Inventory Tab ── */}
            {activeTab === "inventory" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Loại Kho Hàng</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Chọn cách hệ thống xử lý đơn hàng sau khi thanh toán.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manual */}
                  <button type="button" onClick={() => setInventoryType("manual")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      inventoryType === "manual"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${inventoryType === "manual" ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Wrench className={`h-5 w-5 ${inventoryType === "manual" ? "text-blue-600" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Thủ Công</div>
                        <div className="text-sm text-gray-500 mt-1">Admin giao hàng thủ công sau khi khách thanh toán. Phù hợp với dịch vụ hoặc sản phẩm số cần xử lý riêng.</div>
                        {inventoryType === "manual" && (
                          <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đang chọn
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Warehouse */}
                  <button type="button" onClick={() => setInventoryType("warehouse")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      inventoryType === "warehouse"
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${inventoryType === "warehouse" ? "bg-green-100" : "bg-gray-100"}`}>
                        <Warehouse className={`h-5 w-5 ${inventoryType === "warehouse" ? "text-green-600" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Kho Hàng Tự Động</div>
                        <div className="text-sm text-gray-500 mt-1">Hệ thống tự động lấy hàng từ kho và giao cho khách. Phù hợp với key, tài khoản, hoặc sản phẩm số có sẵn.</div>
                        {inventoryType === "warehouse" && (
                          <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đang chọn
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {inventoryType === "warehouse" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                    <p className="font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Kho hàng tự động đang được chọn
                    </p>
                    <p className="mt-1 text-green-600">Vào <strong>Quản Lý Kho</strong> trong menu để nhập hàng vào kho cho sản phẩm này.</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveInventory} disabled={updateProduct.isPending}
                    className="bg-green-600 hover:bg-green-700 gap-1.5">
                    {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu Cấu Hình Kho
                  </Button>
                  <span className="text-sm text-gray-400">
                    Hiện tại: <strong className="text-gray-600">
                      {(product as any).inventoryType === "warehouse" ? "Kho tự động" : "Thủ công"}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* ── Custom Fields Tab ── */}
            {activeTab === "customFields" && productId && (
              <CustomFieldsTab productId={productId} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
