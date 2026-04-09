import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wallet, ArrowDownLeft, ArrowUpRight, Search, Plus, Minus, TrendingUp, Users, RefreshCw } from "@/components/Icon";

const TYPE_LABELS: Record<string, string> = {
  topup: "Nạp tiền",
  spend: "Thanh toán",
  refund: "Hoàn tiền",
  reward: "Thưởng",
  withdrawal: "Rút tiền",
};

const TYPE_IS_CREDIT = (type: string) => ["topup", "refund", "reward"].includes(type);

export default function WalletManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [creditEmail, setCreditEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [showCreditForm, setShowCreditForm] = useState(false);

  const { data: transactions = [], isLoading, refetch } = trpc.wallet.adminList.useQuery(
    { limit: 200, email: searchEmail || undefined },
    { staleTime: 30_000 }
  );

  const creditMutation = trpc.wallet.adminCredit.useMutation({
    onSuccess: (data) => {
      toast.success(`Điều chỉnh thành công. Số dư mới: ${data.newBalance.toLocaleString("vi-VN")}đ`);
      setCreditEmail("");
      setCreditAmount("");
      setCreditDesc("");
      setShowCreditForm(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCredit = () => {
    if (!creditEmail || !creditAmount) {
      toast.error("Vui lòng nhập email và số tiền");
      return;
    }
    const amount = parseFloat(creditAmount);
    if (isNaN(amount)) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    creditMutation.mutate({ customerEmail: creditEmail, amount, description: creditDesc || undefined });
  };

  // Stats
  const totalTopup = (transactions as any[]).filter(t => t.type === "topup" && t.status === "completed").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalRefund = (transactions as any[]).filter(t => t.type === "refund" && t.status === "completed").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalSpend = (transactions as any[]).filter(t => t.type === "spend" && t.status === "completed").reduce((s, t) => s + parseFloat(t.amount), 0);
  const uniqueUsers = new Set((transactions as any[]).map(t => t.customerEmail)).size;

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý ví điện tử</h1>
            <p className="text-muted-foreground text-sm mt-1">Xem lịch sử giao dịch và điều chỉnh số dư khách hàng</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
            </Button>
            <Button size="sm" onClick={() => setShowCreditForm(!showCreditForm)}>
              <Plus className="w-4 h-4 mr-1" /> Điều chỉnh số dư
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng nạp", value: totalTopup, icon: ArrowDownLeft, color: "text-green-600" },
            { label: "Tổng chi", value: totalSpend, icon: ArrowUpRight, color: "text-red-600" },
            { label: "Hoàn tiền", value: totalRefund, icon: RefreshCw, color: "text-blue-600" },
            { label: "Người dùng", value: uniqueUsers, icon: Users, color: "text-purple-600", isCount: true },
          ].map(({ label, value, icon: Icon, color, isCount }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className={`text-xl font-bold ${color}`}>
                  {isCount ? value : `${(value as number).toLocaleString("vi-VN")}đ`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit Form */}
        {showCreditForm && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                Điều chỉnh số dư khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Email khách hàng"
                  value={creditEmail}
                  onChange={(e) => setCreditEmail(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Số tiền (âm để trừ)"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
                <Input
                  placeholder="Ghi chú (tùy chọn)"
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCredit}
                  disabled={creditMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creditMutation.isPending ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreditForm(false)}>Hủy</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nhập số âm (ví dụ: -50000) để trừ tiền. Nhập số dương để cộng tiền.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email khách hàng..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Lịch sử giao dịch ({(transactions as any[]).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : (transactions as any[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Loại</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Số tiền</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Số dư sau</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Mô tả</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions as any[]).map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-xs">{tx.customerEmail}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 rounded-full ${TYPE_IS_CREDIT(tx.type) ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {TYPE_IS_CREDIT(tx.type) ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            </div>
                            <span>{TYPE_LABELS[tx.type] || tx.type}</span>
                          </div>
                        </td>
                        <td className={`p-3 text-right font-semibold ${TYPE_IS_CREDIT(tx.type) ? "text-green-600" : "text-red-600"}`}>
                          {TYPE_IS_CREDIT(tx.type) ? "+" : "-"}{parseFloat(tx.amount).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {tx.balanceAfter ? `${parseFloat(tx.balanceAfter).toLocaleString("vi-VN")}đ` : "-"}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{tx.description || "-"}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Chờ xử lý" : "Thất bại"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
