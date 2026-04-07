import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Search, Star, ArrowLeft, Loader2, ExternalLink, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ICON_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  tiktok: "#010101",
  youtube: "#FF0000",
  zalo: "#0068FF",
  website: "#6366F1",
  other: "#6B7280",
};

function SocialIcon({ platform }: { platform: string }) {
  const color = PLATFORM_ICON_COLORS[platform] || "#6B7280";
  switch (platform) {
    case "facebook":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case "twitter":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case "zalo":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 16.5H6.438C5.643 16.5 5 15.857 5 15.062V8.938C5 8.143 5.643 7.5 6.438 7.5h11.124c.795 0 1.438.643 1.438 1.438v6.124c0 .795-.643 1.438-1.438 1.438zM8.5 10.5v3m3-3v3m3-3v3"/>
          <text x="6" y="14" fontSize="5" fontWeight="bold" fill="white">Zalo</text>
        </svg>
      );
    case "website":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      );
  }
}

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
              <div className="rounded-lg overflow-hidden mb-6 shadow-sm bg-gray-100 flex items-center justify-center">
                <img src={bannerUrl} alt="Banner" className="w-full h-auto max-h-64 object-contain" />
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
                      <SocialIcon platform={link.platform} />
                      <span className="capitalize">{link.platform}</span>
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
