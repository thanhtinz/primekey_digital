import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import {
  Save, Globe, ImageIcon, Palette, Upload, X, Loader2,
  Settings as SettingsIcon, Code, Eye, Bell, Layers,
  AlertTriangle, Info, ChevronRight
} from "@/components/Icon";

// ─── Gradient Presets ──────────────────────────────────────────────────────────
const GRADIENT_PRESETS = [
  { name: "Ocean & Teal",       c1: "#405189", c2: "#0ab39c" },
  { name: "Warm & Vibrant",     c1: "#f7931e", c2: "#e74c3c" },
  { name: "Purple & Pink",      c1: "#8b5cf6", c2: "#ec4899" },
  { name: "Professional Dark",  c1: "#1e293b", c2: "#334155" },
  { name: "Nature & Fresh",     c1: "#16a34a", c2: "#0ea5e9" },
  { name: "Sunset",             c1: "#f59e0b", c2: "#ef4444" },
];

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "UTC",
];

const FONT_FAMILIES = [
  "Be Vietnam Pro",
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Nunito",
  "Poppins",
  "Arial",
  "system-ui",
];

// ─── Tab type ──────────────────────────────────────────────────────────────────
type TabKey = "general" | "images" | "colors";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "general", label: "Cài đặt chung",  icon: <SettingsIcon className="h-4 w-4" /> },
  { key: "images",  label: "Hình ảnh",        icon: <ImageIcon className="h-4 w-4" /> },
  { key: "colors",  label: "Màu sắc",          icon: <Palette className="h-4 w-4" /> },
];

// ─── SettingRow helper ─────────────────────────────────────────────────────────
function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-4 border-b border-border last:border-0">
      <div className="sm:w-64 flex-shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── SwitchRow helper ──────────────────────────────────────────────────────────
function SwitchRow({ label, hint, checked, onCheckedChange, danger }: {
  label: string; hint?: string; checked: boolean;
  onCheckedChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? "text-red-600" : "text-foreground"}`}>{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── ImageUploadCard helper ────────────────────────────────────────────────────
function ImageUploadCard({
  title, description, preview, uploading, onUpload, onRemove, accept, maxSizeMB, recommendedSize, wide
}: {
  title: string; description: string; preview: string | null;
  uploading: boolean; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void; accept: string; maxSizeMB: number; recommendedSize: string; wide?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col ${wide ? "sm:flex-row" : ""} items-start gap-4`}>
          {/* Preview */}
          <div className={`flex-shrink-0 ${wide ? "w-40 h-20" : "w-24 h-24"} rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex items-center justify-center overflow-hidden`}>
            {preview ? (
              <img src={preview} alt={title} className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <div className="text-center p-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground/60 mt-1">Chưa có</p>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex-1 space-y-2">
            <p className="text-xs text-muted-foreground">
              Kích thước khuyến nghị: <strong>{recommendedSize}</strong>. Tối đa {maxSizeMB}MB.
            </p>
            <div className="flex flex-wrap gap-2">
              <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onUpload} />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Đang tải..." : "Chọn file"}
              </Button>
              {preview && (
                <Button variant="outline" size="sm" className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300" onClick={onRemove}>
                  <X className="h-3.5 w-3.5" /> Xóa
                </Button>
              )}
            </div>
            {preview && <p className="text-xs text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Đã lưu</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState<TabKey>("general");

  // ── General state ──
  const [general, setGeneral] = useState({
    siteTitle: "", siteDescription: "", siteKeywords: "", siteAuthor: "",
    siteTimezone: "Asia/Ho_Chi_Minh",
    companyEmail: "", hotline: "", companyAddress: "", fanpageUrl: "",
    copyrightFooter: "", fontFamily: "Be Vietnam Pro",
    maintenanceMode: false, autoUpdate: false, debugMode: false,
    debugAutoBank: false, debugApiSuppliers: false, showApiDocs: true,
    showAvatar: true, showTelegramReminder: false, showSlider: true,
    showBanner: true, showRecentlyViewed: true,
    headerScript: "", footerScript: "", adminFooterScript: "",
  });
  const [generalSaving, setGeneralSaving] = useState(false);

  // ── Images state ──
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDarkPreview, setLogoDarkPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [siteImagePreview, setSiteImagePreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDarkUploading, setLogoDarkUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [siteImageUploading, setSiteImageUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Colors state ──
  const [themeColor, setThemeColor] = useState("#405189");
  const [themeColor1, setThemeColor1] = useState("#0ab39c");
  const [colorSaving, setColorSaving] = useState(false);

  // ── Queries ──
  const { data: settingsData, isLoading } = trpc.settings.get.useQuery();
  const updateGeneral = trpc.settings.updateGeneral.useMutation();
  const updateColors = trpc.settings.updateColors.useMutation();
  const uploadBrandAsset = trpc.settings.uploadBrandAsset.useMutation();
  const uploadBrandAssetExtra = trpc.settings.uploadBrandAssetExtra.useMutation();
  const updateBrand = trpc.settings.updateBrand.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData as any;
    setGeneral({
      siteTitle: s.siteTitle || "",
      siteDescription: s.siteDescription || "",
      siteKeywords: s.siteKeywords || "",
      siteAuthor: s.siteAuthor || "",
      siteTimezone: s.siteTimezone || "Asia/Ho_Chi_Minh",
      companyEmail: s.companyEmail || "",
      hotline: s.hotline || "",
      companyAddress: s.companyAddress || "",
      fanpageUrl: s.fanpageUrl || "",
      copyrightFooter: s.copyrightFooter || "",
      fontFamily: s.fontFamily || "Be Vietnam Pro",
      maintenanceMode: s.maintenanceMode ?? false,
      autoUpdate: s.autoUpdate ?? false,
      debugMode: s.debugMode ?? false,
      debugAutoBank: s.debugAutoBank ?? false,
      debugApiSuppliers: s.debugApiSuppliers ?? false,
      showApiDocs: s.showApiDocs ?? true,
      showAvatar: s.showAvatar ?? true,
      showTelegramReminder: s.showTelegramReminder ?? false,
      showSlider: s.showSlider ?? true,
      showBanner: s.showBanner ?? true,
      showRecentlyViewed: s.showRecentlyViewed ?? true,
      headerScript: s.headerScript || "",
      footerScript: s.footerScript || "",
      adminFooterScript: s.adminFooterScript || "",
    });
    if (s.logoUrl) setLogoPreview(s.logoUrl);
    if (s.logoDarkUrl) setLogoDarkPreview(s.logoDarkUrl);
    if (s.faviconUrl) setFaviconPreview(s.faviconUrl);
    if (s.siteImageUrl) setSiteImagePreview(s.siteImageUrl);
    if (s.avatarImageUrl) setAvatarPreview(s.avatarImageUrl);
    if (s.themeColor) setThemeColor(s.themeColor);
    if (s.themeColor1) setThemeColor1(s.themeColor1);
  }, [settingsData]);

  // Apply favicon
  useEffect(() => {
    if (faviconPreview) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = faviconPreview;
      else {
        const l = document.createElement("link");
        l.rel = "icon"; l.href = faviconPreview;
        document.head.appendChild(l);
      }
    }
  }, [faviconPreview]);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSaveGeneral = async () => {
    setGeneralSaving(true);
    try {
      await updateGeneral.mutateAsync(general);
      await utils.settings.get.invalidate();
      toast.success("Đã lưu cài đặt chung!");
    } catch (e: any) {
      toast.error(e.message || "Lưu thất bại");
    } finally { setGeneralSaving(false); }
  };

  const handleSaveColors = async () => {
    setColorSaving(true);
    try {
      await updateColors.mutateAsync({ themeColor, themeColor1 });
      await utils.settings.get.invalidate();
      toast.success("Đã lưu màu sắc!");
    } catch (e: any) {
      toast.error(e.message || "Lưu thất bại");
    } finally { setColorSaving(false); }
  };

  const makeUploadHandler = (
    type: "logo" | "favicon",
    setPreview: (v: string | null) => void,
    setUploading: (v: boolean) => void,
    maxBytes: number
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) { toast.error(`File không được vượt quá ${maxBytes / 1024 / 1024}MB`); return; }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const result = await uploadBrandAsset.mutateAsync({ type, dataUrl, fileName: file.name });
      setPreview(result.url);
      await utils.settings.get.invalidate();
      toast.success(`Đã tải lên ${type === "logo" ? "logo" : "favicon"}!`);
    } catch (e: any) { toast.error(e.message || "Upload thất bại"); setPreview(null); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const makeUploadExtraHandler = (
    type: "logoDark" | "siteImage" | "avatar",
    setPreview: (v: string | null) => void,
    setUploading: (v: boolean) => void,
    maxBytes: number
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) { toast.error(`File không được vượt quá ${maxBytes / 1024 / 1024}MB`); return; }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const result = await uploadBrandAssetExtra.mutateAsync({ type, dataUrl, fileName: file.name });
      setPreview(result.url);
      await utils.settings.get.invalidate();
      toast.success("Đã tải lên ảnh!");
    } catch (e: any) { toast.error(e.message || "Upload thất bại"); setPreview(null); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const makeRemoveHandler = (field: "logoUrl" | "faviconUrl", setPreview: (v: string | null) => void) => async () => {
    try {
      await updateBrand.mutateAsync({ [field]: null });
      setPreview(null);
      if (field === "faviconUrl") {
        const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (link) link.href = "/favicon.ico";
      }
      await utils.settings.get.invalidate();
      toast.success("Đã xóa");
    } catch (e: any) { toast.error(e.message || "Xóa thất bại"); }
  };

  const makeRemoveExtraHandler = (field: "logoDarkUrl" | "siteImageUrl" | "avatarImageUrl", setPreview: (v: string | null) => void) => async () => {
    try {
      await updateBrand.mutateAsync({ [field]: null } as any);
      setPreview(null);
      await utils.settings.get.invalidate();
      toast.success("Đã xóa");
    } catch (e: any) { toast.error(e.message || "Xóa thất bại"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="ak-page-title">Cài Đặt Hệ Thống</h1>
          <p className="ak-page-subtitle">Quản lý thông tin, hình ảnh thương hiệu và màu sắc giao diện</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-full sm:w-auto sm:inline-flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none justify-center sm:justify-start ${
                tab === t.key
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Đang tải cài đặt...</span>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════
                TAB 1: CÀI ĐẶT CHUNG
            ═══════════════════════════════════════════════════════════ */}
            {tab === "general" && (
              <div className="space-y-5">
                {/* SEO */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" /> SEO & Metadata
                    </CardTitle>
                    <CardDescription>Thông tin hiển thị trên công cụ tìm kiếm</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <SettingRow label="Title" hint="Tiêu đề trang web (tối đa 60 ký tự)">
                      <Input value={general.siteTitle} onChange={e => setGeneral(g => ({ ...g, siteTitle: e.target.value }))} placeholder="Prime Shop - Mua sắm thông minh" />
                    </SettingRow>
                    <SettingRow label="Description" hint="Mô tả ngắn về website (tối đa 160 ký tự)">
                      <Textarea value={general.siteDescription} onChange={e => setGeneral(g => ({ ...g, siteDescription: e.target.value }))} placeholder="Mô tả website..." rows={2} className="resize-none" />
                    </SettingRow>
                    <SettingRow label="Keywords" hint="Từ khóa SEO, cách nhau bởi dấu phẩy">
                      <Input value={general.siteKeywords} onChange={e => setGeneral(g => ({ ...g, siteKeywords: e.target.value }))} placeholder="mua sắm, sản phẩm, khuyến mãi" />
                    </SettingRow>
                    <SettingRow label="Author">
                      <Input value={general.siteAuthor} onChange={e => setGeneral(g => ({ ...g, siteAuthor: e.target.value }))} placeholder="Tên tác giả / công ty" />
                    </SettingRow>
                    <SettingRow label="Timezone">
                      <select
                        value={general.siteTimezone}
                        onChange={e => setGeneral(g => ({ ...g, siteTimezone: e.target.value }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      >
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </SettingRow>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-emerald-600" /> Thông Tin Liên Hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <SettingRow label="Email">
                      <Input type="email" value={general.companyEmail} onChange={e => setGeneral(g => ({ ...g, companyEmail: e.target.value }))} placeholder="contact@example.com" />
                    </SettingRow>
                    <SettingRow label="Hotline">
                      <Input value={general.hotline} onChange={e => setGeneral(g => ({ ...g, hotline: e.target.value }))} placeholder="1900 xxxx" />
                    </SettingRow>
                    <SettingRow label="Địa chỉ">
                      <Textarea value={general.companyAddress} onChange={e => setGeneral(g => ({ ...g, companyAddress: e.target.value }))} placeholder="123 Đường ABC, Quận 1, TP.HCM" rows={2} className="resize-none" />
                    </SettingRow>
                    <SettingRow label="Fanpage">
                      <Input value={general.fanpageUrl} onChange={e => setGeneral(g => ({ ...g, fanpageUrl: e.target.value }))} placeholder="https://facebook.com/yourpage" />
                    </SettingRow>
                    <SettingRow label="Copyright Footer Left">
                      <Input value={general.copyrightFooter} onChange={e => setGeneral(g => ({ ...g, copyrightFooter: e.target.value }))} placeholder="© 2024 Prime Shop. All rights reserved." />
                    </SettingRow>
                  </CardContent>
                </Card>

                {/* Display toggles */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-violet-600" /> Hiển Thị
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <SwitchRow label="Trạng thái website" hint="Chọn OFF để bật chế độ bảo trì. Lưu ý: đang bảo trì vui lòng không đăng xuất tài khoản Admin." checked={!general.maintenanceMode} onCheckedChange={v => setGeneral(g => ({ ...g, maintenanceMode: !v }))} />
                    <SwitchRow label="Cập nhật phiên bản tự động" hint="Hệ thống sẽ tự động cập nhật khi có phiên bản mới nếu bạn chọn ON." checked={general.autoUpdate} onCheckedChange={v => setGeneral(g => ({ ...g, autoUpdate: v }))} />
                    <SwitchRow label="Hiển thị hình đại diện" checked={general.showAvatar} onCheckedChange={v => setGeneral(g => ({ ...g, showAvatar: v }))} />
                    <SwitchRow label="Thông báo liên kết Telegram" hint="Hiển thị thông báo nhắc nhở User liên kết Telegram" checked={general.showTelegramReminder} onCheckedChange={v => setGeneral(g => ({ ...g, showTelegramReminder: v }))} />
                    <SwitchRow label="Hiển thị Slider" hint="Bật/Tắt hiển thị Slider trên trang chủ" checked={general.showSlider} onCheckedChange={v => setGeneral(g => ({ ...g, showSlider: v }))} />
                    <SwitchRow label="Hiển thị Banner" hint="Bật/Tắt hiển thị Banner trên trang chủ" checked={general.showBanner} onCheckedChange={v => setGeneral(g => ({ ...g, showBanner: v }))} />
                    <SwitchRow label="Hiển thị Sản phẩm đã xem" hint='Bật/Tắt hiển thị widget "Sản phẩm đã xem gần đây" trên trang chủ' checked={general.showRecentlyViewed} onCheckedChange={v => setGeneral(g => ({ ...g, showRecentlyViewed: v }))} />
                    <SwitchRow label="ON/OFF Tài liệu API" hint="Hệ thống sẽ ẩn menu tài liệu API nếu bạn chọn OFF" checked={general.showApiDocs} onCheckedChange={v => setGeneral(g => ({ ...g, showApiDocs: v }))} />
                  </CardContent>
                </Card>

                {/* Font */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-orange-600" /> Giao Diện
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <SettingRow label="Font Family" hint="Font chữ hiển thị trên toàn bộ website">
                      <select
                        value={general.fontFamily}
                        onChange={e => setGeneral(g => ({ ...g, fontFamily: e.target.value }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        style={{ fontFamily: general.fontFamily }}
                      >
                        {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                      </select>
                    </SettingRow>
                  </CardContent>
                </Card>

                {/* Debug */}
                <Card className="shadow-sm border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" /> Debug
                    </CardTitle>
                    <CardDescription className="text-amber-600">Chỉ bật khi được yêu cầu từ đội kỹ thuật</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-amber-100">
                    <SwitchRow label="ON/OFF Debug" hint="Không bật ON khi chưa được yêu cầu." checked={general.debugMode} onCheckedChange={v => setGeneral(g => ({ ...g, debugMode: v }))} danger />
                    <SwitchRow label="ON/OFF Debug Auto Bank" hint="Không bật ON khi chưa được yêu cầu." checked={general.debugAutoBank} onCheckedChange={v => setGeneral(g => ({ ...g, debugAutoBank: v }))} danger />
                    <SwitchRow label="ON/OFF Debug API Suppliers" hint="Debug API đồng bộ nguồn hàng." checked={general.debugApiSuppliers} onCheckedChange={v => setGeneral(g => ({ ...g, debugApiSuppliers: v }))} danger />
                  </CardContent>
                </Card>

                {/* Custom Scripts */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4 text-slate-600" /> Tùy Chỉnh Script/HTML
                    </CardTitle>
                    <CardDescription>Cấu hình các script và HTML tùy chỉnh cho website</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-1">
                      <p className="font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Lưu ý quan trọng</p>
                      <p>Header Script: Dành cho Google Analytics, Facebook Pixel, Meta tags...</p>
                      <p>Footer Script: Dành cho chat plugin, tracking, popup...</p>
                      <p>Admin Footer: Script chỉ hiển thị trong trang quản trị</p>
                      <p className="text-red-600 font-medium">Cẩn thận với script có thể ảnh hưởng đến bảo mật website</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Script/HTML Header Trang Khách</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Hiển thị trong thẻ &lt;head&gt; của trang khách</p>
                      <Textarea
                        value={general.headerScript}
                        onChange={e => setGeneral(g => ({ ...g, headerScript: e.target.value }))}
                        placeholder={'<link rel="preconnect" href="https://fonts.googleapis.com">'}
                        rows={4}
                        className="font-mono text-xs resize-y"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Script/HTML Footer Trang Khách</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Hiển thị cuối trang khách trước thẻ &lt;/body&gt;</p>
                      <Textarea
                        value={general.footerScript}
                        onChange={e => setGeneral(g => ({ ...g, footerScript: e.target.value }))}
                        placeholder="<!-- Footer scripts -->"
                        rows={4}
                        className="font-mono text-xs resize-y"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Script/HTML Footer Trang Quản Trị</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Hiển thị cuối trang admin trước thẻ &lt;/body&gt;</p>
                      <Textarea
                        value={general.adminFooterScript}
                        onChange={e => setGeneral(g => ({ ...g, adminFooterScript: e.target.value }))}
                        placeholder="<!-- Admin footer scripts -->"
                        rows={4}
                        className="font-mono text-xs resize-y"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={generalSaving} className="gap-2 min-w-32">
                    {generalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {generalSaving ? "Đang lưu..." : "Lưu cài đặt"}
                  </Button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                TAB 2: HÌNH ẢNH
            ═══════════════════════════════════════════════════════════ */}
            {tab === "images" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-1">Lưu ý về hình ảnh</p>
                  <p>Logo sẽ hiển thị trên navbar, trang thanh toán và landing page. Favicon sẽ hiển thị ngay lập tức trên tab trình duyệt. Để logo hiển thị đẹp trên nền tối, hãy dùng PNG có nền trong suốt.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadCard
                    title="Logo Light"
                    description="Logo hiển thị trên nền sáng (navbar, trang chủ)"
                    preview={logoPreview}
                    uploading={logoUploading}
                    onUpload={makeUploadHandler("logo", setLogoPreview, setLogoUploading, 2 * 1024 * 1024)}
                    onRemove={makeRemoveHandler("logoUrl", setLogoPreview)}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    maxSizeMB={2}
                    recommendedSize="200×60px"
                    wide
                  />

                  <ImageUploadCard
                    title="Logo Dark"
                    description="Logo hiển thị trên nền tối (dark mode)"
                    preview={logoDarkPreview}
                    uploading={logoDarkUploading}
                    onUpload={makeUploadExtraHandler("logoDark", setLogoDarkPreview, setLogoDarkUploading, 2 * 1024 * 1024)}
                    onRemove={makeRemoveExtraHandler("logoDarkUrl", setLogoDarkPreview)}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    maxSizeMB={2}
                    recommendedSize="200×60px"
                    wide
                  />

                  <ImageUploadCard
                    title="Favicon"
                    description="Icon tab trình duyệt (ICO/PNG vuông)"
                    preview={faviconPreview}
                    uploading={faviconUploading}
                    onUpload={makeUploadHandler("favicon", setFaviconPreview, setFaviconUploading, 512 * 1024)}
                    onRemove={makeRemoveHandler("faviconUrl", setFaviconPreview)}
                    accept="image/x-icon,image/png,image/svg+xml"
                    maxSizeMB={0.5}
                    recommendedSize="32×32px hoặc 64×64px"
                  />

                  <ImageUploadCard
                    title="Image"
                    description="Ảnh đại diện website (OG image, share preview)"
                    preview={siteImagePreview}
                    uploading={siteImageUploading}
                    onUpload={makeUploadExtraHandler("siteImage", setSiteImagePreview, setSiteImageUploading, 5 * 1024 * 1024)}
                    onRemove={makeRemoveExtraHandler("siteImageUrl", setSiteImagePreview)}
                    accept="image/png,image/jpeg,image/webp"
                    maxSizeMB={5}
                    recommendedSize="1200×630px"
                    wide
                  />

                  <ImageUploadCard
                    title="Avatar"
                    description="Ảnh đại diện mặc định cho tài khoản"
                    preview={avatarPreview}
                    uploading={avatarUploading}
                    onUpload={makeUploadExtraHandler("avatar", setAvatarPreview, setAvatarUploading, 2 * 1024 * 1024)}
                    onRemove={makeRemoveExtraHandler("avatarImageUrl", setAvatarPreview)}
                    accept="image/png,image/jpeg,image/webp"
                    maxSizeMB={2}
                    recommendedSize="200×200px"
                  />
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                TAB 3: MÀU SẮC
            ═══════════════════════════════════════════════════════════ */}
            {tab === "colors" && (
              <div className="space-y-5">
                {/* Live preview */}
                <Card className="shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" /> Xem trước Gradient
                    </CardTitle>
                    <CardDescription>Giao diện của bạn — Gradient được tạo từ 2 màu chủ đạo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="h-24 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-inner transition-all duration-300"
                      style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor1} 100%)` }}
                    >
                      <span className="drop-shadow">Giao diện của bạn</span>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex-shrink-0" style={{ background: themeColor }} />
                        <div>
                          <p className="text-xs font-medium">Theme Color</p>
                          <p className="text-xs text-muted-foreground">{themeColor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex-shrink-0" style={{ background: themeColor1 }} />
                        <div>
                          <p className="text-xs font-medium">Theme Color 1</p>
                          <p className="text-xs text-muted-foreground">{themeColor1}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color pickers */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4 text-violet-600" /> Theme Colors
                    </CardTitle>
                    <CardDescription>Thiết lập màu chủ đạo cho giao diện website</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-medium">Theme Color</Label>
                        <p className="text-xs text-muted-foreground mb-2">Màu chủ đạo cho buttons, links, headers</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={themeColor}
                            onChange={e => setThemeColor(e.target.value)}
                            className="w-12 h-10 rounded-lg border border-input cursor-pointer"
                          />
                          <Input
                            value={themeColor}
                            onChange={e => setThemeColor(e.target.value)}
                            placeholder="#405189"
                            className="font-mono flex-1"
                            maxLength={7}
                          />
                        </div>
                        {/* Suggested colors */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {["#405189","#0d6efd","#198754","#dc3545","#6f42c1","#fd7e14","#0dcaf0","#1e293b"].map(c => (
                            <button key={c} onClick={() => setThemeColor(c)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${themeColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                              style={{ background: c }} title={c}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Màu đề xuất</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Theme Color 1</Label>
                        <p className="text-xs text-muted-foreground mb-2">Màu phụ cho gradient, hover effects</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={themeColor1}
                            onChange={e => setThemeColor1(e.target.value)}
                            className="w-12 h-10 rounded-lg border border-input cursor-pointer"
                          />
                          <Input
                            value={themeColor1}
                            onChange={e => setThemeColor1(e.target.value)}
                            placeholder="#0ab39c"
                            className="font-mono flex-1"
                            maxLength={7}
                          />
                        </div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {["#0ab39c","#20c997","#0dcaf0","#6610f2","#e83e8c","#ffc107","#28a745","#17a2b8"].map(c => (
                            <button key={c} onClick={() => setThemeColor1(c)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${themeColor1 === c ? "border-foreground scale-110" : "border-transparent"}`}
                              style={{ background: c }} title={c}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Màu đề xuất</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gradient presets */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Gradient phổ biến</CardTitle>
                    <CardDescription>Nhấn để áp dụng nhanh</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {GRADIENT_PRESETS.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => { setThemeColor(preset.c1); setThemeColor1(preset.c2); }}
                          className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-md ${
                            themeColor === preset.c1 && themeColor1 === preset.c2
                              ? "border-foreground shadow-md"
                              : "border-transparent"
                          }`}
                          style={{ background: `linear-gradient(135deg, ${preset.c1} 0%, ${preset.c2} 100%)` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold drop-shadow text-center px-2 leading-tight">{preset.name}</span>
                          </div>
                          {themeColor === preset.c1 && themeColor1 === preset.c2 && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                              <ChevronRight className="h-3 w-3 text-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveColors} disabled={colorSaving} className="gap-2 min-w-32">
                    {colorSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {colorSaving ? "Đang lưu..." : "Lưu màu sắc"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
