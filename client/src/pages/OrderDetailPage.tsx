import React, { useState, useCallback } from "react";
import { ArrowLeft, Package, CheckCircle, Truck, Shield, Clock, XCircle, RefreshCw, CreditCard, FileText, Download, Copy, Check, AlertCircle, Loader2, Receipt, Calendar, Phone, User } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
}> = {
  CREATED:   { label: "Chờ xác nhận",  color: "text-amber-700",   bgColor: "bg-amber-50",   borderColor: "border-amber-200",   icon: Clock,       step: 1 },
  PAID:      { label: "Đang xử lý",     color: "text-blue-700",    bgColor: "bg-blue-50",    borderColor: "border-blue-200",    icon: CheckCircle, step: 2 },
  SHIPPING:  { label: "Đang giao hàng", color: "text-indigo-700",  bgColor: "bg-indigo-50",  borderColor: "border-indigo-200",  icon: Truck,       step: 3 },
  COMPLETED: { label: "Hoàn thành",     color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: CheckCircle, step: 4 },
  WARRANTY:  { label: "Bảo hành",       color: "text-purple-700",  bgColor: "bg-purple-50",  borderColor: "border-purple-200",  icon: Shield,      step: 5 },
  FAILED:    { label: "Thất bại",       color: "text-red-600",     bgColor: "bg-red-50",     borderColor: "border-red-200",     icon: XCircle,     step: 0 },
  REFUNDED:  { label: "Đã hoàn tiền",  color: "text-teal-700",   bgColor: "bg-teal-50",   borderColor: "border-teal-200",   icon: RefreshCw,   step: 0 },
  CANCELLED: { label: "Đã hủy",         color: "text-slate-600",   bgColor: "bg-slate-100",  borderColor: "border-slate-200",   icon: XCircle,     step: 0 },
  EXPIRED:   { label: "Hết hạn",       color: "text-gray-500",    bgColor: "bg-gray-100",   borderColor: "border-gray-200",    icon: Clock,       step: 0 },
};

const STEPS = [
  { key: "CREATED",   label: "Tạo đơn",      icon: Package },
  { key: "PAID",      label: "Đang xử lý",  icon: CheckCircle },
  { key: "SHIPPING",  label: "Đang giao",    icon: Truck },
  { key: "COMPLETED", label: "Hoàn thành",   icon: CheckCircle },
  { key: "WARRANTY",  label: "Bảo hành",    icon: Shield },
];

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")}đ`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      title="Sao chép"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
    </button>
  );
}

export default function OrderDetailPage() {
  const { customer } = useCustomerAuth();
  const params = useParams<{ invoiceNumber: string }>();
  const invoiceNumber = params.invoiceNumber || "";
  const [, navigate] = useLocation();
  const [exportingPdf, setExportingPdf] = useState(false);

  const email = customer?.email || "";

  const { data: order, isLoading, error } = trpc.invoices.getByEmailAndNumber.useQuery(
    { email, invoiceNumber },
    { enabled: !!email && !!invoiceNumber, staleTime: 30_000 }
  );

  const orderId = (order as any)?.id;
  const { data: inventoryItems = [] } = trpc.inventory.getByOrder.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId }
  );
  const exportPdfMutation = trpc.invoices.exportPdfForCustomer.useMutation({
    onSuccess: (data) => {
      const byteArray = Uint8Array.from(atob(data.buffer), c => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải hóa đơn PDF");
      setExportingPdf(false);
    },
    onError: (err) => {
      toast.error(err.message || "Không thể xuất PDF");
      setExportingPdf(false);
    },
  });

  const handleExportPdf = useCallback(() => {
    if (!email || !invoiceNumber) return;
    setExportingPdf(true);
    exportPdfMutation.mutate({ email, invoiceNumber });
  }, [email, invoiceNumber]);

  // Parse orderInfo
  const parseOrderInfo = (orderInfo: string | null | undefined) => {
    if (!orderInfo) return null;
    try {
      const parsed = JSON.parse(orderInfo);
      if (Array.isArray(parsed)) {
        // Array format: [{fieldName, fieldValue}]
        const result: Record<string, string> = {};
        parsed.forEach((f: any) => { if (f.fieldName) result[f.fieldName] = f.fieldValue || ""; });
        return Object.keys(result).length > 0 ? result : null;
      }
      if (typeof parsed === "object") return parsed;
      return null;
    } catch { return null; }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ClientHeader />
        <main className="flex-1 flex items-center justify-center pt-16 px-4">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
            <button onClick={() => navigate("/client-login")} className="mt-4 px-6 py-3 bg-[#1e3a6e] text-white rounded-xl font-semibold">Đăng nhập</button>
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ClientHeader />
        <main className="flex-1 flex items-center justify-center pt-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </main>
        <ClientFooter />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ClientHeader />
        <main className="flex-1 flex items-center justify-center pt-16 px-4">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-500 text-sm mb-6">Đơn hàng #{invoiceNumber} không tồn tại hoặc không thuộc tài khoản của bạn</p>
            <button onClick={() => navigate("/track-order")} className="px-6 py-3 bg-[#1e3a6e] text-white rounded-xl font-semibold">Xem đơn hàng</button>
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status || "CREATED"] || STATUS_CONFIG.CREATED;
  const StatusIcon = statusCfg.icon;
  const currentStep = statusCfg.step;
  const customFields = parseOrderInfo((order as any).orderInfo);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-16 pb-6 space-y-4">

        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/track-order")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 text-sm text-[#1e3a6e] hover:text-teal-600 font-semibold transition-colors disabled:opacity-50"
          >
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Tải PDF
          </button>
        </div>

        {/* Order header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Mã đơn hàng</p>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#1e3a6e]">#{order.invoiceNumber}</h1>
                <CopyButton text={order.invoiceNumber} />
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(order.createdAt)}
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ${statusCfg.bgColor} ${statusCfg.color} ${statusCfg.borderColor}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </div>
          </div>

          {/* Customer info */}
          {(order.customerName || order.customerPhone) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
              {order.customerName && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" /> {order.customerName}
                </span>
              )}
              {order.customerPhone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" /> {order.customerPhone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress steps */}
        {["CREATED", "PAID", "SHIPPING", "WARRANTY"].includes(order.status || "") && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isDone = stepNum < currentStep;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone ? "bg-teal-500 border-teal-500" :
                        isActive ? "bg-[#1e3a6e] border-[#1e3a6e]" :
                        "bg-white border-gray-300"
                      }`}>
                        <Icon className={`h-4 w-4 ${isDone || isActive ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <p className={`text-[10px] font-bold mt-1.5 tracking-wide text-center whitespace-nowrap ${
                        isDone ? "text-teal-500" : isActive ? "text-[#1e3a6e]" : "text-gray-400"
                      }`}>{s.label}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full self-start mt-5 ${isDone ? "bg-teal-400" : "bg-gray-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Products */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <Package className="h-4 w-4 text-[#1e3a6e]" /> Sản phẩm đã đặt
            </h3>
            <div className="space-y-3">
              {(order.items as any[]).map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} × {parseFloat(item.quantity)}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0">{formatCurrency(item.totalAmount)}</p>
                  </div>
                  {(inventoryItems as any[]).filter((inv: any) => inv.productId === item.productId).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Thông tin sản phẩm</p>
                      <div className="space-y-1.5">
                        {(inventoryItems as any[]).filter((inv: any) => inv.productId === item.productId).map((inv: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <span className="text-xs text-gray-400 flex-shrink-0">#{i + 1}</span>
                            <span className="text-xs font-mono text-gray-800 flex-1 break-all">{inv.stockData}</span>
                            <CopyButton text={inv.stockData || ""} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order info / custom fields */}
        {customFields && Object.keys(customFields).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <FileText className="h-4 w-4 text-blue-600" /> Thông tin đơn hàng
            </h3>
            <div className="space-y-2">
              {Object.entries(customFields).map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{k}</p>
                    <p className="text-sm text-gray-800 mt-0.5 font-mono break-all">{String(v)}</p>
                  </div>
                  <CopyButton text={String(v)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warranty info */}
        {!!(order.warrantyStartDate || order.warrantyExpiryDate || (Number(order.warrantyMonths) > 0)) && (
          <div className={`rounded-2xl border p-5 ${
            order.status === "WARRANTY"
              ? "bg-purple-50 border-purple-200"
              : "bg-white border-gray-200 shadow-sm"
          }`}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <Shield className={`h-4 w-4 ${order.status === "WARRANTY" ? "text-purple-600" : "text-gray-500"}`} />
              Thông tin bảo hành
            </h3>
            <div className="space-y-2 text-sm">
              {order.warrantyMonths && order.warrantyMonths > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời hạn bảo hành</span>
                  <span className="font-semibold text-gray-800">{order.warrantyMonths} tháng</span>
                </div>
              ) : null}
              {order.warrantyStartDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày bắt đầu</span>
                  <span className="font-semibold text-gray-800">{formatDate(order.warrantyStartDate)}</span>
                </div>
              )}
              {order.warrantyExpiryDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày hết hạn</span>
                  <span className={`font-semibold ${
                    new Date(order.warrantyExpiryDate) < new Date() ? "text-red-500" : "text-green-600"
                  }`}>
                    {formatDate(order.warrantyExpiryDate)}
                    {new Date(order.warrantyExpiryDate) < new Date() ? " (Đã hết hạn)" : ""}
                  </span>
                </div>
              )}
              {order.status === "WARRANTY" && order.warrantyExpiryDate && new Date(order.warrantyExpiryDate) >= new Date() && (
                <div className="mt-3 bg-purple-100 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-xs text-purple-700 font-medium">Sản phẩm đang trong thời hạn bảo hành</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <CreditCard className="h-4 w-4 text-green-600" /> Thông tin thanh toán
          </h3>
          <div className="space-y-2 text-sm">
            {parseFloat(String(order.subtotal || 0)) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Giá gốc</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {parseFloat(String(order.discountAmount || 0)) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {parseFloat(String(order.taxAmount || 0)) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Thuế</span>
                <span>+{formatCurrency(order.taxAmount)}</span>
              </div>
            )}
            {order.paidAt && (
              <div className="flex justify-between text-gray-500">
                <span>Thanh toán lúc</span>
                <span>{formatDate(order.paidAt)}</span>
              </div>
            )}
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex justify-between items-center mt-2">
              <span className="font-bold text-gray-900">Tổng thanh toán</span>
              <span className="font-bold text-[#1e3a6e] text-lg">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Public note */}
        {(order.publicNote || order.notes) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-0.5">Ghi chú từ shop</p>
              <p className="text-sm text-blue-900/80">{order.publicNote || order.notes}</p>
            </div>
          </div>
        )}

        {/* Payment URL if still CREATED */}
        {order.status === "CREATED" && order.paymentUrl && (
          <a
            href={order.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 rounded-2xl text-white font-bold text-base text-center bg-gradient-to-r from-[#1e3a6e] to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-teal-200"
          >
            💳 Thanh toán ngay
          </a>
        )}

        {/* Download PDF */}
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="w-full py-3.5 rounded-2xl text-[#1e3a6e] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors border border-[#1e3a6e]/30 bg-white disabled:opacity-50"
        >
          {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          {exportingPdf ? "Đang tạo PDF..." : "Tải hóa đơn PDF"}
        </button>

      </main>
      <ClientFooter />
    </div>
  );
}

