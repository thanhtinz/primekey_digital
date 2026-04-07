import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Clock, CheckCircle, XCircle, Wrench, Loader2, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Chờ Xử Lý", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  IN_PROGRESS: { label: "Đang Xử Lý", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Wrench },
  COMPLETED: { label: "Hoàn Thành", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  REJECTED: { label: "Từ Chối", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WarrantyManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  const utils = trpc.useUtils();
  const { data: warranties = [], isLoading } = trpc.warranty.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    { staleTime: 10_000 }
  );
  const updateMutation = trpc.warranty.updateStatus.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); utils.warranty.list.invalidate(); setEditItem(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.warranty.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); utils.warranty.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = warranties.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (w.invoiceNumber?.toLowerCase().includes(s) || w.customerName?.toLowerCase().includes(s) || w.customerEmail?.toLowerCase().includes(s) || w.productNames?.toLowerCase().includes(s));
  });

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-500" />
              Quản Lý Bảo Hành
            </h1>
            <p className="text-muted-foreground mt-1">Danh sách tất cả yêu cầu bảo hành</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ Xử Lý</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang Xử Lý</SelectItem>
                <SelectItem value="COMPLETED">Hoàn Thành</SelectItem>
                <SelectItem value="REJECTED">Từ Chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Chưa có yêu cầu bảo hành nào</p>
              <p className="text-sm mt-1">Yêu cầu bảo hành sẽ xuất hiện khi bạn tạo từ trang chi tiết hóa đơn</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((w) => {
              const st = STATUS_MAP[w.status] || STATUS_MAP.PENDING;
              const StIcon = st.icon;
              return (
                <Card key={w.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{w.invoiceNumber}</span>
                          <Badge variant="outline" className={`text-xs ${st.color}`}>
                            <StIcon className="h-3 w-3 mr-1" />
                            {st.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {w.customerName} {w.customerPhone && `• ${w.customerPhone}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Sản phẩm: {w.productNames || "—"}
                        </p>
                        {w.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Lý do: {w.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          BH: {formatDate(w.warrantyStartDate)} → {formatDate(w.warrantyExpiryDate)} | Tạo: {formatDate(w.createdAt)}
                        </p>
                        {w.resolution && (
                          <p className="text-xs text-emerald-600 mt-1">Kết quả: {w.resolution}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditItem(w); setNewStatus(w.status); setResolution(w.resolution || ""); }}
                        >
                          Cập Nhật
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => { if (confirm("Xóa yêu cầu bảo hành này?")) deleteMutation.mutate({ id: w.id }); }}
                        >
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập Nhật Bảo Hành - {editItem?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Trạng Thái</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
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
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Mô tả kết quả xử lý bảo hành..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Hủy</Button>
            <Button
              onClick={() => editItem && updateMutation.mutate({ id: editItem.id, status: newStatus as any, resolution })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
