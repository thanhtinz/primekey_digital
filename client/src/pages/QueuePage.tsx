import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Package, CheckCircle, Truck, Loader2, ListOrdered } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  CREATED: { label: "Chờ Xử Lý", color: "text-amber-400 bg-amber-500/20 border-amber-500/30", icon: Clock },
  PAID: { label: "Đã Thanh Toán", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", icon: CheckCircle },
  SHIPPING: { label: "Đang Giao", color: "text-blue-400 bg-blue-500/20 border-blue-500/30", icon: Truck },
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

export default function QueuePage() {
  const [, setLocation] = useLocation();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: orders = [], isLoading } = trpc.queue.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const brandName = publicInfo?.companyName || "Invoice Prime";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Trang Chủ</span>
          </button>
          <div className="flex items-center gap-3">
            {publicInfo?.logoUrl ? (
              <img src={publicInfo.logoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IP</span>
              </div>
            )}
            <span className="text-white font-semibold">{brandName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4">
            <ListOrdered className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Hàng Chờ Đơn Hàng</h1>
          <p className="text-slate-400">Danh sách đơn hàng đang được xử lý theo thứ tự</p>
          {orders.length > 0 && (
            <p className="text-slate-500 text-sm mt-2">Đang có <strong className="text-white">{orders.length}</strong> đơn hàng trong hàng chờ</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">Không có đơn hàng nào đang chờ</p>
              <p className="text-sm mt-1">Tất cả đơn hàng đã được xử lý xong</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const st = STATUS_LABEL[order.status || "CREATED"] || STATUS_LABEL.CREATED;
              const StIcon = st.icon;
              return (
                <Card key={order.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Queue number */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">#{idx + 1}</span>
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{order.invoiceNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                          <StIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-slate-400 text-sm mt-0.5 truncate">{order.customerName}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-white">
                        {formatCurrency(order.totalAmount, order.currency || "VND")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-8">
          Tự động cập nhật mỗi 15 giây
        </p>
      </div>
    </div>
  );
}
