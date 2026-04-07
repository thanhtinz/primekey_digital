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
import { Heart, Plus, Trash2, Eye, ExternalLink } from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "zalo", label: "Zalo" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
];

export default function ThankYouCustom() {
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const [form, setForm] = useState({
    thankYouTitle: "Cảm Ơn Bạn Đã Thanh Toán!",
    thankYouMessage: "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
    thankYouSocialLinks: [] as Array<{ platform: string; url: string }>,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        thankYouTitle: (settings as any).thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!",
        thankYouMessage: (settings as any).thankYouMessage || "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
        thankYouSocialLinks: (settings as any).thankYouSocialLinks || [],
      });
    }
  }, [settings]);

  const saveMutation = trpc.settingsExt.updateThankYou.useMutation({
    onSuccess: () => { toast.success("Đã lưu trang cảm ơn"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const addLink = () => setForm(f => ({ ...f, thankYouSocialLinks: [...f.thankYouSocialLinks, { platform: "facebook", url: "" }] }));
  const removeLink = (idx: number) => setForm(f => ({ ...f, thankYouSocialLinks: f.thankYouSocialLinks.filter((_, i) => i !== idx) }));
  const updateLink = (idx: number, field: "platform" | "url", value: string) =>
    setForm(f => ({ ...f, thankYouSocialLinks: f.thankYouSocialLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l) }));

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

        {/* Form */}
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

            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Xem Trước
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 rounded-xl p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold">{form.thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!"}</h3>
              <p className="text-sm text-muted-foreground">{form.thankYouMessage || "Đơn hàng của bạn đã được xác nhận."}</p>
              {form.thankYouSocialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {form.thankYouSocialLinks.map((link, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
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
