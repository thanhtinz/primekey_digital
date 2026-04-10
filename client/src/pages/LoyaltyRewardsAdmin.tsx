import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Gift, Star } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

export default function LoyaltyRewardsAdmin() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", pointsCost: 100, rewardType: "discount_code" as any, rewardValue: 0, stock: -1, isActive: true, sortOrder: 0 });

  const { data: rewards, refetch } = trpc.loyaltyRewards.list.useQuery();
  const createMutation = trpc.loyaltyRewards.create.useMutation({ onSuccess: () => { toast.success("Đã tạo phần thưởng"); refetch(); setOpen(false); } });
  const updateMutation = trpc.loyaltyRewards.update.useMutation({ onSuccess: () => { toast.success("Đã cập nhật"); refetch(); setOpen(false); } });
  const deleteMutation = trpc.loyaltyRewards.delete.useMutation({ onSuccess: () => { toast.success("Đã xóa"); refetch(); } });

  const openCreate = () => { setEditItem(null); setForm({ name: "", description: "", imageUrl: "", pointsCost: 100, rewardType: "discount_code", rewardValue: 0, stock: -1, isActive: true, sortOrder: 0 }); setOpen(true); };
  const openEdit = (r: any) => { setEditItem(r); setForm({ name: r.name, description: r.description || "", imageUrl: r.imageUrl || "", pointsCost: r.pointsCost, rewardType: r.rewardType, rewardValue: parseFloat(r.rewardValue || "0"), stock: r.stock, isActive: r.isActive, sortOrder: r.sortOrder }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || form.pointsCost < 1) { toast.error("Vui lòng nhập đầy đủ thông tin"); return; }
    if (editItem) updateMutation.mutate({ id: editItem.id, ...form });
    else createMutation.mutate(form);
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Phần Thưởng Tích Điểm</h1>
            <p className="ak-page-subtitle">Quản lý danh sách phần thưởng đổi điểm</p>
          </div>
        </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Thêm phần thưởng</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards?.map((r: any) => (
            <div key={r.id} className="border rounded-xl p-4 bg-white space-y-3">
              {r.imageUrl && <img src={r.imageUrl} alt={r.name} className="w-full h-32 object-cover rounded-lg" />}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{r.name}</h3>
                <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Đang bán" : "Ẩn"}</Badge>
              </div>
              {r.description && <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>}
              <div className="flex items-center gap-1 text-yellow-600 font-bold">
                <Star className="w-4 h-4 fill-yellow-500" />
                {r.pointsCost.toLocaleString("vi-VN")} điểm
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Edit className="w-3 h-3 mr-1" />Sửa</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: r.id })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
          {(!rewards || rewards.length === 0) && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có phần thưởng nào. Tạo phần thưởng đầu tiên!</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Sửa phần thưởng" : "Thêm phần thưởng"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên phần thưởng *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Mã giảm 50K" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div><Label>URL ảnh</Label><Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Số điểm cần *</Label><Input type="number" min={1} value={form.pointsCost} onChange={e => setForm(f => ({ ...f, pointsCost: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label>Tồn kho (-1 = vô hạn)</Label><Input type="number" min={-1} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || -1 }))} /></div>
            </div>
            <div><Label>Loại phần thưởng</Label>
              <Select value={form.rewardType} onValueChange={v => setForm(f => ({ ...f, rewardType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_code">Mã giảm giá</SelectItem>
                  <SelectItem value="wallet_credit">Cộng ví</SelectItem>
                  <SelectItem value="physical">Quà vật lý</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.rewardType === "wallet_credit") && (
              <div><Label>Giá trị (₫)</Label><Input type="number" min={0} value={form.rewardValue} onChange={e => setForm(f => ({ ...f, rewardValue: parseFloat(e.target.value) || 0 }))} /></div>
            )}
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>Hiển thị</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
