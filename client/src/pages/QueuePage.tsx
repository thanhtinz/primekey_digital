import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Package, CheckCircle, Truck, Loader2, ListOrdered, Activity, Timer, ShoppingBag, User } from "@/components/Icon";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  CREATED: { label: "Chờ Xử Lý", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  PAID: { label: "Đã Thanh Toán", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  SHIPPING: { label: "Đang Giao", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Truck },
};

function formatCurrency(amount: string | number | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") return `$${num.toFixed(2)}`;
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function timeAgo(date: Date | string) {
  const now = new Date().getTime();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function QueuePage() {
  const [, setLocation] = useLocation();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: orders = [], isLoading } = trpc.queue.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const brandName = publicInfo?.companyName || "Invoice Prime";
  const createdCount = orders.filter(o => o.status === "CREATED").length;
  const paidCount = orders.filter(o => o.status === "PAID").length;
  const shippingCount = orders.filter(o => o.status === "SHIPPING").length;

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <ClientHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500/30 to-orange-500/10 rounded-3xl mb-4 border border-amber-200">
            <ListOrdered className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">
            Hàng Chờ <span className="text-amber-600">Đơn Hàng</span>
          </h1>
          <p className="text-slate-500 text-base">Theo dõi trạng thái xử lý đơn hàng theo thời gian thực</p>

          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-emerald-600 text-xs font-medium">Cập nhật trực tiếp</span>
          </div>
        </div>

        {/* Stats */}
        {orders.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-center">
              <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-xl">{createdCount}</p>
              <p className="text-amber-500 text-xs">Chờ xử lý</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-xl">{paidCount}</p>
              <p className="text-emerald-500 text-xs">Đã thanh toán</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
              <Truck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-xl">{shippingCount}</p>
              <p className="text-blue-500 text-xs">Đang giao</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600 mb-3" />
            <p className="text-slate-500 text-sm">Đang tải danh sách...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Package className="h-20 w-20 mb-4 opacity-30" />
              <p className="text-xl font-bold text-slate-800 mb-1">Không có đơn hàng nào đang chờ</p>
              <p className="text-sm">Tất cả đơn hàng đã được xử lý xong</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const st = STATUS_LABEL[order.status || "CREATED"] || STATUS_LABEL.CREATED;
              const StIcon = st.icon;
              return (
                <Card key={order.id} className="bg-white border-slate-200 hover:bg-slate-50 transition-all overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Queue number sidebar */}
                      <div className="w-16 sm:w-20 bg-gradient-to-b from-blue-100 to-purple-50 border-r border-slate-200 flex flex-col items-center justify-center flex-shrink-0 py-4">
                        <span className="text-slate-500 text-[10px] uppercase font-medium tracking-wider">Thứ tự</span>
                        <span className="text-slate-800 font-black text-2xl sm:text-3xl">#{idx + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Invoice number + status */}
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="font-bold text-slate-800 text-sm sm:text-base font-mono">{order.invoiceNumber}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.color} ${st.border}`}>
                                <StIcon className="h-3 w-3" />
                                {st.label}
                              </span>
                            </div>

                            {/* Customer */}
                            {order.customerName && (
                              <p className="text-slate-500 text-sm flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                                <span className="truncate">{order.customerName}</span>
                              </p>
                            )}

                            {/* Time info */}
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {timeAgo(order.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-slate-800 text-base sm:text-lg">
                              {formatCurrency(order.totalAmount, order.currency || "VND")}
                            </p>
                            {(order as any).itemCount && (
                              <p className="text-slate-500 text-xs flex items-center gap-1 justify-end mt-0.5">
                                <ShoppingBag className="h-3 w-3" />
                                {(order as any).itemCount} sản phẩm
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-slate-400 text-xs mt-8 flex items-center justify-center gap-2">
          <Activity className="h-3 w-3" />
          Tự động cập nhật mỗi 15 giây
        </p>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}
