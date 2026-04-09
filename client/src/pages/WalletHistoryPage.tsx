import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Gift, Search, X } from "@/components/Icon";

const formatCurrency = (v: number | string) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
};

const formatDateTime = (d: any) => {
  const dt = new Date(d);
  return dt.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const TYPE_LABELS: Record<string, string> = {
  topup: "Nạp tiền",
  spend: "Chi tiêu",
  refund: "Hoàn tiền",
  reward: "Thưởng",
};

const typeIcon = (t: string) => {
  if (t === "topup") return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
  if (t === "spend") return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
  if (t === "refund") return <RefreshCw className="h-4 w-4 text-blue-500" />;
  return <Gift className="h-4 w-4 text-yellow-500" />;
};

export default function WalletHistoryPage() {
  const [, navigate] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "";

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "topup" | "spend" | "refund" | "reward">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedType, setAppliedType] = useState<"all" | "topup" | "spend" | "refund" | "reward">("all");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const { data: balanceData } = trpc.wallet.getBalance.useQuery(
    { token },
    { enabled: !!token }
  );
  const currentBalance = balanceData?.balance ?? 0;

  const { data: transactions = [], isLoading } = trpc.wallet.getTransactions.useQuery(
    { token, type: appliedType, dateFrom: appliedDateFrom || undefined, dateTo: appliedDateTo || undefined, search: appliedSearch || undefined, limit: 100 },
    { enabled: !!token }
  );

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedType(type);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleClear = () => {
    setSearch(""); setType("all"); setDateFrom(""); setDateTo("");
    setAppliedSearch(""); setAppliedType("all"); setAppliedDateFrom(""); setAppliedDateTo("");
  };

  const handleTimePreset = (v: string) => {
    if (v === "today") {
      const d = new Date().toISOString().split("T")[0];
      setDateFrom(d); setDateTo(d);
    } else if (v === "week") {
      const now = new Date();
      const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
      setDateFrom(mon.toISOString().split("T")[0]); setDateTo(now.toISOString().split("T")[0]);
    } else if (v === "month") {
      const now = new Date();
      setDateFrom(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`);
      setDateTo(now.toISOString().split("T")[0]);
    } else {
      setDateFrom(""); setDateTo("");
    }
  };

  const stats = useMemo(() => {
    const all = transactions as any[];
    return {
      totalTopup: all.filter(t => t.type === "topup" && t.status === "completed").reduce((s, t) => s + parseFloat(t.amount || "0"), 0),
      totalSpend: all.filter(t => t.type === "spend").reduce((s, t) => s + parseFloat(t.amount || "0"), 0),
      totalRefund: all.filter(t => t.type === "refund").reduce((s, t) => s + parseFloat(t.amount || "0"), 0),
    };
  }, [transactions]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ClientHeader />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem lịch sử dòng tiền</p>
            <button onClick={() => navigate("/client-login")} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm">Đăng nhập</button>
          </div>
        </div>
        <ClientFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-20 pb-6 space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1e3a6e] flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-arrow-right-arrow-left w-8 h-8 text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Biến động số dư</h1>
              <p className="text-gray-500 mt-0.5">Lịch sử các giao dịch thay đổi số dư</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Số dư hiện tại</p>
              <p className="text-base font-bold text-blue-700 mt-1">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Tổng nạp</p>
              <p className="text-base font-bold text-green-700 mt-1">{formatCurrency(stats.totalTopup)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Tổng chi</p>
              <p className="text-base font-bold text-red-700 mt-1">{formatCurrency(stats.totalSpend)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Hoàn tiền</p>
              <p className="text-base font-bold text-purple-700 mt-1">{formatCurrency(stats.totalRefund)}</p>
            </div>
          </div>
        </div>

        {/* Filter card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lý do</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nhập lý do..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Thời gian</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                onChange={e => handleTimePreset(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Loại</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
              >
                <option value="all">Tất cả</option>
                <option value="topup">Nạp tiền</option>
                <option value="spend">Chi tiêu</option>
                <option value="refund">Hoàn tiền</option>
                <option value="reward">Thưởng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Khoảng ngày</label>
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSearch}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1e3a6e] hover:bg-[#162d57] text-white rounded-lg text-sm font-semibold transition-colors">
              <Search className="h-4 w-4" /> Tìm
            </button>
            <button onClick={handleClear}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
              <X className="h-4 w-4" /> Xóa
            </button>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e3a6e] text-white text-xs font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-right">Số dư trước</th>
                  <th className="px-4 py-3 text-right">Thay đổi</th>
                  <th className="px-4 py-3 text-right">Số dư sau</th>
                  <th className="px-4 py-3 text-left">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-[#1e3a6e] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Đang tải...</p>
                  </td></tr>
                ) : (transactions as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
                    <p className="text-gray-400 text-sm mt-1">Nạp tiền để bắt đầu mua sắm</p>
                  </td></tr>
                ) : (
                  (transactions as any[]).map((tx: any) => {
                    const amount = parseFloat(tx.amount || "0");
                    const balBefore = parseFloat(tx.balanceBefore || "0");
                    const balAfter = parseFloat(tx.balanceAfter || "0");
                    const isPositive = tx.type === "topup" || tx.type === "refund" || tx.type === "reward";
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {typeIcon(tx.type)}
                            <div>
                              <p className="text-sm text-gray-700">{formatDateTime(tx.createdAt)}</p>
                              <span className="text-[10px] text-gray-400">{TYPE_LABELS[tx.type] || tx.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-semibold text-gray-800">{formatCurrency(balBefore)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : "-"}{formatCurrency(amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-semibold text-blue-700">{formatCurrency(balAfter)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-gray-600 line-clamp-2">{tx.description || "—"}</p>
                          {tx.status === "pending" && (
                            <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">Chờ xử lý</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-[#1e3a6e] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Đang tải...</p>
              </div>
            ) : (transactions as any[]).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(transactions as any[]).map((tx: any) => {
                  const amount = parseFloat(tx.amount || "0");
                  const balAfter = parseFloat(tx.balanceAfter || "0");
                  const isPositive = tx.type === "topup" || tx.type === "refund" || tx.type === "reward";
                  return (
                    <div key={tx.id} className="px-4 py-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {typeIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{formatDateTime(tx.createdAt)}</p>
                        <p className="text-xs text-gray-400 truncate">{tx.description || TYPE_LABELS[tx.type] || tx.type}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Còn lại: <span className="text-blue-600 font-semibold">{formatCurrency(balAfter)}</span></p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : "-"}{formatCurrency(amount)}
                        </p>
                        {tx.status === "pending" && (
                          <span className="text-[10px] text-yellow-600">Chờ xử lý</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>
      <ClientFooter />
    </div>
  );
}
