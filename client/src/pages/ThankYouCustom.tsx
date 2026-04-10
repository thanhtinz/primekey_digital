import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook", icon: "fa-brands fa-facebook" },
  { value: "instagram", label: "Instagram", icon: "fa-brands fa-instagram" },
  { value: "zalo", label: "Zalo", icon: "fa-solid fa-comment-dots" },
  { value: "youtube", label: "YouTube", icon: "fa-brands fa-youtube" },
  { value: "tiktok", label: "TikTok", icon: "fa-brands fa-tiktok" },
  { value: "website", label: "Website", icon: "fa-solid fa-globe" },
];

const GRADIENT_PRESETS = [
  { label: "Xanh Lá", from: "#f0fdf4", to: "#eff6ff" },
  { label: "Tím Hồng", from: "#fdf4ff", to: "#fce7f3" },
  { label: "Cam Vàng", from: "#fff7ed", to: "#fefce8" },
  { label: "Xanh Dương", from: "#eff6ff", to: "#f0f9ff" },
  { label: "Hồng Đào", from: "#fff1f2", to: "#fdf4ff" },
  { label: "Xanh Ngọc", from: "#f0fdfa", to: "#ecfeff" },
  { label: "Tối Sang Trọng", from: "#0f172a", to: "#1e1b4b" },
  { label: "Đêm Tím", from: "#1a0533", to: "#0f172a" },
];

const TEMPLATES = [
  {
    id: "minimal",
    label: "Tối Giản",
    emoji: "⬜",
    config: {
      thankYouTitle: "Cảm Ơn Bạn!",
      thankYouMessage: "Đơn hàng đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất.",
      thankYouBgFrom: "#ffffff",
      thankYouBgTo: "#f8fafc",
      thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
      thankYouBannerUrl: "",
      thankYouCustomHtml: "",
    }
  },
  {
    id: "warm",
    label: "Ấm Áp",
    emoji: "🌅",
    config: {
      thankYouTitle: "Cảm Ơn Bạn Đã Tin Tưởng!",
      thankYouMessage: "Đơn hàng của bạn đã được xác nhận thành công. Chúng tôi sẽ xử lý và liên hệ với bạn trong thời gian sớm nhất.",
      thankYouBgFrom: "#fff7ed",
      thankYouBgTo: "#fefce8",
      thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
      thankYouBannerUrl: "",
      thankYouCustomHtml: "",
    }
  },
  {
    id: "dark",
    label: "Tối Sang Trọng",
    emoji: "🌙",
    config: {
      thankYouTitle: "Cảm Ơn Quý Khách!",
      thankYouMessage: "Giao dịch thành công. Chúng tôi trân trọng sự tin tưởng của bạn.",
      thankYouBgFrom: "#0f172a",
      thankYouBgTo: "#1e1b4b",
      thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
      thankYouBannerUrl: "",
      thankYouCustomHtml: "",
    }
  },
];

type TabType = "content" | "design" | "social" | "custom-code";

export default function ThankYouCustom() {
  const utils = trpc.useUtils();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const settingsAny = settings as any;
  const featureThankYou = settingsAny?.featureThankYou === true;

  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState({
    thankYouTitle: "Cảm Ơn Bạn Đã Thanh Toán!",
    thankYouMessage: "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
    thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
    thankYouBgFrom: "#f0fdf4",
    thankYouBgTo: "#eff6ff",
    thankYouBannerUrl: "",
    thankYouCustomHtml: "",
  });

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
        thankYouCustomHtml: s.thankYouCustomHtml || "",
      });
      const presetIdx = GRADIENT_PRESETS.findIndex(p => p.from === bgFrom && p.to === bgTo);
      setSelectedPreset(presetIdx >= 0 ? presetIdx : -1);
    }
  }, [settings]);

  const toggleFeatureMutation = trpc.settings.updateFeaturesSettings.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      refetch();
      toast.success(featureThankYou ? "Đã tắt trang cảm ơn" : "Đã bật trang cảm ơn");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

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
    setForm(f => ({ ...f, thankYouBgFrom: preset.from, thankYouBgTo: preset.to }));
  };

  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(f => ({ ...f, ...tpl.config }));
    setSelectedTemplate(templateId);
    const presetIdx = GRADIENT_PRESETS.findIndex(p => p.from === tpl.config.thankYouBgFrom && p.to === tpl.config.thankYouBgTo);
    setSelectedPreset(presetIdx >= 0 ? presetIdx : -1);
    toast.success("Đã áp dụng mẫu " + tpl.label);
  };

  const isDarkBg = form.thankYouBgFrom.startsWith("#0") || form.thankYouBgFrom.startsWith("#1") || form.thankYouBgFrom.startsWith("#2");

  const buildPreviewHtml = () => {
    if (form.thankYouCustomHtml) {
      return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\"></head><body style=\"margin:0;padding:0\">" + form.thankYouCustomHtml + "</body></html>";
    }
    const textColor = isDarkBg ? "#ffffff" : "#1f2937";
    const subColor = isDarkBg ? "rgba(255,255,255,0.7)" : "#6b7280";
    const socialLinks = form.thankYouSocialLinks.map(link => {
      const platform = PLATFORM_OPTIONS.find(p => p.value === link.platform);
      return "<a href=\"" + link.url + "\" target=\"_blank\" style=\"display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:" + (isDarkBg ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)") + ";border-radius:9999px;color:" + textColor + ";text-decoration:none;font-size:14px;font-weight:500\"><i class=\"" + (platform?.icon || "fa-solid fa-link") + "\"></i>" + (platform?.label || link.platform) + "</a>";
    }).join("");
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\"><style>*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg," + form.thankYouBgFrom + "," + form.thankYouBgTo + ");font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}</style></head><body><div style=\"max-width:480px;width:100%;text-align:center\"><div style=\"font-size:64px;margin-bottom:16px\">🎉</div>" + (form.thankYouBannerUrl ? "<img src=\"" + form.thankYouBannerUrl + "\" style=\"max-width:100%;max-height:200px;object-fit:contain;border-radius:12px;margin-bottom:20px\" />" : "") + "<h1 style=\"font-size:28px;font-weight:800;color:" + textColor + ";margin-bottom:12px;line-height:1.2\">" + form.thankYouTitle + "</h1><p style=\"font-size:16px;color:" + subColor + ";line-height:1.6;margin-bottom:24px\">" + form.thankYouMessage + "</p>" + (socialLinks ? "<div style=\"display:flex;flex-wrap:wrap;gap:8px;justify-content:center\">" + socialLinks + "</div>" : "") + "</div></body></html>";
  };

  const TABS: { id: TabType; label: string; icon: string }[] = [
    { id: "content", label: "Nội Dung", icon: "fa-solid fa-align-left" },
    { id: "design", label: "Thiết Kế", icon: "fa-solid fa-palette" },
    { id: "social", label: "Mạng Xã Hội", icon: "fa-solid fa-share-nodes" },
    { id: "custom-code", label: "Code", icon: "fa-solid fa-code" },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-heart text-pink-500" />
              Trang Cảm Ơn Tùy Chỉnh
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Tùy chỉnh trang cảm Ơn sau khi khách hàng thanh toán</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href="/thank-you" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square" />
              <span className="hidden sm:inline">Xem trang</span>
            </a>
            <button
              onClick={() => toggleFeatureMutation.mutate({ featureThankYou: !featureThankYou })}
              disabled={toggleFeatureMutation.isPending}
              className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border " + (featureThankYou ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200")}
            >
              <i className={"fa-solid text-sm " + (featureThankYou ? "fa-toggle-on text-green-600" : "fa-toggle-off")} />
              {featureThankYou ? "Đang bật" : "Đang tắt"}
            </button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs">
              {saveMutation.isPending ? <><i className="fa-solid fa-spinner fa-spin mr-1" />Đang lưu...</> : <><i className="fa-solid fa-floppy-disk mr-1" />Lưu</>}
            </Button>
          </div>
        </div>

        {!featureThankYou && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
            <i className="fa-solid fa-triangle-exclamation" />
            Trang cảm ơn đang tắt. Khách hàng sẽ chuyển thẳng về trang đơn hàng sau khi thanh toán.
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto" style={{ maxHeight: "55vh", minHeight: 0 }}>
            <style>{"@media (min-width: 1024px) { .thankyou-editor { max-height: none !important; } }"}</style>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={"flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors " + (activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                  <i className={tab.icon + " text-sm"} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {activeTab === "content" && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mẫu Có Sẵn</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TEMPLATES.map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                          className={"relative rounded-lg overflow-hidden border-2 transition-all " + (selectedTemplate === tpl.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300")}>
                          <div className="h-14 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            <span className="text-2xl">{tpl.emoji}</span>
                          </div>
                          <div className="py-1 text-center bg-white dark:bg-gray-800">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{tpl.label}</span>
                          </div>
                          {selectedTemplate === tpl.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <i className="fa-solid fa-check text-white" style={{ fontSize: "8px" }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Tiêu Đề</Label>
                      <Input value={form.thankYouTitle} onChange={e => setForm(f => ({ ...f, thankYouTitle: e.target.value }))} placeholder="Cảm Ơn Bạn Đã Thanh Toán!" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Nội Dung</Label>
                      <Textarea value={form.thankYouMessage} onChange={e => setForm(f => ({ ...f, thankYouMessage: e.target.value }))} rows={4} placeholder="Đơn hàng của bạn đã được xác nhận..." className="mt-1 resize-none" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Ảnh Banner (tùy chọn)</Label>
                      <div className="mt-1">
                        {form.thankYouBannerUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img src={form.thankYouBannerUrl} alt="banner" className="w-full max-h-28 object-contain bg-gray-50" />
                            <button onClick={() => setForm(f => ({ ...f, thankYouBannerUrl: "" }))}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                              <i className="fa-solid fa-times text-xs" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-lg mb-0.5" />
                            <span className="text-xs text-gray-500">Tải lên ảnh banner</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "design" && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Màu Nền Gradient</p>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENT_PRESETS.map((preset, idx) => (
                        <button key={idx} onClick={() => applyPreset(idx)} title={preset.label}
                          className={"relative h-10 rounded-lg border-2 transition-all overflow-hidden " + (selectedPreset === idx ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300")}
                          style={{ background: "linear-gradient(135deg, " + preset.from + ", " + preset.to + ")" }}>
                          {selectedPreset === idx && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-1">{selectedPreset >= 0 ? GRADIENT_PRESETS[selectedPreset].label : "Tùy chỉnh"}</p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Màu Tùy Chỉnh</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Màu bắt đầu</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={form.thankYouBgFrom} onChange={e => { setForm(f => ({ ...f, thankYouBgFrom: e.target.value })); setSelectedPreset(-1); }} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                          <Input value={form.thankYouBgFrom} onChange={e => { setForm(f => ({ ...f, thankYouBgFrom: e.target.value })); setSelectedPreset(-1); }} className="flex-1 font-mono text-xs h-8" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Màu kết thúc</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={form.thankYouBgTo} onChange={e => { setForm(f => ({ ...f, thankYouBgTo: e.target.value })); setSelectedPreset(-1); }} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                          <Input value={form.thankYouBgTo} onChange={e => { setForm(f => ({ ...f, thankYouBgTo: e.target.value })); setSelectedPreset(-1); }} className="flex-1 font-mono text-xs h-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Chế Độ Xem Trước</p>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewMode("desktop")} className={"flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-colors " + (previewMode === "desktop" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                        <i className="fa-solid fa-desktop" /> Desktop
                      </button>
                      <button onClick={() => setPreviewMode("mobile")} className={"flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-colors " + (previewMode === "mobile" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                        <i className="fa-solid fa-mobile-screen" /> Mobile
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "social" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Liên Kết Mạng Xã Hội</p>
                    <Button variant="outline" size="sm" onClick={addLink} className="h-7 text-xs gap-1">
                      <i className="fa-solid fa-plus text-xs" /> Thêm
                    </Button>
                  </div>
                  {form.thankYouSocialLinks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <i className="fa-solid fa-share-nodes text-3xl mb-2 block" />
                      <p className="text-sm">Chưa có liên kết</p>
                      <p className="text-xs mt-1">Thêm để hiển thị nút trên trang cảm ơn</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.thankYouSocialLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <select value={link.platform} onChange={e => updateLink(idx, "platform", e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs w-28 dark:bg-gray-700 dark:border-gray-600">
                            {PLATFORM_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                          <Input placeholder="https://..." value={link.url} onChange={e => updateLink(idx, "url", e.target.value)} className="flex-1 h-8 text-xs" />
                          <button onClick={() => removeLink(idx)} className="h-8 w-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <i className="fa-solid fa-trash-can text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "custom-code" && (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400">
                    <i className="fa-solid fa-triangle-exclamation mr-2" />
                    Khi có code tùy chỉnh, toàn bộ trang sẽ dùng code này thay vì cài đặt ở trên.
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">HTML/CSS/JS Tùy Chỉnh</p>
                      {form.thankYouCustomHtml && (
                        <button onClick={() => setForm(f => ({ ...f, thankYouCustomHtml: "" }))} className="text-xs text-red-500 hover:text-red-700">
                          <i className="fa-solid fa-times mr-1" />Xóa code
                        </button>
                      )}
                    </div>
                    <Textarea value={form.thankYouCustomHtml} onChange={e => setForm(f => ({ ...f, thankYouCustomHtml: e.target.value }))} rows={18}
                      placeholder={"<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>Cảm Ơn</title>\n  <style>\n    body { background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }\n  </style>\n</head>\n<body>\n  <h1>🎉 Cảm Ơn Bạn!</h1>\n</body>\n</html>"}
                      className="font-mono text-xs resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs"><i className="fa-brands fa-html5 mr-1" /> HTML</Badge>
                    <Badge variant="secondary" className="text-xs"><i className="fa-brands fa-css3-alt mr-1" /> CSS</Badge>
                    <Badge variant="secondary" className="text-xs"><i className="fa-brands fa-js mr-1" /> JavaScript</Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 overflow-hidden" style={{ minHeight: "300px" }}>
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <i className="fa-solid fa-eye text-blue-500" />
                <span className="font-medium">Xem Trước Trực Tiếp</span>
                <Badge variant="outline" className="text-xs">{previewMode === "desktop" ? "Desktop" : "Mobile 375px"}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewMode("desktop")} className={"p-1.5 rounded transition-colors " + (previewMode === "desktop" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600")}>
                  <i className="fa-solid fa-desktop text-sm" />
                </button>
                <button onClick={() => setPreviewMode("mobile")} className={"p-1.5 rounded transition-colors " + (previewMode === "mobile" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600")}>
                  <i className="fa-solid fa-mobile-screen text-sm" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <div className={"transition-all duration-300 shadow-2xl rounded-xl overflow-hidden " + (previewMode === "mobile" ? "w-[375px] h-[667px]" : "w-full max-w-3xl h-[480px]")}>
                <iframe ref={iframeRef} srcDoc={buildPreviewHtml()} className="w-full h-full border-0" title="Preview trang cảm ơn" sandbox="allow-scripts allow-same-origin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
