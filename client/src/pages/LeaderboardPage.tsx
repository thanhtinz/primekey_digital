import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Crown, Medal, Trophy, Star, Flame, ShoppingBag } from "@/components/Icon";
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

const RANK_MEDAL = [
  { icon: Crown,  bg: "bg-yellow-400",  text: "text-yellow-900", ring: "ring-2 ring-yellow-400/70", label: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { icon: Medal,  bg: "bg-slate-300",   text: "text-slate-700",  ring: "ring-2 ring-slate-300/70",  label: "bg-slate-100 text-slate-600 border-slate-200" },
  { icon: Trophy, bg: "bg-orange-400",  text: "text-orange-900", ring: "ring-2 ring-orange-400/70", label: "bg-orange-100 text-orange-700 border-orange-200" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { data: leaderboard = [], isLoading } = trpc.leaderboard.getTop.useQuery({ period }, { staleTime: 30_000 });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-16">
      <ClientHeader />
      <main className="flex-1 pb-16">
        {/* Hero Banner */}
        <div className="mx-4 mt-4 mb-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl px-5 py-5 text-white flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy className="h-7 w-7 text-yellow-200" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-black">Bảng Xếp Hạng 🏆</h1>
              <p className="text-white/80 text-sm">Top khách hàng chi tiêu nhiều nhất</p>
            </div>
            <div className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <p className="text-white font-black text-xl">{leaderboard.length}</p>
              <p className="text-white/80 text-[10px]">thành viên</p>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4">
          {/* Period Tabs */}
          <div className="flex items-center border-b border-gray-200 mb-8">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`relative flex-1 py-3 px-2 text-sm font-medium transition-all text-center ${
                  period === key ? "text-violet-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {label}
                {period === key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-600 rounded-full" />
                )}
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
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const rank = entry.rank;
                const isTop3 = rank <= 3;
                const medalStyle = isTop3 ? RANK_MEDAL[rank - 1] : null;
                const MedalIcon = medalStyle?.icon;

                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors shadow-sm ${
                      rank === 1
                        ? "bg-yellow-50 border-yellow-200"
                        : rank === 2
                        ? "bg-slate-50 border-slate-200"
                        : rank === 3
                        ? "bg-orange-50 border-orange-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {/* Rank number */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isTop3 && medalStyle
                        ? `${medalStyle.bg} ${medalStyle.text}`
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {isTop3 && MedalIcon ? (
                        <MedalIcon className="h-4 w-4" />
                      ) : (
                        rank
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                      rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400" :
                      rank === 3 ? "bg-gradient-to-br from-orange-400 to-amber-500" :
                      "bg-gradient-to-br from-violet-400 to-indigo-500"
                    } ${isTop3 && medalStyle ? medalStyle.ring : ""}`}>
                      <span className={rank <= 2 ? "text-gray-700" : ""}>{getInitials(entry.name)}</span>
                    </div>

                    {/* Name & email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-800 font-semibold text-sm truncate">{entry.name}</p>
                        {rank === 1 && (
                          <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                            #1 Top
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{entry.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-gray-400 text-xs">
                        <ShoppingBag className="h-3 w-3" />
                        <span>{entry.orderCount} đơn</span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-800 font-bold text-sm">{formatCurrency(entry.totalSpent)}đ</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-600 text-xs">VIP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <ClientFooter />
    </div>
  );
}
