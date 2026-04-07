import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Users2, Save, Loader2, Gift, TrendingUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function ReferralSettings() {
  const { data: settings, isLoading } = trpc.referral.getSettings.useQuery();
  const { data: referrals = [] } = trpc.referral.adminList.useQuery();
  const saveMut = trpc.referral.saveSettings.useMutation({
    onSuccess: () => { toast.success("Lưu cấu hình thành công"); utils.referral.getSettings.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const utils = trpc.useUtils();

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
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="h-6 w-6 text-blue-600" /> Giới Thiệu Bạn Bè
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Cấu hình chương trình giới thiệu bạn bè</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Cấu Hình</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Bật Chương Trình</Label>
                        <p className="text-xs text-gray-400 mt-0.5">Cho phép khách hàng giới thiệu bạn bè</p>
                      </div>
                      <Switch checked={form.isEnabled} onCheckedChange={(v) => setForm(p => ({ ...p, isEnabled: v }))} />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Loại Thưởng</Label>
                      <div className="flex gap-2 mt-1.5">
                        {[
                          { value: "percentage", label: "% Giảm giá" },
                          { value: "fixed", label: "Số tiền cố định" },
                          { value: "points", label: "Điểm thưởng" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setForm(p => ({ ...p, rewardType: opt.value as any }))}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${form.rewardType === opt.value ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Giá trị thưởng {form.rewardType === "percentage" ? "(%)" : form.rewardType === "points" ? "(điểm)" : "(₫)"}
                        </Label>
                        <Input type="number" value={form.rewardAmount} onChange={(e) => setForm(p => ({ ...p, rewardAmount: e.target.value }))} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Đơn hàng tối thiểu (₫)</Label>
                        <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} className="mt-1.5" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Mô tả chương trình</Label>
                      <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn về chương trình giới thiệu..." className="mt-1.5" rows={3} />
                    </div>

                    <Button onClick={handleSave} disabled={saveMut.isPending} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                      {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Lưu Cấu Hình
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="space-y-5">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Thống Kê
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tổng lượt giới thiệu</span>
                    <span className="font-bold text-lg text-blue-600">{referrals.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Đã hoàn thành</span>
                    <span className="font-bold text-lg text-green-600">{referrals.filter((r: any) => r.status === "completed").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent referrals */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Lượt Giới Thiệu Gần Đây</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Chưa có lượt giới thiệu nào</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {referrals.slice(0, 10).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2.5">
                        <div>
                          <p className="font-medium text-gray-700">{r.refereeEmail}</p>
                          <p className="text-xs text-gray-400">Mã: {r.referralCode}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {r.status === "completed" ? "Hoàn thành" : "Chờ"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
