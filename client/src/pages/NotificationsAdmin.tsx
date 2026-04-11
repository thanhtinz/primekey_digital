/**
 * NotificationsAdmin - Quản lý thông báo:
 * Tab 1: Thông Báo Khách Hàng (customerNotif - gửi vào chuông bell của khách)
 * Tab 2: Thông Báo Website (announcement - banner/popup trên trang khách)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, Send, Users, Info, CheckCircle, AlertTriangle, AlertCircle,
  ShoppingBag, CreditCard, Tag, Megaphone, Plus, Pencil, Trash2,
  Loader2, Globe,
} from "@/components/Icon";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnnouncementType = "info" | "success" | "warning" | "error";

// ─── Config ───────────────────────────────────────────────────────────────────
const ANN_TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  info:    { label: "Thông tin",  color: "bg-blue-100 text-blue-700 border-blue-200",          bg: "bg-blue-500",    icon: <Info className="w-4 h-4" /> },
  success: { label: "Thành công", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bg: "bg-emerald-500", icon: <CheckCircle className="w-4 h-4" /> },
  warning: { label: "Cảnh báo",  color: "bg-amber-100 text-amber-700 border-amber-200",        bg: "bg-amber-500",   icon: <AlertTriangle className="w-4 h-4" /> },
  error:   { label: "Khẩn cấp",  color: "bg-red-100 text-red-700 border-red-200",              bg: "bg-red-500",     icon: <AlertCircle className="w-4 h-4" /> },
};

const NOTIF_TYPE_OPTIONS = [
  { value: "info",    label: "Thông tin",  icon: Info,          color: "bg-blue-100 text-blue-700" },
  { value: "success", label: "Thành công", icon: CheckCircle,   color: "bg-green-100 text-green-700" },
  { value: "warning", label: "Cảnh báo",  icon: AlertTriangle,  color: "bg-yellow-100 text-yellow-700" },
  { value: "order",   label: "Đơn hàng",  icon: ShoppingBag,   color: "bg-purple-100 text-purple-700" },
  { value: "payment", label: "Thanh toán", icon: CreditCard,    color: "bg-emerald-100 text-emerald-700" },
  { value: "promo",   label: "Khuyến mãi", icon: Tag,           color: "bg-orange-100 text-orange-700" },
];

const PAGE_OPTIONS = [
  { value: "all",            label: "Tất cả các trang" },
  { value: "home",           label: "Trang chủ" },
  { value: "products",       label: "Trang sản phẩm" },
  { value: "product-detail", label: "Chi tiết sản phẩm" },
  { value: "cart",           label: "Giỏ hàng" },
  { value: "checkout",       label: "Thanh toán" },
  { value: "track-order",    label: "Tra cứu đơn hàng" },
  { value: "blog",           label: "Blog" },
  { value: "my-account",     label: "Tài khoản" },
];

const toLocalDatetimeString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
type TabId = "customer" | "website";

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string; color: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  {
    id: "customer", label: "Khách Hàng", icon: <Bell className="h-5 w-5" />,
    desc: "Gửi vào chuông bell của khách",
    color: "text-violet-500", activeBg: "bg-violet-50", activeText: "text-violet-700", activeBorder: "border-violet-500",
  },
  {
    id: "website", label: "Website", icon: <Globe className="h-5 w-5" />,
    desc: "Banner/popup trên trang khách",
    color: "text-sky-500", activeBg: "bg-sky-50", activeText: "text-sky-700", activeBorder: "border-sky-500",
  },
];

function TabBar({ active, onChange, counts }: { active: TabId; onChange: (t: TabId) => void; counts: Record<TabId, number> }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50/80 border-b border-gray-200">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200
              ${
                isActive
                  ? `${tab.activeBg} ${tab.activeBorder} shadow-sm`
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }
            `}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${isActive ? `${tab.activeBg} ${tab.color}` : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}
            `}>
              {tab.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${isActive ? tab.activeText : "text-gray-700"}`}>{tab.label}</span>
                <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex-shrink-0
                  ${isActive ? `${tab.activeBg} ${tab.activeText}` : "bg-gray-100 text-gray-500"}
                `}>{counts[tab.id]}</span>
              </div>
              <p className={`text-xs mt-0.5 truncate ${isActive ? tab.color : "text-gray-400"}`}>{tab.desc}</p>
            </div>
            {isActive && (
              <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${tab.color.replace("text-", "bg-")}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationsAdmin() {
  const { token } = useCustomerAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<TabId>("customer");

  // ── Tab 1: Customer Notifications ──────────────────────────────────────────
  const customers = trpc.customers.list.useQuery();
  const [notifForm, setNotifForm] = useState({
    customerEmail: "", title: "", message: "",
    type: "info" as "info" | "success" | "warning" | "order" | "payment" | "promo",
    link: "", sendToAll: false,
  });
  const createNotif = trpc.customerNotif.create.useMutation({
    onSuccess: () => {
      toast.success("Đã gửi thông báo!");
      setNotifForm(f => ({ ...f, customerEmail: "", title: "", message: "", link: "" }));
    },
    onError: (e) => toast.error("Lỗi: " + e.message),
  });
  const broadcastNotif = trpc.customerNotif.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã gửi đến ${data.count} khách hàng!`);
      setNotifForm(f => ({ ...f, title: "", message: "", link: "" }));
    },
    onError: (e) => toast.error("Lỗi: " + e.message),
  });
  const handleSendNotif = () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) { toast.error("Vui lòng nhập tiêu đề và nội dung"); return; }
    if (notifForm.sendToAll) {
      broadcastNotif.mutate({ token: token || "", title: notifForm.title, message: notifForm.message, type: notifForm.type, link: notifForm.link || undefined });
    } else {
      if (!notifForm.customerEmail) { toast.error("Vui lòng chọn khách hàng"); return; }
      createNotif.mutate({ token: token || "", customerEmail: notifForm.customerEmail, title: notifForm.title, message: notifForm.message, type: notifForm.type, link: notifForm.link || undefined });
    }
  };
  const selectedNotifType = NOTIF_TYPE_OPTIONS.find(t => t.value === notifForm.type);

  // ── Tab 2: Site Announcements ───────────────────────────────────────────────
  const { data: announcements = [], isLoading: annLoading } = trpc.announcement.list.useQuery();
  const createAnnMutation = trpc.announcement.create.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã tạo thông báo"); setAnnDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateAnnMutation = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã cập nhật"); setAnnDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAnnMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => { utils.announcement.list.invalidate(); toast.success("Đã xóa"); },
    onError: (e) => toast.error(e.message),
  });
  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<number | null>(null);
  const [deleteAnnId, setDeleteAnnId] = useState<number | null>(null);
  const defaultAnnForm = {
    title: "", content: "", type: "info" as AnnouncementType,
    isActive: true, showAsPopup: false, targetPages: ["all"],
    startAt: toLocalDatetimeString(new Date()), endAt: "",
  };
  const [annForm, setAnnForm] = useState(defaultAnnForm);

  const openCreateAnn = () => { setEditingAnnId(null); setAnnForm(defaultAnnForm); setAnnDialogOpen(true); };
  const openEditAnn = (a: any) => {
    setEditingAnnId(a.id);
    setAnnForm({
      title: a.title, content: a.content, type: a.type as AnnouncementType,
      isActive: a.isActive, showAsPopup: a.showAsPopup,
      targetPages: a.targetPages ? (() => { try { return JSON.parse(a.targetPages); } catch { return ["all"]; } })() : ["all"],
      startAt: a.startAt ? toLocalDatetimeString(new Date(a.startAt)) : toLocalDatetimeString(new Date()),
      endAt: a.endAt ? toLocalDatetimeString(new Date(a.endAt)) : "",
    });
    setAnnDialogOpen(true);
  };
  const handleSubmitAnn = () => {
    if (!annForm.title.trim() || !annForm.content.trim()) { toast.error("Vui lòng nhập tiêu đề và nội dung"); return; }
    const payload = {
      title: annForm.title.trim(), content: annForm.content.trim(), type: annForm.type,
      isActive: annForm.isActive, showAsPopup: annForm.showAsPopup,
      targetPages: JSON.stringify(annForm.targetPages),
      startAt: annForm.startAt ? new Date(annForm.startAt) : undefined,
      endAt: annForm.endAt ? new Date(annForm.endAt) : undefined,
    };
    if (editingAnnId) { updateAnnMutation.mutate({ id: editingAnnId, ...payload }); }
    else { createAnnMutation.mutate(payload); }
  };

  // ── Counts for tab badges ──────────────────────────────────────────────────
  const counts: Record<TabId, number> = {
    customer: customers.data?.length ?? 0,
    website:  (announcements as any[]).length,
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Thông Báo</h1>
            <p className="ak-page-subtitle">Quản lý thông báo khách hàng và thông báo trên website</p>
          </div>
          {activeTab === "customer" ? (
            <Button onClick={handleSendNotif} disabled={createNotif.isPending || broadcastNotif.isPending} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Send className="w-4 h-4" /> Gửi Thông Báo
            </Button>
          ) : (
            <Button onClick={openCreateAnn} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Tạo Thông Báo
            </Button>
          )}
        </div>

        {/* Tab Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TabBar active={activeTab} onChange={setActiveTab} counts={counts} />

          <div className="p-5">

            {/* ── Tab 1: Customer Notifications ── */}
            {activeTab === "customer" && (
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Send to all toggle */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Gửi đến tất cả khách hàng</p>
                    <p className="text-xs text-muted-foreground">Broadcast thông báo đến toàn bộ khách hàng đã đăng ký</p>
                  </div>
                  <button
                    onClick={() => setNotifForm(f => ({ ...f, sendToAll: !f.sendToAll }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifForm.sendToAll ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${notifForm.sendToAll ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Customer selector */}
                {!notifForm.sendToAll && (
                  <div className="space-y-1.5">
                    <Label>Khách hàng</Label>
                    <Select value={notifForm.customerEmail} onValueChange={v => setNotifForm(f => ({ ...f, customerEmail: v }))}>
                      <SelectTrigger><SelectValue placeholder="Chọn khách hàng..." /></SelectTrigger>
                      <SelectContent>
                        {customers.data?.filter(c => c.email).map(c => (
                          <SelectItem key={c.email!} value={c.email!}>
                            <span className="font-medium">{c.name || c.email}</span>
                            {c.name && <span className="text-muted-foreground ml-1 text-xs">({c.email})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Type */}
                <div className="space-y-1.5">
                  <Label>Loại thông báo</Label>
                  <div className="flex flex-wrap gap-2">
                    {NOTIF_TYPE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setNotifForm(f => ({ ...f, type: t.value as typeof notifForm.type }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${notifForm.type === t.value ? t.color + " border-current" : "border-border text-muted-foreground hover:border-primary/50"}`}
                      >
                        <t.icon className="h-3 w-3" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label>Tiêu đề</Label>
                  <Input placeholder="Ví dụ: Đơn hàng của bạn đã được xác nhận" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label>Nội dung</Label>
                  <Textarea placeholder="Nội dung chi tiết của thông báo..." value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} rows={3} />
                </div>

                {/* Link */}
                <div className="space-y-1.5">
                  <Label>Link (tuỳ chọn)</Label>
                  <Input placeholder="Ví dụ: /order/INV-XXXXX" value={notifForm.link} onChange={e => setNotifForm(f => ({ ...f, link: e.target.value }))} />
                </div>

                {/* Preview */}
                {(notifForm.title || notifForm.message) && (
                  <div className="p-3 rounded-lg border bg-gray-50 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Xem trước</p>
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-full ${selectedNotifType?.color || "bg-blue-100 text-blue-700"}`}>
                        {selectedNotifType && <selectedNotifType.icon className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{notifForm.title || "Tiêu đề thông báo"}</p>
                        <p className="text-xs text-muted-foreground">{notifForm.message || "Nội dung thông báo..."}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSendNotif} disabled={createNotif.isPending || broadcastNotif.isPending} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                  {notifForm.sendToAll ? "Gửi đến tất cả khách hàng" : "Gửi thông báo"}
                </Button>
              </div>
            )}

            {/* ── Tab 2: Site Announcements ── */}
            {activeTab === "website" && (
              <div className="space-y-3">
                {annLoading ? (
                  <div className="py-10 text-center text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                  </div>
                ) : (announcements as any[]).length === 0 ? (
                  <div className="ak-empty py-12">
                    <div className="ak-empty-icon"><Megaphone className="h-6 w-6" /></div>
                    <div className="ak-empty-title">Chưa có thông báo website nào</div>
                    <div className="ak-empty-desc">Tạo banner hoặc popup hiển thị trên trang khách hàng</div>
                    <Button onClick={openCreateAnn} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" /> Tạo ngay
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {(announcements as any[]).map((a: any) => {
                      const cfg = ANN_TYPE_CONFIG[a.type as AnnouncementType] || ANN_TYPE_CONFIG.info;
                      return (
                        <div key={a.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!a.isActive ? "opacity-60" : ""}`}>
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bg}`} />
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm text-gray-900">{a.title}</span>
                              <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                              {a.showAsPopup && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">Popup</Badge>}
                              {!a.isActive && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Tắt</Badge>}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{a.content}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                              <span>Bắt đầu: {new Date(a.startAt).toLocaleDateString("vi-VN")}</span>
                              {a.endAt && <span>Kết thúc: {new Date(a.endAt).toLocaleDateString("vi-VN")}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch checked={a.isActive} onCheckedChange={() => updateAnnMutation.mutate({ id: a.id, isActive: !a.isActive })} />
                            <button onClick={() => openEditAnn(a)} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteAnnId(a.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Announcement Create/Edit Dialog ── */}
      <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnId ? "Chỉnh sửa thông báo website" : "Tạo thông báo website mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Input placeholder="Ví dụ: Chào mừng bạn đến với cửa hàng!" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung <span className="text-red-500">*</span></Label>
              <Textarea placeholder="Nội dung chi tiết..." value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loại thông báo</Label>
                <Select value={annForm.type} onValueChange={v => setAnnForm(f => ({ ...f, type: v as AnnouncementType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={annForm.showAsPopup ? "popup" : "banner"} onValueChange={v => setAnnForm(f => ({ ...f, showAsPopup: v === "popup" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="datetime-local" value={annForm.startAt} onChange={e => setAnnForm(f => ({ ...f, startAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc <span className="text-gray-400 text-xs">(tùy chọn)</span></Label>
                <Input type="datetime-local" value={annForm.endAt} onChange={e => setAnnForm(f => ({ ...f, endAt: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hiển thị trên trang</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                {PAGE_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={annForm.targetPages.includes(opt.value)}
                      onChange={e => {
                        if (opt.value === "all") {
                          setAnnForm(f => ({ ...f, targetPages: e.target.checked ? ["all"] : [] }));
                        } else {
                          setAnnForm(f => ({
                            ...f,
                            targetPages: e.target.checked
                              ? [...f.targetPages.filter(p => p !== "all"), opt.value]
                              : f.targetPages.filter(p => p !== opt.value),
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Kích hoạt ngay</p>
                <p className="text-xs text-gray-400">Thông báo sẽ hiển thị ngay sau khi lưu</p>
              </div>
              <Switch checked={annForm.isActive} onCheckedChange={v => setAnnForm(f => ({ ...f, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitAnn} disabled={createAnnMutation.isPending || updateAnnMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {editingAnnId ? "Lưu thay đổi" : "Tạo thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Announcement Confirm ── */}
      <Dialog open={deleteAnnId !== null} onOpenChange={() => setDeleteAnnId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAnnId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => { if (deleteAnnId) { deleteAnnMutation.mutate({ id: deleteAnnId }); setDeleteAnnId(null); } }} disabled={deleteAnnMutation.isPending}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
