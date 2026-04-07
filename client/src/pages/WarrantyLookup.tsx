import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Search, CheckCircle, AlertCircle, Package,
  Calendar, User, Clock, ShieldCheck, ShieldX, ShieldAlert, ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

function WarrantyStatus({ startDate, expiryDate, warrantyMonths }: {
  startDate?: string | null;
  expiryDate?: string | null;
  warrantyMonths?: number | null;
}) {
  if (!startDate && !warrantyMonths) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400">
        <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <span>Sản phẩm này không có thông tin bảo hành</span>
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

  return (
    <div className={`rounded-xl border p-4 space-y-4 ${
      isExpired
        ? "border-red-500/30 bg-red-500/5"
        : isActive
        ? "border-blue-500/30 bg-blue-500/5"
        : "border-white/10 bg-white/5"
    }`}>
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isExpired ? (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldX className="w-6 h-6 text-red-400" />
          </div>
        ) : isActive ? (
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div>
          <p className={`font-bold text-base ${isExpired ? "text-red-400" : isActive ? "text-blue-300" : "text-slate-300"}`}>
            {isExpired ? "Bảo Hành Đã Hết Hạn" : isActive ? "Đang Trong Thời Hạn Bảo Hành" : "Chưa Kích Hoạt Bảo Hành"}
          </p>
          {warrantyMonths && warrantyMonths > 0 && (
            <p className="text-sm text-slate-400">Thời hạn bảo hành: {warrantyMonths} tháng</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {start && (
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500">Ngày bắt đầu bảo hành</p>
            <p className="font-medium text-white">{start.toLocaleDateString("vi-VN")}</p>
          </div>
        )}
        {expiry && (
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500">Ngày hết hạn bảo hành</p>
            <p className={`font-medium ${isExpired ? "text-red-400" : "text-blue-300"}`}>
              {expiry.toLocaleDateString("vi-VN")}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {start && expiry && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Đã dùng {daysUsed} ngày</span>
            <span>{isExpired ? "Đã hết hạn" : `Còn ${daysRemaining} ngày`}</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            {(() => {
              const total = expiry.getTime() - start.getTime();
              const used = Math.min(now.getTime() - start.getTime(), total);
              const pct = Math.round((used / total) * 100);
              return (
                <div
                  className={`h-full rounded-full transition-all ${
                    isExpired ? "bg-red-500" : pct > 80 ? "bg-orange-400" : "bg-blue-500"
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
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
          daysRemaining <= 30
            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
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

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearchCode(code.trim().toUpperCase());
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
            {publicInfo?.companyLogo ? (
              <img src={publicInfo.companyLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {publicInfo?.companyName ? publicInfo.companyName.slice(0, 2).toUpperCase() : "IP"}
                </span>
              </div>
            )}
            <span className="text-white font-semibold">{publicInfo?.companyName || "Invoice Prime"}</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tra Cứu Bảo Hành</h1>
          <p className="text-slate-400">Nhập mã hóa đơn để kiểm tra thông tin bảo hành sản phẩm</p>
        </div>

        {/* Search Form */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Nhập mã hóa đơn (VD: INV-2024-001)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-11 font-mono"
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

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã hóa đơn.</span>
          </div>
        )}

        {/* Result */}
        {invoice && !isLoading && (
          <div className="space-y-4">
            {/* Invoice Info Card */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg font-mono">{(invoice as any).invoiceNumber}</h3>
                      <p className="text-slate-400 text-sm">Tìm thấy hóa đơn</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-xl">
                      {Number((invoice as any).totalAmount).toLocaleString("vi-VN")} {(invoice as any).currency}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  {(invoice as any).customerName && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4 flex-shrink-0 text-slate-500" />
                      <span>{(invoice as any).customerName}</span>
                    </div>
                  )}
                  {(invoice as any).createdAt && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4 flex-shrink-0 text-slate-500" />
                      <span>Ngày mua: {new Date((invoice as any).createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}

                  {/* Items */}
                  {(invoice as any).items?.length > 0 && (
                    <div className="border border-white/10 rounded-xl overflow-hidden mt-2">
                      <div className="bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Sản Phẩm
                      </div>
                      {(invoice as any).items.map((item: { name: string; quantity: number; unitPrice: number }, i: number) => (
                        <div key={i} className="px-4 py-2.5 text-sm border-t border-white/10 flex justify-between">
                          <span className="text-slate-300">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-white">{Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Public note */}
                  {(invoice as any).publicNote && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-300">
                      <p className="font-medium text-xs mb-1 text-blue-400">Ghi chú từ cửa hàng:</p>
                      <p>{(invoice as any).publicNote}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warranty Status Card */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">Thông Tin Bảo Hành</h3>
                </div>
                <WarrantyStatus
                  startDate={(invoice as any).warrantyStartDate}
                  expiryDate={(invoice as any).warrantyExpiryDate}
                  warrantyMonths={(invoice as any).warrantyMonths}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!searchCode && !isLoading && (
          <div className="text-center py-10">
            <Shield className="h-14 w-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nhập mã hóa đơn phía trên để tra cứu thông tin bảo hành</p>
          </div>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-slate-600 border-t border-white/5">
        © {new Date().getFullYear()} {publicInfo?.companyName || "Invoice Prime"}
      </footer>
    </div>
  );
}
