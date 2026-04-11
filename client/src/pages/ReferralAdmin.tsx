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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, Save, Loader2, TrendingUp, CheckCircle, XCircle, Clock, Search, Banknote, Wallet, Settings, List } from "@/components/Icon";

function formatAmount(v: any) {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export default function ReferralAdmin() {
  const [tab, setTab] = useState<"settings" | "withdrawals">("settings");

  // ── Settings tab ──
  const { data: settings, isLoading: loadingSettings } = trpc.referral.getSettings.useQuery();
  const { data: referrals = [] } = trpc.referral.adminList.useQuery();
  const utils = trpc.useUtils();
  const saveMut = trpc.referral.saveSettings.useMutation({
    onSuccess: () => { toast.success("Lưu cấu hình thành công"); utils.referral.getSettings.invalidate(); utils.settings.get.invalidate(); utils.featureFlags.getAll.invalidate(); },
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

  // ── Withdrawals tab ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const { data: withdrawals = [], refetch } = trpc.referralWithdrawals.list.useQuery(undefined, { staleTime: 0 });
  const updateMutation = trpc.referralWithdrawals.updateStatus.useMutation({
    onSuccess: () => { toast.success("Cập nhật thành công"); setSelectedItem(null); setAdminNote(""); setDialogAction(null); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const filtered = withdrawals.filter((w: any) => {
    const matchSearch = !search || w.customerEmail?.toLowerCase().includes(search.toLowerCase()) || w.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const handleAction = (item: any, action: "approve" | "reject") => { setSelectedItem(item); setDialogAction(action); setAdminNote(""); };
  const confirmAction = () => {
    if (!selectedItem || !dialogAction) return;
    updateMutation.mutate({ id: selectedItem.id, status: dialogAction === "approve" ? "completed" : "rejected", adminNote });
  };
  const statusBadge = (s: string) => {
    if (s === "pending") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>;
    if (s === "completed") return <Badge className="bg-green-100 text-green-700 border-green-200">Đã duyệt</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Từ chối</Badge>;
  };

  const tabs = [
    { id: "settings", label: "Cấu Hình", icon: Settings },
    { id: "withdrawals", label: "Yêu Cầu Rút", icon: List },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Chương Trình Giới Thiệu</h1>
            <p className="ak-page-subtitle">Quản lý hoa hồng và rút tiền giới thiệu</p>
          </div>
        </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng giới thiệu", value: (referrals as any[]).length, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Hoàn thành", value: (referrals as any[]).filter((r: any) => r.status === "completed").length, color: "text-green-600", bg: "bg-green-50" },
            { label: "Chờ rút", value: (withdrawals as any[]).filter((w: any) => w.status === "pending").length, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Đã rút", value: (withdrawals as any[]).filter((w: any) => w.status === "completed").length, color: "text-purple-600", bg: "bg-purple-50" },
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
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" /> Cấu Hình Chương Trình
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  {loadingSettings ? (
                    <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800">Bật chương trình giới thiệu</p>
                          <p className="text-xs text-gray-500 mt-0.5">Cho phép người dùng chia sẻ link và nhận hoa hồng</p>
                        </div>
                        <Switch checked={form.isEnabled} onCheckedChange={v => setForm(p => ({ ...p, isEnabled: v }))} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Loại thưởng</Label>
                        <div className="flex gap-2 mt-2">
                          {[{ value: "percentage", label: "Phần trăm (%)" }, { value: "fixed", label: "Số tiền cố định" }, { value: "points", label: "Điểm thưởng" }].map(opt => (
                            <button key={opt.value} onClick={() => setForm(p => ({ ...p, rewardType: opt.value as any }))}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${form.rewardType === opt.value ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Giá trị thưởng {form.rewardType === "percentage" ? "(%)" : form.rewardType === "points" ? "(điểm)" : "(₫)"}
                          </Label>
                          <Input type="number" value={form.rewardAmount} onChange={e => setForm(p => ({ ...p, rewardAmount: e.target.value }))} className="mt-1.5" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Đơn hàng tối thiểu (₫)</Label>
                          <Input type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} className="mt-1.5" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Mô tả chương trình</Label>
                        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn về chương trình giới thiệu..." className="mt-1.5" rows={3} />
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
            <div>
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" /> Lượt Giới Thiệu Gần Đây
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {(referrals as any[]).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Chưa có lượt giới thiệu nào</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {(referrals as any[]).slice(0, 15).map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2.5">
                          <div>
                            <p className="font-medium text-gray-700 truncate max-w-[140px]">{r.refereeEmail}</p>
                            <p className="text-xs text-gray-400">Mã: {r.referralCode}</p>
                          </div>
                          <Badge className={r.status === "completed" ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>
                            {r.status === "completed" ? "Hoàn thành" : "Chờ"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {tab === "withdrawals" && (
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" /> Yêu Cầu Rút Hoa Hồng
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Tìm khách hàng..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56 h-9" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ duyệt</SelectItem>
                      <SelectItem value="completed">Đã duyệt</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Không có yêu cầu nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Khách hàng</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Số tiền</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Hình thức</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((w: any) => (
                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{w.customerName || w.customerEmail}</p>
                            <p className="text-xs text-gray-400">{w.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-600">{formatAmount(w.amount)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              {w.withdrawType === "wallet" ? <Wallet className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                              {w.withdrawType === "wallet" ? "Về số dư" : "Về ATM"}
                            </div>
                          </td>
                          <td className="py-3 px-4">{statusBadge(w.status)}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{new Date(w.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="py-3 px-4">
                            {w.status === "pending" && (
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className="h-7 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(w, "approve")}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Duyệt
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(w, "reject")}>
                                  <XCircle className="h-3 w-3 mr-1" /> Từ chối
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!selectedItem && !!dialogAction} onOpenChange={() => { setSelectedItem(null); setDialogAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === "approve" ? "Xác nhận duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Khách hàng:</span><span className="font-medium">{selectedItem.customerName || selectedItem.customerEmail}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Số tiền:</span><span className="font-semibold text-green-600">{formatAmount(selectedItem.amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Hình thức:</span><span>{selectedItem.withdrawType === "wallet" ? "Về số dư" : "Về ATM"}</span></div>
                {selectedItem.withdrawType === "atm" && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Ngân hàng:</span><span>{selectedItem.bankName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Số TK:</span><span className="font-mono">{selectedItem.bankAccount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Chủ TK:</span><span>{selectedItem.bankHolder}</span></div>
                  </>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ghi chú admin (tuỳ chọn)</label>
                <Textarea placeholder="Nhập ghi chú..." value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedItem(null); setDialogAction(null); }}>Huỷ</Button>
            <Button onClick={confirmAction} disabled={updateMutation.isPending}
              className={dialogAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
              {updateMutation.isPending ? "Đang xử lý..." : dialogAction === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
