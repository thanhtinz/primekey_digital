import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Zap, Clock, Tag, Loader2, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function CountdownTimer({ endTime }: { endTime: Date | string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Đã kết thúc");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${mins}m`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className={`font-mono font-bold ${isExpired ? "text-red-400" : "text-amber-400"}`}>
      {timeLeft}
    </span>
  );
}

export default function FlashSalePage() {
  const [, setLocation] = useLocation();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: sales = [], isLoading } = trpc.flashSale.getActive.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const brandName = publicInfo?.companyName || "Invoice Prime";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-red-400">Flash</span> Sale
          </h1>
          <p className="text-slate-400">Ưu đãi có thời hạn - Nhanh tay kẻo lỡ!</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-red-400" />
          </div>
        ) : sales.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Zap className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">Hiện tại chưa có Flash Sale</p>
              <p className="text-sm mt-1">Hãy quay lại sau để xem các ưu đãi mới</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales.map((sale) => {
              const soldOut = sale.maxQuantity && sale.maxQuantity > 0 && (sale.soldQuantity || 0) >= sale.maxQuantity;
              const progress = sale.maxQuantity && sale.maxQuantity > 0
                ? Math.min(((sale.soldQuantity || 0) / sale.maxQuantity) * 100, 100)
                : 0;
              return (
                <Card key={sale.id} className={`bg-white/5 border-white/10 overflow-hidden transition-all hover:scale-[1.02] ${soldOut ? "opacity-60" : ""}`}>
                  <CardContent className="p-0">
                    {/* Discount badge */}
                    <div className="bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-white" />
                        <span className="text-white font-bold">-{sale.discountPercent}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/90 text-xs">
                        <Clock className="h-3 w-3" />
                        <CountdownTimer endTime={sale.endTime} />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Product name */}
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{sale.productName}</h3>
                        {sale.description && (
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{sale.description}</p>
                        )}
                      </div>

                      {/* Prices */}
                      <div className="flex items-end gap-3">
                        <span className="text-2xl font-bold text-red-400">
                          {formatCurrency(sale.salePrice)}
                        </span>
                        <span className="text-slate-500 line-through text-sm mb-1">
                          {formatCurrency(sale.originalPrice)}
                        </span>
                      </div>

                      {/* Stock progress */}
                      {sale.maxQuantity && sale.maxQuantity > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              Đã bán {sale.soldQuantity || 0}/{sale.maxQuantity}
                            </span>
                            {soldOut && <span className="text-red-400 font-medium">Hết hàng</span>}
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${soldOut ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-red-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
