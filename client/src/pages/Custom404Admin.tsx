import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TEMPLATES_404 = [
  {
    id: "dark",
    label: "Tối Sang Trọng",
    emoji: "🌙",
    config: {
      custom404Title: "Trang Không Tồn Tại",
      custom404Message: "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
      custom404ButtonText: "Về Trang Chủ",
      custom404ButtonUrl: "/",
      custom404ImageUrl: "",
      custom404BgColor: "#0a0a0a",
      custom404TextColor: "#ffffff",
      custom404CustomHtml: "",
    }
  },
  {
    id: "light",
    label: "Sáng Tối Giản",
    emoji: "☀️",
    config: {
      custom404Title: "404 - Không Tìm Thấy",
      custom404Message: "Trang này không tồn tại. Hãy quay về trang chủ.",
      custom404ButtonText: "Quay Về Trang Chủ",
      custom404ButtonUrl: "/",
      custom404ImageUrl: "",
      custom404BgColor: "#f8fafc",
      custom404TextColor: "#1e293b",
      custom404CustomHtml: "",
    }
  },
  {
    id: "gradient",
    label: "Gradient Màu",
    emoji: "🌈",
    config: {
      custom404Title: "Ồ! Trang Không Tồn Tại",
      custom404Message: "Có vẻ như bạn đã lạc đường. Đừng lo, hãy để chúng tôi đưa bạn về nhà.",
      custom404ButtonText: "Về Trang Chủ",
      custom404ButtonUrl: "/",
      custom404ImageUrl: "",
      custom404BgColor: "#4f46e5",
      custom404TextColor: "#ffffff",
      custom404CustomHtml: "",
    }
  },
];

type TabType = "content" | "design" | "custom-code";

export default function Custom404Admin() {
  const utils = trpc.useUtils();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const settingsAny = settings as any;
  const featureCustom404 = settingsAny?.featureCustom404 === true;

  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState({
    custom404Title: "Trang Không Tồn Tại",
    custom404Message: "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
    custom404ButtonText: "Về Trang Chủ",
    custom404ButtonUrl: "/",
    custom404ImageUrl: "",
    custom404BgColor: "#0a0a0a",
    custom404TextColor: "#ffffff",
    custom404CustomHtml: "",
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        custom404Title: s.custom404Title || "Trang Không Tồn Tại",
        custom404Message: s.custom404Message || "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
        custom404ButtonText: s.custom404ButtonText || "Về Trang Chủ",
        custom404ButtonUrl: s.custom404ButtonUrl || "/",
        custom404ImageUrl: s.custom404ImageUrl || "",
        custom404BgColor: s.custom404BgColor || "#0a0a0a",
        custom404TextColor: s.custom404TextColor || "#ffffff",
        custom404CustomHtml: s.custom404CustomHtml || "",
      });
    }
  }, [settings]);

  const toggleFeatureMutation = trpc.settings.updateFeaturesSettings.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      refetch();
      toast.success(featureCustom404 ? "Đã tắt trang 404 tùy chỉnh" : "Đã bật trang 404 tùy chỉnh");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const saveMutation = trpc.settings.updateCustom404.useMutation({
    onSuccess: () => { toast.success("Đã lưu trang 404 tùy chỉnh"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES_404.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(f => ({ ...f, ...tpl.config }));
    setSelectedTemplate(templateId);
    toast.success("Đã áp dụng mẫu " + tpl.label);
  };

  const buildPreviewHtml = () => {
    if (form.custom404CustomHtml) {
      return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\"></head><body style=\"margin:0;padding:0\">" + form.custom404CustomHtml + "</body></html>";
    }
    const bg = form.custom404BgColor;
    const tc = form.custom404TextColor;
    const subColor = tc + "99";
    const btnBg = tc;
    const btnText = bg;
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\"><style>*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:" + bg + ";font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}</style></head><body><div style=\"max-width:480px;width:100%;text-align:center\">" + (form.custom404ImageUrl ? "<img src=\"" + form.custom404ImageUrl + "\" style=\"max-width:100%;max-height:180px;object-fit:contain;border-radius:12px;margin-bottom:20px\" />" : "<div style=\"font-size:80px;font-weight:900;color:" + tc + ";opacity:0.15;line-height:1;margin-bottom:16px\">404</div>") + "<h1 style=\"font-size:26px;font-weight:800;color:" + tc + ";margin-bottom:12px;line-height:1.2\">" + form.custom404Title + "</h1><p style=\"font-size:15px;color:" + subColor + ";line-height:1.6;margin-bottom:28px\">" + form.custom404Message + "</p>" + (form.custom404ButtonText ? "<a href=\"" + form.custom404ButtonUrl + "\" style=\"display:inline-block;padding:12px 28px;background:" + btnBg + ";color:" + btnText + ";border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600\">" + form.custom404ButtonText + "</a>" : "") + "</div></body></html>";
  };

  const TABS: { id: TabType; label: string; icon: string }[] = [
    { id: "content", label: "Nội Dung", icon: "fa-solid fa-align-left" },
    { id: "design", label: "Thiết Kế", icon: "fa-solid fa-palette" },
    { id: "custom-code", label: "Code", icon: "fa-solid fa-code" },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-orange-500" />
              Trang 404 Tùy Chỉnh
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tùy chỉnh giao diện trang lỗi 404 theo thương hiệu của bạn</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/test-404-page-not-exist" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square" /> Xem thử
            </a>
            <button
              onClick={() => toggleFeatureMutation.mutate({ featureCustom404: !featureCustom404 })}
              disabled={toggleFeatureMutation.isPending}
              className={"flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border " + (featureCustom404 ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200")}
            >
              <i className={"fa-solid text-sm " + (featureCustom404 ? "fa-toggle-on text-green-600" : "fa-toggle-off")} />
              {featureCustom404 ? "Đang bật" : "Đang tắt"}
            </button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs">
              {saveMutation.isPending ? <><i className="fa-solid fa-spinner fa-spin mr-1" />Đang lưu...</> : <><i className="fa-solid fa-floppy-disk mr-1" />Lưu</>}
            </Button>
          </div>
        </div>

        {!featureCustom404 && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 flex items-center gap-2 flex-shrink-0">
            <i className="fa-solid fa-triangle-exclamation" />
            Đang dùng trang 404 mặc định. Bật để tùy chỉnh theo thương hiệu của bạn.
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
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
                      {TEMPLATES_404.map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                          className={"relative rounded-lg overflow-hidden border-2 transition-all " + (selectedTemplate === tpl.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300")}>
                          <div className="h-14 flex items-center justify-center" style={{ background: tpl.config.custom404BgColor }}>
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
                      <Input value={form.custom404Title} onChange={e => setForm(f => ({ ...f, custom404Title: e.target.value }))} placeholder="Trang Không Tồn Tại" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Nội Dung</Label>
                      <Textarea value={form.custom404Message} onChange={e => setForm(f => ({ ...f, custom404Message: e.target.value }))} rows={3} placeholder="Xin lỗi, trang bạn đang tìm kiếm không tồn tại..." className="mt-1 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Text Nút CTA</Label>
                        <Input value={form.custom404ButtonText} onChange={e => setForm(f => ({ ...f, custom404ButtonText: e.target.value }))} placeholder="Về Trang Chủ" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">URL Nút CTA</Label>
                        <Input value={form.custom404ButtonUrl} onChange={e => setForm(f => ({ ...f, custom404ButtonUrl: e.target.value }))} placeholder="/" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">URL Hình Ảnh (tùy chọn)</Label>
                      <Input value={form.custom404ImageUrl} onChange={e => setForm(f => ({ ...f, custom404ImageUrl: e.target.value }))} placeholder="https://example.com/404-image.png" className="mt-1" />
                      {form.custom404ImageUrl && (
                        <img src={form.custom404ImageUrl} alt="404 preview" className="mt-2 max-h-20 rounded-lg object-contain" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "design" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Màu Nền</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={form.custom404BgColor} onChange={e => setForm(f => ({ ...f, custom404BgColor: e.target.value }))} className="w-9 h-9 rounded cursor-pointer border border-gray-200" />
                        <Input value={form.custom404BgColor} onChange={e => setForm(f => ({ ...f, custom404BgColor: e.target.value }))} className="flex-1 font-mono text-xs h-9" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Màu Chữ</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={form.custom404TextColor} onChange={e => setForm(f => ({ ...f, custom404TextColor: e.target.value }))} className="w-9 h-9 rounded cursor-pointer border border-gray-200" />
                        <Input value={form.custom404TextColor} onChange={e => setForm(f => ({ ...f, custom404TextColor: e.target.value }))} className="flex-1 font-mono text-xs h-9" />
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
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Màu Nhanh</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { bg: "#0a0a0a", tc: "#ffffff" },
                        { bg: "#1e1b4b", tc: "#ffffff" },
                        { bg: "#4f46e5", tc: "#ffffff" },
                        { bg: "#0f766e", tc: "#ffffff" },
                        { bg: "#dc2626", tc: "#ffffff" },
                        { bg: "#f8fafc", tc: "#1e293b" },
                        { bg: "#fff7ed", tc: "#7c2d12" },
                        { bg: "#f0fdf4", tc: "#14532d" },
                        { bg: "#fdf4ff", tc: "#581c87" },
                        { bg: "#eff6ff", tc: "#1e3a5f" },
                      ].map((c, i) => (
                        <button key={i} onClick={() => setForm(f => ({ ...f, custom404BgColor: c.bg, custom404TextColor: c.tc }))}
                          title={c.bg}
                          className={"h-8 rounded-lg border-2 transition-all " + (form.custom404BgColor === c.bg ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300")}
                          style={{ background: c.bg }} />
                      ))}
                    </div>
                  </div>
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
                      {form.custom404CustomHtml && (
                        <button onClick={() => setForm(f => ({ ...f, custom404CustomHtml: "" }))} className="text-xs text-red-500 hover:text-red-700">
                          <i className="fa-solid fa-times mr-1" />Xóa code
                        </button>
                      )}
                    </div>
                    <Textarea value={form.custom404CustomHtml} onChange={e => setForm(f => ({ ...f, custom404CustomHtml: e.target.value }))} rows={18}
                      placeholder={"<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>404</title>\n  <style>\n    body { background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }\n  </style>\n</head>\n<body>\n  <div style=\"text-align:center\">\n    <h1 style=\"font-size:80px;opacity:0.2\">404</h1>\n    <h2>Trang Không Tồn Tại</h2>\n    <a href=\"/\">Về Trang Chủ</a>\n  </div>\n</body>\n</html>"}
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
          <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
                <iframe ref={iframeRef} srcDoc={buildPreviewHtml()} className="w-full h-full border-0" title="Preview trang 404" sandbox="allow-scripts allow-same-origin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
