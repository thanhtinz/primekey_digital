/**
 * CouponStorePage - Trang kho mã giảm giá công khai
 * Hiển thị các mã giảm giá đang hoạt động cho khách hàng
 */
import { useState } from "react";
import { Copy, Tag, Clock, Percent, DollarSign, CheckCircle, Gift, Zap, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { toast } from "sonner";

function CouponCard({ coupon }: { coupon: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      toast.success(`Đã sao chép mã ${coupon.code}!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isNotStarted = coupon.startsAt && new Date(coupon.startsAt) > new Date();
  const isFullyUsed = coupon.maxUses && coupon.maxUses > 0 && (coupon.usedCount || 0) >= coupon.maxUses;
  const isAvailable = !isExpired && !isNotStarted && !isFullyUsed && coupon.isActive;

  const formatDiscount = () => {
    if (coupon.discountType === "percent") return `${Number(coupon.discountValue)}%`;
    return `${Number(coupon.discountValue).toLocaleString("vi-VN")}đ`;
  };

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  const usagePercent = coupon.maxUses > 0 ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.maxUses) * 100)) : 0;

  return (
    <div className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${isAvailable ? "border-gray-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100" : "border-gray-100 opacity-60"}`}>
      {/* Decorative left stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${coupon.discountType === "percent" ? "bg-gradient-to-b from-blue-500 to-cyan-500" : "bg-gradient-to-b from-green-500 to-emerald-500"}`} />

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${coupon.discountType === "percent" ? "bg-blue-500/15" : "bg-green-500/15"}`}>
              {coupon.discountType === "percent" ? (
                <Percent className="h-5 w-5 text-blue-400" />
              ) : (
                <DollarSign className="h-5 w-5 text-green-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xl font-bold ${coupon.discountType === "percent" ? "text-blue-400" : "text-green-400"}`}>
                  -{formatDiscount()}
                </span>
                {!isAvailable && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                    {isExpired ? "Hết hạn" : isFullyUsed ? "Hết lượt" : "Chưa bắt đầu"}
                  </span>
                )}
              </div>
              {coupon.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{coupon.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Code */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex-1 bg-gray-50 border border-dashed ${isAvailable ? "border-white/20" : "border-gray-200"} rounded-xl px-3 py-2 flex items-center justify-between gap-2`}>
            <span className={`font-mono font-bold tracking-widest text-sm ${isAvailable ? "text-white" : "text-gray-400"}`}>
              {coupon.code}
            </span>
            <button
              onClick={handleCopy}
              disabled={!isAvailable}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${isAvailable ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Đã copy" : "Copy"}
            </button>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          {Number(coupon.minOrderAmount) > 0 && (
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Đơn tối thiểu {Number(coupon.minOrderAmount).toLocaleString("vi-VN")}đ
            </span>
          )}
          {coupon.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              HSD: {formatDate(coupon.expiresAt)}
            </span>
          )}
          {coupon.maxUses > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {coupon.usedCount || 0}/{coupon.maxUses} lượt
            </span>
          )}
        </div>

        {/* Usage progress bar */}
        {coupon.maxUses > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePercent >= 80 ? "bg-red-500" : usagePercent >= 50 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Đã dùng {usagePercent}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CouponStorePage() {
  const [filter, setFilter] = useState<"all" | "percent" | "fixed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: couponsRaw, isLoading } = trpc.coupon.listPublic.useQuery(undefined, {
    staleTime: 60_000,
  });

  const coupons = (couponsRaw || []).filter((c: any) => {
    if (filter === "percent" && c.discountType !== "percent") return false;
    if (filter === "fixed" && c.discountType !== "fixed") return false;
    if (searchQuery && !c.code.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.description || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // listPublic already filters for active/valid coupons, so all returned items are active
  const activeCoupons = coupons;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <ClientHeader />
      <div className="flex-1 pt-14">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border-b border-blue-800 py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <Gift className="h-4 w-4 text-white" />
              <span className="text-sm text-white font-medium">Ưu đãi đặc biệt</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Kho Mã Giảm Giá</h1>
            <p className="text-blue-100 text-base max-w-xl mx-auto">
              Sao chép mã và áp dụng khi thanh toán để nhận ưu đãi hấp dẫn
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-blue-100">Đang có</span>
              <span className="text-white font-bold text-lg">{activeCoupons.length}</span>
              <span className="text-blue-100">mã đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã giảm giá..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {/* Type filter */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "Tất cả" },
                { key: "percent", label: "% Giảm" },
                { key: "fixed", label: "Tiền mặt" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-gray-400 text-lg font-medium">Chưa có mã giảm giá</p>
              <p className="text-gray-400 text-sm mt-1">Hãy quay lại sau để xem các ưu đãi mới nhất</p>
            </div>
          ) : (
            <>
              {/* Active coupons */}
              {activeCoupons.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Đang hoạt động ({activeCoupons.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCoupons.map((c: any) => <CouponCard key={c.id} coupon={c} />)}
                  </div>
                </div>
              )}
              {/* Expired/unavailable coupons */}
              {coupons.filter((c: any) => !activeCoupons.includes(c)).length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Không còn hiệu lực
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.filter((c: any) => !activeCoupons.includes(c)).map((c: any) => <CouponCard key={c.id} coupon={c} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ClientFooter />
    </div>
  );
}
