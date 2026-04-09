import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Package, CheckCircle, Truck, Shield, Clock, AlertCircle, ShoppingBag, CreditCard, ChevronDown, ExternalLink, FileText, RefreshCw, XCircle } from "@/components/Icon";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  tabColor: string;
}> = {
  CREATED:   { label: "Chờ xác nhận",  color: "text-amber-700",   bgColor: "bg-amber-50",   borderColor: "border-amber-200",   icon: Clock,       step: 1, tabColor: "text-amber-700"   },
  PAID:      { label: "Đang xử lý",     color: "text-blue-700",    bgColor: "bg-blue-50",    borderColor: "border-blue-200",    icon: CheckCircle, step: 2, tabColor: "text-blue-700"    },
  SHIPPING:  { label: "Đang giao hàng", color: "text-indigo-700",  bgColor: "bg-indigo-50",  borderColor: "border-indigo-200",  icon: Truck,       step: 3, tabColor: "text-indigo-700"  },
  COMPLETED: { label: "Hoàn thành",     color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: CheckCircle, step: 4, tabColor: "text-emerald-700" },
  WARRANTY:  { label: "Bảo hành",       color: "text-purple-700",  bgColor: "bg-purple-50",  borderColor: "border-purple-200",  icon: Shield,      step: 5, tabColor: "text-purple-700"  },
  FAILED:    { label: "Thất bại",       color: "text-red-600",     bgColor: "bg-red-50",     borderColor: "border-red-200",     icon: XCircle,     step: 0, tabColor: "text-red-600"     },
  REFUNDED:  { label: "Đã hoàn tiền",  color: "text-teal-700",   bgColor: "bg-teal-50",   borderColor: "border-teal-200",   icon: RefreshCw,   step: 0, tabColor: "text-teal-700"   },
  CANCELLED: { label: "Đã hủy",         color: "text-slate-600",   bgColor: "bg-slate-100",  borderColor: "border-slate-200",   icon: XCircle,     step: 0, tabColor: "text-slate-600"   },
  EXPIRED:   { label: "Hết hạn",       color: "text-gray-500",    bgColor: "bg-gray-100",   borderColor: "border-gray-200",    icon: Clock,       step: 0, tabColor: "text-gray-500"    },
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
  return new Date(date).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Detail view for a single order
function OrderDetail({ order, onBack }: { order: any; onBack: () => void }) {
  const statusCfg = STATUS_CONFIG[order.status || "CREATED"] || STATUS_CONFIG.CREATED;
  const StatusIcon = statusCfg.icon;
  const currentStep = statusCfg.step;

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ChevronDown className="h-4 w-4 rotate-90" /> Quay lại danh sách
      </button>

      {/* Order header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#1e3a6e]">Chi tiết đơn hàng #{order.invoiceNumber}</h2>
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bgColor} ${statusCfg.color} border ${statusCfg.borderColor}`}>
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          {order.status === "CREATED" && order.paymentUrl && (
            <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a6e] hover:bg-[#162d57] text-white text-sm font-semibold rounded-xl transition-colors">
              <ExternalLink className="h-4 w-4" /> Thanh toán ngay
            </a>
          )}
        </div>

        {/* Progress steps */}
        {currentStep > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div className="absolute top-4 left-0 h-0.5 bg-[#1e3a6e] z-0 transition-all duration-700"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isCompleted = i + 1 < currentStep;
                const isCurrent = i + 1 === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? "bg-[#1e3a6e] border-[#1e3a6e]" : isCurrent ? "bg-blue-50 border-[#1e3a6e]" : "bg-white border-gray-300"
                    }`}>
                      <StepIcon className={`h-4 w-4 ${isCompleted ? "text-white" : isCurrent ? "text-[#1e3a6e]" : "text-gray-400"}`} />
                    </div>
                    <p className={`text-xs mt-2 font-medium ${isCompleted || isCurrent ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <ShoppingBag className="h-4 w-4 text-[#1e3a6e]" /> Thông tin sản phẩm
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  {item.variantName && (
                    <span className="inline-block mt-0.5 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.variantName}</span>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.unitPrice)} × {parseFloat(item.quantity)}</p>
                </div>
                <p className="text-sm font-bold text-gray-800 flex-shrink-0">{formatCurrency(item.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment summary */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <CreditCard className="h-4 w-4 text-green-600" /> Thông tin thanh toán
        </h3>
        <div className="space-y-2 text-sm">
          {order.subtotal && parseFloat(String(order.subtotal)) > 0 && <div className="flex justify-between text-gray-600"><span>Giá gốc</span><span>{formatCurrency(order.subtotal)}</span></div>}
          {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatCurrency(order.discountAmount)}</span></div>
          )}
          {order.taxAmount && parseFloat(order.taxAmount) > 0 && (
            <div className="flex justify-between text-gray-600"><span>Thuế</span><span>{formatCurrency(order.taxAmount)}</span></div>
          )}
          <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-100">
            <span>Tổng thanh toán</span>
            <span className="text-[#1e3a6e]">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Order info (custom fields) */}
      {order.customFields && Object.keys(order.customFields).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <FileText className="h-4 w-4 text-blue-600" /> Thông tin đơn hàng
          </h3>
          <div className="space-y-2">
            {Object.entries(order.customFields).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{k}</p>
                <p className="text-sm text-gray-800 mt-0.5">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {(order.publicNote || order.notes) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-0.5">Ghi chú</p>
            <p className="text-sm text-blue-900/80">{order.publicNote || order.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Order list card
function OrderCard({ order, onView }: { order: any; onView: () => void }) {
  const statusCfg = STATUS_CONFIG[order.status || "CREATED"] || STATUS_CONFIG.CREATED;
  const StatusIcon = statusCfg.icon;
  const firstItem = order.items?.[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-bold text-[#1e3a6e]">#{order.invoiceNumber}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-1">
            {firstItem?.name || "Đơn hàng"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.bgColor} ${statusCfg.color} border ${statusCfg.borderColor}`}>
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {firstItem?.imageUrl && (
            <img src={firstItem.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <p className="text-sm text-gray-600">
            Tổng tiền: <span className="font-bold text-[#1e3a6e]">{formatCurrency(order.totalAmount)}</span>
          </p>
        </div>
        <button onClick={onView}
          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

const STATUS_TABS = [
  { key: "all",       label: "Tất cả" },
  { key: "CREATED",   label: "Chờ xác nhận" },
  { key: "PAID",      label: "Đang xử lý" },
  { key: "SHIPPING",  label: "Đang giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "WARRANTY",  label: "Bảo hành" },
  { key: "FAILED",    label: "Thất bại" },
  { key: "REFUNDED",  label: "Hoàn tiền" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const { customer, isLoggedIn, isLoading: authLoading } = useCustomerAuth();
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) setLocation("/client-login");
  }, [authLoading, isLoggedIn, setLocation]);

  const { data: orders = [], isLoading, error } = trpc.invoices.getByEmail.useQuery(
    { email: customer?.email || "" },
    { enabled: !!customer?.email, refetchInterval: 30000 }
  );

  const filtered = (orders as any[]).filter(o => {
    const matchTab = activeTab === "all" || o.status === activeTab;
    const q = searchText.toLowerCase().trim();
    const matchSearch = !q ||
      (o.invoiceNumber || "").toLowerCase().includes(q) ||
      (o.items || []).some((i: any) => (i.name || "").toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all"
      ? (orders as any[]).length
      : (orders as any[]).filter(o => o.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-16 pb-6 space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1e3a6e] flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Đơn hàng của tôi</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tổng cộng {(orders as any[]).length} đơn hàng
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Tìm mã đơn hàng, tên sản phẩm.."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => {}}
              className="px-5 py-2.5 bg-[#1e3a6e] hover:bg-[#162d57] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.key
                    ? "bg-[#1e3a6e] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {tabCounts[tab.key] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
          </div>
        )}

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">Không tìm thấy đơn hàng</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab !== "all" ? "Không có đơn hàng nào trong trạng thái này" : "Bạn chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => (
              <OrderCard key={order.id} order={order} onView={() => setLocation(`/order/${order.invoiceNumber}`)} />
            ))}
          </div>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
