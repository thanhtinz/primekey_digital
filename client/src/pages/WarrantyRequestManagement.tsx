import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Search, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "@/components/Icon";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: Clock },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: RefreshCw },
  RESOLVED: { label: "Đã giải quyết", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
};

export default function WarrantyRequestManagement() {
  const utils = trpc.useUtils();
  const { data: requests = [], isLoading } = trpc.warrantyRequest.list.useQuery();
  const updateMutation = trpc.warrantyRequest.updateStatus.useMutation({
    onSuccess: () => { utils.warrantyRequest.list.invalidate(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (requests as any[]).filter(r => {
    const matchSearch = !search || r.customerEmail.toLowerCase().includes(search.toLowerCase()) || (r.customerName || "").toLowerCase().includes(search.toLowerCase()) || (r.invoiceCode || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: (requests as any[]).length,
    pending: (requests as any[]).filter(r => r.status === "PENDING").length,
    inProgress: (requests as any[]).filter(r => r.status === "IN_PROGRESS").length,
    resolved: (requests as any[]).filter(r => r.status === "RESOLVED").length,
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Yêu Cầu Bảo Hành</h1>
            <p className="ak-page-subtitle">Xử lý yêu cầu bảo hành từ khách hàng</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tổng yêu cầu", value: counts.total, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
            { label: "Chờ xử lý", value: counts.pending, color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" },
            { label: "Đang xử lý", value: counts.inProgress, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Đã giải quyết", value: counts.resolved, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo email, tên, mã đơn..." className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800/60 border-slate-700 text-white">
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
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Chưa có yêu cầu bảo hành nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filtered.map((req: any) => {
                const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={req.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm">{req.customerName || req.customerEmail}</span>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}
                          </Badge>
                          {req.invoiceCode && <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 font-mono">{req.invoiceCode}</Badge>}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{req.customerEmail} {req.customerPhone && `• ${req.customerPhone}`}</p>
                        <p className="text-slate-300 text-sm mt-2 line-clamp-2">{req.description}</p>
                        <p className="text-slate-500 text-xs mt-1">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                      <Select value={req.status} onValueChange={v => updateMutation.mutate({ id: req.id, status: v as any })}>
                        <SelectTrigger className="w-36 bg-slate-900 border-slate-600 text-white text-xs h-8 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-xs">{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
