import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Search, Star, ArrowLeft, Loader2, ExternalLink, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "🔵",
  instagram: "📸",
  twitter: "🐦",
  tiktok: "🎵",
  youtube: "▶️",
  zalo: "💬",
  website: "🌐",
  other: "🔗",
};

export default function ThankYou() {
  const [, setLocation] = useLocation();
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invoiceId");
    if (id) setInvoiceId(parseInt(id));
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const { data: invoice, isLoading } = trpc.invoices.get.useQuery(
    { id: invoiceId! },
    { enabled: !!invoiceId }
  );

  // Lấy nội dung trang cảm ơn từ cấu hình admin
  const { data: thankYouConfig } = trpc.settingsExt.getThankYouPublic.useQuery();

  const exportPDFMutation = trpc.pdf.exportInvoice.useMutation({
    onSuccess: (data) => {
      const byteChars = atob(data.buffer);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNums)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "hoa-don.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải hóa đơn PDF!");
    },
    onError: () => toast.error("Không thể tải PDF. Vui lòng thử lại."),
  });

  const formatCurrency = (amount: number | string | null | undefined, currency = "VND") => {
    const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    return num.toLocaleString("vi-VN") + " " + currency;
  };

  const title = thankYouConfig?.thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!";
  const message = thankYouConfig?.thankYouMessage || "Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi. Đơn hàng của bạn đã được xác nhận.";
  const socialLinks = thankYouConfig?.thankYouSocialLinks || [];
  const companyName = thankYouConfig?.companyName || "Invoice Prime";
  const logoUrl = (thankYouConfig as any)?.logoUrl;
  const bgFrom = (thankYouConfig as any)?.thankYouBgFrom || "#f0fdf4";
  const bgTo = (thankYouConfig as any)?.thankYouBgTo || "#eff6ff";
  const bannerUrl = (thankYouConfig as any)?.thankYouBannerUrl;

  // Detect dark background for text color
  const isDarkBg = bgFrom.startsWith("#0") || bgFrom.startsWith("#1") || bgFrom.startsWith("#2");

  // Review link từ reviewToken của đơn hàng
  const reviewToken = (invoice as any)?.reviewToken;
  const reviewUrl = reviewToken ? `${window.location.origin}/review/${reviewToken}` : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500"
      style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}
    >
      {/* Confetti particles */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5],
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-lg">
        {/* Logo / Brand */}
        <div className="flex justify-center mb-4">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-12 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {companyName.charAt(0).toUpperCase()}
              </div>
              <span className={`font-semibold ${isDarkBg ? "text-white" : "text-gray-700"}`}>{companyName}</span>
            </div>
          )}
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
            
            {/* Banner image inside card */}
            {bannerUrl && (
              <div className="rounded-lg overflow-hidden mb-6 shadow-sm">
                <img src={bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
              </div>
            )}
            
            <p className="text-gray-500 mb-6 whitespace-pre-line">{message}</p>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : invoice ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mã đơn hàng</span>
                  <span className="font-semibold text-blue-600">{invoice.invoiceNumber}</span>
                </div>
                {(invoice as any).customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Khách hàng</span>
                    <span className="font-medium">{(invoice as any).customerName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng tiền</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(invoice.totalAmount, invoice.currency || "VND")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trạng thái</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã Thanh Toán
                  </span>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-3">
              {invoice && (
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={exportPDFMutation.isPending}
                  onClick={() => exportPDFMutation.mutate({ invoiceId: invoice.id })}
                >
                  {exportPDFMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Tải Hóa Đơn PDF
                </Button>
              )}

              {/* Nút Viết Đánh Giá - chỉ hiện khi có reviewToken */}
              {reviewUrl && (
                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => window.location.href = reviewUrl}
                >
                  <MessageSquare className="h-4 w-4" />
                  Viết Đánh Giá
                  <Star className="h-4 w-4 fill-white" />
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setLocation("/track-order")}
              >
                <Search className="h-4 w-4" />
                Tra Cứu Đơn Hàng
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-gray-500"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
                Về Trang Chủ
              </Button>
            </div>

            {/* Social Links từ cấu hình */}
            {socialLinks.length > 0 && (
              <div className="mt-6 pt-5 border-t">
                <p className="text-xs text-gray-400 mb-3">Theo dõi chúng tôi</p>
                <div className="flex justify-center gap-3 flex-wrap">
                  {socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"
                    >
                      <span>{PLATFORM_ICONS[link.platform] || "🔗"}</span>
                      <span className="capitalize">{link.platform}</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className={`text-center text-xs mt-4 ${isDarkBg ? "text-gray-400" : "text-gray-400"}`}>
          Bạn sẽ nhận được email xác nhận trong vài phút. Nếu không nhận được, vui lòng kiểm tra thư mục spam.
        </p>
      </div>
    </div>
  );
}
