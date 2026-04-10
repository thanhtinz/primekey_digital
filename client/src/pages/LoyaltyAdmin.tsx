import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, Settings, Users, TrendingUp, Plus, Minus, Search, Gift, Edit, Trash2, Loader2 } from "@/components/Icon";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function LoyaltyAdmin() {
  const [tab, setTab] = useState<"settings" | "members" | "rewards">("settings");
  const utils = trpc.useUtils();

  // ── Settings ──
  const { data: settings } = trpc.loyalty.getSettings.useQuery();
  const saveSettingsMutation = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => { utils.loyalty.getSettings.invalidate(); toast.success("Đã lưu cài đặt"); },
    onError: (e) => toast.error(e.message),
  });
  const adjustMutation = trpc.loyalty.adjust.useMutation({
    onSuccess: () => { utils.loyalty.listPoints.invalidate(); toast.success("Đã điều chỉnh điểm"); setAdjustForm({ customerEmail: "", points: 0, reason: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const [settingsForm, setSettingsForm] = useState({ pointsPerAmount: 1000, redeemRate: 100, isEnabled: true });
  const [adjustForm, setAdjustForm] = useState({ customerEmail: "", points: 0, reason: "" });
  useEffect(() => {
    if (settings) setSettingsForm({ pointsPerAmount: settings.pointsPerAmount ?? 1000, redeemRate: settings.redeemRate ?? 100, isEnabled: settings.isEnabled ?? true });
  }, [settings]);

  // ── Members ──
  const { data: pointsList = [] } = trpc.loyalty.listPoints.useQuery();
  const [search, setSearch] = useState("");
  const filteredList = (pointsList as any[]).filter(p =>
    !search || p.customerEmail.toLowerCase().includes(search.toLowerCase()) || (p.customerName || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPoints = (pointsList as any[]).reduce((sum, p) => sum + Number(p.totalPoints || 0), 0);

  // ── Rewards ──
  const { data: rewards = [], refetch: refetchRewards } = trpc.loyaltyRewards.list.useQuery();
  const createMutation = trpc.loyaltyRewards.create.useMutation({
    onSuccess: () => { refetchRewards(); toast.success("Đã tạo phần thưởng"); setOpen(false); resetRewardForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.loyaltyRewards.update.useMutation({
    onSuccess: () => { refetchRewards(); toast.success("Đã cập nhật"); setOpen(false); setEditItem(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.loyaltyRewards.delete.useMutation({
    onSuccess: () => { refetchRewards(); toast.success("Đã xóa"); },
    onError: (e: any) => toast.error(e.message),
  });
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", imageUrl: "", pointsCost: 0, stock: -1, rewardType: "discount_code" as any, rewardValue: 0, isActive: true });
  const resetRewardForm = () => setRewardForm({ name: "", description: "", imageUrl: "", pointsCost: 0, stock: -1, rewardType: "discount_code", rewardValue: 0, isActive: true });
  const openCreate = () => { resetRewardForm(); setEditItem(null); setOpen(true); };
  const openEdit = (r: any) => { setRewardForm({ name: r.name, description: r.description || "", imageUrl: r.imageUrl || "", pointsCost: r.pointsCost, stock: r.stock, rewardType: r.rewardType, rewardValue: r.rewardValue || 0, isActive: r.isActive }); setEditItem(r); setOpen(true); };
  const handleSaveReward = () => {
    if (!rewardForm.name || rewardForm.pointsCost < 1) { toast.error("Vui lòng nhập đầy đủ thông tin"); return; }
    if (editItem) updateMutation.mutate({ id: editItem.id, ...rewardForm });
    else createMutation.mutate(rewardForm);
  };

  const tabs = [
    { id: "settings", label: "Cấu Hình", icon: Settings },
    { id: "members", label: "Thành Viên", icon: Users },
    { id: "rewards", label: "Phần Thưởng", icon: Gift },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" /> Điểm Tích Lũy
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý chương trình tích điểm và phần thưởng</p>
          </div>
          {tab === "rewards" && <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1.5" /> Thêm phần thưởng</Button>}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng thành viên", value: (pointsList as any[]).length, color: "text-blue-600" },
            { label: "Tổng điểm đang có", value: totalPoints.toLocaleString("vi-VN"), color: "text-yellow-600" },
            { label: "Phần thưởng", value: (rewards as any[]).length, color: "text-purple-600" },
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-500" /> Cài Đặt Tích Điểm
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">Bật tích điểm</p>
                    <p className="text-xs text-gray-500 mt-0.5">Cho phép khách hàng tích điểm khi mua hàng</p>
                  </div>
                  <Switch checked={settingsForm.isEnabled} onCheckedChange={v => setSettingsForm(f => ({ ...f, isEnabled: v }))} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Điểm / số tiền (₫)</Label>
                  <p className="text-xs text-gray-400 mb-1.5">1 điểm = X ₫ chi tiêu</p>
                  <Input type="number" value={settingsForm.pointsPerAmount} onChange={e => setSettingsForm(f => ({ ...f, pointsPerAmount: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tỷ lệ quy đổi (điểm/₫)</Label>
                  <p className="text-xs text-gray-400 mb-1.5">X điểm = 1.000 ₫ khi đổi thưởng</p>
                  <Input type="number" value={settingsForm.redeemRate} onChange={e => setSettingsForm(f => ({ ...f, redeemRate: parseInt(e.target.value) || 0 }))} />
                </div>
                <Button onClick={() => saveSettingsMutation.mutate(settingsForm)} disabled={saveSettingsMutation.isPending} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                  {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Lưu Cài Đặt
                </Button>
              </CardContent>
            </Card>
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Điều Chỉnh Điểm Thủ Công
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email khách hàng</Label>
                  <Input value={adjustForm.customerEmail} onChange={e => setAdjustForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="customer@email.com" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Số điểm (âm để trừ)</Label>
                  <Input type="number" value={adjustForm.points} onChange={e => setAdjustForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Lý do</Label>
                  <Input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="VD: Thưởng sinh nhật" className="mt-1.5" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => adjustMutation.mutate({ ...adjustForm, points: Math.abs(adjustForm.points) })} disabled={adjustMutation.isPending} variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50">
                    <Plus className="h-4 w-4 mr-1" /> Cộng điểm
                  </Button>
                  <Button onClick={() => adjustMutation.mutate({ ...adjustForm, points: -Math.abs(adjustForm.points) })} disabled={adjustMutation.isPending} variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    <Minus className="h-4 w-4 mr-1" /> Trừ điểm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Tab */}
        {tab === "members" && (
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Thành Viên Tích Điểm
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Tìm thành viên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><Users className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Chưa có thành viên nào</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Thành viên</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Điểm hiện có</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tổng tích lũy</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Đã đổi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredList.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{p.customerName || p.customerEmail}</p>
                            <p className="text-xs text-gray-400">{p.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-yellow-600">{Number(p.totalPoints || 0).toLocaleString("vi-VN")} điểm</td>
                          <td className="py-3 px-4 text-gray-600">{Number(p.totalEarned || 0).toLocaleString("vi-VN")}</td>
                          <td className="py-3 px-4 text-gray-600">{Number(p.totalRedeemed || 0).toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rewards Tab */}
        {tab === "rewards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rewards as any[]).map((r: any) => (
              <Card key={r.id} className="border border-gray-100 shadow-sm overflow-hidden">
                {r.imageUrl && <img src={r.imageUrl} alt={r.name} className="w-full h-36 object-cover" />}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">{r.name}</h3>
                    <Badge className={r.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
                      {r.isActive ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </div>
                  {r.description && <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                    <Star className="h-4 w-4 fill-yellow-500" />
                    {r.pointsCost.toLocaleString("vi-VN")} điểm
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => openEdit(r)}><Edit className="h-3 w-3 mr-1" /> Sửa</Button>
                    <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteMutation.mutate({ id: r.id })}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(rewards as any[]).length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có phần thưởng nào. Tạo phần thưởng đầu tiên!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reward Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Sửa phần thưởng" : "Thêm phần thưởng"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên phần thưởng *</Label><Input value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Mã giảm 50K" className="mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" /></div>
            <div><Label>URL ảnh</Label><Input value={rewardForm.imageUrl} onChange={e => setRewardForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Số điểm cần *</Label><Input type="number" min={1} value={rewardForm.pointsCost} onChange={e => setRewardForm(f => ({ ...f, pointsCost: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
              <div><Label>Tồn kho (-1 = vô hạn)</Label><Input type="number" min={-1} value={rewardForm.stock} onChange={e => setRewardForm(f => ({ ...f, stock: parseInt(e.target.value) || -1 }))} className="mt-1" /></div>
            </div>
            <div>
              <Label>Loại phần thưởng</Label>
              <Select value={rewardForm.rewardType} onValueChange={v => setRewardForm(f => ({ ...f, rewardType: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_code">Mã giảm giá</SelectItem>
                  <SelectItem value="wallet_credit">Cộng ví</SelectItem>
                  <SelectItem value="physical">Quà vật lý</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rewardForm.rewardType === "wallet_credit" && (
              <div><Label>Giá trị (₫)</Label><Input type="number" min={0} value={rewardForm.rewardValue} onChange={e => setRewardForm(f => ({ ...f, rewardValue: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
            )}
            <div className="flex items-center gap-2"><Switch checked={rewardForm.isActive} onCheckedChange={v => setRewardForm(f => ({ ...f, isActive: v }))} /><Label>Hiển thị</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveReward} disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
