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

const RANK_STYLES = [
  {
    gradient: "from-yellow-400 to-amber-500",
    avatarBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    text: "text-yellow-900",
    badge: "bg-yellow-400",
    ring: "ring-2 ring-yellow-400/60",
    podiumBg: "bg-gradient-to-t from-yellow-400/30 to-yellow-400/10",
    nameBadge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    rankBg: "bg-yellow-400",
  },
  {
    gradient: "from-slate-300 to-slate-400",
    avatarBg: "bg-gradient-to-br from-slate-300 to-slate-400",
    text: "text-slate-700",
    badge: "bg-slate-300",
    ring: "ring-2 ring-slate-300/60",
    podiumBg: "bg-gradient-to-t from-slate-300/30 to-slate-300/10",
    nameBadge: "bg-slate-50 text-slate-600 border border-slate-200",
    rankBg: "bg-slate-400",
  },
  {
    gradient: "from-orange-400 to-amber-500",
    avatarBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    text: "text-orange-900",
    badge: "bg-orange-400",
    ring: "ring-2 ring-orange-400/60",
    podiumBg: "bg-gradient-to-t from-orange-400/30 to-orange-400/10",
    nameBadge: "bg-orange-50 text-orange-700 border border-orange-200",
    rankBg: "bg-orange-400",
  },
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
    <div className="min-h-screen flex flex-col bg-white">
      <ClientHeader />
      <main className="flex-1 pt-20 pb-16">
        {/* Hero Banner - gradient accent strip */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-10 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/90 font-medium mb-4">
              <Flame className="h-3.5 w-3.5 text-orange-300" />
              Bảng xếp hạng khách hàng VIP
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Top{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Khách Hàng
              </span>{" "}
              Chi Tiêu
            </h1>
            <p className="text-white/70 text-sm">Những khách hàng thân thiết chi tiêu nhiều nhất</p>

            {/* Stats row */}
            {leaderboard.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
                  <Users className="h-3.5 w-3.5 text-blue-200" />
                  <span className="font-semibold">{leaderboard.length}</span>
                  <span className="text-white/60">người</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
                  <TrendingUp className="h-3.5 w-3.5 text-green-300" />
                  <span className="font-semibold">{formatCurrency(totalSpent)}đ</span>
                  <span className="text-white/60">tổng</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-sm text-white">
                  <ShoppingBag className="h-3.5 w-3.5 text-purple-200" />
                  <span className="font-semibold">{totalOrders}</span>
                  <span className="text-white/60">đơn hàng</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 mt-6">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-8">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  period === key
                    ? "bg-white text-violet-700 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium text-lg">Chưa có dữ liệu</p>
              <p className="text-gray-300 text-sm mt-1">Hãy là người đầu tiên lên bảng xếp hạng!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="mb-8 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-end justify-center gap-4">
                    {podiumOrder.map((entry, idx) => {
                      const rank = podiumRanks[idx] as 1 | 2 | 3;
                      if (!entry) return <div key={idx} className="flex-1 max-w-[140px]" />;
                      const style = RANK_STYLES[rank - 1];
                      const RankIcon = RANK_ICONS[rank - 1];
                      const isFirst = rank === 1;
                      return (
                        <div key={entry.rank} className={`flex-1 max-w-[160px] flex flex-col items-center ${isFirst ? "" : "mt-8"}`}>
                          {isFirst && (
                            <Crown className="h-7 w-7 text-yellow-500 mb-2 drop-shadow-sm" />
                          )}
                          {/* Avatar */}
                          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ${style.avatarBg} flex items-center justify-center font-bold text-lg shadow-md ${style.ring}`}>
                            <span className={style.text}>{getInitials(entry.name)}</span>
                            <span className={`absolute -bottom-1 -right-1 w-6 h-6 ${style.badge} rounded-full flex items-center justify-center shadow`}>
                              <RankIcon className={`h-3.5 w-3.5 ${style.text}`} />
                            </span>
                          </div>
                          {/* Name */}
                          <p className="text-gray-800 font-semibold text-sm mt-3 text-center truncate w-full px-1">{entry.name}</p>
                          <p className="text-gray-400 text-xs truncate w-full text-center px-1">{entry.email}</p>
                          {/* Amount badge */}
                          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${style.nameBadge}`}>
                            {formatCurrency(entry.totalSpent)}đ
                          </div>
                          {/* Orders */}
                          <p className="text-gray-400 text-xs mt-1">{entry.orderCount} đơn</p>
                          {/* Podium bar */}
                          <div className={`mt-3 w-full rounded-t-lg ${style.podiumBg} ${PODIUM_HEIGHTS[rank - 1]}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rank 4+ List */}
              {rest.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Xếp hạng tiếp theo</p>
                  {rest.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 transition-colors shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold flex-shrink-0">
                        {entry.rank}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(entry.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-sm truncate">{entry.name}</p>
                        <p className="text-gray-400 text-xs truncate">{entry.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-1 text-gray-400 text-xs">
                          <ShoppingBag className="h-3 w-3" />
                          <span>{entry.orderCount} đơn</span>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-800 font-semibold text-sm">{formatCurrency(entry.totalSpent)}đ</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-600 text-xs">VIP</span>
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
