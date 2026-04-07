import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Crown, Loader2, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";

const PERIODS = [
  { key: "day", label: "Hôm Nay" },
  { key: "week", label: "Tuần Này" },
  { key: "month", label: "Tháng Này" },
  { key: "year", label: "Năm Nay" },
] as const;

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function PodiumCard({ entry, rank }: { entry: any; rank: number }) {
  const configs: Record<number, { gradient: string; border: string; text: string; glow: string; height: string; icon: typeof Crown; iconColor: string }> = {
    1: { gradient: "from-yellow-400/30 via-amber-400/15 to-yellow-500/5", border: "border-yellow-400/60", text: "text-yellow-600", glow: "shadow-yellow-400/20", height: "h-40", icon: Crown, iconColor: "text-yellow-500" },
    2: { gradient: "from-slate-200/30 via-slate-100/15 to-slate-200/5", border: "border-slate-300", text: "text-slate-500", glow: "shadow-slate-300/10", height: "h-32", icon: Medal, iconColor: "text-slate-500" },
    3: { gradient: "from-orange-400/30 via-orange-300/15 to-orange-400/5", border: "border-orange-400", text: "text-orange-600", glow: "shadow-orange-400/10", height: "h-28", icon: Medal, iconColor: "text-orange-500" },
  };
  const cfg = configs[rank]!;
  const RankIcon = cfg.icon;

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? "order-2 -mt-4" : rank === 2 ? "order-1 mt-4" : "order-3 mt-6"}`}>
      {/* Avatar */}
      <div className={`relative mb-3`}>
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${cfg.gradient} border-2 ${cfg.border} flex items-center justify-center shadow-lg ${cfg.glow}`}>
          <span className="text-slate-800 font-bold text-xl sm:text-2xl">
            {entry.name ? entry.name.charAt(0).toUpperCase() : "?"}
          </span>
        </div>
        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 ${cfg.border} flex items-center justify-center`}>
          <RankIcon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
        </div>
      </div>

      {/* Info */}
      <p className="text-slate-800 font-bold text-sm sm:text-base text-center truncate max-w-[120px]">{entry.name}</p>
      <p className={`font-bold text-base sm:text-lg ${cfg.text} mt-0.5`}>{formatCurrency(entry.totalSpent)}</p>
      <p className="text-slate-500 text-xs mt-0.5">{entry.orderCount} đơn</p>

      {/* Podium bar */}
      <div className={`${cfg.height} w-24 sm:w-28 mt-3 rounded-t-xl bg-gradient-to-t ${cfg.gradient} border ${cfg.border} border-b-0 flex items-start justify-center pt-3`}>
        <span className={`font-black text-2xl sm:text-3xl ${cfg.text}`}>#{rank}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: leaderboard = [], isLoading } = trpc.leaderboard.getTop.useQuery({ period }, { staleTime: 30_000 });

  const brandName = publicInfo?.companyName || "Invoice Prime";
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const totalSpent = leaderboard.reduce((s, e) => s + (typeof e.totalSpent === "string" ? parseFloat(e.totalSpent) : (e.totalSpent || 0)), 0);
  const totalOrders = leaderboard.reduce((s, e) => s + (e.orderCount || 0), 0);

  return (
    <div className="min-h-screen pt-14 bg-slate-50">
      <ClientHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-amber-400/10 rounded-3xl mb-4 border border-yellow-400/30">
            <Trophy className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
            Bảng Xếp Hạng <span className="text-yellow-600">Chi Tiêu</span>
          </h1>
          <p className="text-slate-500 text-base">Top khách hàng thân thiết chi tiêu nhiều nhất</p>
        </div>

        {/* Stats summary */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-lg sm:text-xl">{leaderboard.length}</p>
              <p className="text-slate-500 text-xs">Khách hàng</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <ShoppingCart className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-lg sm:text-xl">{totalOrders}</p>
              <p className="text-slate-500 text-xs">Tổng đơn</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <TrendingUp className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-slate-800 font-bold text-sm sm:text-base truncate">{formatCurrency(totalSpent)}</p>
              <p className="text-slate-500 text-xs">Tổng chi tiêu</p>
            </div>
          </div>
        )}

        {/* Period tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.key
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Trophy className="h-20 w-20 mb-4 opacity-30" />
              <p className="text-xl font-bold text-slate-800 mb-1">Chưa có dữ liệu</p>
              <p className="text-sm">Chưa có đơn hàng nào trong khoảng thời gian này</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {top3.length >= 2 && (
              <div className="flex justify-center items-end gap-2 sm:gap-4 mb-10 px-4">
                {top3.map((entry, i) => (
                  <PodiumCard key={entry.rank} entry={entry} rank={i + 1} />
                ))}
              </div>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-slate-500 text-sm font-medium px-1 mb-3">Xếp hạng tiếp theo</h3>
                {rest.map((entry) => (
                  <Card key={entry.rank} className="bg-white border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      {/* Rank number */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-slate-500">#{entry.rank}</span>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-800 font-bold text-sm">
                          {entry.name ? entry.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{entry.name}</p>
                        {entry.email && (
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{entry.email}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-800 text-sm sm:text-base">{formatCurrency(entry.totalSpent)}</p>
                        <p className="text-slate-500 text-xs">{entry.orderCount} đơn</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Only top3 and no rest - show as list if only 1 entry */}
            {top3.length === 1 && (
              <div className="space-y-2">
                {top3.map((entry) => {
                  const cfg = { bg: "bg-gradient-to-r from-yellow-400/20 to-amber-400/10", border: "border-yellow-400/50", text: "text-yellow-600" };
                  return (
                    <Card key={entry.rank} className={`${cfg.bg} border ${cfg.border}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center flex-shrink-0">
                          <Crown className={`h-6 w-6 ${cfg.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{entry.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{entry.orderCount} đơn hàng</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${cfg.text}`}>{formatCurrency(entry.totalSpent)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear()} {brandName}. Bảng xếp hạng cập nhật tự động.
      </footer>
    </div>
  );
}
