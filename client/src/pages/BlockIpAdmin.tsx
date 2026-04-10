import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Shield, Plus, Trash2, Search, X, Filter, Clock,
  AlertTriangle, CheckCircle2, Loader2, RefreshCw
} from "@/components/Icon";

type FilterType = "all" | "active" | "expired";

export default function BlockIpAdmin() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ipAddress: "", reason: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: blockedIps = [], isLoading, refetch } = trpc.blockIp.list.useQuery();

  const addMutation = trpc.blockIp.add.useMutation({
    onSuccess: () => {
      toast.success("Đã block IP thành công");
      setShowAdd(false);
      setForm({ ipAddress: "", reason: "" });
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Lỗi khi block IP"),
  });

  const deleteMutation = trpc.blockIp.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa IP"); refetch(); },
    onError: () => toast.error("Xóa thất bại"),
  });

  const deleteSelectedMutation = trpc.blockIp.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`Đã xóa ${selected.length} IP`);
      setSelected([]);
      refetch();
    },
  });

  const cleanupMutation = trpc.blockIp.cleanup.useMutation({
    onSuccess: (r) => { toast.success(`Đã dọn dẹp ${r.deleted} IP hết hạn`); refetch(); },
    onError: () => toast.error("Dọn dẹp thất bại"),
  });

  const filtered = useMemo(() => {
    return (blockedIps as any[]).filter((ip: any) => {
      const matchSearch = !search || ip.ipAddress.includes(search) || (ip.reason || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || (filter === "active" ? ip.isActive : !ip.isActive);
      return matchSearch && matchFilter;
    });
  }, [blockedIps, search, filter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length && paginated.length > 0 ? [] : paginated.map((ip: any) => ip.id));
  const isAllSelected = paginated.length > 0 && paginated.every((ip: any) => selected.includes(ip.id));

  // Stats
  const activeCount = (blockedIps as any[]).filter((ip: any) => ip.isActive).length;
  const expiredCount = (blockedIps as any[]).filter((ip: any) => !ip.isActive).length;

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: (blockedIps as any[]).length },
    { key: "active", label: "Đang chặn", count: activeCount },
    { key: "expired", label: "Hết hạn", count: expiredCount },
  ];

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="ak-page-title">Block IP</h1>
            <p className="ak-page-subtitle">Quản lý danh sách địa chỉ IP bị chặn truy cập</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              {cleanupMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Dọn hết hạn
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              className="gap-1.5 bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm IP Block
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{(blockedIps as any[]).length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Tổng IP</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{activeCount}</p>
              <p className="text-xs text-red-500 mt-0.5">Đang chặn</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl font-bold text-gray-500">{expiredCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Hết hạn</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Filter tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm địa chỉ IP hoặc lý do..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filter === tab.key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-muted-foreground border-border hover:border-blue-300"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-blue-700">
              Đã chọn {selected.length} IP
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected([])}
                className="gap-1 text-blue-600 border-blue-300"
              >
                <X className="h-3.5 w-3.5" /> Bỏ chọn
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-red-600 hover:bg-red-700"
                disabled={deleteSelectedMutation.isPending}
                onClick={() => {
                  if (confirm(`Xóa ${selected.length} IP đã chọn?`))
                    deleteSelectedMutation.mutate({ ids: selected });
                }}
              >
                {deleteSelectedMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Xóa đã chọn
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Shield className="h-8 w-8 opacity-40" />
            </div>
            <p className="font-medium">Không có IP nào</p>
            <p className="text-sm opacity-70">
              {search ? "Thử thay đổi từ khóa tìm kiếm" : "Chưa có địa chỉ IP nào bị chặn"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden sm:block">
              <Card className="shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 w-10">
                          <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Địa chỉ IP</th>
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lý do</th>
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ngày block</th>
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hết hạn</th>
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                        <th className="p-3 w-14"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((ip: any) => (
                        <tr key={ip.id} className={`border-b hover:bg-muted/20 transition-colors ${selected.includes(ip.id) ? "bg-blue-50/50" : ""}`}>
                          <td className="p-3">
                            <Checkbox checked={selected.includes(ip.id)} onCheckedChange={() => toggleSelect(ip.id)} />
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-sm font-medium">{ip.ipAddress}</span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{ip.reason || "—"}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(ip.blockedAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {ip.expiresAt ? new Date(ip.expiresAt).toLocaleDateString("vi-VN") : (
                              <span className="text-xs text-red-500 font-medium">Vĩnh viễn</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={ip.isActive
                              ? "bg-red-100 text-red-700 border-red-200 border"
                              : "bg-gray-100 text-gray-500 border-gray-200 border"
                            }>
                              {ip.isActive ? (
                                <><AlertTriangle className="h-3 w-3 mr-1" />Đang chặn</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />Hết hạn</>
                              )}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="icon" variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { if (confirm("Xóa IP này?")) deleteMutation.mutate({ id: ip.id }); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile: Card list */}
            <div className="sm:hidden space-y-2">
              {/* Select all on mobile */}
              <div className="flex items-center gap-2 px-1">
                <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} id="select-all-mobile" />
                <label htmlFor="select-all-mobile" className="text-sm text-muted-foreground cursor-pointer">
                  Chọn tất cả ({paginated.length})
                </label>
              </div>

              {paginated.map((ip: any) => (
                <div
                  key={ip.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    selected.includes(ip.id) ? "border-blue-300 bg-blue-50/50" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.includes(ip.id)}
                      onCheckedChange={() => toggleSelect(ip.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-semibold text-sm">{ip.ipAddress}</span>
                        <Badge className={ip.isActive
                          ? "bg-red-100 text-red-700 border-red-200 border text-xs"
                          : "bg-gray-100 text-gray-500 border-gray-200 border text-xs"
                        }>
                          {ip.isActive ? "Đang chặn" : "Hết hạn"}
                        </Badge>
                      </div>

                      {ip.reason && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ip.reason}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ip.blockedAt).toLocaleDateString("vi-VN")}
                        </span>
                        {ip.expiresAt ? (
                          <span>Hết hạn: {new Date(ip.expiresAt).toLocaleDateString("vi-VN")}</span>
                        ) : (
                          <span className="text-red-500 font-medium">Vĩnh viễn</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                      onClick={() => { if (confirm("Xóa IP này?")) deleteMutation.mutate({ id: ip.id }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm" variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-8 px-3"
                  >
                    ‹
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Button
                        key={p} size="sm"
                        variant={page === p ? "default" : "outline"}
                        onClick={() => setPage(p)}
                        className="h-8 w-8 p-0"
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm" variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8 px-3"
                  >
                    ›
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add IP Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Thêm IP Cần Block
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">
                Địa chỉ IP <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.ipAddress}
                onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
                placeholder="vd: 192.168.1.1 hoặc 2001:db8::1"
                className="mt-1.5 font-mono"
                onKeyDown={e => e.key === "Enter" && form.ipAddress && addMutation.mutate(form)}
              />
              <p className="text-xs text-muted-foreground mt-1">Hỗ trợ IPv4 và IPv6</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Lý do</Label>
              <Input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Spam, tấn công DDoS, ..."
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowAdd(false); setForm({ ipAddress: "", reason: "" }); }}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => addMutation.mutate(form)}
                disabled={addMutation.isPending || !form.ipAddress.trim()}
              >
                {addMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang block...</>
                  : <><Shield className="h-4 w-4 mr-2" />Block IP</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
