import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Settings, Users2, Percent, DollarSign, Gift } from "@/components/Icon";

export default function AffiliateConfig() {
  const { data: settings, isLoading } = trpc.referral.getSettings.useQuery();
  const utils = trpc.useUtils();
  const saveMut = trpc.referral.saveSettings.useMutation({
    onSuccess: () => { toast.success("Lưu cấu hình thành công"); utils.referral.getSettings.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    isEnabled: false,
    rewardType: "percentage" as "percentage" | "fixed" | "points",
    rewardAmount: "0",
    minOrderAmount: "0",
    description: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        isEnabled: settings.isEnabled ?? false,
        rewardType: (settings.rewardType as any) || "percentage",
        rewardAmount: String(settings.rewardAmount || 0),
        minOrderAmount: String(settings.minOrderAmount || 0),
        description: settings.description || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    saveMut.mutate({
      isEnabled: form.isEnabled,
      rewardType: form.rewardType,
      rewardAmount: parseFloat(form.rewardAmount) || 0,
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      description: form.description || undefined,
    });
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Cấu Hình Affiliate</h1>
            <p className="ak-page-subtitle">Thiết lập chương trình giới thiệu và hoa hồng</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Config */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Cài Đặt Chung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Kích hoạt chương trình</p>
                      <p className="text-sm text-muted-foreground">Cho phép người dùng giới thiệu và nhận hoa hồng</p>
                    </div>
                    <Switch checked={form.isEnabled} onCheckedChange={v => setForm(f => ({ ...f, isEnabled: v }))} />
                  </div>

                  <div>
                    <Label>Loại phần thưởng</Label>
                    <Select value={form.rewardType} onValueChange={v => setForm(f => ({ ...f, rewardType: v as any }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Phần trăm đơn hàng (%)</SelectItem>
                        <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                        <SelectItem value="points">Điểm thưởng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {form.rewardType === "percentage" ? "Tỷ lệ hoa hồng (%)" :
                         form.rewardType === "fixed" ? "Số tiền hoa hồng (VNĐ)" : "Điểm thưởng"}
                      </Label>
                      <Input
                        type="number"
                        value={form.rewardAmount}
                        onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Đơn hàng tối thiểu (VNĐ)</Label>
                      <Input
                        type="number"
                        value={form.minOrderAmount}
                        onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Mô tả chương trình</Label>
                    <Textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Mô tả chi tiết về chương trình giới thiệu..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} disabled={saveMut.isPending} className="bg-blue-600 hover:bg-blue-700 w-full">
                {saveMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang lưu...</> : <><Save className="h-4 w-4 mr-2" />Lưu Cấu Hình</>}
              </Button>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Loại thưởng</p>
                      <p className="font-semibold capitalize">
                        {form.rewardType === "percentage" ? "Phần trăm" : form.rewardType === "fixed" ? "Cố định" : "Điểm"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      {form.rewardType === "percentage" ? <Percent className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5 text-green-500" />}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mức thưởng</p>
                      <p className="font-semibold">
                        {form.rewardAmount}{form.rewardType === "percentage" ? "%" : form.rewardType === "fixed" ? " VNĐ" : " điểm"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trạng thái</p>
                      <p className={`font-semibold ${form.isEnabled ? "text-green-600" : "text-red-500"}`}>
                        {form.isEnabled ? "Đang hoạt động" : "Đã tắt"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
