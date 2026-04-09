import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const TYPE_LABELS: Record<string, string> = {
  topup: "Nạp tiền",
  spend: "Thanh toán đơn hàng",
  refund: "Hoàn tiền",
  reward: "Thưởng / Referral",
  withdrawal: "Rút tiền",
};

const TYPE_IS_CREDIT = (type: string) => ["topup", "refund", "reward"].includes(type);

export default function WalletPage() {
  const { customer } = useCustomerAuth();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: transactions, isLoading: txLoading, refetch } = trpc.wallet.getTransactions.useQuery(
    { token: localStorage.getItem("customerToken") || "", limit: 50 },
    { enabled: !!customer }
  );

  const topupMutation = trpc.wallet.topup.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success("Yêu cầu nạp tiền đã được ghi nhận. Vui lòng kiểm tra email.");
        refetch();
      }
    },
    onError: (e) => {
      toast.error(e.message || "Không thể tạo link thanh toán. Vui lòng thử lại.");
    },
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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <ClientHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="p-8 text-center bg-[#111] border-[#222] max-w-sm w-full">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <p className="text-lg font-medium mb-2 text-white">Bạn chưa đăng nhập</p>
            <p className="text-gray-400 mb-4 text-sm">Vui lòng đăng nhập để xem ví của bạn</p>
            <Link href="/client-login">
              <Button className="bg-blue-600 hover:bg-blue-700">Đăng nhập</Button>
            </Link>
          </Card>
        </main>
        <ClientFooter />
      </div>
    );
  }

  const balance = parseFloat(customer.walletBalance || "0");

  // Calculate stats from transactions
  const totalTopup = (transactions || []).filter((t: any) => t.type === "topup" && t.status === "completed").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
  const totalSpend = (transactions || []).filter((t: any) => t.type === "spend" && t.status === "completed").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <ClientHeader />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/my-account" className="hover:text-white transition-colors">Tài khoản</Link>
            <span>/</span>
            <span className="text-white">Ví điện tử</span>
          </div>

          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3 opacity-80">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">Số dư ví điện tử</span>
              </div>
              <p className="text-4xl font-bold mb-1">
                {balance.toLocaleString("vi-VN")}<span className="text-2xl ml-1">đ</span>
              </p>
              <p className="text-sm opacity-70">{customer.email}</p>

              {/* Stats row */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-xs opacity-60">Tổng nạp</p>
                  <p className="text-sm font-semibold">+{totalTopup.toLocaleString("vi-VN")}đ</p>
                </div>
                <div>
                  <p className="text-xs opacity-60">Tổng chi</p>
                  <p className="text-sm font-semibold">-{totalSpend.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "Bảo mật", desc: "Mã hóa 256-bit" },
              { icon: Zap, label: "Tức thì", desc: "Thanh toán nhanh" },
              { icon: TrendingUp, label: "Ưu đãi", desc: "Không tính thuế" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-[#111] border border-[#222] rounded-xl p-3 text-center">
                <Icon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-white">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* Top Up */}
          <Card className="bg-[#111] border-[#222]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Plus className="w-4 h-4 text-blue-400" />
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
                    className={amount === String(amt)
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      : "border-[#333] text-gray-300 hover:border-blue-500 hover:text-blue-400 bg-transparent"}
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Hoặc nhập số tiền (VNĐ)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={10000}
                  step={10000}
                  className="bg-[#1a1a1a] border-[#333] text-white placeholder-gray-500"
                />
                <Button
                  onClick={handleTopup}
                  disabled={isLoading || topupMutation.isPending || !amount}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading || topupMutation.isPending ? "Đang xử lý..." : "Nạp tiền"}
                </Button>
              </div>

              {amount && parseInt(amount) >= 10000 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                  <p className="text-blue-300">
                    Bạn sẽ nạp: <strong>{parseInt(amount).toLocaleString("vi-VN")}đ</strong> qua PayOS
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Thanh toán qua PayOS (QR Code / Chuyển khoản ngân hàng). Tối thiểu 10,000đ. Số dư được cộng ngay sau khi thanh toán thành công.
              </p>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-[#111] border-[#222]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Clock className="w-4 h-4 text-blue-400" />
                Lịch sử giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="text-center py-8 text-gray-400">Đang tải...</div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Chưa có giao dịch nào</p>
                  <p className="text-sm mt-1">Nạp tiền để bắt đầu sử dụng ví</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(transactions as any[]).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#333] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${TYPE_IS_CREDIT(tx.type) ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {TYPE_IS_CREDIT(tx.type) ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {TYPE_LABELS[tx.type] || tx.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleString("vi-VN")}
                          </p>
                          {tx.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${TYPE_IS_CREDIT(tx.type) ? "text-green-400" : "text-red-400"}`}>
                          {TYPE_IS_CREDIT(tx.type) ? "+" : "-"}
                          {parseFloat(tx.amount).toLocaleString("vi-VN")}đ
                        </p>
                        <Badge
                          variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                          className={`text-xs mt-1 ${tx.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30" : tx.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                        >
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
      </main>
      <ClientFooter />
    </div>
  );
}
