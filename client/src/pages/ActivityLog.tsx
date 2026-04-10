import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  History, Search, FileText, User, Package, Settings, ShoppingCart,
  Loader2, Filter, X, ChevronDown, Activity, TrendingUp, Clock, AlertCircle
} from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

// ─── Action config ─────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  CREATE_INVOICE:   { label: "Tạo đơn hàng",       color: "text-emerald-600 bg-emerald-50 border-emerald-200",   dot: "bg-emerald-500", bg: "bg-emerald-50" },
  UPDATE_STATUS:    { label: "Cập nhật trạng thái", color: "text-blue-600 bg-blue-50 border-blue-200",            dot: "bg-blue-500",    bg: "bg-blue-50" },
  DELETE_INVOICE:   { label: "Xóa đơn hàng",        color: "text-red-600 bg-red-50 border-red-200",              dot: "bg-red-500",     bg: "bg-red-50" },
  ADD_NOTE:         { label: "Thêm ghi chú",         color: "text-amber-600 bg-amber-50 border-amber-200",        dot: "bg-amber-500",   bg: "bg-amber-50" },
  CREATE_STAFF:     { label: "Tạo nhân viên",        color: "text-violet-600 bg-violet-50 border-violet-200",     dot: "bg-violet-500",  bg: "bg-violet-50" },
  CREATE_CUSTOMER:  { label: "Tạo khách hàng",       color: "text-cyan-600 bg-cyan-50 border-cyan-200",           dot: "bg-cyan-500",    bg: "bg-cyan-50" },
  UPDATE_CUSTOMER:  { label: "Cập nhật KH",          color: "text-cyan-600 bg-cyan-50 border-cyan-200",           dot: "bg-cyan-500",    bg: "bg-cyan-50" },
  CREATE_PRODUCT:   { label: "Tạo sản phẩm",         color: "text-orange-600 bg-orange-50 border-orange-200",     dot: "bg-orange-500",  bg: "bg-orange-50" },
  UPDATE_PRODUCT:   { label: "Cập nhật SP",          color: "text-orange-600 bg-orange-50 border-orange-200",     dot: "bg-orange-500",  bg: "bg-orange-50" },
  UPDATE_SETTINGS:  { label: "Cập nhật cài đặt",     color: "text-slate-600 bg-slate-50 border-slate-200",        dot: "bg-slate-500",   bg: "bg-slate-50" },
  LOGIN:            { label: "Đăng nhập",             color: "text-green-600 bg-green-50 border-green-200",        dot: "bg-green-500",   bg: "bg-green-50" },
  LOGOUT:           { label: "Đăng xuất",             color: "text-gray-600 bg-gray-50 border-gray-200",           dot: "bg-gray-400",    bg: "bg-gray-50" },
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  invoice:  <ShoppingCart className="w-4 h-4" />,
  customer: <User className="w-4 h-4" />,
  product:  <Package className="w-4 h-4" />,
  user:     <User className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
};

const ENTITY_COLORS: Record<string, string> = {
  invoice:  "bg-blue-100 text-blue-600",
  customer: "bg-cyan-100 text-cyan-600",
  product:  "bg-orange-100 text-orange-600",
  user:     "bg-violet-100 text-violet-600",
  settings: "bg-slate-100 text-slate-600",
};

// Group logs by date
function groupByDate(logs: any[]) {
  const groups: Record<string, any[]> = {};
  for (const log of logs) {
    const d = new Date(log.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = "Hôm nay";
    else if (d.toDateString() === yesterday.toDateString()) key = "Hôm qua";
    else key = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: logs = [], isLoading } = trpc.activityLogs.list.useQuery({ limit: 500 });

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayCount = logs.filter((l: any) => new Date(l.createdAt).toDateString() === today).length;
    const actionCounts: Record<string, number> = {};
    for (const l of logs as any[]) {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    }
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    return { total: logs.length, todayCount, topAction };
  }, [logs]);

  // Unique action types & entity types for filter
  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    (logs as any[]).forEach((l: any) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    (logs as any[]).forEach((l: any) => set.add(l.entityType));
    return Array.from(set);
  }, [logs]);

  const filtered = useMemo(() => {
    return (logs as any[]).filter((log: any) => {
      const matchSearch = !search ||
        log.authorName?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entityType.toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === "all" || log.action === filterAction;
      const matchEntity = filterEntity === "all" || log.entityType === filterEntity;
      return matchSearch && matchAction && matchEntity;
    });
  }, [logs, search, filterAction, filterEntity]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const activeFilters = (filterAction !== "all" ? 1 : 0) + (filterEntity !== "all" ? 1 : 0);

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="ak-page-title">Nhật Ký Hoạt Động</h1>
            <p className="ak-page-subtitle">Theo dõi toàn bộ thao tác trong hệ thống</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Cập nhật realtime</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Tổng hoạt động</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Hôm nay</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.todayCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/50 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-violet-600 font-medium">Phổ biến nhất</p>
                <p className="text-sm font-bold text-violet-700 truncate">
                  {stats.topAction
                    ? (ACTION_CONFIG[stats.topAction[0]]?.label || stats.topAction[0])
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, hành động, loại..."
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 flex-shrink-0 ${activeFilters > 0 ? "border-blue-500 text-blue-600 bg-blue-50" : ""}`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card className="border border-blue-100 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Loại hành động
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilterAction("all")}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        filterAction === "all"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-muted-foreground border-border hover:border-blue-300"
                      }`}
                    >
                      Tất cả
                    </button>
                    {actionTypes.map(a => {
                      const cfg = ACTION_CONFIG[a];
                      return (
                        <button
                          key={a}
                          onClick={() => setFilterAction(a === filterAction ? "all" : a)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            filterAction === a
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-muted-foreground border-border hover:border-blue-300"
                          }`}
                        >
                          {cfg?.label || a}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Loại đối tượng
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilterEntity("all")}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        filterEntity === "all"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-muted-foreground border-border hover:border-blue-300"
                      }`}
                    >
                      Tất cả
                    </button>
                    {entityTypes.map(e => (
                      <button
                        key={e}
                        onClick={() => setFilterEntity(e === filterEntity ? "all" : e)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                          filterEntity === e
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-muted-foreground border-border hover:border-blue-300"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {activeFilters > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <button
                    onClick={() => { setFilterAction("all"); setFilterEntity("all"); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Result count */}
        {(search || activeFilters > 0) && (
          <p className="text-sm text-muted-foreground">
            Tìm thấy <span className="font-semibold text-foreground">{filtered.length}</span> kết quả
          </p>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Đang tải nhật ký...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <History className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium">Không có hoạt động nào</p>
            <p className="text-sm opacity-70">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateLogs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 rounded-full bg-muted">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Timeline items */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />

                  <div className="space-y-2">
                    {dateLogs.map((log: any, idx: number) => {
                      const cfg = ACTION_CONFIG[log.action] || {
                        label: log.action,
                        color: "text-slate-600 bg-slate-50 border-slate-200",
                        dot: "bg-slate-400",
                        bg: "bg-slate-50",
                      };
                      const entityColor = ENTITY_COLORS[log.entityType] || "bg-slate-100 text-slate-600";
                      const entityIcon = ENTITY_ICONS[log.entityType] || <FileText className="w-4 h-4" />;

                      return (
                        <div
                          key={log.id}
                          className="flex gap-3 sm:gap-4 group"
                        >
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 relative z-10 hidden sm:flex items-start pt-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ring-2 ring-background mt-1`} />
                          </div>

                          {/* Card */}
                          <div className="flex-1 min-w-0">
                            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-150 group-hover:bg-blue-50/20">
                              <div className="flex items-start gap-3">
                                {/* Entity icon */}
                                <div className={`w-9 h-9 rounded-lg ${entityColor} flex items-center justify-center flex-shrink-0`}>
                                  {entityIcon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-foreground">
                                      {log.authorName || "Hệ thống"}
                                    </span>
                                    <Badge className={`text-xs border px-2 py-0 h-5 ${cfg.color}`}>
                                      {cfg.label}
                                    </Badge>
                                    {log.entityId && (
                                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        #{log.entityId}
                                      </span>
                                    )}
                                  </div>

                                  {log.changes != null && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {typeof log.changes === "object"
                                        ? JSON.stringify(log.changes as Record<string, unknown>).slice(0, 120)
                                        : String(log.changes as string).slice(0, 120)}
                                    </p>
                                  )}
                                </div>

                                {/* Time */}
                                <div className="flex-shrink-0 text-right">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
