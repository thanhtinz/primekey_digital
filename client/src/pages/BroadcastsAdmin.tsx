import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Megaphone, Info, AlertCircle, CheckCircle2, AlertTriangle, Star, X, Loader2 } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

type BroadcastType = "info" | "warning" | "success" | "error";

const TYPE_CONFIG: Record<BroadcastType, { label: string; bg: string; border: string; textColor: string; badgeClass: string }> = {
  info: { label: "Thông tin", bg: "bg-blue-50", border: "border-blue-200", textColor: "text-blue-800", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
  warning: { label: "Cảnh báo", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-800", badgeClass: "bg-amber-100 text-amber-700 border-amber-200" },
  success: { label: "Thành công", bg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-800", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  error: { label: "Lỗi / Khẩn cấp", bg: "bg-red-50", border: "border-red-200", textColor: "text-red-800", badgeClass: "bg-red-100 text-red-700 border-red-200" },
};

const TYPE_ICONS: Record<BroadcastType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

interface FormState {
  title: string;
  message: string;
  type: BroadcastType;
  isPinned: boolean;
  expiresAt: string;
}

const EMPTY_FORM: FormState = { title: "", message: "", type: "info", isPinned: false, expiresAt: "" };

export default function BroadcastsAdmin() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: broadcasts = [], isLoading } = (trpc as any).broadcasts.getAll.useQuery();
  const createMutation = (trpc as any).broadcasts.create.useMutation({
    onSuccess: () => {
      (utils as any).broadcasts.getAll.invalidate();
      (utils as any).broadcasts.getActive.invalidate();
      toast.success("Đã tạo thông báo");
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = (trpc as any).broadcasts.update.useMutation({
    onSuccess: () => {
      (utils as any).broadcasts.getAll.invalidate();
      (utils as any).broadcasts.getActive.invalidate();
      toast.success("Đã cập nhật thông báo");
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = (trpc as any).broadcasts.delete.useMutation({
    onSuccess: () => {
      (utils as any).broadcasts.getAll.invalidate();
      (utils as any).broadcasts.getActive.invalidate();
      toast.success("Đã xóa thông báo");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleActiveMutation = (trpc as any).broadcasts.update.useMutation({
    onSuccess: () => {
      (utils as any).broadcasts.getAll.invalidate();
      (utils as any).broadcasts.getActive.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!form.message.trim()) { toast.error("Vui lòng nhập nội dung"); return; }
    const payload = {
      title: form.title,
      message: form.message,
      type: form.type,
      isPinned: form.isPinned,
      expiresAt: form.expiresAt || undefined,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (b: any) => {
    setForm({
      title: b.title,
      message: b.message,
      type: b.type as BroadcastType,
      isPinned: b.isPinned ?? false,
      expiresAt: b.expiresAt ? new Date(b.expiresAt).toISOString().slice(0, 16) : "",
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <DashboardLayoutCustom>
      <div className="max-w-3xl mx-auto space-y-4 p-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-violet-600" /> Thông Báo Hệ Thống
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Quản lý thông báo hiển thị trên Dashboard admin</p>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="h-8 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700">
              <Plus className="h-3.5 w-3.5" /> Tạo thông báo
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">{editingId !== null ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</h2>
              <button onClick={handleCancel} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Tiêu đề</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Bảo trì hệ thống lúc 2:00 sáng"
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Nội dung</Label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Mô tả chi tiết thông báo..."
                  rows={3}
                  className="mt-1 text-sm resize-none"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Loại thông báo</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {(Object.keys(TYPE_CONFIG) as BroadcastType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                        form.type === t
                          ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].border} ${TYPE_CONFIG[t].textColor} ring-1 ring-offset-0`
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {TYPE_ICONS[t]}
                      {TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Hết hạn (tuỳ chọn)</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-xs text-gray-600">Ghim lên đầu</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${TYPE_CONFIG[form.type].bg} ${TYPE_CONFIG[form.type].border}`}>
              <div className="flex-shrink-0 mt-0.5">{TYPE_ICONS[form.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${TYPE_CONFIG[form.type].textColor}`}>{form.title || "Tiêu đề thông báo"}</p>
                <p className={`text-xs mt-0.5 ${TYPE_CONFIG[form.type].textColor} opacity-80`}>{form.message || "Nội dung thông báo..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-700">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                {editingId !== null ? "Lưu thay đổi" : "Tạo thông báo"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs">Hủy</Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (broadcasts as any[]).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
              <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Chưa có thông báo nào</p>
              <p className="text-xs text-gray-300 mt-1">Tạo thông báo để hiển thị trên Dashboard</p>
            </div>
          ) : (
            (broadcasts as any[]).map((b: any) => {
              const cfg = TYPE_CONFIG[b.type as BroadcastType] || TYPE_CONFIG.info;
              return (
                <div key={b.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition ${
                  b.isActive ? `${cfg.bg} ${cfg.border}` : "bg-gray-50 border-gray-200 opacity-60"
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {b.isActive ? TYPE_ICONS[b.type as BroadcastType] : <X className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <p className={`text-sm font-semibold ${b.isActive ? cfg.textColor : "text-gray-500"}`}>{b.title}</p>
                      {b.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-xs bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-md">
                          <Star className="h-2.5 w-2.5" /> Ghim
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${cfg.badgeClass}`}>{cfg.label}</span>
                      {!b.isActive && <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md">Đã tắt</span>}
                    </div>
                    <p className={`text-xs ${b.isActive ? `${cfg.textColor} opacity-80` : "text-gray-400"}`}>{b.message}</p>
                    {b.expiresAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Hết hạn: {new Date(b.expiresAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: b.id, isActive: !b.isActive })}
                      className={`h-6 px-2 text-xs rounded-md border transition ${
                        b.isActive ? "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {b.isActive ? "Tắt" : "Bật"}
                    </button>
                    <button
                      onClick={() => handleEdit(b)}
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/10 text-gray-500 transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: b.id })}
                      disabled={deleteMutation.isPending}
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
