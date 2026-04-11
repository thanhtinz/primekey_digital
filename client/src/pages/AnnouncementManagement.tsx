/**
 * AnnouncementManagement - Quản lý thông báo & banner
 * Gộp 2 tính năng: Thông Báo (popup/banner strip) + Banner (slideshow trang chủ)
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Bell, Info, CheckCircle, AlertTriangle, AlertCircle, Megaphone, ImageIcon, Upload, Link, ExternalLink, GripVertical } from "@/components/Icon";
import { toast } from "sonner";

type AnnouncementType = "info" | "success" | "warning" | "error";

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  info: { label: "Thông tin", color: "bg-blue-100 text-blue-700 border-blue-200", bg: "bg-blue-500", icon: <Info className="w-4 h-4" /> },
  success: { label: "Thành công", color: "bg-emerald-100 text-emerald-700 border-emerald-200", bg: "bg-emerald-500", icon: <CheckCircle className="w-4 h-4" /> },
  warning: { label: "Cảnh báo", color: "bg-amber-100 text-amber-700 border-amber-200", bg: "bg-amber-500", icon: <AlertTriangle className="w-4 h-4" /> },
  error: { label: "Khẩn cấp", color: "bg-red-100 text-red-700 border-red-200", bg: "bg-red-500", icon: <AlertCircle className="w-4 h-4" /> },
};

const PAGE_OPTIONS = [
  { value: "all", label: "Tất cả các trang" },
  { value: "home", label: "Trang chủ" },
  { value: "products", label: "Trang sản phẩm" },
  { value: "product-detail", label: "Chi tiết sản phẩm" },
  { value: "cart", label: "Giỏ hàng" },
  { value: "checkout", label: "Thanh toán" },
  { value: "track-order", label: "Tra cứu đơn hàng" },
  { value: "blog", label: "Blog" },
  { value: "my-account", label: "Tài khoản" },
];

interface AnnouncementForm {
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  showAsPopup: boolean;
  targetPages: string[];
  startAt: string;
  endAt: string;
}

const toLocalDatetimeString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultAnnForm: AnnouncementForm = {
  title: "", content: "", type: "info", isActive: true, showAsPopup: false,
  targetPages: ["all"],
  startAt: toLocalDatetimeString(new Date()), endAt: "",
};

// ─── Image Upload Field for Banners ──────────────────────────────────────────
function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.banner.uploadImage.useMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh quá lớn (tối đa 5MB)"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, mimeType: file.type, fileName: file.name });
        onChange(result.url);
        toast.success("Đã tải ảnh lên");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "upload" ? "default" : "outline"} size="sm" onClick={() => setMode("upload")}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Tải lên
        </Button>
        <Button type="button" variant={mode === "url" ? "default" : "outline"} size="sm" onClick={() => setMode("url")}>
          <Link className="w-3.5 h-3.5 mr-1.5" /> URL
        </Button>
      </div>
      {mode === "upload" ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {value ? (
              <div className="space-y-2">
                <img src={value} alt="Preview" className="w-full max-h-36 object-cover rounded-lg mx-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p className="text-xs text-gray-400">Click để đổi ảnh</p>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <Upload className="w-7 h-7 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400">{uploading ? "Đang tải lên..." : "Click để chọn ảnh (JPG, PNG — tối đa 5MB)"}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input placeholder="https://example.com/banner.jpg" value={value} onChange={(e) => onChange(e.target.value)} />
          {value && <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} />}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnnouncementManagement() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("announcements");

  // Announcements
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
  const [annForm, setAnnForm] = useState<AnnouncementForm>(defaultAnnForm);
  const [deleteAnnId, setDeleteAnnId] = useState<number | null>(null);

  // Banners
  const { data: banners = [], refetch: refetchBanners } = trpc.banner.list.useQuery();
  const createBannerMutation = trpc.banner.create.useMutation({
    onSuccess: () => { toast.success("Đã thêm banner"); setAddingBanner(false); setNewBanner({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 }); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const updateBannerMutation = trpc.banner.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteBannerMutation = trpc.banner.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa banner"); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });

  const [addingBanner, setAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 });

  // Side Banners
  const { data: sideBanners = [], refetch: refetchSideBanners } = trpc.sideBanners.list.useQuery();
  const upsertSideBannerMutation = trpc.sideBanners.upsert.useMutation({
    onSuccess: () => { toast.success("Đã lưu side banner"); refetchSideBanners(); setAddingSideBanner(false); setNewSideBanner({ position: "left", imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSideBannerMutation = trpc.sideBanners.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa side banner"); refetchSideBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const [newSideBanner, setNewSideBanner] = useState({ position: "left" as "left" | "right", imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true });
  const [addingSideBanner, setAddingSideBanner] = useState(false);

  // Mini Banners
  const { data: miniBanners = [], refetch: refetchMiniBanners } = trpc.miniBanners.list.useQuery();
  const upsertMiniBannerMutation = trpc.miniBanners.upsert.useMutation({
    onSuccess: () => { toast.success("Đã lưu mini banner"); refetchMiniBanners(); setAddingMiniBanner(false); setNewMiniBanner({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMiniBannerMutation = trpc.miniBanners.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa mini banner"); refetchMiniBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const [newMiniBanner, setNewMiniBanner] = useState({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true });
  const [addingMiniBanner, setAddingMiniBanner] = useState(false);

  // Announcement handlers
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

  const activeAnnCount = (announcements as any[]).filter((a: any) => a.isActive).length;
  const activeBannerCount = (banners as any[]).filter((b: any) => b.isActive).length;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Thông Báo & Banner</h1>
            <p className="ak-page-subtitle">Quản lý thông báo popup/strip và banner slideshow trang chủ</p>
          </div>
          {activeTab === "announcements" ? (
            <Button onClick={openCreateAnn} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Tạo Thông Báo
            </Button>
          ) : activeTab === "banners" ? (
            <Button onClick={() => setAddingBanner(true)} disabled={addingBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Banner
            </Button>
          ) : activeTab === "side-banners" ? (
            <Button onClick={() => setAddingSideBanner(true)} disabled={addingSideBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Side Banner
            </Button>
          ) : activeTab === "mini-banners" ? (
            <Button onClick={() => setAddingMiniBanner(true)} disabled={addingMiniBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Mini Banner
            </Button>
          ) : null}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-blue-100"><Bell className="h-5 w-5 text-blue-600" /></div>
            <div><div className="ak-stat-value">{(announcements as any[]).length}</div><div className="ak-stat-label">Tổng thông báo</div></div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><div className="ak-stat-value text-green-600">{activeAnnCount}</div><div className="ak-stat-label">Đang hiển thị</div></div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-purple-100"><ImageIcon className="h-5 w-5 text-purple-600" /></div>
            <div><div className="ak-stat-value">{(banners as any[]).length}</div><div className="ak-stat-label">Tổng banner</div></div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-orange-100"><Megaphone className="h-5 w-5 text-orange-600" /></div>
            <div><div className="ak-stat-value text-orange-600">{activeBannerCount}</div><div className="ak-stat-label">Banner đang bật</div></div>
          </div>
        </div>

        {/* ── Custom Tab Bar ── */}
        <div className="flex gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium transition-all ${
              activeTab === "announcements"
                ? "bg-blue-600 text-white shadow-inner"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Thông Báo</span>
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold ${
              activeTab === "announcements" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>{(announcements as any[]).length}</span>
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={() => setActiveTab("banners")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium transition-all ${
              activeTab === "banners"
                ? "bg-blue-600 text-white shadow-inner"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Banner</span>
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold ${
              activeTab === "banners" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>{(banners as any[]).length}</span>
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={() => setActiveTab("side-banners")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium transition-all ${
              activeTab === "side-banners"
                ? "bg-blue-600 text-white shadow-inner"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Side Banner</span>
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold ${
              activeTab === "side-banners" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>{(sideBanners as any[]).length}</span>
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={() => setActiveTab("mini-banners")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium transition-all ${
              activeTab === "mini-banners"
                ? "bg-blue-600 text-white shadow-inner"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Mini Banner</span>
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold ${
              activeTab === "mini-banners" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>{(miniBanners as any[]).length}</span>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── Announcements Tab ── */}
          <TabsContent value="announcements" className="mt-4">
            <div className="ak-card">
              {annLoading ? (
                <div className="p-10 text-center text-gray-400">Đang tải...</div>
              ) : (announcements as any[]).length === 0 ? (
                <div className="ak-empty">
                  <div className="ak-empty-icon"><Megaphone className="h-6 w-6" /></div>
                  <div className="ak-empty-title">Chưa có thông báo nào</div>
                  <div className="ak-empty-desc">Tạo thông báo để hiển thị trên trang khách hàng</div>
                  <Button onClick={openCreateAnn} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Tạo ngay
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(announcements as any[]).map((a: any) => {
                    const cfg = TYPE_CONFIG[a.type as AnnouncementType] || TYPE_CONFIG.info;
                    return (
                      <div key={a.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!a.isActive ? "opacity-60" : ""}`}>
                        {/* Color strip */}
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bg}`} />
                        {/* Type icon */}
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm text-gray-900">{a.title}</span>
                            <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                            {a.showAsPopup && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">Popup</Badge>
                            )}
                            {!a.isActive && (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Tắt</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">{a.content}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span>Bắt đầu: {new Date(a.startAt).toLocaleDateString("vi-VN")}</span>
                            {a.endAt && <span>Kết thúc: {new Date(a.endAt).toLocaleDateString("vi-VN")}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={a.isActive}
                            onCheckedChange={() => updateAnnMutation.mutate({ id: a.id, isActive: !a.isActive })}
                          />
                          <button
                            onClick={() => openEditAnn(a)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteAnnId(a.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Banners Tab ── */}
          <TabsContent value="banners" className="mt-4 space-y-4">
            {/* Add Banner Form */}
            {addingBanner && (
              <div className="ak-card p-5 border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">Banner Mới</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                    <div className="mt-1.5">
                      <ImageUploadField value={newBanner.imageUrl} onChange={(url) => setNewBanner(p => ({ ...p, imageUrl: url }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tiêu đề (tùy chọn)</Label>
                      <Input placeholder="Tiêu đề banner" value={newBanner.title} onChange={(e) => setNewBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Link khi click</Label>
                      <Input placeholder="/catalog hoặc https://..." value={newBanner.linkUrl} onChange={(e) => setNewBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => createBannerMutation.mutate(newBanner)} disabled={!newBanner.imageUrl || createBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {createBannerMutation.isPending ? "Đang lưu..." : "Lưu Banner"}
                    </Button>
                    <Button variant="outline" onClick={() => setAddingBanner(false)}>Hủy</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Banner List */}
            {(banners as any[]).length === 0 && !addingBanner ? (
              <div className="ak-card">
                <div className="ak-empty">
                  <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                  <div className="ak-empty-title">Chưa có banner nào</div>
                  <div className="ak-empty-desc">Thêm banner để hiển thị slideshow trên trang chủ</div>
                  <Button onClick={() => setAddingBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Thêm Banner
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(banners as any[]).map((banner: any) => (
                  <div key={banner.id} className={`ak-card p-4 flex gap-4 items-start ${!banner.isActive ? "opacity-60" : ""}`}>
                    <GripVertical className="w-5 h-5 text-gray-300 mt-2 flex-shrink-0" />
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        className="w-28 h-18 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        style={{ height: "72px" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="w-28 h-18 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0" style={{ height: "72px" }}>
                        <ImageIcon className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{banner.title || "Banner không có tiêu đề"}</p>
                      {banner.linkUrl && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">{banner.linkUrl}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.isActive ?? true}
                            onCheckedChange={(checked) => updateBannerMutation.mutate({ id: banner.id, isActive: checked })}
                          />
                          <span className="text-xs text-gray-500">{banner.isActive ? "Hiển thị" : "Ẩn"}</span>
                        </div>
                        <button
                          onClick={() => { if (confirm("Xóa banner này?")) deleteBannerMutation.mutate({ id: banner.id }); }}
                          className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Side Banners Tab ── */}
          <TabsContent value="side-banners" className="mt-4 space-y-4">
            <div className="ak-card p-4">
              <p className="text-sm text-gray-500 mb-4">ℹ️ Side banner hiển thị hai bên trái/phải của carousel chính trên màn hình PC. Mỗi vị trí chỉ hiển thị 1 banner.</p>
              {addingSideBanner && (
                <div className="border-2 border-blue-200 rounded-xl p-4 mb-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Side Banner Mới</h3>
                  <div>
                    <Label className="text-sm font-medium">Vị trí</Label>
                    <Select value={newSideBanner.position} onValueChange={v => setNewSideBanner(p => ({ ...p, position: v as "left" | "right" }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Bên trái</SelectItem>
                        <SelectItem value="right">Bên phải</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                    <div className="mt-1.5"><ImageUploadField value={newSideBanner.imageUrl} onChange={url => setNewSideBanner(p => ({ ...p, imageUrl: url }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Tiêu đề</Label>
                      <Input placeholder="Tiêu đề (tùy chọn)" value={newSideBanner.title} onChange={e => setNewSideBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Link khi click</Label>
                      <Input placeholder="/catalog hoặc https://..." value={newSideBanner.linkUrl} onChange={e => setNewSideBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => upsertSideBannerMutation.mutate(newSideBanner)} disabled={!newSideBanner.imageUrl || upsertSideBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {upsertSideBannerMutation.isPending ? "Đang lưu..." : "Lưu Side Banner"}
                    </Button>
                    <Button variant="outline" onClick={() => setAddingSideBanner(false)}>Hủy</Button>
                  </div>
                </div>
              )}
              {(sideBanners as any[]).length === 0 && !addingSideBanner ? (
                <div className="ak-empty">
                  <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                  <div className="ak-empty-title">Chưa có side banner</div>
                  <div className="ak-empty-desc">Thêm banner hiển thị hai bên carousel trên PC</div>
                  <Button onClick={() => setAddingSideBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Thêm</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(sideBanners as any[]).map((sb: any) => (
                    <div key={sb.id} className={`flex gap-4 items-start p-3 rounded-xl border border-gray-100 hover:bg-gray-50 ${!sb.isActive ? "opacity-60" : ""}`}>
                      {sb.imageUrl ? (
                        <img src={sb.imageUrl} alt={sb.title || ""} className="w-24 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{sb.title || "Side Banner"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sb.position === "left" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {sb.position === "left" ? "Trái" : "Phải"}
                          </span>
                        </div>
                        {sb.linkUrl && <p className="text-xs text-gray-400 truncate">{sb.linkUrl}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <Switch checked={sb.isActive ?? true} onCheckedChange={checked => upsertSideBannerMutation.mutate({ id: sb.id, position: sb.position, imageUrl: sb.imageUrl, title: sb.title, linkUrl: sb.linkUrl, isActive: checked })} />
                          <span className="text-xs text-gray-500">{sb.isActive ? "Hiển thị" : "Ẩn"}</span>
                          <button onClick={() => { if (confirm("Xóa side banner này?")) deleteSideBannerMutation.mutate({ id: sb.id }); }}
                            className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Mini Banners Tab ── */}
          <TabsContent value="mini-banners" className="mt-4 space-y-4">
            <div className="ak-card p-4">
              <p className="text-sm text-gray-500 mb-4">ℹ️ Mini banner hiển thị dưới carousel chính theo dạng lưới 4 ô. Tối đa 8 banner.</p>
              {addingMiniBanner && (
                <div className="border-2 border-blue-200 rounded-xl p-4 mb-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Mini Banner Mới</h3>
                  <div>
                    <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                    <div className="mt-1.5"><ImageUploadField value={newMiniBanner.imageUrl} onChange={url => setNewMiniBanner(p => ({ ...p, imageUrl: url }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Tiêu đề</Label>
                      <Input placeholder="Tiêu đề (tùy chọn)" value={newMiniBanner.title} onChange={e => setNewMiniBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Link khi click</Label>
                      <Input placeholder="/catalog hoặc https://..." value={newMiniBanner.linkUrl} onChange={e => setNewMiniBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Thứ tự hiển thị</Label>
                    <Input type="number" placeholder="0" value={newMiniBanner.sortOrder} onChange={e => setNewMiniBanner(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="mt-1.5 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => upsertMiniBannerMutation.mutate(newMiniBanner)} disabled={!newMiniBanner.imageUrl || upsertMiniBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {upsertMiniBannerMutation.isPending ? "Đang lưu..." : "Lưu Mini Banner"}
                    </Button>
                    <Button variant="outline" onClick={() => setAddingMiniBanner(false)}>Hủy</Button>
                  </div>
                </div>
              )}
              {(miniBanners as any[]).length === 0 && !addingMiniBanner ? (
                <div className="ak-empty">
                  <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                  <div className="ak-empty-title">Chưa có mini banner</div>
                  <div className="ak-empty-desc">Thêm mini banner hiển thị dưới carousel theo lưới 4 ô</div>
                  <Button onClick={() => setAddingMiniBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Thêm</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(miniBanners as any[]).map((mb: any) => (
                    <div key={mb.id} className={`relative rounded-xl overflow-hidden border border-gray-100 group ${!mb.isActive ? "opacity-60" : ""}`}>
                      {mb.imageUrl ? (
                        <img src={mb.imageUrl} alt={mb.title || ""} className="w-full h-20 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-full h-20 bg-gray-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                      )}
                      {mb.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs font-bold leading-tight truncate">{mb.title}</p>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Switch checked={mb.isActive ?? true} onCheckedChange={checked => upsertMiniBannerMutation.mutate({ id: mb.id, imageUrl: mb.imageUrl, title: mb.title, linkUrl: mb.linkUrl, isActive: checked, sortOrder: mb.sortOrder })} />
                        <button onClick={() => { if (confirm("Xóa mini banner?")) deleteMiniBannerMutation.mutate({ id: mb.id }); }}
                          className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Announcement Dialog */}
      <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnId ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ví dụ: Chào mừng bạn đến với cửa hàng!"
                value={annForm.title}
                onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Nội dung chi tiết của thông báo..."
                value={annForm.content}
                onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
              />
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
            {/* Target Pages */}
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
              <p className="text-xs text-gray-400">Chọn "Tất cả các trang" để hiển thị ở mọi nơi</p>
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

      {/* Delete Announcement Confirm */}
      <Dialog open={deleteAnnId !== null} onOpenChange={() => setDeleteAnnId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAnnId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteAnnId) { deleteAnnMutation.mutate({ id: deleteAnnId }); setDeleteAnnId(null); } }}
              disabled={deleteAnnMutation.isPending}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
