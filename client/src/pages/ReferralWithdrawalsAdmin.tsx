import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Search, Banknote, Wallet } from "lucide-react";

export default function ReferralWithdrawalsAdmin() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);

  const { data: withdrawals = [], refetch } = trpc.referralWithdrawals.list.useQuery(undefined, { staleTime: 0 });

  const updateMutation = trpc.referralWithdrawals.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      setSelectedItem(null);
      setAdminNote("");
      setDialogAction(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = withdrawals.filter((w: any) => {
    const matchSearch = !search || w.customerEmail?.toLowerCase().includes(search.toLowerCase()) || w.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = (item: any, action: "approve" | "reject") => {
    setSelectedItem(item);
    setDialogAction(action);
    setAdminNote("");
  };

  const confirmAction = () => {
    if (!selectedItem || !dialogAction) return;
    updateMutation.mutate({
      id: selectedItem.id,
      status: dialogAction === "approve" ? "completed" : "rejected",
      adminNote,
    });
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
    return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
  };

  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Yêu Cầu Rút Thưởng</h1>
        <Badge variant="outline" className="text-base px-3 py-1">
          {withdrawals.filter((w: any) => w.status === "pending").length} chờ duyệt
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo email, tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="completed">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Yêu Cầu ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Không có yêu cầu rút thưởng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2">Khách hàng</th>
                    <th className="text-left py-3 px-2">Số tiền</th>
                    <th className="text-left py-3 px-2">Hình thức</th>
                    <th className="text-left py-3 px-2">Thông tin nhận</th>
                    <th className="text-left py-3 px-2">Trạng thái</th>
                    <th className="text-left py-3 px-2">Ngày tạo</th>
                    <th className="text-left py-3 px-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w: any) => (
                    <tr key={w.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium">{w.customerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{w.customerEmail}</div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-green-600">
                        {formatAmount(w.amount)}
                      </td>
                      <td className="py-3 px-2">
                        {w.withdrawType === "wallet" ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Wallet className="w-3 h-3" /> Số dư
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Banknote className="w-3 h-3" /> ATM
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {w.withdrawType === "atm" ? (
                          <div className="text-xs">
                            <div>{w.bankName}</div>
                            <div className="font-mono">{w.bankAccount}</div>
                            <div className="text-muted-foreground">{w.bankHolder}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Cộng vào ví</span>
                        )}
                      </td>
                      <td className="py-3 px-2">{statusBadge(w.status)}</td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-2">
                        {w.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleAction(w, "approve")}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleAction(w, "reject")}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Từ chối
                            </Button>
                          </div>
                        )}
                        {w.adminNote && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={w.adminNote}>
                            Ghi chú: {w.adminNote}
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
      <Dialog open={!!selectedItem && !!dialogAction} onOpenChange={() => { setSelectedItem(null); setDialogAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Xác nhận duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="font-medium">{selectedItem.customerName || selectedItem.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <span className="font-semibold text-green-600">{formatAmount(selectedItem.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hình thức:</span>
                  <span>{selectedItem.withdrawType === "wallet" ? "Về số dư" : "Về ATM"}</span>
                </div>
                {selectedItem.withdrawType === "atm" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngân hàng:</span>
                      <span>{selectedItem.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số TK:</span>
                      <span className="font-mono">{selectedItem.bankAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chủ TK:</span>
                      <span>{selectedItem.bankHolder}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ghi chú admin (tuỳ chọn)</label>
                <Textarea
                  placeholder="Nhập ghi chú..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedItem(null); setDialogAction(null); }}>
              Huỷ
            </Button>
            <Button
              onClick={confirmAction}
              disabled={updateMutation.isPending}
              className={dialogAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {updateMutation.isPending ? "Đang xử lý..." : dialogAction === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
