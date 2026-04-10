import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Search, Plus, Minus, Edit, Trash2, RefreshCw, ArrowUpRight, ArrowDownLeft } from "@/components/Icon";

type ActionType = "add" | "subtract" | "set" | "reset";

interface Customer {
  id: number;
  email: string;
  name: string;
  walletBalance?: number | null;
}

export default function WalletManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [action, setAction] = useState<ActionType>("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: customers = [], isLoading: loadingCustomers, refetch: refetchCustomers } = trpc.customers.adminSearch.useQuery(
    { search: searchEmail },
    { staleTime: 30_000, enabled: !!searchEmail }
  );

  const creditMutation = trpc.wallet.adminCredit.useMutation({
    onSuccess: (data) => {
      toast.success(`Thành công! Số dư mới: ${Number(data.newBalance).toLocaleString("vi-VN")}đ`);
      setAmount("");
      setNote("");
      setShowDialog(false);
      setSelectedCustomer(null);
      refetchCustomers();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSearch = () => {
    setSearchEmail(searchInput);
  };

  const openAction = (customer: Customer, actionType: ActionType) => {
    setSelectedCustomer(customer);
    setAction(actionType);
    setAmount("");
    setNote("");
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!selectedCustomer) return;
    const numAmount = parseFloat(amount);

    if (action !== "reset" && (isNaN(numAmount) || numAmount < 0)) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    let finalAmount = numAmount;
    let type: "topup" | "spend" | "reward" = "topup";

    if (action === "subtract") {
      finalAmount = -numAmount;
      type = "spend";
    } else if (action === "set") {
      const currentBalance = Number(selectedCustomer.walletBalance ?? 0);
      finalAmount = numAmount - currentBalance;
      type = finalAmount >= 0 ? "topup" : "spend";
    } else if (action === "reset") {
      const currentBalance = Number(selectedCustomer.walletBalance ?? 0);
      finalAmount = -currentBalance;
      type = "spend";
    } else {
      type = "reward";
    }

    creditMutation.mutate({
      customerEmail: selectedCustomer.email,
      amount: finalAmount,
      description: note || getActionLabel(action),
    });
  };

  const getActionLabel = (a: ActionType) => {
    switch (a) {
      case "add": return "Cộng số dư";
      case "subtract": return "Trừ số dư";
      case "set": return "Đặt số dư";
      case "reset": return "Xóa số dư";
    }
  };

  const getActionColor = (a: ActionType) => {
    switch (a) {
      case "add": return "text-green-600";
      case "subtract": return "text-red-600";
      case "set": return "text-blue-600";
      case "reset": return "text-orange-600";
    }
  };

  const getActionIcon = (a: ActionType) => {
    switch (a) {
      case "add": return <Plus className="w-4 h-4" />;
      case "subtract": return <Minus className="w-4 h-4" />;
      case "set": return <Edit className="w-4 h-4" />;
      case "reset": return <Trash2 className="w-4 h-4" />;
    }
  };

  const customerList = customers as unknown as Customer[];

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="ak-page-header">
          <h1 className="ak-page-title">Quản Lý Ví</h1>
          <p className="ak-page-subtitle">Điều chỉnh số dư ví của khách hàng</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Tìm khách hàng theo email hoặc tên..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchInput.trim()}>
                <Search className="w-4 h-4 mr-1" /> Tìm
              </Button>
              {searchEmail && (
                <Button variant="outline" onClick={() => { setSearchEmail(""); setSearchInput(""); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searchEmail && (
          <div className="space-y-2">
            {loadingCustomers ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Đang tìm kiếm...</div>
            ) : customerList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy khách hàng nào</div>
            ) : (
              customerList.map(customer => (
                <Card key={customer.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{customer.name || "Chưa đặt tên"}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-primary">
                          {Number(customer.walletBalance ?? 0).toLocaleString("vi-VN")}đ
                        </p>
                        <p className="text-xs text-muted-foreground">Số dư hiện tại</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => openAction(customer, "add")}
                          title="Cộng tiền"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => openAction(customer, "subtract")}
                          title="Trừ tiền"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => openAction(customer, "set")}
                          title="Đặt số dư"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => {
                            if (confirm("Xóa toàn bộ số dư của " + customer.email + "?")) {
                              openAction(customer, "reset");
                            }
                          }}
                          title="Xóa số dư"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {!searchEmail && (
          <div className="text-center py-16 text-muted-foreground">
            <Wallet className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Tìm khách hàng để điều chỉnh số dư</p>
            <p className="text-sm mt-1">Nhập email hoặc tên để bắt đầu</p>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setSelectedCustomer(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={"flex items-center gap-2 " + getActionColor(action)}>
              {getActionIcon(action)}
              {getActionLabel(action)}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedCustomer.name || selectedCustomer.email}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Số dư: {Number(selectedCustomer.walletBalance ?? 0).toLocaleString("vi-VN")}đ
                  </Badge>
                </div>
              </div>

              {action !== "reset" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {action === "set" ? "Số dư mới (VNĐ)" : "Số tiền (VNĐ)"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Nhập số tiền..."
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                  />
                  {action === "set" && amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {parseFloat(amount) >= Number(selectedCustomer.walletBalance ?? 0)
                        ? <span className="text-green-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> +{(parseFloat(amount) - Number(selectedCustomer.walletBalance ?? 0)).toLocaleString("vi-VN")}đ</span>
                        : <span className="text-red-600 flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" /> -{(Number(selectedCustomer.walletBalance ?? 0) - parseFloat(amount)).toLocaleString("vi-VN")}đ</span>
                      }
                    </p>
                  )}
                </div>
              )}

              {action === "reset" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  Thao tác này sẽ xóa toàn bộ <strong>{Number(selectedCustomer.walletBalance ?? 0).toLocaleString("vi-VN")}đ</strong> trong ví của khách hàng.
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ghi chú (tùy chọn)</label>
                <Input
                  placeholder="Lý do điều chỉnh..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setSelectedCustomer(null); }}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={creditMutation.isPending || (action !== "reset" && !amount)}
            >
              {creditMutation.isPending ? "Đang xử lý..." : getActionLabel(action)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
