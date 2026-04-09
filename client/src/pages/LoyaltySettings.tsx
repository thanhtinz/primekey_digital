import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Settings, Users, TrendingUp, Plus, Minus, Search } from "@/components/Icon";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function LoyaltySettings() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.loyalty.getSettings.useQuery();
  const { data: pointsList = [] } = trpc.loyalty.listPoints.useQuery();

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
  const [search, setSearch] = useState("");

  // Sync settings when loaded
  if (settings && settingsForm.pointsPerAmount === 1000 && settings.pointsPerAmount !== 1000) {
    setSettingsForm({ pointsPerAmount: settings.pointsPerAmount ?? 1000, redeemRate: settings.redeemRate ?? 100, isEnabled: settings.isEnabled ?? true });
  }

  const filteredList = (pointsList as any[]).filter(p =>
    !search || p.customerEmail.toLowerCase().includes(search.toLowerCase()) || (p.customerName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = (pointsList as any[]).reduce((sum, p) => sum + Number(p.totalPoints || 0), 0);
  const totalMembers = pointsList.length;

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" />
            Tích Điểm Thành Viên
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý chương trình tích điểm và thành viên</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng thành viên", value: totalMembers, icon: Users, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Tổng điểm đang lưu", value: totalPoints.toLocaleString(), icon: Star, color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" },
            { label: "Tỷ lệ tích điểm", value: `${(settings?.pointsPerAmount || 1000).toLocaleString()}đ/điểm`, icon: TrendingUp, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
            { label: "Trạng thái", value: ((settings?.isEnabled) !== false) ? "Đang bật" : "Đang tắt", icon: Settings, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <s.icon className="w-5 h-5 text-slate-400 mb-2" />
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white font-bold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-400" /> Cài Đặt Tích Điểm</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Bật chương trình tích điểm</Label>
                <Switch checked={settingsForm.isEnabled} onCheckedChange={v => setSettingsForm(f => ({ ...f, isEnabled: v }))} />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Tỷ lệ tích điểm (VND / 1 điểm)</Label>
                <Input type="number" value={settingsForm.pointsPerAmount} onChange={e => setSettingsForm(f => ({ ...f, pointsPerAmount: Number(e.target.value) }))} className="mt-1 bg-slate-900 border-slate-600 text-white" />
                <p className="text-slate-500 text-xs mt-1">VD: 1000 = cứ 1.000đ mua hàng được 1 điểm</p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Tỷ lệ đổi điểm (điểm / 1.000đ giảm)</Label>
                <Input type="number" value={settingsForm.redeemRate} onChange={e => setSettingsForm(f => ({ ...f, redeemRate: Number(e.target.value) }))} className="mt-1 bg-slate-900 border-slate-600 text-white" />
                <p className="text-slate-500 text-xs mt-1">VD: 100 = 100 điểm đổi được 1.000đ giảm giá</p>
              </div>
              <Button onClick={() => saveSettingsMutation.mutate(settingsForm)} disabled={saveSettingsMutation.isPending} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                {saveSettingsMutation.isPending ? "Đang lưu..." : "Lưu Cài Đặt"}
              </Button>
            </div>
          </div>

          {/* Manual adjust */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-400" /> Điều Chỉnh Điểm Thủ Công</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-sm">Email khách hàng</Label>
                <Input value={adjustForm.customerEmail} onChange={e => setAdjustForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@example.com" className="mt-1 bg-slate-900 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Số điểm (âm = trừ điểm)</Label>
                <Input type="number" value={adjustForm.points} onChange={e => setAdjustForm(f => ({ ...f, points: Number(e.target.value) }))} className="mt-1 bg-slate-900 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Lý do</Label>
                <Input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="VD: Quà tặng sinh nhật, Đổi điểm..." className="mt-1 bg-slate-900 border-slate-600 text-white" />
              </div>
              <Button onClick={() => adjustMutation.mutate(adjustForm)} disabled={adjustMutation.isPending || !adjustForm.customerEmail || !adjustForm.reason} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {adjustMutation.isPending ? "Đang xử lý..." : "Điều Chỉnh Điểm"}
              </Button>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> Danh Sách Thành Viên ({filteredList.length})</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="pl-8 h-8 text-sm bg-slate-900 border-slate-600 text-white w-48" />
            </div>
          </div>
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Chưa có thành viên nào</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredList.map((member: any, idx: number) => (
                <div key={member.customerEmail} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{member.customerName || "—"}</p>
                    <p className="text-slate-400 text-xs">{member.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{Number(member.totalPoints).toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">điểm</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
