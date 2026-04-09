import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Code, Copy, Star, Eye } from "@/components/Icon";

export default function EmbedWidget() {
  const [config, setConfig] = useState({
    theme: "light",
    maxReviews: "6",
    showRating: "true",
    layout: "grid",
  });
  const [copied, setCopied] = useState(false);

  const { data: reviews } = trpc.reviews.getPublic.useQuery();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();

  const siteUrl = window.location.origin;

  const embedCode = `<!-- ${publicInfo?.companyName || "Invoice Prime"} Reviews Widget -->
<div id="ip-reviews-widget"></div>
<script>
(function() {
  var config = {
    siteUrl: "${siteUrl}",
    theme: "${config.theme}",
    maxReviews: ${config.maxReviews},
    showRating: ${config.showRating},
    layout: "${config.layout}"
  };
  var s = document.createElement('script');
  s.src = "${siteUrl}/widget.js";
  s.onload = function() { window.IPReviews && window.IPReviews.init(config); };
  document.head.appendChild(s);
})();
</script>`;

  const iframeCode = `<iframe
  src="${siteUrl}/feedbacks-public?embed=1&theme=${config.theme}&max=${config.maxReviews}"
  width="100%"
  height="500"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Đã sao chép code!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Widget Đánh Giá Nhúng</h1>
          <p className="text-muted-foreground text-sm mt-1">Tạo code nhúng hiển thị đánh giá của khách hàng lên website ngoài</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xl font-bold">{reviews?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Đánh giá</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xl font-bold text-yellow-500">
              {reviews?.length ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Điểm TB</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xl font-bold text-green-600">{reviews?.filter(r => r.isPublic).length || 0}</p>
            <p className="text-xs text-muted-foreground">Công khai</p>
          </div>
        </div>

        {/* Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cấu Hình Widget</CardTitle>
            <CardDescription>Tùy chỉnh giao diện widget trước khi nhúng</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Giao Diện</Label>
              <Select value={config.theme} onValueChange={v => setConfig(c => ({ ...c, theme: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Sáng</SelectItem>
                  <SelectItem value="dark">Tối</SelectItem>
                  <SelectItem value="auto">Tự động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Số Đánh Giá Hiển Thị</Label>
              <Select value={config.maxReviews} onValueChange={v => setConfig(c => ({ ...c, maxReviews: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 đánh giá</SelectItem>
                  <SelectItem value="6">6 đánh giá</SelectItem>
                  <SelectItem value="9">9 đánh giá</SelectItem>
                  <SelectItem value="12">12 đánh giá</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bố Cục</Label>
              <Select value={config.layout} onValueChange={v => setConfig(c => ({ ...c, layout: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Lưới (Grid)</SelectItem>
                  <SelectItem value="list">Danh sách</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hiển Thị Sao</Label>
              <Select value={config.showRating} onValueChange={v => setConfig(c => ({ ...c, showRating: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Có</SelectItem>
                  <SelectItem value="false">Không</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Embed codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4" />
              Phương Thức 1: Nhúng Iframe (Đơn Giản)
            </CardTitle>
            <CardDescription>Dán code này vào HTML website của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{iframeCode}</pre>
            <Button variant="outline" size="sm" onClick={() => handleCopy(iframeCode)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              {copied ? "Đã sao chép!" : "Sao Chép Code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4" />
              Phương Thức 2: JavaScript Widget (Nâng Cao)
            </CardTitle>
            <CardDescription>Tích hợp linh hoạt hơn, phù hợp với React/Vue/WordPress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
            <Button variant="outline" size="sm" onClick={() => handleCopy(embedCode)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              {copied ? "Đã sao chép!" : "Sao Chép Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Xem Trước Đánh Giá
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!reviews?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Chưa có đánh giá nào được duyệt</p>
                <p className="text-xs mt-1">Quản lý đánh giá tại trang <a href="/feedbacks" className="text-blue-600 hover:underline">Feedback KH</a></p>
              </div>
            ) : (
              <div className={`grid gap-3 ${config.layout === "grid" ? "sm:grid-cols-2" : ""}`}>
                {reviews.slice(0, Number(config.maxReviews)).map((r, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {(r.customerName || "K").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{r.customerName || "Khách hàng"}</span>
                      {config.showRating === "true" && (
                        <div className="flex ml-auto">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} className={`w-3 h-3 ${si < (r.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>
                    {r.productName && <Badge variant="outline" className="text-xs">{r.productName}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p className="font-medium">Hướng dẫn sử dụng:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Chọn cấu hình widget phù hợp với website của bạn</li>
              <li>Sao chép code iframe (đơn giản) hoặc JavaScript (nâng cao)</li>
              <li>Dán code vào HTML website tại vị trí muốn hiển thị đánh giá</li>
              <li>Đảm bảo website của bạn cho phép nhúng từ domain này</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
