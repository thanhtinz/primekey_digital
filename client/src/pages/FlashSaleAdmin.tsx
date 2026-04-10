import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, Trash2, Loader2, Clock, Tag, Edit, Bell, Mail, Users, CheckCircle2, Search, Settings, List } from "@/components/Icon";

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")} ₫`;
}
function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FlashSaleAdmin() {
  const [tab, setTab] = useState<"sales" | "subscribers">("sales");
  const utils = trpc.useUtils();

  // ── Flash Sales ──
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("0");
  const [description, setDescription] = useState("");

  const { data: flashSales = [], isLoading } = trpc.flashSale.list.useQuery(undefined, { staleTime: 10_000 });
  const { data: products = [] } = trpc.products.list.useQuery(undefined, { staleTime: 60_000 });
  const createMutation = trpc.flashSale.create.useMutation({
    onSuccess: () => { toast.success("Tạo Flash Sale thành công"); utils.flashSale.list.invalidate(); setShowCreate(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.flashSale.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); utils.flashSale.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.flashSale.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); utils.flashSale.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const resetForm = () => { setSelectedProduct(""); setSalePrice(""); setDiscountPercent(""); setStartTime(""); setEndTime(""); setMaxQuantity("0"); setDescription(""); };
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id.toString() === productId);
    if (product && discountPercent) {
      const disc = parseInt(discountPercent);
      const price = parseFloat(product.price || "0");
      setSalePrice(Math.round(price * (1 - disc / 100)).toString());
    }
  };
  const handleDiscountChange = (val: string) => {
    setDiscountPercent(val);
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product && val) {
      const disc = parseInt(val);
      const price = parseFloat(product.price || "0");
      setSalePrice(Math.round(price * (1 - disc / 100)).toString());
    }
  };
  const handleCreate = () => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product || !salePrice || !startTime || !endTime || !discountPercent) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    createMutation.mutate({ productId: product.id, productName: product.name, originalPrice: product.price || "0", salePrice, discountPercent: parseInt(discountPercent), startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), maxQuantity: parseInt(maxQuantity) || 0, description });
  };
  const toggleActive = (sale: any) => updateMutation.mutate({ id: sale.id, isActive: !sale.isActive });

  const now = new Date();
  const activeSales = (flashSales as any[]).filter(s => s.isActive && new Date(s.endTime) > now);
  const expiredSales = (flashSales as any[]).filter(s => !s.isActive || new Date(s.endTime) <= now);

  // ── Subscribers ──
  const { data: subscribers = [] } = trpc.flashSaleSubscriber.list.useQuery();
  const deleteSubMutation = trpc.flashSaleSubscriber.delete.useMutation({
    onSuccess: () => { utils.flashSaleSubscriber.list.invalidate(); toast.success("Đã xóa"); },
    onError: (e) => toast.error(e.message),
  });
  const [search, setSearch] = useState("");
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });
  const filtered = (subscribers as any[]).filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: "sales", label: "Flash Sale", icon: Zap },
    { id: "subscribers", label: "Đăng Ký Thông Báo", icon: Bell },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-500" /> Flash Sale
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý chương trình Flash Sale và danh sách đăng ký thông báo</p>
          </div>
          {tab === "sales" && (
            <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 gap-1.5">
              <Plus className="h-4 w-4" /> Tạo Flash Sale
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Đang hoạt động", value: activeSales.length, color: "text-green-600" },
            { label: "Đã kết thúc", value: expiredSales.length, color: "text-gray-500" },
            { label: "Tổng đăng ký", value: (subscribers as any[]).length, color: "text-blue-600" },
            { label: "Đã xác nhận", value: (subscribers as any[]).filter((s: any) => s.isConfirmed).length, color: "text-purple-600" },
          ].map(k => (
            <Card key={k.label} className="border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flash Sales Tab */}
        {tab === "sales" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-400 py-8 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải...</div>
            ) : (flashSales as any[]).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có Flash Sale nào. Tạo ngay!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(flashSales as any[]).map((sale: any) => {
                  const isActive = sale.isActive && new Date(sale.endTime) > now;
                  return (
                    <Card key={sale.id} className="border border-gray-100 shadow-sm overflow-hidden">
                      <div className={`h-1 ${isActive ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-gray-200"}`} />
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-800">{sale.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-400 line-through text-sm">{formatCurrency(sale.originalPrice)}</span>
                              <span className="text-orange-600 font-bold">{formatCurrency(sale.salePrice)}</span>
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">-{sale.discountPercent}%</Badge>
                            </div>
                          </div>
                          <Switch checked={sale.isActive} onCheckedChange={() => toggleActive(sale)} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDate(sale.startTime)}</div>
                          <span>→</span>
                          <div>{formatDate(sale.endTime)}</div>
                        </div>
                        {sale.maxQuantity > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Tag className="h-3.5 w-3.5" /> Tối đa {sale.maxQuantity} sản phẩm
                            {sale.soldCount > 0 && <span className="text-orange-600 ml-1">· Đã bán {sale.soldCount}</span>}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteMutation.mutate({ id: sale.id })}>
                            <Trash2 className="h-3 w-3 mr-1" /> Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Tab */}
        {tab === "subscribers" && (
          <div className="space-y-4">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" /> Danh Sách Đăng Ký ({filtered.length})
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Tìm email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56 h-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><Bell className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Chưa có ai đăng ký</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày đăng ký</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.map((s: any) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-800">{s.email}</td>
                            <td className="py-3 px-4">
                              {s.isConfirmed
                                ? <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Đã xác nhận</Badge>
                                : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Mail className="h-3 w-3 mr-1" />Chờ xác nhận</Badge>}
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="py-3 px-4">
                              <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteSubMutation.mutate({ id: s.id })}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Notification */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-500" /> Gửi Thông Báo Flash Sale
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div><Label className="text-sm font-medium text-gray-700">Tiêu đề email</Label><Input value={emailContent.subject} onChange={e => setEmailContent(f => ({ ...f, subject: e.target.value }))} placeholder="VD: 🔥 Flash Sale bắt đầu rồi!" className="mt-1.5" /></div>
                <div><Label className="text-sm font-medium text-gray-700">Nội dung</Label><Textarea value={emailContent.body} onChange={e => setEmailContent(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Nội dung thông báo..." className="mt-1.5" /></div>
                <Button onClick={() => toast.info("Tính năng gửi email đang được phát triển")} className="bg-orange-500 hover:bg-orange-600 gap-1.5">
                  <Mail className="h-4 w-4" /> Gửi đến {(subscribers as any[]).filter((s: any) => s.isConfirmed).length} người đã xác nhận
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Flash Sale Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-orange-500" /> Tạo Flash Sale Mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Sản phẩm *</Label>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                <SelectContent>
                  {(products as any[]).map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} — {formatCurrency(p.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Giảm giá (%) *</Label>
                <Input type="number" min={1} max={99} value={discountPercent} onChange={e => handleDiscountChange(e.target.value)} placeholder="VD: 30" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Giá Flash Sale (₫) *</Label>
                <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Tự tính theo %" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-sm font-medium">Bắt đầu *</Label><Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1" /></div>
              <div><Label className="text-sm font-medium">Kết thúc *</Label><Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label className="text-sm font-medium">Số lượng tối đa (0 = không giới hạn)</Label><Input type="number" min={0} value={maxQuantity} onChange={e => setMaxQuantity(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-sm font-medium">Mô tả</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả ngắn về Flash Sale..." className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Tạo Flash Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
