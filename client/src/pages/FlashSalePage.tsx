import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Clock, Tag, Loader2, ShoppingBag, Flame, TrendingDown, AlertTriangle } from "@/components/Icon";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
}

function CountdownTimer({ endTime }: { endTime: Date | string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0, expired: false });

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, mins, secs, expired: false });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft.expired) {
    return <span className="text-red-500 font-bold text-sm">Đã kết thúc</span>;
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-slate-100 border border-slate-200 rounded-lg w-11 h-11 flex items-center justify-center">
        <span className="text-slate-800 font-mono font-bold text-lg">{value.toString().padStart(2, "0")}</span>
      </div>
      <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="ngày" />}
      <TimeBox value={timeLeft.hours} label="giờ" />
      <span className="text-slate-500 font-bold text-lg mb-4">:</span>
      <TimeBox value={timeLeft.mins} label="phút" />
      <span className="text-slate-500 font-bold text-lg mb-4">:</span>
      <TimeBox value={timeLeft.secs} label="giây" />
    </div>
  );
}

export default function FlashSalePage() {
  const [, setLocation] = useLocation();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: sales = [], isLoading } = trpc.flashSale.getActive.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const brandName = publicInfo?.companyName || "";
  const activeSales = sales.filter(s => !(s.maxQuantity && s.maxQuantity > 0 && (s.soldQuantity || 0) >= s.maxQuantity));
  const soldOutSales = sales.filter(s => s.maxQuantity && s.maxQuantity > 0 && (s.soldQuantity || 0) >= s.maxQuantity);

  return (
    <div className="min-h-screen pt-16 lg:pt-24 bg-gray-50">
      <ClientHeader />
      {/* Hero banner */}
      <div className="mx-4 mb-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-red-600 via-orange-500 to-pink-500 rounded-2xl px-5 py-5 text-white flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black">Flash Sale 🔥</h1>
            <p className="text-white/80 text-sm">Ưu đãi có thời hạn — Nhanh tay kẻo lỡ!</p>
          </div>
          {sales.length > 0 && (
            <div className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <p className="text-white font-black text-xl">{activeSales.length}</p>
              <p className="text-white/80 text-[10px]">ưu đãi</p>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-8">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-3" />
            <p className="text-slate-500 text-sm">Đang tải ưu đãi...</p>
          </div>
        ) : sales.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Zap className="h-20 w-20 mb-4 opacity-30" />
              <p className="text-xl font-bold text-slate-800 mb-1">Hiện tại chưa có Flash Sale</p>
              <p className="text-sm">Hãy quay lại sau để xem các ưu đãi mới</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active sales */}
            {activeSales.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSales.map((sale) => {
                  const progress = sale.maxQuantity && sale.maxQuantity > 0
                    ? Math.min(((sale.soldQuantity || 0) / sale.maxQuantity) * 100, 100)
                    : 0;
                  const isHot = progress > 70;
                  const savedAmount = (typeof sale.originalPrice === "string" ? parseFloat(sale.originalPrice) : sale.originalPrice || 0) -
                    (typeof sale.salePrice === "string" ? parseFloat(sale.salePrice) : sale.salePrice || 0);

                  return (
                    <Card key={sale.id} className="bg-white border-slate-200 overflow-hidden hover:border-red-400 transition-all group shadow-sm hover:shadow-md">
                      <CardContent className="p-0">
                        {/* Discount header */}
                        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 flex items-center justify-between relative overflow-hidden">
                          <div className="flex items-center gap-2 z-10">
                            <Tag className="h-5 w-5 text-white" />
                            <span className="text-white font-black text-xl">-{sale.discountPercent}%</span>
                          </div>
                          {isHot && (
                            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 z-10">
                              <Flame className="h-3.5 w-3.5 text-yellow-200" />
                              <span className="text-white text-xs font-bold">HOT</span>
                            </div>
                          )}
                          {/* Decorative circles */}
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                          <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Product info */}
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-red-600 transition-colors">{sale.productName}</h3>
                            {sale.description && (
                              <p className="text-slate-500 text-sm mt-1.5 line-clamp-2">{sale.description}</p>
                            )}
                          </div>

                          {/* Prices */}
                          <div className="flex items-end gap-3 pb-2 border-b border-slate-200">
                            <div>
                              <p className="text-slate-500 text-xs mb-0.5">Giá sale</p>
                              <span className="text-3xl font-black text-red-500">
                                {formatCurrency(sale.salePrice)}
                              </span>
                            </div>
                            <div className="mb-1">
                              <p className="text-slate-400 text-xs mb-0.5">Giá gốc</p>
                              <span className="text-slate-500 line-through text-base">
                                {formatCurrency(sale.originalPrice)}
                              </span>
                            </div>
                          </div>

                          {/* Savings */}
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <TrendingDown className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-emerald-700 text-sm font-medium">
                              Tiết kiệm {formatCurrency(savedAmount)}
                            </span>
                          </div>

                          {/* Countdown */}
                          <div className="flex flex-col items-center py-2">
                            <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Kết thúc sau
                            </p>
                            <CountdownTimer endTime={sale.endTime} />
                          </div>

                          {/* Stock progress */}
                          {sale.maxQuantity && sale.maxQuantity > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <ShoppingBag className="h-3 w-3" />
                                  Đã bán {sale.soldQuantity || 0}/{sale.maxQuantity}
                                </span>
                                {isHot && (
                                  <span className="text-orange-500 font-medium flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Sắp hết!
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isHot
                                      ? "bg-gradient-to-r from-orange-500 via-red-500 to-red-600"
                                      : "bg-gradient-to-r from-orange-500 to-red-500"
                                  }`}
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

            {/* Sold out sales */}
            {soldOutSales.length > 0 && (
              <div>
                <h3 className="text-slate-500 text-sm font-medium mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Đã hết hàng ({soldOutSales.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {soldOutSales.map((sale) => (
                    <Card key={sale.id} className="bg-slate-50 border-slate-200 opacity-70">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Tag className="h-5 w-5 text-red-500/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-500 text-sm truncate">{sale.productName}</p>
                          <p className="text-red-500/70 text-xs mt-0.5">Đã bán hết</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-slate-500 line-through text-sm">{formatCurrency(sale.originalPrice)}</p>
                          <p className="text-red-500/70 text-xs">-{sale.discountPercent}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ClientFooter />
    </div>
  );
}
