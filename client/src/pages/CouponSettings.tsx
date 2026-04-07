import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Copy, Calendar, Users, TicketCheck, Search } from "lucide-react";

export default function CouponSettings() {
  const utils = trpc.useUtils();
  const { data: coupons = [], isLoading } = trpc.coupon.list.useQuery();
  const createMut = trpc.coupon.create.useMutation({ onSuccess: () => { utils.coupon.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("Tạo mã giảm giá thành công"); } });
  const updateMut = trpc.coupon.update.useMutation({ onSuccess: () => { utils.coupon.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("Cập nhật thành công"); } });
  const deleteMut = trpc.coupon.delete.useMutation({ onSuccess: () => { utils.coupon.list.invalidate(); toast.success("Đã xóa mã giảm giá"); } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    code: "", description: "", discountType: "percent" as "percent" | "fixed",
    discountValue: 0, minOrderAmount: 0, maxDiscountAmount: 0,
    maxUses: 0, maxUsesPerCustomer: 1, startsAt: "", expiresAt: "", isActive: true,
  });

  const resetForm = () => {
    setForm({ code: "", description: "", discountType: "percent", discountValue: 0, minOrderAmount: 0, maxDiscountAmount: 0, maxUses: 0, maxUsesPerCustomer: 1, startsAt: "", expiresAt: "", isActive: true });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || "", discountType: c.discountType,
      discountValue: Number(c.discountValue), minOrderAmount: Number(c.minOrderAmount || 0),
      maxDiscountAmount: Number(c.maxDiscountAmount || 0), maxUses: c.maxUses || 0,
      maxUsesPerCustomer: c.maxUsesPerCustomer || 1,
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : "",
      isActive: c.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim()) { toast.error("Vui lòng nhập mã"); return; }
    if (form.discountValue <= 0) { toast.error("Giá trị giảm phải > 0"); return; }
    if (editingId) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter((c: any) => c.code.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
  }, [coupons, search]);

  const stats = useMemo(() => {
    const active = coupons.filter((c: any) => c.isActive).length;
    const expired = coupons.filter((c: any) => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
    const totalUsed = coupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0);
    return { total: coupons.length, active, expired, totalUsed };
  }, [coupons]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép: ${code}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng mã", value: stats.total, icon: Tag, color: "text-blue-500" },
          { label: "Đang hoạt động", value: stats.active, icon: TicketCheck, color: "text-green-500" },
          { label: "Đã hết hạn", value: stats.expired, icon: Calendar, color: "text-orange-500" },
          { label: "Lượt sử dụng", value: stats.totalUsed, icon: Users, color: "text-purple-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm mã giảm giá..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo Mã Giảm Giá
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">Chưa có mã giảm giá nào</p>
            <Button onClick={openCreate} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Tạo mã đầu tiên</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c: any) => {
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const isMaxed = c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses;
            const status = !c.isActive ? "inactive" : isExpired ? "expired" : isMaxed ? "maxed" : "active";
            const statusColors: Record<string, string> = {
              active: "bg-green-500/10 text-green-600 border-green-500/20",
              inactive: "bg-slate-500/10 text-slate-500 border-slate-500/20",
              expired: "bg-orange-500/10 text-orange-600 border-orange-500/20",
              maxed: "bg-red-500/10 text-red-600 border-red-500/20",
            };
            const statusLabels: Record<string, string> = { active: "Hoạt động", inactive: "Tắt", expired: "Hết hạn", maxed: "Hết lượt" };

            return (
              <Card key={c.id} className={`transition-all hover:shadow-md ${status !== "active" ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        {c.discountType === "percent" ? <Percent className="h-5 w-5 text-blue-500" /> : <DollarSign className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => copyCode(c.code)} className="font-mono font-bold text-base hover:text-blue-500 transition-colors flex items-center gap-1">
                            {c.code} <Copy className="h-3 w-3 opacity-50" />
                          </button>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColors[status]}`}>
                            {statusLabels[status]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {c.discountType === "percent"
                            ? `Giảm ${Number(c.discountValue)}%${c.maxDiscountAmount ? ` (tối đa ${Number(c.maxDiscountAmount).toLocaleString("vi-VN")}đ)` : ""}`
                            : `Giảm ${Number(c.discountValue).toLocaleString("vi-VN")}đ`
                          }
                          {Number(c.minOrderAmount) > 0 && ` · Đơn tối thiểu ${Number(c.minOrderAmount).toLocaleString("vi-VN")}đ`}
                        </p>
                        {c.description && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right text-xs text-muted-foreground hidden md:block">
                        <p>Đã dùng: {c.usedCount || 0}{c.maxUses > 0 ? `/${c.maxUses}` : ""}</p>
                        {c.expiresAt && <p>HH: {new Date(c.expiresAt).toLocaleDateString("vi-VN")}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Xóa mã giảm giá này?")) deleteMut.mutate({ id: c.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa Mã Giảm Giá" : "Tạo Mã Giảm Giá"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label>Mã giảm giá *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE50" className="font-mono" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Loại giảm giá</Label>
                <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Mô tả</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="VD: Giảm 50% cho khách mới" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giá trị giảm *</Label>
                <Input type="number" value={form.discountValue || ""} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} placeholder={form.discountType === "percent" ? "50" : "100000"} />
              </div>
              {form.discountType === "percent" && (
                <div>
                  <Label>Giảm tối đa (VNĐ)</Label>
                  <Input type="number" value={form.maxDiscountAmount || ""} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: Number(e.target.value) }))} placeholder="0 = không giới hạn" />
                </div>
              )}
              <div>
                <Label>Đơn tối thiểu (VNĐ)</Label>
                <Input type="number" value={form.minOrderAmount || ""} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tổng lượt dùng (0 = vô hạn)</Label>
                <Input type="number" value={form.maxUses || ""} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div>
                <Label>Lượt/khách hàng</Label>
                <Input type="number" value={form.maxUsesPerCustomer || ""} onChange={e => setForm(f => ({ ...f, maxUsesPerCustomer: Number(e.target.value) }))} placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bắt đầu</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div>
                <Label>Hết hạn</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label>Kích hoạt ngay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mã"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
