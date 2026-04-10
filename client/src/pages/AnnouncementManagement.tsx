/**
 * AnnouncementManagement - Quản lý thông báo banner & popup cho trang khách
 * Admin có thể tạo, chỉnh sửa, bật/tắt, xóa thông báo
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Bell, Info, CheckCircle, AlertTriangle, AlertCircle, Megaphone } from "@/components/Icon";
import { toast } from "sonner";

type AnnouncementType = "info" | "success" | "warning" | "error";

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; icon: React.ReactNode }> = {
  info: { label: "Thông tin", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Info className="w-4 h-4" /> },
  success: { label: "Thành công", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle className="w-4 h-4" /> },
  warning: { label: "Cảnh báo", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle className="w-4 h-4" /> },
  error: { label: "Khẩn cấp", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle className="w-4 h-4" /> },
};

const BANNER_BG: Record<AnnouncementType, string> = {
  info: "bg-blue-600",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  error: "bg-red-600",
};

interface FormState {
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  showAsPopup: boolean;
  startAt: string;
  endAt: string;
}

// Trả về datetime-local string theo giờ địa phương (không phải UTC)
const toLocalDatetimeString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Parse datetime-local string (local time) thành Date object
const parseDatetimeLocal = (s: string): Date => {
  // datetime-local format: "YYYY-MM-DDTHH:mm" → interpreted as local time
  return new Date(s);
};

const defaultForm: FormState = {
  title: "",
  content: "",
  type: "info",
  isActive: true,
  showAsPopup: false,
  startAt: toLocalDatetimeString(new Date()),
  endAt: "",
};

export default function AnnouncementManagement() {

  const utils = trpc.useUtils();
  const { data: announcements = [], isLoading } = trpc.announcement.list.useQuery();
  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã tạo thông báo"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã cập nhật"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã xóa thông báo"); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content,
      type: a.type as AnnouncementType,
      isActive: a.isActive,
      showAsPopup: a.showAsPopup,
      startAt: a.startAt ? toLocalDatetimeString(new Date(a.startAt)) : toLocalDatetimeString(new Date()),
      endAt: a.endAt ? toLocalDatetimeString(new Date(a.endAt)) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      isActive: form.isActive,
      showAsPopup: form.showAsPopup,
      startAt: form.startAt ? new Date(form.startAt) : undefined,
      endAt: form.endAt ? new Date(form.endAt) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (a: any) => {
    updateMutation.mutate({ id: a.id, isActive: !a.isActive });
  };

  const activeCount = (announcements as any[]).filter((a: any) => a.isActive).length;
  const popupCount = (announcements as any[]).filter((a: any) => a.showAsPopup && a.isActive).length;

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Quản Lý Thông Báo</h1>
            <p className="ak-page-subtitle">Tạo và quản lý thông báo hiển thị cho khách hàng</p>
          </div>
        </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo thông báo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(announcements as any[]).length}</p>
                <p className="text-xs text-muted-foreground">Tổng thông báo</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Đang hiển thị</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{popupCount}</p>
                <p className="text-xs text-muted-foreground">Popup đang bật</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách thông báo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
            ) : (announcements as any[]).length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Chưa có thông báo nào</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Tạo thông báo đầu tiên để hiển thị trên trang khách</p>
                <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo ngay
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {(announcements as any[]).map((a: any) => {
                  const cfg = TYPE_CONFIG[a.type as AnnouncementType] || TYPE_CONFIG.info;
                  const bgCls = BANNER_BG[a.type as AnnouncementType] || BANNER_BG.info;
                  return (
                    <div key={a.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                      {/* Preview strip */}
                      <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${bgCls}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{a.title}</span>
                          <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                          {a.showAsPopup && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                              Popup
                            </Badge>
                          )}
                          {!a.isActive && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                              Tắt
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
                          <span>Bắt đầu: {new Date(a.startAt).toLocaleDateString("vi-VN")}</span>
                          {a.endAt && <span>Kết thúc: {new Date(a.endAt).toLocaleDateString("vi-VN")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={a.isActive}
                          onCheckedChange={() => toggleActive(a)}
                          title={a.isActive ? "Đang bật" : "Đang tắt"}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(a.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tiêu đề <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ví dụ: Chào mừng bạn đến với ShopKey!"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Nội dung chi tiết của thông báo..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loại thông báo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AnnouncementType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Thông tin (xanh)</SelectItem>
                    <SelectItem value="success">Thành công (xanh lá)</SelectItem>
                    <SelectItem value="warning">Cảnh báo (vàng)</SelectItem>
                    <SelectItem value="error">Khẩn cấp (đỏ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hiển thị dạng</Label>
                <Select value={form.showAsPopup ? "popup" : "banner"} onValueChange={v => setForm(f => ({ ...f, showAsPopup: v === "popup" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner (thanh trên đầu)</SelectItem>
                    <SelectItem value="popup">Popup (hộp thoại)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc <span className="text-muted-foreground text-xs">(tùy chọn)</span></Label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Kích hoạt ngay</p>
                <p className="text-xs text-muted-foreground">Thông báo sẽ hiển thị ngay sau khi lưu</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Lưu thay đổi" : "Tạo thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirmId) { deleteMutation.mutate({ id: deleteConfirmId }); setDeleteConfirmId(null); } }}
              disabled={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
