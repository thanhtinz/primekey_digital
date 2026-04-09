import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, Plus, Trash2, Eye, ExternalLink, Palette, ImagePlus, X } from "@/components/Icon";

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "zalo", label: "Zalo" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
];

// Preset gradient themes
const GRADIENT_PRESETS = [
  { label: "Xanh Lá (Mặc định)", from: "#f0fdf4", to: "#eff6ff" },
  { label: "Tím Hồng", from: "#fdf4ff", to: "#fce7f3" },
  { label: "Cam Vàng", from: "#fff7ed", to: "#fefce8" },
  { label: "Xanh Dương", from: "#eff6ff", to: "#f0f9ff" },
  { label: "Hồng Đào", from: "#fff1f2", to: "#fdf4ff" },
  { label: "Xanh Ngọc", from: "#f0fdfa", to: "#ecfeff" },
  { label: "Tối Sang Trọng", from: "#0f172a", to: "#1e1b4b" },
  { label: "Tùy Chỉnh", from: "", to: "" },
];

export default function ThankYouCustom() {
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const [form, setForm] = useState({
    thankYouTitle: "Cảm Ơn Bạn Đã Thanh Toán!",
    thankYouMessage: "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
    thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
    thankYouBgFrom: "#f0fdf4",
    thankYouBgTo: "#eff6ff",
    thankYouBannerUrl: "",
  });
  const [selectedPreset, setSelectedPreset] = useState(0);

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      const bgFrom = s.thankYouBgFrom || "#f0fdf4";
      const bgTo = s.thankYouBgTo || "#eff6ff";
      setForm({
        thankYouTitle: s.thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!",
        thankYouMessage: s.thankYouMessage || "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
        thankYouSocialLinks: s.thankYouSocialLinks || [],
        thankYouBgFrom: bgFrom,
        thankYouBgTo: bgTo,
        thankYouBannerUrl: s.thankYouBannerUrl || "",
      });
      // Tìm preset tương ứng
      const presetIdx = GRADIENT_PRESETS.findIndex(p => p.from === bgFrom && p.to === bgTo);
      setSelectedPreset(presetIdx >= 0 ? presetIdx : GRADIENT_PRESETS.length - 1);
    }
  }, [settings]);

  const uploadBannerMutation = trpc.settings.uploadThankYouBanner.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, thankYouBannerUrl: data.url }));
      toast.success("Đã tải lên banner!");
      refetch();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh quá lớn (tối đa 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadBannerMutation.mutate({ dataUrl, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const saveMutation = trpc.settingsExt.updateThankYou.useMutation({
    onSuccess: () => { toast.success("Đã lưu trang cảm ơn"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const addLink = () => setForm(f => ({ ...f, thankYouSocialLinks: [...f.thankYouSocialLinks, { platform: "facebook", url: "" }] }));
  const removeLink = (idx: number) => setForm(f => ({ ...f, thankYouSocialLinks: f.thankYouSocialLinks.filter((_, i) => i !== idx) }));
  const updateLink = (idx: number, field: "platform" | "url", value: string) =>
    setForm(f => ({ ...f, thankYouSocialLinks: f.thankYouSocialLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l) }));

  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const preset = GRADIENT_PRESETS[idx];
    if (preset.from && preset.to) {
      setForm(f => ({ ...f, thankYouBgFrom: preset.from, thankYouBgTo: preset.to }));
    }
  };

  // Detect if text should be dark or light based on bg color
  const isDarkBg = form.thankYouBgFrom.startsWith("#0") || form.thankYouBgFrom.startsWith("#1") || form.thankYouBgFrom.startsWith("#2");

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trang Cảm Ơn Tùy Chỉnh</h1>
          <p className="text-muted-foreground text-sm mt-1">Tùy chỉnh nội dung trang cảm ơn sau khi khách hàng thanh toán</p>
        </div>

        {/* Preview link */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Trang cảm ơn công khai:</span>
          <a href="/thank-you" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            /thank-you <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form nội dung */}
        <Card>
          <CardHeader>
            <CardTitle>Nội Dung Trang Cảm Ơn</CardTitle>
            <CardDescription>Khách hàng sẽ thấy trang này sau khi thanh toán thành công</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tiêu Đề</Label>
              <Input
                value={form.thankYouTitle}
                onChange={e => setForm(f => ({ ...f, thankYouTitle: e.target.value }))}
                placeholder="Cảm Ơn Bạn Đã Thanh Toán!"
              />
            </div>
            <div>
              <Label>Nội Dung</Label>
              <Textarea
                value={form.thankYouMessage}
                onChange={e => setForm(f => ({ ...f, thankYouMessage: e.target.value }))}
                rows={4}
                placeholder="Đơn hàng của bạn đã được xác nhận..."
              />
            </div>

            {/* Social links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Liên Kết Mạng Xã Hội</Label>
                <Button variant="outline" size="sm" onClick={addLink}>
                  <Plus className="w-3 h-3 mr-1" />Thêm
                </Button>
              </div>
              {form.thankYouSocialLinks.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Chưa có liên kết nào. Thêm để hiển thị nút mạng xã hội.</p>
              )}
              <div className="space-y-2">
                {form.thankYouSocialLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={link.platform}
                      onChange={e => updateLink(idx, "platform", e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm w-32"
                    >
                      {PLATFORM_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={e => updateLink(idx, "url", e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeLink(idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Màu nền gradient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Màu Nền Trang Cảm Ơn
            </CardTitle>
            <CardDescription>Chọn màu gradient cho nền trang cảm ơn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PRESETS.slice(0, -1).map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(idx)}
                  className={`relative h-14 rounded-lg border-2 transition-all overflow-hidden ${
                    selectedPreset === idx ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                  title={preset.label}
                >
                  {selectedPreset === idx && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-gray-700 bg-white/60 py-0.5 px-1 truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom color pickers */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Tùy Chỉnh Màu</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Màu Bắt Đầu</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.thankYouBgFrom}
                      onChange={e => {
                        setSelectedPreset(GRADIENT_PRESETS.length - 1);
                        setForm(f => ({ ...f, thankYouBgFrom: e.target.value }));
                      }}
                      className="w-9 h-9 rounded cursor-pointer border border-input"
                    />
                    <Input
                      value={form.thankYouBgFrom}
                      onChange={e => {
                        setSelectedPreset(GRADIENT_PRESETS.length - 1);
                        setForm(f => ({ ...f, thankYouBgFrom: e.target.value }));
                      }}
                      className="font-mono text-sm"
                      placeholder="#f0fdf4"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Màu Kết Thúc</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.thankYouBgTo}
                      onChange={e => {
                        setSelectedPreset(GRADIENT_PRESETS.length - 1);
                        setForm(f => ({ ...f, thankYouBgTo: e.target.value }));
                      }}
                      className="w-9 h-9 rounded cursor-pointer border border-input"
                    />
                    <Input
                      value={form.thankYouBgTo}
                      onChange={e => {
                        setSelectedPreset(GRADIENT_PRESETS.length - 1);
                        setForm(f => ({ ...f, thankYouBgTo: e.target.value }));
                      }}
                      className="font-mono text-sm"
                      placeholder="#eff6ff"
                    />
                  </div>
                </div>
              </div>
              {/* Gradient preview bar */}
              <div
                className="h-8 rounded-md border"
                style={{ background: `linear-gradient(to right, ${form.thankYouBgFrom}, ${form.thankYouBgTo})` }}
              />
            </div>

            {/* Banner upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5 text-purple-500" />
                  Ảnh Banner (tùy chọn)
                </Label>
                {form.thankYouBannerUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-500 hover:text-red-600"
                    onClick={() => {
                      setForm(f => ({ ...f, thankYouBannerUrl: "" }));
                      saveMutation.mutate({ ...form, thankYouBannerUrl: "" });
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />Xóa banner
                  </Button>
                )}
              </div>
              {form.thankYouBannerUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={form.thankYouBannerUrl} alt="Banner" className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                  {uploadBannerMutation.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-purple-500">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải lên...
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6 text-gray-300 mb-1" />
                      <p className="text-xs text-gray-400">Click để chọn ảnh (tối đa 5MB)</p>
                    </>
                  )}
                </label>
              )}
              <p className="text-xs text-muted-foreground mt-1">Ảnh sẽ hiển thị phía trên card chính trên trang cảm ơn</p>
            </div>

            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </CardContent>
        </Card>

        {/* Màu nền gradient */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Xem Trước Realtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-xl p-6 text-center space-y-3 transition-all duration-300"
              style={{ background: `linear-gradient(135deg, ${form.thankYouBgFrom}, ${form.thankYouBgTo})` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-lg font-bold ${isDarkBg ? "text-white" : "text-gray-900"}`}>
                {form.thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!"}
              </h3>
              <p className={`text-sm ${isDarkBg ? "text-gray-300" : "text-gray-500"}`}>
                {form.thankYouMessage || "Đơn hàng của bạn đã được xác nhận."}
              </p>
              {form.thankYouSocialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {form.thankYouSocialLinks.map((link, i) => (
                    <Badge key={i} variant="outline" className={`text-xs ${isDarkBg ? "border-white/30 text-white" : ""}`}>
                      {PLATFORM_OPTIONS.find(p => p.value === link.platform)?.label || link.platform}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
