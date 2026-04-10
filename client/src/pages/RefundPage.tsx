import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCcw, Search, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign } from "@/components/Icon";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: Clock },
  APPROVED: { label: "Đã duyệt", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
  PROCESSED: { label: "Đã hoàn tiền", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: RefreshCw },
};

export default function RefundPage() {
  const utils = trpc.useUtils();
  const { data: refunds = [], isLoading } = trpc.refund.list.useQuery();
  const updateMutation = trpc.refund.updateStatus.useMutation({
    onSuccess: () => { utils.refund.list.invalidate(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e: any) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (refunds as any[]).filter(r => {
    const matchSearch = !search || r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPending = (refunds as any[]).filter(r => r.status === "PENDING").length;
  const totalProcessed = (refunds as any[]).filter(r => r.status === "PROCESSED").length;
  const totalAmount = (refunds as any[]).filter(r => r.status === "PROCESSED").reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="ak-page-header">
          <h1 className="ak-page-title">Quản Lý Hoàn Tiền</h1>
          <p className="ak-page-subtitle">Xem và duyệt yêu cầu hoàn tiền từ khách hàng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng yêu cầu", value: (refunds as any[]).length, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
            { label: "Chờ duyệt", value: totalPending, color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" },
            { label: "Đã hoàn tiền", value: totalProcessed, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
            { label: "Tổng đã hoàn", value: totalAmount.toLocaleString("vi-VN") + "đ", color: "from-red-500/20 to-red-600/10 border-red-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white text-xl font-bold mt-1 truncate">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo lý do hoàn tiền..." className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-white">Tất cả</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <RotateCcw className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Chưa có yêu cầu hoàn tiền nào</p>
              <p className="text-slate-500 text-sm mt-1">Khách hàng có thể tạo yêu cầu từ trang theo dõi đơn hàng</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filtered.map((refund: any) => {
                const statusInfo = STATUS_MAP[refund.status] || STATUS_MAP.PENDING;
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={refund.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <DollarSign className="w-4 h-4 text-red-400" />
                          <span className="text-white font-semibold text-sm">{Number(refund.amount).toLocaleString("vi-VN")}đ</span>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 font-mono">Đơn #{refund.invoiceId}</Badge>
                          {refund.customerId && (
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              KH #{refund.customerId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mt-1 line-clamp-2">{refund.reason}</p>
                        {refund.adminNote && <p className="text-slate-500 text-xs mt-1 italic">Ghi chú admin: {refund.adminNote}</p>}
                        <p className="text-slate-500 text-xs mt-1">{new Date(refund.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Select value={refund.status} onValueChange={s => updateMutation.mutate({ id: refund.id, status: s as any })}>
                          <SelectTrigger className="w-36 bg-slate-900 border-slate-600 text-white text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-xs">{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
