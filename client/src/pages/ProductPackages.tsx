import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

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
  sortOrder: string;
  isActive: boolean;
  deliveryType: "manual" | "warehouse";
  minStockThreshold: string;
}

const emptyPkg = (sortOrder = 0): PackageForm => ({
  name: "", price: "", originalPrice: "", priceVip: "", priceWholesale: "",
  pricePartner: "", description: "", warrantyMonths: "0",
  sortOrder: String(sortOrder), isActive: true, deliveryType: "manual", minStockThreshold: "5",
});

export default function ProductPackages() {
  const [, params] = useRoute("/products/:id/packages");
  const [, navigate] = useLocation();
  const productId = params ? parseInt(params.id) : null;

  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const product = (products as any[]).find(p => p.id === productId);
  const utils = trpc.useUtils();

  const [pkgList, setPkgList] = useState<PackageForm[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyPkg());

  useEffect(() => {
    if (product) {
      const pkgs = ((product as any).packages || []).map((p: any) => ({
        id: p.id,
        name: p.name || "",
        price: String(p.price || ""),
        originalPrice: String(p.originalPrice || ""),
        priceVip: String(p.priceVip || ""),
        priceWholesale: String(p.priceWholesale || ""),
        pricePartner: String(p.pricePartner || ""),
        description: p.description || "",
        warrantyMonths: String(p.warrantyMonths ?? 0),
        sortOrder: String(p.sortOrder ?? 0),
        isActive: p.isActive !== false,
        deliveryType: (p.deliveryType === "warehouse" ? "warehouse" : "manual") as "manual" | "warehouse",
        minStockThreshold: String(p.minStockThreshold ?? 5),
      }));
      setPkgList(pkgs);
    }
  }, [product?.id, JSON.stringify((product as any)?.packages?.map((p: any) => p.id))]);

  // Fetch inventory counts for all warehouse packages
  const warehousePkgIds = pkgList.filter(p => (p as any).deliveryType === "warehouse" && p.id).map(p => p.id!);
  const { data: inventoryStats } = trpc.inventory.statsByPackages.useQuery(
    { packageIds: warehousePkgIds },
    { enabled: warehousePkgIds.length > 0, staleTime: 30_000 }
  );
  const getStockCount = (pkgId: number | undefined): number | null => {
    if (!pkgId || !inventoryStats) return null;
    const stat = (inventoryStats as any[]).find((s: any) => s.packageId === pkgId);
    return stat ? Number(stat.available) : 0;
  };

  const createPkg = trpc.products.createPackage.useMutation({
    onSuccess: () => { toast.success("Đã tạo gói!"); utils.products.list.invalidate(); setShowDialog(false); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updatePkg = trpc.products.updatePackage.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật gói!"); utils.products.list.invalidate(); setShowDialog(false); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deletePkg = trpc.products.deletePackage.useMutation({
    onSuccess: () => { toast.success("Đã xóa gói!"); utils.products.list.invalidate(); setDeleteConfirm(null); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyPkg(pkgList.length));
    setEditingIdx(null);
    setShowDialog(true);
  };

  const openEdit = (idx: number) => {
    setForm({ ...pkgList[idx] });
    setEditingIdx(idx);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!productId) return;
    if (!form.name.trim()) { toast.error("Vui lòng nhập tên gói"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { toast.error("Giá không hợp lệ"); return; }
    const payload = {
      name: form.name,
      price,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      priceVip: form.priceVip ? parseFloat(form.priceVip) : undefined,
      priceWholesale: form.priceWholesale ? parseFloat(form.priceWholesale) : undefined,
      pricePartner: form.pricePartner ? parseFloat(form.pricePartner) : undefined,
      description: form.description || undefined,
      warrantyMonths: parseInt(form.warrantyMonths) || 0,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive,
      deliveryType: form.deliveryType,
      minStockThreshold: parseInt(form.minStockThreshold) || 5,
    };
    const editingPkg = editingIdx !== null ? pkgList[editingIdx] : null;
    if (editingPkg?.id) {
      updatePkg.mutate({ id: editingPkg.id, ...payload });
    } else {
      createPkg.mutate({ productId, ...payload });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate("/products")} className="hover:text-blue-600 transition-colors">
            <i className="fa-solid fa-box mr-1" /> Sản Phẩm
          </button>
          <i className="fa-solid fa-chevron-right text-xs" />
          <button onClick={() => navigate("/products/" + productId + "/edit")} className="hover:text-blue-600 transition-colors truncate max-w-[200px]">
            {product?.name || "..."}
          </button>
          <i className="fa-solid fa-chevron-right text-xs" />
          <span className="text-gray-700 font-medium">Quản Lý Gói</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-blue-500" />
              Quản Lý Gói
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{product?.name} · {pkgList.length} gói</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/edit")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-pen" />
              <span className="hidden sm:inline">Thông tin</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/fields")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-sliders" />
              <span className="hidden sm:inline">Trường</span>
            </Button>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8">
              <i className="fa-solid fa-plus" /> Thêm gói
            </Button>
          </div>
        </div>

        {pkgList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <i className="fa-solid fa-layer-group text-gray-300 text-5xl mb-4 block" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Chưa có gói nào</h3>
            <p className="text-sm text-gray-400 mb-4">Tạo gói để khách hàng có thể chọn và mua sản phẩm</p>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <i className="fa-solid fa-plus" /> Tạo gói đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pkgList.map((pkg, idx) => (
              <div key={pkg.id ?? idx} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-100 flex items-center justify-center">
                    <i className="fa-solid fa-cube text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{pkg.name}</h3>
                      {!pkg.isActive && <Badge variant="secondary" className="text-xs">Ẩn</Badge>}
                      {(pkg as any).deliveryType === "warehouse" && (
                        <Badge className="text-xs bg-green-100 text-green-600 border-green-200">Kho tự động</Badge>
                      )}
                      {(pkg as any).deliveryType === "warehouse" && pkg.id && (() => {
                        const cnt = getStockCount(pkg.id);
                        if (cnt === null) return null;
                        return (
                          <Badge className={`text-xs ${cnt > 0 ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                            {cnt > 0 ? `${cnt} còn hàng` : "Hết hàng"}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">{formatCurrency(parseFloat(pkg.price) || 0)}</span>
                      {pkg.originalPrice && parseFloat(pkg.originalPrice) > 0 && (
                        <span className="text-gray-400 line-through text-xs">{formatCurrency(parseFloat(pkg.originalPrice))}</span>
                      )}
                      {pkg.warrantyMonths && parseInt(pkg.warrantyMonths) > 0 && (
                        <span className="text-xs text-gray-500">
                          <i className="fa-solid fa-shield-halved mr-1 text-green-500" />
                          BH {pkg.warrantyMonths} tháng
                        </span>
                      )}
                    </div>
                    {pkg.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{pkg.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(idx)} className="h-8 w-8 p-0">
                      <i className="fa-solid fa-pen text-xs" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => pkg.id !== undefined && setDeleteConfirm(pkg.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:border-red-300">
                      <i className="fa-solid fa-trash-can text-xs" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/products")}>
            <i className="fa-solid fa-arrow-left mr-2" /> Quay lại
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className={"fa-solid " + (editingIdx !== null ? "fa-pen" : "fa-plus") + " text-blue-500"} />
              {editingIdx !== null ? "Chỉnh Sửa Gói" : "Tạo Gói Mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-sm">Tên Gói <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Gói Cơ Bản, Gói Premium..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Giá Bán (VND) <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Giá Gốc (VND)</Label>
                <Input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="Để trống nếu không có" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Giá VIP</Label>
                <Input type="number" value={form.priceVip} onChange={e => setForm(f => ({ ...f, priceVip: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Giá Sỉ</Label>
                <Input type="number" value={form.priceWholesale} onChange={e => setForm(f => ({ ...f, priceWholesale: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Giá Đối Tác</Label>
                <Input type="number" value={form.pricePartner} onChange={e => setForm(f => ({ ...f, pricePartner: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Bảo Hành (tháng)</Label>
                <Input type="number" value={form.warrantyMonths} onChange={e => setForm(f => ({ ...f, warrantyMonths: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Thứ Tự Hiển Thị</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Mô Tả Gói</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về gói này..." rows={2} className="mt-1 resize-none" />
            </div>
            {form.deliveryType === "warehouse" && (
              <div>
                <Label className="text-sm">Ngưỡng Cảnh Báo Kho Thấp</Label>
                <Input type="number" min="0" value={form.minStockThreshold} onChange={e => setForm(f => ({ ...f, minStockThreshold: e.target.value }))} placeholder="5" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Thông báo admin khi tồn kho ≤ ngưỡng này</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Loại Giao Hàng</Label>
              <div className="flex gap-2 mt-1.5">
                <button type="button" onClick={() => setForm(f => ({ ...f, deliveryType: "manual" }))}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${form.deliveryType === "manual" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <div className="font-semibold">Thủ Công</div>
                  <div className="text-xs opacity-70 mt-0.5">Admin giao tay sau khi mua</div>
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, deliveryType: "warehouse" }))}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${form.deliveryType === "warehouse" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <div className="font-semibold">Kho Tự Động</div>
                  <div className="text-xs opacity-70 mt-0.5">Hệ thống lấy từ kho hàng</div>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (form.isActive ? "bg-blue-600" : "bg-gray-300")}>
                <span className={"inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform " + (form.isActive ? "translate-x-4" : "translate-x-1")} />
              </button>
              <Label className="text-sm cursor-pointer" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                {form.isActive ? "Hiển thị gói này" : "Ẩn gói này"}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createPkg.isPending || updatePkg.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {(createPkg.isPending || updatePkg.isPending) ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
              {editingIdx !== null ? "Lưu thay đổi" : "Tạo gói"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <i className="fa-solid fa-triangle-exclamation" /> Xác Nhận Xóa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">Bạn có chắc muốn xóa gói này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button onClick={() => deleteConfirm !== null && deletePkg.mutate({ id: deleteConfirm })}
              disabled={deletePkg.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deletePkg.isPending ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
              Xóa gói
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
