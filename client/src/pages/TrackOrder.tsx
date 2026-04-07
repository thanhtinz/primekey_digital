import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, CheckCircle, Truck, Shield, Clock, AlertCircle, User, Phone, ShoppingBag, CreditCard, ChevronDown, ChevronUp, ExternalLink, Mail, FileText, Receipt } from "lucide-react";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
}> = {
  CREATED: { label: "Tạo Đơn", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/30", icon: Package, step: 1 },
  PAID: { label: "Đã Thanh Toán", color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/30", icon: CheckCircle, step: 2 },
  SHIPPING: { label: "Đang Giao Hàng", color: "text-amber-400", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/30", icon: Truck, step: 3 },
  WARRANTY: { label: "Bảo Hành", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/30", icon: Shield, step: 4 },
  FAILED: { label: "Thất Bại", color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500/30", icon: AlertCircle, step: 0 },
  EXPIRED: { label: "Hết Hạn", color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-500/30", icon: Clock, step: 0 },
};

const STEPS = [
  { key: "CREATED", label: "Tạo Đơn", icon: Package },
  { key: "PAID", label: "Thanh Toán", icon: CheckCircle },
  { key: "SHIPPING", label: "Giao Hàng", icon: Truck },
  { key: "WARRANTY", label: "Bảo Hành", icon: Shield },
];

function formatCurrency(amount: string | number | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") return `$${num.toFixed(2)}`;
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Expandable order card
function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[order.status || "CREATED"] || STATUS_CONFIG.CREATED;
  const StatusIcon = statusCfg.icon;
  const currentStep = statusCfg.step;
  const currency = order.currency || "VND";

  const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

  return (
    <Card className="bg-white/[0.04] border-white/10 overflow-hidden transition-all hover:bg-white/[0.06]">
      <CardContent className="p-0">
        {/* Order Header - always visible */}
        <button
          onClick={toggleExpand}
          className="w-full text-left p-5 flex items-start justify-between gap-4 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3 className="font-bold text-white text-base font-mono">{order.invoiceNumber}</h3>
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bgColor} ${statusCfg.color} border ${statusCfg.borderColor}`}>
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </div>
            </div>
            {order.customerName && (
              <p className="text-slate-400 text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                {order.customerName}
                {order.customerPhone && (
                  <span className="text-slate-500 ml-2 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customerPhone}
                  </span>
                )}
              </p>
            )}
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
            <p className="font-black text-white text-xl">
              {formatCurrency(order.totalAmount, currency)}
            </p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${expanded ? "rotate-180" : ""} bg-white/5`}>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-white/10">
            {/* Progress Steps */}
            {currentStep > 0 && (
              <div className="px-5 py-5 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 z-0" />
                  <div
                    className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 z-0 transition-all duration-700"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                  {STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const isCompleted = i + 1 < currentStep;
                    const isCurrent = i + 1 === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" : isCurrent ? "bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-slate-800 border-white/20"
                        }`}>
                          <StepIcon className={`h-4 w-4 ${isCompleted ? "text-white" : isCurrent ? "text-blue-400" : "text-slate-600"}`} />
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isCompleted || isCurrent ? "text-white" : "text-slate-600"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items list */}
            {order.items && order.items.length > 0 && (
              <div className="px-5 py-4 border-b border-white/5">
                <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <ShoppingBag className="h-4 w-4 text-blue-400" />
                  Chi Tiết Sản Phẩm ({order.items.length})
                </h4>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {formatCurrency(item.unitPrice, currency)} × {parseFloat(item.quantity)}
                        </p>
                      </div>
                      <p className="text-white text-sm font-bold ml-3">
                        {formatCurrency(item.totalAmount, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment summary */}
            <div className="px-5 py-4 border-b border-white/5">
              <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Tổng Kết Thanh Toán
              </h4>
              <div className="space-y-2 text-sm bg-white/[0.02] border border-white/5 rounded-xl p-4">
                {order.subtotal && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(order.subtotal, currency)}</span>
                  </div>
                )}
                {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(order.discountAmount, currency)}</span>
                  </div>
                )}
                {order.taxAmount && parseFloat(order.taxAmount) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Thuế</span>
                    <span>{formatCurrency(order.taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Tổng cộng</span>
                  <span className="text-xl">{formatCurrency(order.totalAmount, currency)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-emerald-400 text-xs pt-1">
                    <span>Đã thanh toán lúc</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty info */}
            {order.warrantyMonths && order.warrantyMonths > 0 && (
              <div className="px-5 py-4 border-b border-white/5">
                <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-purple-400" />
                  Thông Tin Bảo Hành
                </h4>
                <div className="text-sm space-y-2 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Thời hạn</span>
                    <span className="text-white font-medium">{order.warrantyMonths} tháng</span>
                  </div>
                  {order.warrantyStartDate && (
                    <div className="flex justify-between text-slate-400">
                      <span>Bắt đầu</span>
                      <span className="text-white">{formatDateShort(order.warrantyStartDate)}</span>
                    </div>
                  )}
                  {order.warrantyExpiryDate && (
                    <div className="flex justify-between text-slate-400">
                      <span>Hết hạn</span>
                      <span className={`font-semibold ${new Date(order.warrantyExpiryDate) > new Date() ? "text-emerald-400" : "text-red-400"}`}>
                        {formatDateShort(order.warrantyExpiryDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(order.publicNote || order.notes) && (
              <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
                  <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-blue-400 font-semibold text-xs mb-0.5">Ghi chú</p>
                    <p className="text-blue-200/80">{order.publicNote || order.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment link */}
            {order.status === "CREATED" && order.paymentUrl && (
              <div className="px-5 py-4 border-b border-white/5">
                <a
                  href={order.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <ExternalLink className="h-4 w-4" />
                  Thanh Toán Ngay
                </a>
              </div>
            )}

            {/* Last updated */}
            <div className="px-5 py-3 bg-white/[0.02]">
              <p className="text-slate-600 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Cập nhật lần cuối: {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });

  const { data: orders, isLoading, error } = trpc.invoices.getByEmail.useQuery(
    { email: searchEmail },
    {
      enabled: !!searchEmail,
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSearchEmail(email.trim());
    }
  };

  const brandName = publicInfo?.companyName || "Invoice Prime";

  // Stats
  const totalOrders = orders?.length || 0;
  const paidOrders = orders?.filter(o => ["PAID", "SHIPPING", "WARRANTY"].includes(o.status || "")).length || 0;
  const totalSpent = orders?.reduce((s, o) => s + (typeof o.totalAmount === "string" ? parseFloat(o.totalAmount) : (o.totalAmount || 0)), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <ClientHeader maxWidth="max-w-5xl" />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/10 rounded-3xl mb-4 border border-blue-500/20">
            <Search className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Tra Cứu <span className="text-blue-400">Đơn Hàng</span>
          </h1>
          <p className="text-slate-400 text-base">Nhập email để xem trạng thái và chi tiết tất cả đơn hàng của bạn</p>
        </div>

        {/* Search Form */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 text-base"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Search className="h-4 w-4 mr-2" />Tra Cứu</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-4 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Có lỗi xảy ra</p>
              <p className="text-sm text-red-400/70 mt-0.5">Vui lòng thử lại sau.</p>
            </div>
          </div>
        )}

        {searchEmail && !isLoading && orders !== undefined && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-20 w-20 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-slate-400">Không có đơn hàng nào với email <strong className="text-white">{searchEmail}</strong></p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <Receipt className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-xl">{totalOrders}</p>
                    <p className="text-slate-500 text-xs">Tổng đơn</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-xl">{paidOrders}</p>
                    <p className="text-slate-500 text-xs">Đã thanh toán</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <CreditCard className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm sm:text-base truncate">{formatCurrency(totalSpent)}</p>
                    <p className="text-slate-500 text-xs">Tổng chi tiêu</p>
                  </div>
                </div>

                <p className="text-slate-400 text-sm">
                  Tìm thấy <strong className="text-white">{orders.length}</strong> đơn hàng cho <strong className="text-white">{searchEmail}</strong>
                  <span className="text-slate-500 ml-2">(Nhấn vào đơn hàng để xem chi tiết)</span>
                </p>
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-slate-600 border-t border-white/5">
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}
