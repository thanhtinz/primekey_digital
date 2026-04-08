import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { Link } from "wouter";

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function WalletPage() {
  const { customer } = useCustomerAuth();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: transactions, isLoading: txLoading } = trpc.wallet.getTransactions.useQuery(
    { token: localStorage.getItem("customerToken") || "" },
    { enabled: !!customer }
  );

  const topupMutation = trpc.wallet.topup.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success("Yêu cầu nạp tiền đã được ghi nhận. Vui lòng kiểm tra email.");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleTopup = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10,000đ");
      return;
    }
    setIsLoading(true);
    try {
      await topupMutation.mutateAsync({
        token: localStorage.getItem("customerToken") || "",
        amount: amt,
        returnUrl: window.location.origin + "/wallet",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Bạn chưa đăng nhập</p>
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem ví của bạn</p>
          <Link href="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const balance = parseFloat(customer.walletBalance || "0");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <Link href="/account">
            <Button variant="ghost" size="sm">← Tài khoản</Button>
          </Link>
          <h1 className="text-xl font-bold">Ví của tôi</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Số dư hiện tại</span>
            </div>
            <p className="text-3xl font-bold">
              {balance.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-sm opacity-70 mt-1">{customer.email}</p>
          </CardContent>
        </Card>

        {/* Top Up */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4" />
              Nạp tiền vào ví
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === String(amt) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(amt))}
                >
                  {(amt / 1000).toLocaleString("vi-VN")}K
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Nhập số tiền (VNĐ)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={10000}
                step={10000}
              />
              <Button
                onClick={handleTopup}
                disabled={isLoading || topupMutation.isPending || !amount}
                className="shrink-0"
              >
                {isLoading || topupMutation.isPending ? "Đang xử lý..." : "Nạp tiền"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Thanh toán qua PayOS. Số tiền tối thiểu 10,000đ.
            </p>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" />
              Lịch sử giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === "topup" || tx.type === "refund" || tx.type === "reward" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {tx.type === "topup" || tx.type === "refund" || tx.type === "reward" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.type === "topup" ? "Nạp tiền" :
                           tx.type === "payment" ? "Thanh toán đơn hàng" :
                           tx.type === "refund" ? "Hoàn tiền" :
                           tx.type === "reward" ? "Thưởng" :
                           tx.type === "withdrawal" ? "Rút tiền" : tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === "topup" || tx.type === "refund" || tx.type === "reward" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "topup" || tx.type === "refund" || tx.type === "reward" ? "+" : "-"}
                        {parseFloat(tx.amount).toLocaleString("vi-VN")}đ
                      </p>
                      <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                        {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Chờ xử lý" : "Thất bại"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
