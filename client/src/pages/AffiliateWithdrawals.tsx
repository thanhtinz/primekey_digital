import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Search, Banknote, Wallet, Loader2 } from "@/components/Icon";

export default function AffiliateWithdrawals() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);

  const { data: withdrawals = [], refetch } = trpc.referralWithdrawals.list.useQuery(undefined, { staleTime: 0 });
  const updateMutation = trpc.referralWithdrawals.updateStatus.useMutation({
    onSuccess: () => { toast.success("Cập nhật thành công"); setSelectedItem(null); setAdminNote(""); setDialogAction(null); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (withdrawals as any[]).filter((w: any) => {
    const matchSearch = !search || w.customerEmail?.toLowerCase().includes(search.toLowerCase()) || w.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = (item: any, action: "approve" | "reject") => { setSelectedItem(item); setDialogAction(action); setAdminNote(""); };
  const confirmAction = () => {
    if (!selectedItem || !dialogAction) return;
    updateMutation.mutate({ id: selectedItem.id, status: dialogAction === "approve" ? "completed" : "rejected", adminNote });
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
  };

  const formatAmount = (amount: string | number) => Number(amount).toLocaleString("vi-VN") + " ₫";
  const pendingCount = (withdrawals as any[]).filter((w: any) => w.status === "pending").length;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <div>
              <h1 className="ak-page-title">Yêu Cầu Rút Thưởng</h1>
              <p className="ak-page-subtitle">Xử lý yêu cầu rút hoa hồng giới thiệu</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
              {pendingCount} chờ duyệt
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo email, tên..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="completed">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh Sách Yêu Cầu ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Banknote className="h-10 w-10 mb-2 opacity-30" />
                <p>Không có yêu cầu rút thưởng nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ak-table w-full">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Số tiền</th>
                      <th>Hình thức</th>
                      <th>Thông tin nhận</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w: any) => (
                      <tr key={w.id}>
                        <td>
                          <div className="font-medium">{w.customerName || "—"}</div>
                          <div className="text-xs text-muted-foreground">{w.customerEmail}</div>
                        </td>
                        <td className="font-semibold text-green-600">{formatAmount(w.amount)}</td>
                        <td>
                          {w.withdrawType === "wallet" ? (
                            <span className="flex items-center gap-1 text-blue-600 text-sm"><Wallet className="h-3 w-3" /> Số dư</span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 text-sm"><Banknote className="h-3 w-3" /> ATM</span>
                          )}
                        </td>
                        <td className="text-sm text-muted-foreground max-w-[150px] truncate">{w.bankInfo || w.walletInfo || "—"}</td>
                        <td>{statusBadge(w.status)}</td>
                        <td className="text-sm text-muted-foreground">
                          {w.createdAt ? new Date(w.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td>
                          {w.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(w, "approve")}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Duyệt
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(w, "reject")}>
                                <XCircle className="h-3 w-3 mr-1" /> Từ chối
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={dialogAction === "approve" ? "text-green-600" : "text-red-600"}>
                {dialogAction === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {dialogAction === "approve"
                  ? `Duyệt yêu cầu rút ${formatAmount(selectedItem?.amount || 0)} của ${selectedItem?.customerName || selectedItem?.customerEmail}?`
                  : `Từ chối yêu cầu rút ${formatAmount(selectedItem?.amount || 0)} của ${selectedItem?.customerName || selectedItem?.customerEmail}?`}
              </p>
              <div>
                <label className="text-sm font-medium">Ghi chú (tuỳ chọn)</label>
                <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Ghi chú cho khách hàng..." rows={3} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Hủy</Button>
              <Button
                onClick={confirmAction}
                disabled={updateMutation.isPending}
                className={dialogAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {dialogAction === "approve" ? "Duyệt" : "Từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayoutCustom>
  );
}
