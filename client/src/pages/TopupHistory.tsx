import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Clock, CheckCircle, XCircle } from "@/components/Icon";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  topup: { label: "Nạp tiền", color: "bg-green-100 text-green-700 border-green-200" },
  spend: { label: "Chi tiêu", color: "bg-red-100 text-red-700 border-red-200" },
  refund: { label: "Hoàn tiền", color: "bg-blue-100 text-blue-700 border-blue-200" },
  reward: { label: "Thưởng", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  completed: { label: "Hoàn thành", icon: <CheckCircle className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Đang xử lý", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-amber-100 text-amber-700 border-amber-200" },
  failed: { label: "Thất bại", icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-700 border-red-200" },
};

export default function TopupHistory() {
  const [emailFilter, setEmailFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(100);

  const { data: transactions = [], isLoading, refetch } = trpc.wallet.adminList.useQuery(
    { limit, offset: 0, email: emailFilter || undefined },
    { refetchInterval: false }
  );

  const filtered = typeFilter === "all"
    ? (transactions as any[])
    : (transactions as any[]).filter((t: any) => t.type === typeFilter);

  const totalTopup = (transactions as any[]).filter((t: any) => t.type === "topup" && t.status === "completed").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
  const totalPending = (transactions as any[]).filter((t: any) => t.status === "pending").length;
  const totalFailed = (transactions as any[]).filter((t: any) => t.status === "failed").length;
  const uniqueEmails = new Set((transactions as any[]).map((t: any) => t.customerEmail)).size;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Lịch Sử Nạp Tiền</h1>
            <p className="ak-page-subtitle">Xem lịch sử giao dịch ví của tất cả khách hàng</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-green-100"><ArrowDownLeft className="h-5 w-5 text-green-600" /></div>
            <div>
              <div className="ak-stat-value text-green-600">{totalTopup.toLocaleString("vi-VN")}đ</div>
              <div className="ak-stat-label">Tổng nạp thành công</div>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-blue-100"><Wallet className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="ak-stat-value">{(transactions as any[]).length}</div>
              <div className="ak-stat-label">Tổng giao dịch</div>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <div className="ak-stat-value text-amber-600">{totalPending}</div>
              <div className="ak-stat-label">Đang chờ xử lý</div>
            </div>
          </div>
          <div className="ak-stat-card">
            <div className="ak-stat-icon bg-purple-100"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="ak-stat-value">{uniqueEmails}</div>
              <div className="ak-stat-label">Khách hàng</div>
            </div>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="ak-card">
          <div className="ak-card-header flex-wrap gap-2">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Loại GD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="topup">Nạp tiền</SelectItem>
                <SelectItem value="spend">Chi tiêu</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
                <SelectItem value="reward">Thưởng</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 ml-auto">{filtered.length} giao dịch</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="ak-empty">
              <div className="ak-empty-icon"><Wallet className="h-6 w-6" /></div>
              <div className="ak-empty-title">Không có giao dịch</div>
              <div className="ak-empty-desc">Chưa có giao dịch nào phù hợp với bộ lọc</div>
            </div>
          ) : (
            <div className="ak-table-wrapper rounded-none border-0">
              <table className="ak-table">
                <thead>
                  <tr>
                    <th>Khách Hàng</th>
                    <th>Loại</th>
                    <th>Số Tiền</th>
                    <th className="hidden md:table-cell">Số Dư Sau</th>
                    <th className="hidden lg:table-cell">Mô Tả</th>
                    <th>Trạng Thái</th>
                    <th className="hidden sm:table-cell">Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any) => {
                    const typeCfg = TYPE_LABELS[t.type] || { label: t.type, color: "bg-gray-100 text-gray-600" };
                    const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.completed;
                    const isPositive = t.type === "topup" || t.type === "refund" || t.type === "reward";
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-600">{(t.customerEmail || "?")[0].toUpperCase()}</span>
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-36">{t.customerEmail}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" className={`text-xs ${typeCfg.color}`}>
                            {typeCfg.label}
                          </Badge>
                        </td>
                        <td>
                          <span className={`font-semibold text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : "-"}{Math.abs(parseFloat(t.amount)).toLocaleString("vi-VN")}đ
                          </span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-sm text-gray-600">
                            {t.balanceAfter ? parseFloat(t.balanceAfter).toLocaleString("vi-VN") + "đ" : "—"}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell">
                          <span className="text-xs text-gray-500 truncate max-w-40 block">{t.description || "—"}</span>
                        </td>
                        <td>
                          <Badge variant="outline" className={`text-xs gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-xs text-gray-400">
                            {new Date(t.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
