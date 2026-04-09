import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, QrCode, AlertCircle, RefreshCw, Building2, Phone, Mail, ShoppingCart, Tag, X, Loader2 } from "@/components/Icon";

function formatCurrency(amount: string | number, currency: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (currency === "VND") return num.toLocaleString("vi-VN") + " ₫";
  return num.toLocaleString("vi-VN") + " " + currency;
}

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "Đã hết hạn";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PaymentPage() {
  const [, params] = useRoute("/pay/:invoiceId");
  const [, navigate] = useLocation();
  const invoiceId = params?.invoiceId ? parseInt(params.invoiceId) : null;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  // Local state for regenerated QR
  const [localQrCode, setLocalQrCode] = useState<string | null>(null);
  const [localPaymentUrl, setLocalPaymentUrl] = useState<string | null>(null);
  const [localExpiresAt, setLocalExpiresAt] = useState<number | null>(null);
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: number; code: string; discountAmount: number; description?: string | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const utils = trpc.useUtils();

  const { data: invoice, isLoading, error } = trpc.invoices.getPaymentInfo.useQuery(
    { invoiceId: invoiceId! },
    { enabled: !!invoiceId, refetchOnWindowFocus: false }
  );

  // Polling for payment status every 3 seconds
  const { data: statusData } = trpc.invoices.checkPaymentStatus.useQuery(
    { invoiceId: invoiceId! },
    {
      enabled: !!invoiceId && !isPaid,
      refetchInterval: isPaid ? false : 3000,
      refetchOnWindowFocus: false,
    }
  );

  const regenerateMutation = trpc.invoices.regeneratePaymentLink.useMutation({
    onSuccess: (data) => {
      setLocalQrCode(data.qrCode);
      setLocalPaymentUrl(data.paymentUrl);
      const expTs = new Date(data.expiresAt).getTime();
      setLocalExpiresAt(expTs);
      setCountdown(Math.floor((expTs - Date.now()) / 1000));
      utils.invoices.getPaymentInfo.invalidate({ invoiceId: invoiceId! });
    },
  });

  // Watch for payment completion
  useEffect(() => {
    if (statusData?.paid) {
      setIsPaid(true);
      setTimeout(() => {
        navigate(`/thank-you?invoiceId=${invoiceId}`);
      }, 2000);
    }
  }, [statusData, invoiceId, navigate]);

  // Countdown timer - use localExpiresAt if available
  useEffect(() => {
    const expiresAtMs = localExpiresAt ?? (invoice?.expiresAt ? new Date(invoice.expiresAt).getTime() : null);
    if (!expiresAtMs) return;
    const tick = () => {
      const remaining = Math.floor((expiresAtMs - Date.now()) / 1000);
      setCountdown(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [invoice?.expiresAt, localExpiresAt]);

  if (!invoiceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Link không hợp lệ</h2>
            <p className="text-slate-500">Không tìm thấy thông tin hóa đơn.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hóa đơn</h2>
            <p className="text-slate-500">Hóa đơn không tồn tại hoặc đã bị xóa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = countdown !== null && countdown <= 0;
  const alreadyPaid = invoice.status === "PAID" || isPaid;
  const subtotal = typeof invoice.subtotal === "string" ? parseFloat(invoice.subtotal) : invoice.subtotal;
  const taxAmount = typeof invoice.taxAmount === "string" ? parseFloat(invoice.taxAmount || "0") : (invoice.taxAmount || 0);
  const discountAmount = typeof invoice.discountAmount === "string" ? parseFloat(invoice.discountAmount || "0") : (invoice.discountAmount || 0);
  const rawTotal = typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(0, rawTotal - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const result = await utils.client.coupon.validate.query({
        code: couponCode.trim(),
        orderAmount: rawTotal,
        customerEmail: (invoice as any).customerEmail || undefined,
      });
      if (result.valid && result.couponId) {
        setAppliedCoupon({
          couponId: result.couponId,
          code: result.code!,
          discountAmount: result.discountAmount!,
          description: result.description,
        });
        setCouponError(null);
      } else {
        setCouponError(result.error || "M\u00e3 kh\u00f4ng h\u1ee3p l\u1ec7");
        setAppliedCoupon(null);
      }
    } catch (e: any) {
      setCouponError(e.message || "L\u1ed7i ki\u1ec3m tra m\u00e3 gi\u1ea3m gi\u00e1");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };
  const companyLogo = (invoice as any).companyLogo as string | null;
  const accentColor = (invoice as any).accentColor as string || "#2563eb";
  // Use local (regenerated) values if available
  const displayQrCode = localQrCode || invoice.qrCode;
  const displayPaymentUrl = localPaymentUrl || invoice.paymentUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header - Company branding */}
        <div className="text-center mb-2">
          {companyLogo ? (
            <div className="flex justify-center mb-3">
              <img
                src={companyLogo}
                alt={invoice.companyName}
                className="h-16 max-w-[220px] object-contain drop-shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: accentColor + "20" }}
              >
                <Building2 className="w-6 h-6" style={{ color: accentColor }} />
              </div>
            </div>
          )}
          <h1 className="font-bold text-slate-800 text-xl">{invoice.companyName}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mt-1">
            {invoice.companyPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {invoice.companyPhone}
              </span>
            )}
            {invoice.companyEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {invoice.companyEmail}
              </span>
            )}
          </div>
        </div>

        {/* Paid success state */}
        {alreadyPaid && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Thanh toán thành công!</h2>
              <p className="text-green-600">Đang chuyển đến trang xác nhận...</p>
            </CardContent>
          </Card>
        )}

        {/* Expired state - with regenerate button */}
        {!alreadyPaid && isExpired && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6 pb-6 text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-orange-700 mb-2">Mã QR đã hết hạn</h2>
              <p className="text-orange-600 text-sm mb-5">
                Nhấn nút bên dưới để tạo mã QR mới và tiếp tục thanh toán.
              </p>
              <Button
                onClick={() => regenerateMutation.mutate({ invoiceId: invoiceId!, origin: window.location.origin })}
                disabled={regenerateMutation.isPending}
                className="gap-2 text-white"
                style={{ backgroundColor: accentColor }}
              >
                {regenerateMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo mã mới...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Tạo lại mã QR</>
                )}
              </Button>
              {regenerateMutation.isError && (
                <p className="text-red-500 text-xs mt-3">{regenerateMutation.error?.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main payment card */}
        {!alreadyPaid && !isExpired && (
          <Card className="shadow-lg border-0 overflow-hidden">
            {/* Accent top bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
            <CardContent className="p-6">
              {/* Invoice info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Hóa đơn</p>
                  <p className="font-bold text-slate-800 text-lg">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-slate-500 mt-0.5">Khách hàng: {invoice.customerName}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-opacity-30"
                  style={{ color: accentColor, borderColor: accentColor + "50", backgroundColor: accentColor + "10" }}
                >
                  Chờ thanh toán
                </Badge>
              </div>

              {/* Countdown */}
              {countdown !== null && countdown > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-amber-700">
                    Hết hạn sau: <span className="font-bold font-mono">{formatCountdown(countdown)}</span>
                  </span>
                </div>
              )}

              <Separator className="mb-4" />

              {/* Items */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Chi tiết đơn hàng
                </div>
                <div className="space-y-1.5">
                  {invoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                        {item.name}
                        <span className="text-slate-400 ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(item.totalAmount, invoice.currency || "VND")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-3 mb-5 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Cộng tiền hàng</span>
                  <span>{formatCurrency(subtotal, invoice.currency || "VND")}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Thuế VAT</span>
                    <span>{formatCurrency(taxAmount, invoice.currency || "VND")}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Chiết khấu</span>
                    <span>-{formatCurrency(discountAmount, invoice.currency || "VND")}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Mã giảm giá ({appliedCoupon?.code})
                    </span>
                    <span>-{formatCurrency(couponDiscount, invoice.currency || "VND")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base text-slate-800 pt-0.5">
                  <span>Tổng cộng</span>
                  <span style={{ color: accentColor }}>{formatCurrency(totalAmount, invoice.currency || "VND")}</span>
                </div>
              </div>


              {/* Coupon Code Input */}
              {!appliedCoupon ? (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    Mã giảm giá
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                      placeholder="Nhập mã giảm giá..."
                      className="font-mono text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-1.5"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                      Áp dụng
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-1.5">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-bold text-emerald-700">{appliedCoupon.code}</span>
                        {appliedCoupon.description && (
                          <p className="text-xs text-emerald-600 mt-0.5">{appliedCoupon.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-700">
                        -{formatCurrency(appliedCoupon.discountAmount, invoice.currency || "VND")}
                      </span>
                      <button onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {displayQrCode ? (
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
                    <QrCode className="w-3.5 h-3.5" />
                    Quét mã QR để thanh toán
                  </div>
                  <div
                    className="inline-block p-3 bg-white rounded-2xl shadow-sm mb-3"
                    style={{ border: `2px solid ${accentColor}30` }}
                  >
                    <img
                      src={`data:image/png;base64,${displayQrCode}`}
                      alt="QR Code thanh toán"
                      className="w-52 h-52 object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Hỗ trợ tất cả ứng dụng ngân hàng</p>
                  <p className="text-xs text-slate-400">MBBank · VietcomBank · Techcombank · VPBank và nhiều hơn nữa</p>
                  {/* Auto-refresh + regenerate */}
                  <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} />
                      <span>Tự động kiểm tra trạng thái mỗi 3 giây</span>
                    </div>
                    <button
                      onClick={() => regenerateMutation.mutate({ invoiceId: invoiceId!, origin: window.location.origin })}
                      disabled={regenerateMutation.isPending}
                      className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {regenerateMutation.isPending ? "Đang tạo..." : "Tạo lại QR"}
                    </button>
                  </div>
                  {regenerateMutation.isError && (
                    <p className="text-red-500 text-xs mt-2">{regenerateMutation.error?.message}</p>
                  )}
                  {/* Direct payment link */}
                  {displayPaymentUrl && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(displayPaymentUrl, "_blank")}
                        className="text-xs gap-1.5"
                      >
                        Mở trang thanh toán PayOS
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">Mã QR chưa được tạo</p>
                  <Button
                    onClick={() => regenerateMutation.mutate({ invoiceId: invoiceId!, origin: window.location.origin })}
                    disabled={regenerateMutation.isPending}
                    className="gap-2 text-white mb-3"
                    style={{ backgroundColor: accentColor }}
                  >
                    {regenerateMutation.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Tạo mã QR thanh toán</>
                    )}
                  </Button>
                  {regenerateMutation.isError && (
                    <p className="text-red-500 text-xs mt-1">{regenerateMutation.error?.message}</p>
                  )}
                  {displayPaymentUrl && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(displayPaymentUrl, "_blank")}
                      >
                        Thanh toán qua trang PayOS
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && !alreadyPaid && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Ghi chú</p>
              <p className="text-sm text-amber-800">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Powered by Invoice Prime · Thanh toán an toàn qua PayOS
        </p>
      </div>
    </div>
  );
}
