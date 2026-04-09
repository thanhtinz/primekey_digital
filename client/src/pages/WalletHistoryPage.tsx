/**
 * WalletHistoryPage - Lịch sử dòng tiền của user
 * Hiển thị toàn bộ giao dịch ví: nạp tiền, chi tiêu, hoàn tiền
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import {
  Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw,
  TrendingUp, TrendingDown, Clock, Search, ChevronLeft,
  DollarSign, Filter
} from "lucide-react";

function formatVND(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; sign: string }> = {
  topup:    { label: "Nạp tiền",    icon: ArrowUpCircle,   color: "text-emerald-600", bg: "bg-emerald-50", sign: "+" },
  spend:    { label: "Thanh toán",  icon: ArrowDownCircle, color: "text-red-500",     bg: "bg-red-50",     sign: "-" },
  refund:   { label: "Hoàn tiền",   icon: RefreshCw,       color: "text-blue-600",    bg: "bg-blue-50",    sign: "+" },
  bonus:    { label: "Thưởng",      icon: TrendingUp,      color: "text-purple-600",  bg: "bg-purple-50",  sign: "+" },
  withdraw: { label: "Rút tiền",    icon: TrendingDown,    color: "text-orange-500",  bg: "bg-orange-50",  sign: "-" },
  adjust:   { label: "Điều chỉnh",  icon: DollarSign,      color: "text-gray-600",    bg: "bg-gray-50",    sign: "" },
};

export default function WalletHistoryPage() {
  const [, navigate] = useLocation();
  const token = localStorage.getItem("customerToken") || "";
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: balanceData } = trpc.wallet.getBalance.useQuery(
    { token },
    { enabled: !!token }
  );
  const { data: transactions = [], isLoading } = trpc.wallet.getTransactions.useQuery(
    { token, limit: 100 },
    { enabled: !!token }
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-white">
        <ClientHeader />
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 text-center">
          <Wallet className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">Vui lòng đăng nhập</h1>
          <p className="text-gray-400 text-sm mb-6">Bạn cần đăng nhập để xem lịch sử dòng tiền.</p>
          <button
            onClick={() => navigate("/client-login")}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            Đăng nhập
          </button>
        </div>
        <ClientFooter />
      </div>
    );
  }

  const balance = balanceData?.balance ?? 0;

  const filtered = (transactions as any[]).filter(tx => {
    const matchType = filterType === "all" || tx.type === filterType;
    const matchSearch = !search.trim() || (tx.description || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Stats
  const totalIn = (transactions as any[])
    .filter(tx => ["topup", "refund", "bonus"].includes(tx.type) && tx.status === "completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);
  const totalOut = (transactions as any[])
    .filter(tx => ["spend", "withdraw"].includes(tx.type) && tx.status === "completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-24">
        {/* Back */}
        <button
          onClick={() => navigate("/wallet")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition mt-4 mb-5"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại ví
        </button>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 mb-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-5 w-5 text-white/70" />
            <span className="text-sm text-white/70">Số dư hiện tại</span>
          </div>
          <p className="text-3xl font-bold mb-4">{formatVND(balance)}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-xs text-white/60">Tổng nạp</span>
              </div>
              <p className="text-base font-bold text-emerald-300">{formatVND(totalIn)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ArrowDownCircle className="h-3.5 w-3.5 text-red-300" />
                <span className="text-xs text-white/60">Tổng chi</span>
              </div>
              <p className="text-base font-bold text-red-300">{formatVND(totalOut)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Lọc giao dịch</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { value: "all", label: "Tất cả" },
              { value: "topup", label: "Nạp tiền" },
              { value: "spend", label: "Thanh toán" },
              { value: "refund", label: "Hoàn tiền" },
              { value: "bonus", label: "Thưởng" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterType === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mô tả..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Lịch sử giao dịch</h2>
            <span className="text-xs text-gray-400">{filtered.length} giao dịch</span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-1.5" />
                    <div className="h-3 bg-gray-50 rounded w-1/3" />
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">Chưa có giao dịch nào</p>
              <p className="text-gray-300 text-xs mt-1">Các giao dịch ví sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((tx: any) => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.adjust;
                const Icon = cfg.icon;
                const amount = parseFloat(tx.amount || "0");
                const isPositive = ["topup", "refund", "bonus"].includes(tx.type);
                const isPending = tx.status === "pending";
                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                    <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tx.description || cfg.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                        {isPending && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                            Chờ xử lý
                          </span>
                        )}
                        {tx.status === "failed" && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                            Thất bại
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isPositive ? "text-emerald-600" : "text-red-500"} ${isPending ? "opacity-50" : ""}`}>
                        {cfg.sign}{formatVND(amount)}
                      </p>
                      {tx.balanceAfter && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Còn: {formatVND(parseFloat(tx.balanceAfter))}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate("/wallet")}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            Nạp tiền
          </button>
          <button
            onClick={() => navigate("/track-order")}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition"
          >
            Xem đơn hàng
          </button>
        </div>
      </div>

      <ClientFooter />
    </div>
  );
}
