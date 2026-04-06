import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, CheckCircle, Truck, Shield, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
}> = {
  CREATED: { label: "Tạo Đơn", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: Package, step: 1 },
  PAID: { label: "Đã Thanh Toán", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200", icon: CheckCircle, step: 2 },
  SHIPPING: { label: "Đang Giao Hàng", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", icon: Truck, step: 3 },
  WARRANTY: { label: "Bảo Hành", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", icon: Shield, step: 4 },
  FAILED: { label: "Thất Bại", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200", icon: AlertCircle, step: 0 },
  EXPIRED: { label: "Hết Hạn", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", icon: Clock, step: 0 },
};

const STEPS = [
  { key: "CREATED", label: "Tạo Đơn", icon: Package },
  { key: "PAID", label: "Thanh Toán", icon: CheckCircle },
  { key: "SHIPPING", label: "Giao Hàng", icon: Truck },
  { key: "WARRANTY", label: "Bảo Hành", icon: Shield },
];

function formatCurrency(amount: string | number | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") return `$${num.toFixed(2)}`;
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const { data: orders, isLoading, error } = trpc.invoices.getByEmail.useQuery(
    { email: searchEmail },
    {
      enabled: !!searchEmail,
      refetchInterval: 30000, // Poll every 30 seconds for realtime status updates
      refetchIntervalInBackground: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSearchEmail(email.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Trang Chủ</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IP</span>
            </div>
            <span className="text-white font-semibold">Invoice Prime</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4">
            <Search className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tra Cứu Đơn Hàng</h1>
          <p className="text-slate-400">Nhập email để xem trạng thái tất cả đơn hàng của bạn</p>
        </div>

        {/* Search Form */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="email"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11"
                required
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Search className="h-4 w-4 mr-2" />Tra Cứu</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Có lỗi xảy ra. Vui lòng thử lại.</span>
          </div>
        )}

        {searchEmail && !isLoading && orders !== undefined && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-slate-400">Không có đơn hàng nào với email <strong className="text-white">{searchEmail}</strong></p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Tìm thấy <strong className="text-white">{orders.length}</strong> đơn hàng cho <strong className="text-white">{searchEmail}</strong>
                </p>
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status || "CREATED"] || STATUS_CONFIG.CREATED;
                  const StatusIcon = statusCfg.icon;
                  const currentStep = statusCfg.step;

                  return (
                    <Card key={order.id} className="bg-white/5 border-white/10 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                          <div>
                            <h3 className="font-bold text-white text-lg">{order.invoiceNumber}</h3>
                            <p className="text-slate-400 text-sm mt-0.5">
                              Tạo lúc: {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white text-xl">
                              {formatCurrency(order.totalAmount, order.currency || "VND")}
                            </p>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusCfg.bgColor} ${statusCfg.color} border ${statusCfg.borderColor}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </div>
                          </div>
                        </div>

                        {/* Progress Steps */}
                        {currentStep > 0 && (
                          <div className="px-5 py-4">
                            <div className="flex items-center justify-between relative">
                              {/* Progress line */}
                              <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 z-0" />
                              <div
                                className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                              />

                              {STEPS.map((step, i) => {
                                const StepIcon = step.icon;
                                const isCompleted = i + 1 < currentStep;
                                const isCurrent = i + 1 === currentStep;
                                return (
                                  <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                      isCompleted
                                        ? "bg-blue-600 border-blue-600"
                                        : isCurrent
                                        ? "bg-blue-500/20 border-blue-500"
                                        : "bg-white/5 border-white/20"
                                    }`}>
                                      <StepIcon className={`h-4 w-4 ${
                                        isCompleted || isCurrent ? "text-blue-400" : "text-slate-600"
                                      }`} />
                                    </div>
                                    <p className={`text-xs mt-2 font-medium ${
                                      isCompleted || isCurrent ? "text-white" : "text-slate-600"
                                    }`}>
                                      {step.label}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                          <div className="px-5 pb-4">
                            <p className="text-slate-400 text-sm">
                              <span className="text-slate-300 font-medium">Ghi chú: </span>
                              {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Last updated */}
                        <div className="px-5 pb-4">
                          <p className="text-slate-500 text-xs">
                            Cập nhật lần cuối: {formatDate(order.updatedAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
