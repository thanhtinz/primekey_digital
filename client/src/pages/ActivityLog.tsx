import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { History, Search, FileText, User, Package, Settings, ShoppingCart } from "lucide-react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE_INVOICE: { label: "Tạo đơn hàng", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  UPDATE_STATUS: { label: "Cập nhật trạng thái", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  DELETE_INVOICE: { label: "Xóa đơn hàng", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  ADD_NOTE: { label: "Thêm ghi chú", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  CREATE_STAFF: { label: "Tạo nhân viên", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  CREATE_CUSTOMER: { label: "Tạo khách hàng", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  UPDATE_CUSTOMER: { label: "Cập nhật KH", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  CREATE_PRODUCT: { label: "Tạo sản phẩm", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  UPDATE_PRODUCT: { label: "Cập nhật SP", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  invoice: <ShoppingCart className="w-4 h-4 text-blue-400" />,
  customer: <User className="w-4 h-4 text-cyan-400" />,
  product: <Package className="w-4 h-4 text-orange-400" />,
  user: <User className="w-4 h-4 text-purple-400" />,
  settings: <Settings className="w-4 h-4 text-slate-400" />,
};

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = trpc.activityLogs.list.useQuery({ limit: 200 });

  const filtered = logs?.filter(log =>
    (log.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-blue-400" />
              Lịch Sử Hoạt Động
            </h1>
            <p className="text-slate-400 mt-1">Theo dõi mọi hành động trong hệ thống</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, hành động, loại..." className="pl-9 bg-slate-800 border-slate-700 text-white" />
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="text-center text-slate-400 py-8">Đang tải...</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center text-slate-400 py-8">Chưa có hoạt động nào</div>
          )}
          {filtered.map(log => {
            const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
            return (
              <div key={log.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-start gap-4 hover:border-slate-600 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {ENTITY_ICONS[log.entityType] || <FileText className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{log.authorName || "Hệ thống"}</span>
                    <Badge className={`text-xs border ${actionInfo.color}`}>{actionInfo.label}</Badge>
                    {log.entityId && (
                      <span className="text-slate-500 text-xs">#{log.entityId}</span>
                    )}
                  </div>
                  {log.changes != null && (
                    <p className="text-slate-400 text-sm mt-1 truncate">
                      {typeof log.changes === "object" ? JSON.stringify(log.changes as Record<string, unknown>).slice(0, 100) : String(log.changes as string)}
                    </p>
                  )}
                </div>
                <div className="text-slate-500 text-xs flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
