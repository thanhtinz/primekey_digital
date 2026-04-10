import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Play, Clock, Zap, RefreshCw } from "lucide-react";

const JOB_TYPES = [
  { value: "delete_orders", label: "Xóa đơn hàng đã bán" },
  { value: "delete_wallet_history", label: "Xóa lịch sử nạp tiền" },
  { value: "delete_inactive_users", label: "Xóa User không nạp tiền" },
  { value: "delete_telegram_logs", label: "Xóa nhật ký Bot Telegram" },
  { value: "clean_images", label: "Dọn dẹp ảnh rác" },
  { value: "revenue_report_telegram", label: "Báo cáo doanh thu tự động về Telegram" },
];

const INTERVAL_PRESETS = [
  { label: "1 giờ", seconds: 3600 },
  { label: "6 giờ", seconds: 21600 },
  { label: "12 giờ", seconds: 43200 },
  { label: "1 ngày", seconds: 86400 },
  { label: "3 ngày", seconds: 259200 },
  { label: "7 ngày", seconds: 604800 },
  { label: "30 ngày", seconds: 2592000 },
];

function formatInterval(seconds: number): string {
  if (seconds >= 2592000) return `${Math.round(seconds / 2592000)} tháng`;
  if (seconds >= 604800) return `${Math.round(seconds / 604800)} tuần`;
  if (seconds >= 86400) return `${Math.round(seconds / 86400)} ngày`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} giờ`;
  return `${seconds} giây`;
}

export default function Automations() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", jobType: "", intervalSeconds: 86400 });

  const { data: automations, refetch } = trpc.automation.list.useQuery();
  const createMutation = trpc.automation.create.useMutation({
    onSuccess: () => { toast.success("Đã tạo tự động hoá"); setShowAdd(false); setForm({ name: "", jobType: "", intervalSeconds: 86400 }); refetch(); },
    onError: (e: any) => toast.error(e.message || "Lỗi"),
  });
  const toggleMutation = trpc.automation.toggle.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.automation.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); refetch(); },
  });
  const runNowMutation = trpc.automation.runNow.useMutation({
    onSuccess: () => { toast.success("Đã chạy tác vụ"); refetch(); },
    onError: (e: any) => toast.error(e.message || "Lỗi"),
  });

  return (
    <DashboardLayoutCustom>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Tự Động Hoá</h1>
          <p className="ak-page-subtitle">Lên lịch các tác vụ chạy tự động theo chu kỳ</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Thêm Tác Vụ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-blue-50"><Zap className="h-5 w-5 text-blue-600" /></div>
          <div className="ak-stat-value">{automations?.length ?? 0}</div>
          <div className="ak-stat-label">Tổng tác vụ</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-green-50"><Play className="h-5 w-5 text-green-600" /></div>
          <div className="ak-stat-value">{automations?.filter(a => a.isActive).length ?? 0}</div>
          <div className="ak-stat-label">Đang hoạt động</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-gray-50"><Clock className="h-5 w-5 text-gray-600" /></div>
          <div className="ak-stat-value">{automations?.filter(a => !a.isActive).length ?? 0}</div>
          <div className="ak-stat-label">Đã tắt</div>
        </div>
        <div className="ak-stat-card">
          <div className="ak-stat-icon bg-purple-50"><RefreshCw className="h-5 w-5 text-purple-600" /></div>
          <div className="ak-stat-value">{automations?.reduce((s, a) => s + (a.runCount ?? 0), 0) ?? 0}</div>
          <div className="ak-stat-label">Lần đã chạy</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Danh Sách Tác Vụ</h2>
        </div>
        {!automations || automations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có tác vụ nào. Nhấn "+ Thêm Tác Vụ" để bắt đầu.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {automations.map(auto => (
              <div key={auto.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${auto.isActive ? "bg-blue-50" : "bg-gray-100"}`}>
                    <Zap className={`h-5 w-5 ${auto.isActive ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{auto.name}</div>
                    <div className="text-sm text-gray-500">
                      {JOB_TYPES.find(j => j.value === auto.jobType)?.label ?? auto.jobType}
                      {" · "}
                      <span className="text-blue-600">Mỗi {formatInterval(auto.intervalSeconds)}</span>
                    </div>
                    {auto.lastRunAt && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Chạy lần cuối: {new Date(auto.lastRunAt).toLocaleString("vi-VN")}
                        {" · "}Tổng: {auto.runCount} lần
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <Badge variant={auto.isActive ? "default" : "secondary"} className="text-xs">
                    {auto.isActive ? "Đang chạy" : "Đã tắt"}
                  </Badge>
                  <Switch
                    checked={auto.isActive}
                    onCheckedChange={() => toggleMutation.mutate({ id: auto.id, isActive: !auto.isActive })}
                  />
                  <Button
                    size="sm" variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => runNowMutation.mutate({ id: auto.id })}
                    disabled={runNowMutation.isPending}
                  >
                    <Play className="h-3 w-3" /> Chạy ngay
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm("Xóa tác vụ này?")) deleteMutation.mutate({ id: auto.id }); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>+ THÊM CÔNG VIỆC CẦN TỰ ĐỘNG</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Tên công việc</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nhập tên mô tả task nếu có"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Loại công việc <span className="text-red-500">(*)</span></Label>
              <Select value={form.jobType} onValueChange={v => setForm(f => ({ ...f, jobType: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="-- Chọn loại công việc" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map(j => (
                    <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thời gian <span className="text-red-500">(*)</span></Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {INTERVAL_PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    onClick={() => setForm(f => ({ ...f, intervalSeconds: p.seconds }))}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.intervalSeconds === p.seconds ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Vui lòng chọn thời gian chạy định kỳ của hệ thống</p>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.jobType}
            >
              {createMutation.isPending ? "Đang tạo..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
