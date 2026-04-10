import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Clock, CheckCircle, XCircle, Wrench, Loader2, Trash2, Search, RefreshCw, CheckCircle2, AlertCircle } from "@/components/Icon";
import { toast } from "sonner";

// ===== WARRANTY MANAGEMENT (Admin-created) =====
const WM_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Chờ Xử Lý", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: Clock },
  IN_PROGRESS: { label: "Đang Xử Lý", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: Wrench },
  COMPLETED: { label: "Hoàn Thành", color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  REJECTED: { label: "Từ Chối", color: "bg-red-500/20 text-red-600 border-red-500/30", icon: XCircle },
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function WarrantyManagementTab() {
  const utils = trpc.useUtils();
  const { data: warranties = [], isLoading } = trpc.warranty.list.useQuery();
  const updateMutation = trpc.warranty.updateStatus.useMutation({
    onSuccess: () => { utils.warranty.list.invalidate(); toast.success("Đã cập nhật"); setEditItem(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.warranty.delete.useMutation({
    onSuccess: () => { utils.warranty.list.invalidate(); toast.success("Đã xóa"); },
    onError: (e) => toast.error(e.message),
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  const filtered = (warranties as any[]).filter(w => {
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    const matchSearch = !search || w.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || w.customerName?.toLowerCase().includes(search.toLowerCase()) || w.customerPhone?.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã HĐ, tên, SĐT..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(WM_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Không có dữ liệu bảo hành</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const st = WM_STATUS[w.status] || WM_STATUS.PENDING;
            const StIcon = st.icon;
            return (
              <Card key={w.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{w.invoiceNumber}</span>
                        <Badge variant="outline" className={`text-xs ${st.color}`}>
                          <StIcon className="h-3 w-3 mr-1" />{st.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{w.customerName} {w.customerPhone && `• ${w.customerPhone}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Sản phẩm: {w.productNames || "—"}</p>
                      {w.reason && <p className="text-xs text-muted-foreground mt-0.5">Lý do: {w.reason}</p>}
                      <p className="text-xs text-muted-foreground mt-1">BH: {formatDate(w.warrantyStartDate)} → {formatDate(w.warrantyExpiryDate)}</p>
                      {w.resolution && <p className="text-xs text-emerald-600 mt-1">Kết quả: {w.resolution}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setEditItem(w); setNewStatus(w.status); setResolution(w.resolution || ""); }}>
                        Cập Nhật
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"
                        onClick={() => { if (confirm("Xóa yêu cầu bảo hành này?")) deleteMutation.mutate({ id: w.id }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cập Nhật Bảo Hành - {editItem?.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Trạng Thái</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ Xử Lý</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang Xử Lý</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn Thành</SelectItem>
                  <SelectItem value="REJECTED">Từ Chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kết Quả / Ghi Chú</Label>
              <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Mô tả kết quả xử lý..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Hủy</Button>
            <Button onClick={() => editItem && updateMutation.mutate({ id: editItem.id, status: newStatus as any, resolution })} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== WARRANTY REQUEST MANAGEMENT (Customer-submitted) =====
const WR_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: Clock },
  IN_PROGRESS: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: RefreshCw },
  RESOLVED: { label: "Đã giải quyết", color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle },
};

function WarrantyRequestTab() {
  const utils = trpc.useUtils();
  const { data: requests = [], isLoading } = trpc.warrantyRequest.list.useQuery();
  const updateMutation = trpc.warrantyRequest.updateStatus.useMutation({
    onSuccess: () => { utils.warrantyRequest.list.invalidate(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e) => toast.error(e.message),
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (requests as any[]).filter(r => {
    const matchSearch = !search || r.customerEmail?.toLowerCase().includes(search.toLowerCase()) || (r.customerName || "").toLowerCase().includes(search.toLowerCase()) || (r.invoiceCode || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = { total: requests.length, pending: (requests as any[]).filter(r => r.status === "PENDING").length, inProgress: (requests as any[]).filter(r => r.status === "IN_PROGRESS").length, resolved: (requests as any[]).filter(r => r.status === "RESOLVED").length };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng yêu cầu", value: counts.total, cls: "border-gray-200" },
          { label: "Chờ xử lý", value: counts.pending, cls: "border-yellow-200 bg-yellow-50" },
          { label: "Đang xử lý", value: counts.inProgress, cls: "border-blue-200 bg-blue-50" },
          { label: "Đã giải quyết", value: counts.resolved, cls: "border-green-200 bg-green-50" },
        ].map(s => (
          <Card key={s.label} className={`border ${s.cls}`}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo email, tên, mã đơn..." className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(WR_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có yêu cầu bảo hành nào</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => {
            const statusInfo = WR_STATUS[req.status] || WR_STATUS.PENDING;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={req.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{req.customerName || req.customerEmail}</span>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}
                        </Badge>
                        {req.invoiceCode && <Badge variant="outline" className="text-xs font-mono">{req.invoiceCode}</Badge>}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{req.customerEmail} {req.customerPhone && `• ${req.customerPhone}`}</p>
                      <p className="text-sm mt-2 line-clamp-2">{req.description}</p>
                      <p className="text-muted-foreground text-xs mt-1">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <Select value={req.status} onValueChange={v => updateMutation.mutate({ id: req.id, status: v as any })}>
                      <SelectTrigger className="w-36 text-xs h-8 flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(WR_STATUS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function WarrantyAdmin() {
  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Quản Lý Bảo Hành</h1>
            <p className="ak-page-subtitle">Quản lý bảo hành sản phẩm và yêu cầu từ khách hàng</p>
          </div>
        </div>
        <Tabs defaultValue="warranties">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="warranties" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />Bảo Hành Đơn Hàng
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />Yêu Cầu Từ Khách
            </TabsTrigger>
          </TabsList>
          <TabsContent value="warranties" className="mt-4">
            <WarrantyManagementTab />
          </TabsContent>
          <TabsContent value="requests" className="mt-4">
            <WarrantyRequestTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
