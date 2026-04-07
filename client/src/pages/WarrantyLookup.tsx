import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, CheckCircle, AlertCircle, Package, Calendar, User, Clock, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

const statusLabels: Record<string, string> = {
  CREATED: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  SHIPPING: "Đang giao hàng",
  WARRANTY: "Đang bảo hành",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const statusColors: Record<string, string> = {
  WARRANTY: "bg-blue-100 text-blue-700 border-blue-300",
  PAID: "bg-green-100 text-green-700 border-green-300",
  COMPLETED: "bg-gray-100 text-gray-700 border-gray-300",
  SHIPPING: "bg-yellow-100 text-yellow-700 border-yellow-300",
  CREATED: "bg-orange-100 text-orange-700 border-orange-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
  EXPIRED: "bg-red-100 text-red-700 border-red-300",
};

function WarrantyStatus({ startDate, expiryDate, warrantyMonths }: {
  startDate?: string | null;
  expiryDate?: string | null;
  warrantyMonths?: number | null;
}) {
  if (!startDate && !warrantyMonths) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500">
        <ShieldAlert className="w-5 h-5 text-gray-400" />
        <span>Sản phẩm này không có thông tin bảo hành</span>
      </div>
    );
  }

  const now = new Date();
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const start = startDate ? new Date(startDate) : null;
  const isActive = expiry ? expiry > now : !!start;
  const isExpired = expiry ? expiry <= now : false;

  // Days remaining
  const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  const daysUsed = start ? Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${
      isExpired ? "border-red-200 bg-red-50" : isActive ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
    }`}>
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isExpired ? (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-red-500" />
          </div>
        ) : isActive ? (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <div>
          <p className={`font-bold text-base ${isExpired ? "text-red-700" : isActive ? "text-blue-700" : "text-gray-700"}`}>
            {isExpired ? "Bảo Hành Đã Hết Hạn" : isActive ? "Đang Trong Thời Hạn Bảo Hành" : "Chưa Kích Hoạt Bảo Hành"}
          </p>
          {warrantyMonths && warrantyMonths > 0 && (
            <p className="text-sm text-muted-foreground">Thời hạn bảo hành: {warrantyMonths} tháng</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {start && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Ngày bắt đầu bảo hành</p>
            <p className="font-medium">{start.toLocaleDateString("vi-VN")}</p>
          </div>
        )}
        {expiry && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Ngày hết hạn bảo hành</p>
            <p className={`font-medium ${isExpired ? "text-red-600" : "text-blue-600"}`}>
              {expiry.toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {start && expiry && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Đã dùng {daysUsed} ngày</span>
            <span>{isExpired ? "Đã hết hạn" : `Còn ${daysRemaining} ngày`}</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            {(() => {
              const total = expiry.getTime() - start.getTime();
              const used = Math.min(now.getTime() - start.getTime(), total);
              const pct = Math.round((used / total) * 100);
              return (
                <div
                  className={`h-full rounded-full transition-all ${isExpired ? "bg-red-400" : pct > 80 ? "bg-orange-400" : "bg-blue-500"}`}
                  style={{ width: `${pct}%` }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Remaining badge */}
      {isActive && daysRemaining !== null && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
          daysRemaining <= 30 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
        }`}>
          <Clock className="w-4 h-4" />
          {daysRemaining <= 30
            ? `Sắp hết hạn — còn ${daysRemaining} ngày`
            : `Còn ${daysRemaining} ngày bảo hành`}
        </div>
      )}
    </div>
  );
}

export default function WarrantyLookup() {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const { data: invoice, isLoading, error } = trpc.invoices.lookupByCode.useQuery(
    { code: searchCode },
    { enabled: !!searchCode, retry: false }
  );

  const handleSearch = () => {
    if (!code.trim()) return;
    setSearchCode(code.trim().toUpperCase());
  };

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {publicInfo?.companyLogo && (
            <img src={publicInfo.companyLogo} alt="Logo" className="h-8 w-auto object-contain" />
          )}
          <div>
            <h1 className="font-bold text-lg">{publicInfo?.companyName || "Invoice Prime"}</h1>
            <p className="text-xs text-muted-foreground">Tra Cứu Bảo Hành</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-2">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Tra Cứu Bảo Hành</h2>
            <p className="text-muted-foreground text-sm">Nhập mã hóa đơn để kiểm tra thông tin bảo hành sản phẩm</p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã hóa đơn (VD: INV-2024-001)"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="font-mono"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                Đang tra cứu...
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card className="border-red-200">
              <CardContent className="py-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="font-medium text-red-600">Không tìm thấy hóa đơn</p>
                <p className="text-sm text-muted-foreground mt-1">Vui lòng kiểm tra lại mã hóa đơn</p>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {invoice && !isLoading && (
            <div className="space-y-4">
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Tìm thấy hóa đơn
                    </CardTitle>
                    <Badge className={`text-xs border ${statusColors[(invoice as any).status] || "bg-gray-100 text-gray-700"}`}>
                      {statusLabels[(invoice as any).status] || (invoice as any).status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Mã Hóa Đơn</p>
                      <p className="font-mono font-medium">{(invoice as any).invoiceNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Tổng Tiền</p>
                      <p className="font-medium">{Number((invoice as any).totalAmount).toLocaleString("vi-VN")} {(invoice as any).currency}</p>
                    </div>
                  </div>

                  {(invoice as any).customerName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{(invoice as any).customerName}</span>
                    </div>
                  )}

                  {(invoice as any).createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ngày mua: {new Date((invoice as any).createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}

                  {/* Items */}
                  {(invoice as any).items?.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2 text-xs font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" />Sản Phẩm
                      </div>
                      {(invoice as any).items.map((item: { name: string; quantity: number; unitPrice: number }, i: number) => (
                        <div key={i} className="px-3 py-2 text-sm border-t first:border-t-0 flex justify-between">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-medium">{Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Public note */}
                  {(invoice as any).publicNote && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium text-xs mb-1">Ghi chú từ cửa hàng:</p>
                      <p>{(invoice as any).publicNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Warranty Status Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Thông Tin Bảo Hành
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WarrantyStatus
                    startDate={(invoice as any).warrantyStartDate}
                    expiryDate={(invoice as any).warrantyExpiryDate}
                    warrantyMonths={(invoice as any).warrantyMonths}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {publicInfo?.companyName || "Invoice Prime"}
      </footer>
    </div>
  );
}
