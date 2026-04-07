import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Search, CheckCircle, AlertCircle, Package,
  Calendar, User, Clock, ShieldCheck, ShieldX, ShieldAlert, Phone, FileText, Tag, Info
} from "lucide-react";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";

function WarrantyStatus({ startDate, expiryDate, warrantyMonths }: {
  startDate?: string | null;
  expiryDate?: string | null;
  warrantyMonths?: number | null;
}) {
  if (!startDate && !warrantyMonths) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-slate-500" />
        </div>
        <div>
          <p className="text-slate-800 font-semibold">Không có thông tin bảo hành</p>
          <p className="text-slate-500 text-sm mt-1">Sản phẩm này không được bảo hành hoặc chưa kích hoạt</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const start = startDate ? new Date(startDate) : null;
  const isActive = expiry ? expiry > now : !!start;
  const isExpired = expiry ? expiry <= now : false;

  const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  const daysUsed = start ? Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const statusConfig = isExpired
    ? { color: "red", icon: ShieldX, label: "Bảo Hành Đã Hết Hạn", desc: "Thời gian bảo hành đã kết thúc" }
    : isActive
    ? { color: "blue", icon: ShieldCheck, label: "Đang Trong Thời Hạn Bảo Hành", desc: "Sản phẩm đang được bảo hành" }
    : { color: "slate", icon: Shield, label: "Chưa Kích Hoạt Bảo Hành", desc: "Bảo hành sẽ được kích hoạt khi đơn hàng chuyển trạng thái" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${
        isExpired ? "border-red-200 bg-red-50" : isActive ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-100"
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isExpired ? "bg-red-100" : isActive ? "bg-blue-100" : "bg-slate-100"
        }`}>
          <StatusIcon className={`w-7 h-7 ${
            isExpired ? "text-red-500" : isActive ? "text-blue-500" : "text-slate-500"
          }`} />
        </div>
        <div>
          <p className={`font-bold text-lg ${
            isExpired ? "text-red-600" : isActive ? "text-blue-600" : "text-slate-700"
          }`}>
            {statusConfig.label}
          </p>
          <p className="text-sm text-slate-500">{statusConfig.desc}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        {warrantyMonths && warrantyMonths > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Thời hạn</p>
            <p className="font-bold text-slate-800 text-lg">{warrantyMonths} tháng</p>
          </div>
        )}
        {start && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Ngày bắt đầu</p>
            <p className="font-semibold text-slate-800">{start.toLocaleDateString("vi-VN")}</p>
          </div>
        )}
        {expiry && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Ngày hết hạn</p>
            <p className={`font-semibold ${isExpired ? "text-red-500" : "text-blue-600"}`}>
              {expiry.toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}
        {daysUsed !== null && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Đã sử dụng</p>
            <p className="font-semibold text-slate-800">{daysUsed} ngày</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {start && expiry && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Tiến trình bảo hành</span>
            <span>{isExpired ? "Đã hết hạn" : `Còn ${daysRemaining} ngày`}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            {(() => {
              const total = expiry.getTime() - start.getTime();
              const used = Math.min(now.getTime() - start.getTime(), total);
              const pct = Math.round((used / total) * 100);
              return (
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpired ? "bg-red-500" : pct > 80 ? "bg-gradient-to-r from-orange-400 to-red-400" : "bg-gradient-to-r from-blue-500 to-blue-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Remaining badge */}
      {isActive && daysRemaining !== null && (
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
          daysRemaining <= 30
            ? "bg-orange-100 text-orange-600 border border-orange-200"
            : "bg-blue-100 text-blue-600 border border-blue-200"
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
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const { data: invoice, isLoading, error } = trpc.invoices.lookupByCode.useQuery(
    { code: searchCode },
    { enabled: !!searchCode, retry: false }
  );

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: warrantyPublicSettings } = trpc.warranty.getPublicSettings.useQuery(undefined, { staleTime: 300_000 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearchCode(code.trim().toUpperCase());
  };

  const brandName = publicInfo?.companyName || "Invoice Prime";

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader maxWidth="max-w-4xl" />

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-50 rounded-3xl mb-4 border border-blue-200">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">
            Tra Cứu <span className="text-blue-600">Bảo Hành</span>
          </h1>
          <p className="text-slate-500 text-base">Nhập mã hóa đơn để kiểm tra thông tin bảo hành sản phẩm</p>
        </div>

        {/* Search Form */}
        <Card className="bg-white border-slate-200 mb-8 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Nhập mã hóa đơn (VD: INV-2024-001)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white border-slate-200 text-slate-800 placeholder:text-slate-500 h-12 font-mono text-base"
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 h-12 px-6 text-white"
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

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Không tìm thấy hóa đơn</p>
              <p className="text-sm text-red-500 mt-0.5">Vui lòng kiểm tra lại mã hóa đơn và thử lại.</p>
            </div>
          </div>
        )}

        {/* Result */}
        {invoice && !isLoading && (
          <div className="space-y-4">
            {/* Invoice Info Card */}
            <Card className="bg-white border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg font-mono">{(invoice as any).invoiceNumber}</h3>
                      <p className="text-emerald-600 text-sm font-medium">Tìm thấy hóa đơn</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-2xl">
                      {Number((invoice as any).totalAmount).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-slate-500 text-xs">{(invoice as any).currency || "VND"}</p>
                  </div>
                </div>

                {/* Customer & Date */}
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(invoice as any).customerName && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Khách hàng</p>
                          <p className="text-slate-800 font-medium">{(invoice as any).customerName}</p>
                        </div>
                      </div>
                    )}
                    {(invoice as any).createdAt && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Ngày mua</p>
                          <p className="text-slate-800 font-medium">{new Date((invoice as any).createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  {(invoice as any).items?.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                      <div className="bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5" />
                        Sản Phẩm ({(invoice as any).items.length})
                      </div>
                      {(invoice as any).items.map((item: { name: string; quantity: number; unitPrice: number }, i: number) => (
                        <div key={i} className="px-4 py-3 text-sm border-t border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Tag className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-800 truncate">{item.name}</span>
                            <span className="text-slate-500 flex-shrink-0">× {item.quantity}</span>
                          </div>
                          <span className="text-slate-800 font-medium ml-3 flex-shrink-0">
                            {Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Public note */}
                  {(invoice as any).publicNote && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-xs mb-1.5 text-blue-600 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Ghi chú từ cửa hàng
                      </p>
                      <p className="text-blue-700/80">{(invoice as any).publicNote}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warranty Status Card */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-lg">Thông Tin Bảo Hành</h3>
                </div>
                <WarrantyStatus
                  startDate={(invoice as any).warrantyStartDate}
                  expiryDate={(invoice as any).warrantyExpiryDate}
                  warrantyMonths={(invoice as any).warrantyMonths}
                />
              </CardContent>
            </Card>

            {/* Warranty Terms */}
            {warrantyPublicSettings?.termsAndConditions && (
              <Card className="bg-white border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    Điều Khoản Bảo Hành
                  </h3>
                  <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {warrantyPublicSettings.termsAndConditions}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warranty Contact */}
            {warrantyPublicSettings?.contactInfo && (
              <Card className="bg-white border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    Liên Hệ Bảo Hành
                  </h3>
                  <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {warrantyPublicSettings.contactInfo}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searchCode && !isLoading && (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Nhập mã hóa đơn phía trên để tra cứu thông tin bảo hành</p>
          </div>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}
