import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, ExternalLink, Save } from "@/components/Icon";

export default function Custom404Admin() {
  const utils = trpc.useUtils();
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const settingsAny = settings as any;
  const featureCustom404 = settingsAny?.featureCustom404 === true;

  const [form, setForm] = useState({
    custom404Title: "Trang Không Tồn Tại",
    custom404Message: "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
    custom404ButtonText: "Về Trang Chủ",
    custom404ButtonUrl: "/",
    custom404ImageUrl: "",
    custom404BgColor: "#0a0a0a",
    custom404TextColor: "#ffffff",
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

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trang 404 Tùy Chỉnh</h1>
            <p className="text-muted-foreground text-sm mt-1">Tùy chỉnh giao diện trang lỗi 404 khi người dùng truy cập URL không tồn tại</p>
          </div>
          <button
            onClick={() => toggleFeatureMutation.mutate({ featureCustom404: !featureCustom404 })}
            disabled={toggleFeatureMutation.isPending}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              featureCustom404
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <i className={`fa-solid ${featureCustom404 ? "fa-toggle-on" : "fa-toggle-off"} text-base`} />
            {featureCustom404 ? "Trang 404: Bật" : "Trang 404: Tắt"}
          </button>
        </div>

        {!featureCustom404 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400">
            <i className="fa-solid fa-triangle-exclamation mr-2" />
            Đang dùng trang 404 mặc định. Bật để tùy chỉnh theo thương hiệu của bạn.
          </div>
        )}

        {/* Preview link */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Xem thử trang 404:</span>
          <a href="/test-404-page-not-exist" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            /test-404-page-not-exist <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nội Dung Trang 404</CardTitle>
            <CardDescription>Tùy chỉnh thông điệp hiển thị khi người dùng truy cập trang không tồn tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tiêu Đề</Label>
              <Input
                value={form.custom404Title}
                onChange={e => setForm(f => ({ ...f, custom404Title: e.target.value }))}
                placeholder="Trang Không Tồn Tại"
              />
            </div>
            <div>
              <Label>Nội Dung</Label>
              <Textarea
                value={form.custom404Message}
                onChange={e => setForm(f => ({ ...f, custom404Message: e.target.value }))}
                rows={3}
                placeholder="Xin lỗi, trang bạn đang tìm kiếm không tồn tại..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Text Nút CTA</Label>
                <Input
                  value={form.custom404ButtonText}
                  onChange={e => setForm(f => ({ ...f, custom404ButtonText: e.target.value }))}
                  placeholder="Về Trang Chủ"
                />
              </div>
              <div>
                <Label>URL Nút CTA</Label>
                <Input
                  value={form.custom404ButtonUrl}
                  onChange={e => setForm(f => ({ ...f, custom404ButtonUrl: e.target.value }))}
                  placeholder="/"
                />
              </div>
            </div>
            <div>
              <Label>URL Hình Ảnh (tùy chọn)</Label>
              <Input
                value={form.custom404ImageUrl}
                onChange={e => setForm(f => ({ ...f, custom404ImageUrl: e.target.value }))}
                placeholder="https://example.com/404-image.png"
              />
              {form.custom404ImageUrl && (
                <img src={form.custom404ImageUrl} alt="404 preview" className="mt-2 max-h-32 rounded-lg object-contain" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Màu Nền</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={form.custom404BgColor}
                    onChange={e => setForm(f => ({ ...f, custom404BgColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={form.custom404BgColor}
                    onChange={e => setForm(f => ({ ...f, custom404BgColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Màu Chữ</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={form.custom404TextColor}
                    onChange={e => setForm(f => ({ ...f, custom404TextColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={form.custom404TextColor}
                    onChange={e => setForm(f => ({ ...f, custom404TextColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Xem Trước</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-xl p-8 text-center min-h-[200px] flex flex-col items-center justify-center gap-4 transition-all"
              style={{ backgroundColor: form.custom404BgColor, color: form.custom404TextColor }}
            >
              {form.custom404ImageUrl && (
                <img src={form.custom404ImageUrl} alt="" className="max-h-24 object-contain" />
              )}
              {!form.custom404ImageUrl && (
                <div className="text-6xl font-black opacity-20">404</div>
              )}
              <h2 className="text-2xl font-bold">{form.custom404Title || "Trang Không Tồn Tại"}</h2>
              <p className="text-sm opacity-70 max-w-sm">{form.custom404Message}</p>
              {form.custom404ButtonText && (
                <div
                  className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold cursor-default"
                  style={{ backgroundColor: form.custom404TextColor, color: form.custom404BgColor }}
                >
                  {form.custom404ButtonText}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Đang lưu..." : "Lưu Trang 404"}
        </Button>
      </div>
    </DashboardLayoutCustom>
  );
}
