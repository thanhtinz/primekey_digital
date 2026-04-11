/**
 * NotificationsAdmin - Gộp 3 loại thông báo:
 * Tab 1: Thông Báo Khách Hàng (customerNotif - gửi vào chuông bell của khách)
 * Tab 2: Thông Báo Website (announcement - banner/popup trên trang khách)
 * Tab 3: Thông Báo Dashboard (broadcasts - dải thông báo trên admin dashboard)
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Edit, Star, X, Loader2, Globe, LayoutDashboard,
} from "@/components/Icon";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnnouncementType = "info" | "success" | "warning" | "error";
type BroadcastType = "info" | "warning" | "success" | "error";

// ─── Config ───────────────────────────────────────────────────────────────────
const ANN_TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  info:    { label: "Thông tin",  color: "bg-blue-100 text-blue-700 border-blue-200",     bg: "bg-blue-500",    icon: <Info className="w-4 h-4" /> },
  success: { label: "Thành công", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bg: "bg-emerald-500", icon: <CheckCircle className="w-4 h-4" /> },
  warning: { label: "Cảnh báo",  color: "bg-amber-100 text-amber-700 border-amber-200",   bg: "bg-amber-500",   icon: <AlertTriangle className="w-4 h-4" /> },
  error:   { label: "Khẩn cấp",  color: "bg-red-100 text-red-700 border-red-200",         bg: "bg-red-500",     icon: <AlertCircle className="w-4 h-4" /> },
};

const BC_TYPE_CONFIG: Record<BroadcastType, { label: string; bg: string; border: string; textColor: string; badgeClass: string }> = {
  info:    { label: "Thông tin",     bg: "bg-blue-50",   border: "border-blue-200",   textColor: "text-blue-800",   badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
  warning: { label: "Cảnh báo",     bg: "bg-amber-50",  border: "border-amber-200",  textColor: "text-amber-800",  badgeClass: "bg-amber-100 text-amber-700 border-amber-200" },
  success: { label: "Thành công",   bg: "bg-emerald-50",border: "border-emerald-200",textColor: "text-emerald-800",badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  error:   { label: "Lỗi / Khẩn cấp", bg: "bg-red-50",  border: "border-red-200",    textColor: "text-red-800",    badgeClass: "bg-red-100 text-red-700 border-red-200" },
};

const BC_TYPE_ICONS: Record<BroadcastType, React.ReactNode> = {
  info:    <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  error:   <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const NOTIF_TYPE_OPTIONS = [
  { value: "info",    label: "Thông tin",  icon: Info,         color: "bg-blue-100 text-blue-700" },
  { value: "success", label: "Thành công", icon: CheckCircle,  color: "bg-green-100 text-green-700" },
  { value: "warning", label: "Cảnh báo",  icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700" },
  { value: "order",   label: "Đơn hàng",  icon: ShoppingBag,  color: "bg-purple-100 text-purple-700" },
  { value: "payment", label: "Thanh toán", icon: CreditCard,   color: "bg-emerald-100 text-emerald-700" },
  { value: "promo",   label: "Khuyến mãi", icon: Tag,          color: "bg-orange-100 text-orange-700" },
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
type TabId = "customer" | "website" | "dashboard";

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "customer",  label: "Khách Hàng",  icon: <Bell className="h-4 w-4" />,          desc: "Gửi vào chuông bell của khách" },
  { id: "website",   label: "Website",     icon: <Globe className="h-4 w-4" />,          desc: "Banner/popup trên trang khách" },
  { id: "dashboard", label: "Dashboard",   icon: <LayoutDashboard className="h-4 w-4" />, desc: "Dải thông báo trên admin" },
];

function TabBar({ active, onChange, counts }: { active: TabId; onChange: (t: TabId) => void; counts: Record<TabId, number> }) {
  return (
    <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden">
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center gap-0.5 px-4 py-3 text-sm font-medium transition-all relative
            ${active === tab.id
              ? "text-blue-600 bg-blue-50/60"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }
            ${i > 0 ? "border-l border-gray-200" : ""}
          `}
        >
          <div className="flex items-center gap-1.5">
            {tab.icon}
            <span>{tab.label}</span>
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold ${
              active === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}>{counts[tab.id]}</span>
          </div>
          <span className="text-xs font-normal opacity-60 hidden sm:block">{tab.desc}</span>
          {/* Active underline */}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
          )}
        </button>
      ))}
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
    onSuccess: () => { toast.success("Đã gửi thông báo!"); setNotifForm(f => ({ ...f, customerEmail: "", title: "", message: "", link: "" })); },
    onError: (e) => toast.error("Lỗi: " + e.message),
  });
  const broadcastNotif = trpc.customerNotif.broadcast.useMutation({
    onSuccess: (data) => { toast.success(`Đã gửi đến ${data.count} khách hàng!`); setNotifForm(f => ({ ...f, title: "", message: "", link: "" })); },
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
  const defaultAnnForm = { title: "", content: "", type: "info" as AnnouncementType, isActive: true, showAsPopup: false, targetPages: ["all"], startAt: toLocalDatetimeString(new Date()), endAt: "" };
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

  // ── Tab 3: System Broadcasts ────────────────────────────────────────────────
  const { data: broadcasts = [], isLoading: bcLoading } = (trpc as any).broadcasts.getAll.useQuery();
  const [bcForm, setBcForm] = useState({ title: "", message: "", type: "info" as BroadcastType, isPinned: false, expiresAt: "" });
  const [editingBcId, setEditingBcId] = useState<number | null>(null);
  const [showBcForm, setShowBcForm] = useState(false);
  const EMPTY_BC = { title: "", message: "", type: "info" as BroadcastType, isPinned: false, expiresAt: "" };

  const createBcMutation = (trpc as any).broadcasts.create.useMutation({
    onSuccess: () => { (utils as any).broadcasts.getAll.invalidate(); (utils as any).broadcasts.getActive.invalidate(); toast.success("Đã tạo thông báo"); setBcForm(EMPTY_BC); setShowBcForm(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateBcMutation = (trpc as any).broadcasts.update.useMutation({
    onSuccess: () => { (utils as any).broadcasts.getAll.invalidate(); (utils as any).broadcasts.getActive.invalidate(); toast.success("Đã cập nhật"); setBcForm(EMPTY_BC); setEditingBcId(null); setShowBcForm(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteBcMutation = (trpc as any).broadcasts.delete.useMutation({
    onSuccess: () => { (utils as any).broadcasts.getAll.invalidate(); (utils as any).broadcasts.getActive.invalidate(); toast.success("Đã xóa"); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleBcMutation = (trpc as any).broadcasts.update.useMutation({
    onSuccess: () => { (utils as any).broadcasts.getAll.invalidate(); (utils as any).broadcasts.getActive.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmitBc = () => {
    if (!bcForm.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!bcForm.message.trim()) { toast.error("Vui lòng nhập nội dung"); return; }
    const payload = { title: bcForm.title, message: bcForm.message, type: bcForm.type, isPinned: bcForm.isPinned, expiresAt: bcForm.expiresAt || undefined };
    if (editingBcId !== null) { updateBcMutation.mutate({ id: editingBcId, ...payload }); }
    else { createBcMutation.mutate(payload); }
  };
  const handleEditBc = (b: any) => {
    setBcForm({ title: b.title, message: b.message, type: b.type as BroadcastType, isPinned: b.isPinned ?? false, expiresAt: b.expiresAt ? new Date(b.expiresAt).toISOString().slice(0, 16) : "" });
    setEditingBcId(b.id);
    setShowBcForm(true);
  };

  // ── Counts for tab badges ──────────────────────────────────────────────────
  const counts: Record<TabId, number> = {
    customer:  (customers.data?.length ?? 0),
    website:   (announcements as any[]).length,
    dashboard: (broadcasts as any[]).length,
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Thông Báo</h1>
            <p className="ak-page-subtitle">Quản lý thông báo khách hàng, website và dashboard admin</p>
          </div>
          {activeTab === "customer" ? (
            <Button onClick={handleSendNotif} disabled={createNotif.isPending || broadcastNotif.isPending} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Send className="w-4 h-4" /> Gửi Thông Báo
            </Button>
          ) : activeTab === "website" ? (
            <Button onClick={openCreateAnn} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Tạo Thông Báo
            </Button>
          ) : (
            !showBcForm && (
              <Button onClick={() => { setBcForm(EMPTY_BC); setEditingBcId(null); setShowBcForm(true); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4" /> Tạo Thông Báo
              </Button>
            )
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

            {/* ── Tab 3: System Broadcasts ── */}
            {activeTab === "dashboard" && (
              <div className="space-y-3">
                {/* Inline form */}
                {showBcForm && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-800">{editingBcId !== null ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</h2>
                      <button onClick={() => { setBcForm(EMPTY_BC); setEditingBcId(null); setShowBcForm(false); }} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-medium text-gray-600">Tiêu đề</Label>
                        <Input value={bcForm.title} onChange={e => setBcForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Bảo trì hệ thống lúc 2:00 sáng" className="mt-1 h-8 text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-medium text-gray-600">Nội dung</Label>
                        <Textarea value={bcForm.message} onChange={e => setBcForm(f => ({ ...f, message: e.target.value }))} placeholder="Mô tả chi tiết..." rows={3} className="mt-1 text-sm resize-none" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Loại thông báo</Label>
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          {(Object.keys(BC_TYPE_CONFIG) as BroadcastType[]).map(t => (
                            <button key={t} onClick={() => setBcForm(f => ({ ...f, type: t }))}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                                bcForm.type === t
                                  ? `${BC_TYPE_CONFIG[t].bg} ${BC_TYPE_CONFIG[t].border} ${BC_TYPE_CONFIG[t].textColor} ring-1`
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {BC_TYPE_ICONS[t]}
                              {BC_TYPE_CONFIG[t].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Hết hạn (tuỳ chọn)</Label>
                          <Input type="datetime-local" value={bcForm.expiresAt} onChange={e => setBcForm(f => ({ ...f, expiresAt: e.target.value }))} className="mt-1 h-8 text-xs" />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={bcForm.isPinned} onChange={e => setBcForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                          <span className="text-xs text-gray-600">Ghim lên đầu</span>
                        </label>
                      </div>
                    </div>
                    {/* Preview */}
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${BC_TYPE_CONFIG[bcForm.type].bg} ${BC_TYPE_CONFIG[bcForm.type].border}`}>
                      <div className="flex-shrink-0 mt-0.5">{BC_TYPE_ICONS[bcForm.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${BC_TYPE_CONFIG[bcForm.type].textColor}`}>{bcForm.title || "Tiêu đề thông báo"}</p>
                        <p className={`text-xs mt-0.5 ${BC_TYPE_CONFIG[bcForm.type].textColor} opacity-80`}>{bcForm.message || "Nội dung..."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSubmitBc} disabled={createBcMutation.isPending || updateBcMutation.isPending} size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                        {(createBcMutation.isPending || updateBcMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                        {editingBcId !== null ? "Lưu thay đổi" : "Tạo thông báo"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setBcForm(EMPTY_BC); setEditingBcId(null); setShowBcForm(false); }} className="h-8 text-xs">Hủy</Button>
                    </div>
                  </div>
                )}

                {/* List */}
                {bcLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                  </div>
                ) : (broadcasts as any[]).length === 0 ? (
                  <div className="ak-empty py-12">
                    <div className="ak-empty-icon"><Megaphone className="h-6 w-6" /></div>
                    <div className="ak-empty-title">Chưa có thông báo dashboard</div>
                    <div className="ak-empty-desc">Tạo thông báo để hiển thị dải cảnh báo trên admin</div>
                    <Button onClick={() => { setBcForm(EMPTY_BC); setEditingBcId(null); setShowBcForm(true); }} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" /> Tạo ngay
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(broadcasts as any[]).map((b: any) => {
                      const cfg = BC_TYPE_CONFIG[b.type as BroadcastType] || BC_TYPE_CONFIG.info;
                      return (
                        <div key={b.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition ${b.isActive ? `${cfg.bg} ${cfg.border}` : "bg-gray-50 border-gray-200 opacity-60"}`}>
                          <div className="flex-shrink-0 mt-0.5">{b.isActive ? BC_TYPE_ICONS[b.type as BroadcastType] : <X className="h-4 w-4 text-gray-400" />}</div>
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
                            {b.expiresAt && <p className="text-xs text-gray-400 mt-0.5">Hết hạn: {new Date(b.expiresAt).toLocaleString("vi-VN")}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleBcMutation.mutate({ id: b.id, isActive: !b.isActive })}
                              className={`h-6 px-2 text-xs rounded-md border transition ${b.isActive ? "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}
                            >
                              {b.isActive ? "Tắt" : "Bật"}
                            </button>
                            <button onClick={() => handleEditBc(b)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/10 text-gray-500 transition">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteBcMutation.mutate({ id: b.id })} disabled={deleteBcMutation.isPending} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition">
                              <Trash2 className="h-3.5 w-3.5" />
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
                    <input type="checkbox" checked={annForm.targetPages.includes(opt.value)}
                      onChange={e => {
                        if (opt.value === "all") { setAnnForm(f => ({ ...f, targetPages: e.target.checked ? ["all"] : [] })); }
                        else { setAnnForm(f => ({ ...f, targetPages: e.target.checked ? [...f.targetPages.filter(p => p !== "all"), opt.value] : f.targetPages.filter(p => p !== opt.value) })); }
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
