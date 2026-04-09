/**
 * WalletPage - Trang nạp tiền và quản lý ví
 * White background, clean design theo ảnh mẫu
 */
import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, QrCode, ChevronRight, Info, Loader2, CheckCircle, History, Shield, Zap, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { toast } from "sonner";
import { Link } from "wouter";

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

const TYPE_LABELS: Record<string, string> = {
  topup: "Nạp tiền",
  spend: "Thanh toán đơn hàng",
  purchase: "Thanh toán đơn hàng",
  refund: "Hoàn tiền",
  reward: "Thưởng / Referral",
  deduct: "Trừ tiền",
};

const TYPE_IS_CREDIT = (type: string) => ["topup", "refund", "reward"].includes(type);

export default function WalletPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "";
  const isLoggedIn = !!token;
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token },
    { enabled: isLoggedIn, staleTime: 30_000 }
  );

  const { data: txData, isLoading: txLoading } = trpc.wallet.getTransactions.useQuery(
    { token, limit: 30 },
    { enabled: isLoggedIn, staleTime: 30_000 }
  );

  const topupMutation = trpc.wallet.topup.useMutation({
    onSuccess: (data: any) => {
      setIsLoading(false);
      const url = data?.paymentUrl || data?.checkoutUrl;
      if (url) {
        setPaymentUrl(url);
        // Navigate directly to avoid popup blocker issues
        window.location.href = url;
      } else {
        toast.success("Yêu cầu nạp tiền đã được ghi nhận.");
      }
    },
    onError: (e: any) => {
      setIsLoading(false);
      toast.error(e.message || "Không thể tạo link thanh toán. Vui lòng thử lại.");
    },
  });

  const handleTopup = () => {
    const amt = parseInt(amount.replace(/\D/g, ""), 10);
    if (!amt || amt < 10_000) {
      toast.error("Số tiền nạp tối thiểu là 10,000đ");
      return;
    }
    if (amt > 50_000_000) {
      toast.error("Số tiền tối đa là 50,000,000đ");
      return;
    }
    setIsLoading(true);
    topupMutation.mutate({
      token,
      amount: amt,
      returnUrl: window.location.origin + "/wallet",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ClientHeader />
        <div className="flex-1 flex items-center justify-center pt-20 px-4">
          <div className="text-center py-16">
            <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập để sử dụng ví</h2>
            <p className="text-gray-500 mb-6">Bạn cần đăng nhập để nạp tiền và xem lịch sử giao dịch</p>
            <Link href="/client-login">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer">
                Đăng nhập ngay
              </span>
            </Link>
          </div>
        </div>
        <ClientFooter />
      </div>
    );
  }

  const transactions = (txData as any) || [];
  const txList = Array.isArray(transactions) ? transactions : (transactions?.items ?? []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">

          {/* Features row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Shield, label: "Bảo mật", desc: "Mã hóa 256-bit" },
              { icon: Zap, label: "Tức thì", desc: "Thanh toán nhanh" },
              { icon: TrendingUp, label: "Ưu đãi", desc: "Không tính thuế" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                <Icon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          {/* Topup Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nạp tiền vào tài khoản</h2>
              <p className="text-sm text-gray-500 mt-0.5">Bạn có thể chọn các phương thức thanh toán khả dụng bên dưới</p>
            </div>

            {/* Method: QR Pay */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <QrCode className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Nạp số dư tự động bằng quét mã QR</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Quét mã QR PAY trên ứng dụng Mobile Banking, phí giao dịch 0%</p>
                </div>
              </div>
            </div>

            {/* Amount input */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">Mở App ngân hàng trên điện thoại, chọn phần QR Pay và nhập số tiền bạn muốn nạp vào khung bên dưới.</p>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      amount === amt.toString()
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {amt >= 1_000_000 ? `${amt / 1_000_000}M` : `${amt / 1_000}K`}
                  </button>
                ))}
              </div>

              {/* Input + Button */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={amount ? parseInt(amount || "0").toLocaleString("vi-VN") : ""}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setAmount(raw);
                    }}
                    placeholder="Nhập số tiền"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">VNĐ</span>
                </div>
                <button
                  onClick={handleTopup}
                  disabled={isLoading || topupMutation.isPending || !amount}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
                >
                  {isLoading || topupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Nạp tiền
                </button>
              </div>

              {/* Payment URL (if created) */}
              {paymentUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Link thanh toán đã được tạo!</p>
                      <p className="text-xs text-green-600 mt-1">Nếu trang thanh toán chưa mở, nhấn nút bên dưới.</p>
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Mở trang thanh toán <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Số dư sẽ được cộng tự động sau khi thanh toán thành công. Tối thiểu 10,000đ, tối đa 50,000,000đ mỗi lần nạp.</span>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Lịch sử giao dịch</h2>
              </div>
              {txList.length > 0 && (
                <span className="text-xs text-gray-400">{txList.length} giao dịch gần nhất</span>
              )}
            </div>

            {txLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 text-gray-300 mx-auto mb-3 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
              </div>
            ) : txList.length === 0 ? (
              <div className="py-12 text-center">
                <History className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">Chưa có giao dịch nào</p>
                <p className="text-gray-400 text-xs mt-1">Nạp tiền để bắt đầu sử dụng ví</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {txList.map((tx: any) => {
                  const isCredit = TYPE_IS_CREDIT(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                        {isCredit
                          ? <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          : <ArrowUpRight className="w-5 h-5 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[tx.type] || tx.type}</p>
                        {tx.description && <p className="text-xs text-gray-400 truncate mt-0.5">{tx.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-red-500"}`}>
                          {isCredit ? "+" : "-"}{parseFloat(tx.amount).toLocaleString("vi-VN")}đ
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          tx.status === "completed" ? "bg-green-100 text-green-700"
                          : tx.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                        }`}>
                          {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Chờ xử lý" : "Thất bại"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
      <ClientFooter />
    </div>
  );
}
