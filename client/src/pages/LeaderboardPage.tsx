import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal, Crown, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

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

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: "bg-gradient-to-r from-yellow-500/30 to-amber-500/20", border: "border-yellow-500/40", text: "text-yellow-400", icon: Crown };
  if (rank === 2) return { bg: "bg-gradient-to-r from-slate-400/20 to-slate-300/10", border: "border-slate-400/30", text: "text-slate-300", icon: Medal };
  if (rank === 3) return { bg: "bg-gradient-to-r from-orange-600/20 to-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: Medal };
  return { bg: "bg-white/5", border: "border-white/10", text: "text-slate-400", icon: null };
}

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: leaderboard = [], isLoading } = trpc.leaderboard.getTop.useQuery({ period }, { staleTime: 30_000 });

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-2xl mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bảng Xếp Hạng Chi Tiêu</h1>
          <p className="text-slate-400">Top khách hàng thân thiết chi tiêu nhiều nhất</p>
        </div>

        {/* Period tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p.key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Trophy className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">Chưa có dữ liệu</p>
              <p className="text-sm mt-1">Chưa có đơn hàng nào trong khoảng thời gian này</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const style = getRankStyle(entry.rank);
              const RankIcon = style.icon;
              return (
                <Card key={entry.rank} className={`${style.bg} border ${style.border} overflow-hidden transition-all hover:scale-[1.01]`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      entry.rank <= 3 ? "bg-white/10" : "bg-white/5"
                    }`}>
                      {RankIcon ? (
                        <RankIcon className={`h-6 w-6 ${style.text}`} />
                      ) : (
                        <span className={`font-bold text-lg ${style.text}`}>#{entry.rank}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{entry.name}</p>
                      {entry.email && (
                        <p className="text-slate-500 text-xs mt-0.5">{entry.email}</p>
                      )}
                      <p className="text-slate-400 text-xs mt-0.5">{entry.orderCount} đơn hàng</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${entry.rank <= 3 ? style.text : "text-white"}`}>
                        {formatCurrency(entry.totalSpent)}
                      </p>
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
