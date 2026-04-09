import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { XCircle, ShoppingBag, Wallet, ArrowLeft, RefreshCw } from "@/components/Icon";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function PaymentCancel() {
  const { token } = useCustomerAuth();
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse query params
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") || "order"; // "order" | "wallet"
  const orderCodeStr = params.get("orderCode");
  const orderCode = orderCodeStr ? parseInt(orderCodeStr, 10) : null;

  const cancelOrderMutation = trpc.invoices.cancelByCustomer.useMutation({
    onSuccess: () => setProcessed(true),
    onError: (err) => {
      // If not found or already processed, still show cancel UI
      if (err.data?.code === "NOT_FOUND" || err.message?.includes("NOT_FOUND")) {
        setProcessed(true);
      } else {
        setError(err.message);
        setProcessed(true);
      }
    },
  });

  const cancelTopupMutation = trpc.wallet.cancelTopup.useMutation({
    onSuccess: () => setProcessed(true),
    onError: (err) => {
      if (err.data?.code === "NOT_FOUND" || err.message?.includes("NOT_FOUND")) {
        setProcessed(true);
      } else {
        setError(err.message);
        setProcessed(true);
      }
    },
  });

  useEffect(() => {
    if (!token || !orderCode || processed) return;
    if (type === "wallet") {
      cancelTopupMutation.mutate({ token, orderCode });
    } else {
      cancelOrderMutation.mutate({ token, orderCode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, orderCode, type]);

  const isLoading = cancelOrderMutation.isPending || cancelTopupMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1 flex items-center justify-center px-4 pt-14 pb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
              <p className="text-gray-500 font-medium">Đang cập nhật trạng thái...</p>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {type === "wallet" ? "Nạp tiền thất bại" : "Đã huỷ thanh toán"}
              </h1>

              {/* Description */}
              <p className="text-gray-500 mb-1">
                {type === "wallet"
                  ? "Bạn đã huỷ giao dịch nạp tiền vào ví. Số dư ví của bạn không thay đổi."
                  : "Bạn đã huỷ thanh toán. Đơn hàng đã được chuyển sang trạng thái huỷ."}
              </p>

              {orderCode && (
                <p className="text-xs text-gray-400 mb-6">
                  Mã giao dịch: <span className="font-mono font-semibold">{orderCode}</span>
                </p>
              )}

              {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
                  Lưu ý: {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {type === "wallet" ? (
                  <>
                    <Link href="/wallet">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm">
                        <Wallet className="h-4 w-4" />
                        Thử nạp lại
                      </span>
                    </Link>
                    <Link href="/">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer text-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Về trang chủ
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/track-order">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm">
                        <ShoppingBag className="h-4 w-4" />
                        Xem đơn hàng
                      </span>
                    </Link>
                    <Link href="/">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer text-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Tiếp tục mua sắm
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <ClientFooter />
    </div>
  );
}
