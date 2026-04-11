import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Star, Save, Loader2, Plus, Minus } from "@/components/Icon";

export default function LoyaltyConfig() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.loyalty.getSettings.useQuery();
  const [form, setForm] = useState({ pointsPerAmount: 1000, redeemRate: 100, isEnabled: true });
  const [adjustForm, setAdjustForm] = useState({ customerEmail: "", points: 0, reason: "" });

  useEffect(() => {
    if (settings) setForm({
      pointsPerAmount: settings.pointsPerAmount ?? 1000,
      redeemRate: settings.redeemRate ?? 100,
      isEnabled: settings.isEnabled ?? true,
    });
  }, [settings]);

  const saveSettings = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => { utils.loyalty.getSettings.invalidate(); utils.settings.get.invalidate(); utils.featureFlags.getAll.invalidate(); toast.success("Đã lưu cài đặt tích điểm"); },
    onError: (e) => toast.error(e.message),
  });

  const adjustMutation = trpc.loyalty.adjust.useMutation({
    onSuccess: () => {
      utils.loyalty.listPoints.invalidate();
      toast.success("Đã điều chỉnh điểm thành công");
      setAdjustForm({ customerEmail: "", points: 0, reason: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6 max-w-2xl">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Cấu Hình Tích Điểm</h1>
            <p className="ak-page-subtitle">Thiết lập quy tắc tích điểm và quy đổi</p>
          </div>
        </div>

        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500" />
              Cài Đặt Tích Điểm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Bật tích điểm</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Cho phép khách hàng tích điểm khi mua hàng</p>
              </div>
              <Switch checked={form.isEnabled} onCheckedChange={v => setForm(f => ({ ...f, isEnabled: v }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Điểm / {(1000).toLocaleString("vi-VN")} ₫</Label>
                <Input
                  type="number"
                  value={form.pointsPerAmount}
                  onChange={e => setForm(f => ({ ...f, pointsPerAmount: Number(e.target.value) }))}
                  placeholder="1000"
                />
                <p className="text-xs text-muted-foreground">Mỗi {form.pointsPerAmount.toLocaleString("vi-VN")} ₫ = 1 điểm</p>
              </div>
              <div className="space-y-1.5">
                <Label>Điểm / 1 ₫ quy đổi</Label>
                <Input
                  type="number"
                  value={form.redeemRate}
                  onChange={e => setForm(f => ({ ...f, redeemRate: Number(e.target.value) }))}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">{form.redeemRate} điểm = 1 ₫ giảm giá</p>
              </div>
            </div>

            <Button
              onClick={() => saveSettings.mutate(form)}
              disabled={saveSettings.isPending}
              className="w-full"
            >
              {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu Cài Đặt
            </Button>
          </CardContent>
        </Card>

        {/* Manual Adjust */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Điều Chỉnh Điểm Thủ Công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email khách hàng</Label>
              <Input
                value={adjustForm.customerEmail}
                onChange={e => setAdjustForm(f => ({ ...f, customerEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điểm (âm để trừ)</Label>
              <Input
                type="number"
                value={adjustForm.points}
                onChange={e => setAdjustForm(f => ({ ...f, points: Number(e.target.value) }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Input
                value={adjustForm.reason}
                onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Nhập lý do điều chỉnh..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => adjustMutation.mutate({ ...adjustForm, points: Math.abs(adjustForm.points) })}
                disabled={adjustMutation.isPending || !adjustForm.customerEmail}
              >
                <Plus className="h-4 w-4 mr-1" /> Cộng điểm
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => adjustMutation.mutate({ ...adjustForm, points: -Math.abs(adjustForm.points) })}
                disabled={adjustMutation.isPending || !adjustForm.customerEmail}
              >
                <Minus className="h-4 w-4 mr-1" /> Trừ điểm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
