import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Plus, Edit, Trash2, Loader2 } from "@/components/Icon";

function resetForm() {
  return { name: "", description: "", pointsCost: 100, rewardType: "discount_code" as const, rewardValue: 10, isActive: true };
}

export default function LoyaltyRewards() {
  const { data: rewards = [], refetch } = trpc.loyaltyRewards.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<{ name: string; description: string; pointsCost: number; rewardType: "custom" | "discount_code" | "wallet_credit" | "physical"; rewardValue: number; isActive: boolean }>(resetForm());

  const createMutation = trpc.loyaltyRewards.create.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã tạo phần thưởng"); setOpen(false); setForm(resetForm()); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.loyaltyRewards.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã cập nhật"); setOpen(false); setEditItem(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.loyaltyRewards.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || "", pointsCost: item.pointsCost, rewardType: item.rewardType || "discount_code", rewardValue: Number(item.rewardValue || 10), isActive: item.isActive });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <div>
              <h1 className="ak-page-title">Phần Thưởng Tích Điểm</h1>
              <p className="ak-page-subtitle">Quản lý danh sách phần thưởng khách hàng có thể đổi</p>
            </div>
          </div>
          <Button onClick={() => { setEditItem(null); setForm(resetForm()); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Thêm phần thưởng
          </Button>
        </div>

        {/* Rewards Grid */}
        {(rewards as any[]).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Gift className="h-10 w-10 mb-2 opacity-30" />
              <p>Chưa có phần thưởng nào</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Tạo phần thưởng đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rewards as any[]).map((r: any) => (
              <Card key={r.id} className={`border ${!r.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: r.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold">{r.name}</h3>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-600">{r.pointsCost} điểm</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {r.rewardType === "discount_code" ? `Giảm ${r.rewardValue}%` :
                       r.rewardType === "wallet_credit" ? `${Number(r.rewardValue || 0).toLocaleString("vi-VN")} ₫` :
                       r.rewardType === "physical" ? "Sản phẩm vật lý" : r.rewardType || "Tuỳ chỉnh"}
                    </span>
                  </div>
                  {!r.isActive && <p className="text-xs text-muted-foreground mt-2">Đã tắt</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditItem(null); setForm(resetForm()); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Chỉnh sửa phần thưởng" : "Thêm phần thưởng mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên phần thưởng</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Giảm 10% đơn hàng" />
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả (tuỳ chọn)</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về phần thưởng" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Điểm cần đổi</Label>
                  <Input type="number" value={form.pointsCost} onChange={e => setForm(f => ({ ...f, pointsCost: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Loại phần thưởng</Label>
                  <Select value={form.rewardType} onValueChange={(v: any) => setForm(f => ({ ...f, rewardType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount_code">Mã giảm giá</SelectItem>
                      <SelectItem value="wallet_credit">Tiền vào ví (₫)</SelectItem>
                      <SelectItem value="physical">Sản phẩm vật lý</SelectItem>
                      <SelectItem value="custom">Tuỳ chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{form.rewardType === "discount_code" ? "Phần trăm giảm (%)" : form.rewardType === "wallet_credit" ? "Số tiền (₫)" : "Mô tả"}</Label>
                <Input type="number" value={form.rewardValue} onChange={e => setForm(f => ({ ...f, rewardValue: Number(e.target.value) }))} placeholder={form.rewardType === "discount_code" ? "10" : form.rewardType === "wallet_credit" ? "50000" : "0"} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <Label>Kích hoạt</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={isPending || !form.name}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editItem ? "Cập nhật" : "Tạo phần thưởng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayoutCustom>
  );
}
