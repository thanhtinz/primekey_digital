import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Crown, Medal, Trophy, Star, Flame, TrendingUp, ShoppingBag, Users } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";

type Period = "day" | "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
  year: "Năm nay",
};

function formatCurrency(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("vi-VN");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RANK_COLORS = [
  { bg: "from-yellow-400 to-amber-500", text: "text-yellow-900", badge: "bg-yellow-400", glow: "shadow-yellow-500/40", border: "border-yellow-400/60" },
  { bg: "from-slate-300 to-slate-400", text: "text-slate-800", badge: "bg-slate-300", glow: "shadow-slate-400/40", border: "border-slate-300/60" },
  { bg: "from-orange-400 to-amber-600", text: "text-orange-900", badge: "bg-orange-400", glow: "shadow-orange-500/40", border: "border-orange-400/60" },
];

const RANK_ICONS = [Crown, Medal, Trophy];
const PODIUM_HEIGHTS = ["h-20", "h-12", "h-8"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { data: leaderboard = [], isLoading } = trpc.leaderboard.getTop.useQuery({ period }, { staleTime: 30_000 });

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const totalSpent = leaderboard.reduce((s, e) => s + (typeof e.totalSpent === "string" ? parseFloat(e.totalSpent) : (e.totalSpent || 0)), 0);
  const totalOrders = leaderboard.reduce((s, e) => s + (e.orderCount || 0), 0);

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a]">
      <ClientHeader />
      <main className="flex-1 pt-20 pb-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0d1535] to-[#080d1a] pb-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl" />
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 pt-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-purple-300 font-medium mb-4">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              Bảng xếp hạng khách hàng VIP
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Top{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Khách Hàng
              </span>{" "}
              Chi Tiêu
            </h1>
            <p className="text-white/40 text-sm">Những khách hàng thân thiết chi tiêu nhiều nhất</p>

            {/* Stats row */}
            {leaderboard.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-sm">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-white font-semibold">{leaderboard.length}</span>
                  <span className="text-white/40">người</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-white font-semibold">{formatCurrency(totalSpent)}đ</span>
                  <span className="text-white/40">tổng</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-sm">
                  <ShoppingBag className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-white font-semibold">{totalOrders}</span>
                  <span className="text-white/40">đơn hàng</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 mt-6">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/8 mb-8">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  period === key
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-medium text-lg">Chưa có dữ liệu</p>
              <p className="text-white/20 text-sm mt-1">Hãy là người đầu tiên lên bảng xếp hạng!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="mb-8 bg-gradient-to-b from-white/5 to-transparent border border-white/8 rounded-2xl p-6">
                  <div className="flex items-end justify-center gap-4">
                    {podiumOrder.map((entry, idx) => {
                      const rank = podiumRanks[idx] as 1 | 2 | 3;
                      if (!entry) return <div key={idx} className="flex-1 max-w-[140px]" />;
                      const color = RANK_COLORS[rank - 1];
                      const RankIcon = RANK_ICONS[rank - 1];
                      const isFirst = rank === 1;
                      return (
                        <div key={entry.rank} className={`flex-1 max-w-[160px] flex flex-col items-center ${isFirst ? "" : "mt-8"}`}>
                          {isFirst && (
                            <Crown className="h-7 w-7 text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] animate-pulse" />
                          )}
                          {/* Avatar */}
                          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center font-bold text-lg shadow-xl ${color.glow} shadow-lg ${isFirst ? `ring-2 ${color.border}` : ""}`}>
                            <span className={color.text}>{getInitials(entry.name)}</span>
                            <span className={`absolute -bottom-1 -right-1 w-6 h-6 ${color.badge} rounded-full flex items-center justify-center shadow-md`}>
                              <RankIcon className={`h-3.5 w-3.5 ${color.text}`} />
                            </span>
                          </div>
                          {/* Name */}
                          <p className="text-white font-semibold text-sm mt-3 text-center truncate w-full px-1">{entry.name}</p>
                          <p className="text-white/30 text-xs truncate w-full text-center px-1">{entry.email}</p>
                          {/* Amount badge */}
                          <div className={`mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${color.bg} text-xs font-bold ${color.text} shadow-md`}>
                            {formatCurrency(entry.totalSpent)}đ
                          </div>
                          {/* Orders */}
                          <p className="text-white/30 text-xs mt-1">{entry.orderCount} đơn</p>
                          {/* Podium bar */}
                          <div className={`mt-3 w-full rounded-t-lg bg-gradient-to-b ${color.bg} opacity-20 ${PODIUM_HEIGHTS[rank - 1]}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rank 4+ List */}
              {rest.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">Xếp hạng tiếp theo</p>
                  {rest.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-3 bg-white/4 hover:bg-white/7 border border-white/8 rounded-xl px-4 py-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 text-sm font-bold flex-shrink-0">
                        {entry.rank}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white/70 text-xs font-bold flex-shrink-0">
                        {getInitials(entry.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 font-medium text-sm truncate">{entry.name}</p>
                        <p className="text-white/30 text-xs truncate">{entry.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-1 text-white/30 text-xs">
                          <ShoppingBag className="h-3 w-3" />
                          <span>{entry.orderCount} đơn</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold text-sm">{formatCurrency(entry.totalSpent)}đ</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400/70 text-xs">VIP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <ClientFooter />
    </div>
  );
}
