import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Shield, Search, CheckCircle, AlertCircle, Package,
  Calendar, Clock, ShieldCheck, ShieldX, ShieldAlert, Phone, Info,
  ChevronRight, ShoppingBag, Send, ArrowLeft, X
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { toast } from "sonner";

function formatVND(amount: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + " ₫";
}

function formatDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function WarrantyBadge({ startDate, expiryDate }: { startDate?: any; expiryDate?: any }) {
  if (!startDate) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Chưa kích hoạt</span>;
  }
  const now = new Date();
  const expiry = expiryDate ? new Date(expiryDate) : null;
  if (expiry && expiry <= now) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Hết hạn</span>;
  }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Đang bảo hành</span>;
}

function WarrantyProgress({ startDate, expiryDate, warrantyMonths }: { startDate?: any; expiryDate?: any; warrantyMonths?: number }) {
  if (!startDate || !expiryDate) return null;
  const now = new Date();
  const start = new Date(startDate);
  const expiry = new Date(expiryDate);
  const total = expiry.getTime() - start.getTime();
  const used = Math.min(now.getTime() - start.getTime(), total);
  const pct = Math.round((used / total) * 100);
  const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = expiry <= now;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>{warrantyMonths} tháng</span>
        <span>{isExpired ? "Đã hết hạn" : `Còn ${daysRemaining} ngày`}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isExpired ? "bg-red-400" : pct > 80 ? "bg-orange-400" : "bg-emerald-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function WarrantyLookup() {
  const [, setLocation] = useLocation();
  const { customer, token, isLoggedIn, isLoading: authLoading } = useCustomerAuth();
  const [showRequestForm, setShowRequestForm] = useState<any>(null); // product item to request warranty for
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Tra cứu bằng mã hóa đơn (fallback cho chưa login)
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const { data: invoice, isLoading: lookupLoading, error: lookupError } = trpc.invoices.lookupByCode.useQuery(
    { code: searchCode },
    { enabled: !!searchCode && !isLoggedIn, retry: false }
  );

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: warrantySettings } = trpc.warranty.getPublicSettings.useQuery(undefined, { staleTime: 300_000 });

  // Lấy SP đã mua có bảo hành (khi đã login)
  const { data: warrantyProducts = [], isLoading: productsLoading } = trpc.customer.myWarrantyProducts.useQuery(
    { token: token! },
    { enabled: !!token && isLoggedIn, staleTime: 30_000 }
  );

  const submitMutation = trpc.warrantyRequest.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Yêu cầu bảo hành đã được gửi!");
    },
    onError: (e) => toast.error(e.message || "Gửi yêu cầu thất bại"),
  });

  const handleSubmitRequest = () => {
    if (!description.trim() || description.length < 10) {
      toast.error("Vui lòng mô tả chi tiết vấn đề (ít nhất 10 ký tự)");
      return;
    }
    submitMutation.mutate({
      invoiceCode: showRequestForm?.invoiceNumber || "",
      customerEmail: customer?.email || "",
      customerName: customer?.name || "",
      description: `[${showRequestForm?.productName}] ${description}`,
    });
  };

  const brandName = publicInfo?.companyName || "Invoice Prime";

  // Nếu đang loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Nếu chưa login → redirect tới login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientHeader maxWidth="max-w-4xl" />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-50 rounded-3xl mb-4 border border-blue-200">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              Tra Cứu <span className="text-blue-600">Bảo Hành</span>
            </h1>
            <p className="text-slate-500">Đăng nhập để xem sản phẩm đã mua và yêu cầu bảo hành</p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-slate-800 text-lg mb-2">Đăng nhập để tiếp tục</h3>
                <p className="text-slate-500 text-sm mb-6">Bạn cần đăng nhập để xem danh sách sản phẩm đã mua và gửi yêu cầu bảo hành</p>
                <Link href="/client-login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Đăng nhập ngay
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Fallback: tra cứu bằng mã hóa đơn */}
            <div className="mt-6">
              <p className="text-center text-slate-400 text-sm mb-3">Hoặc tra cứu bằng mã hóa đơn</p>
              <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) setSearchCode(code.trim().toUpperCase()); }} className="flex gap-2">
                <Input
                  placeholder="Nhập mã hóa đơn..."
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white border-slate-200 text-slate-800 h-10 font-mono text-sm"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-white" disabled={lookupLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Đã login: hiển thị danh sách SP đã mua có bảo hành =====

  // Form yêu cầu bảo hành cho 1 SP
  if (showRequestForm) {
    if (submitted) {
      return (
        <div className="min-h-screen bg-slate-50">
          <ClientHeader maxWidth="max-w-4xl" />
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">Yêu Cầu Đã Được Gửi!</h1>
            <p className="text-slate-500 mb-2">Chúng tôi đã nhận được yêu cầu bảo hành cho <strong>{showRequestForm.productName}</strong>.</p>
            <p className="text-slate-500 mb-6">Đội ngũ hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
            {warrantySettings?.contactInfo && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
                <p className="text-slate-500 text-sm mb-2">Liên hệ trực tiếp:</p>
                <p className="text-slate-800 text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600" /> {warrantySettings.contactInfo}</p>
              </div>
            )}
            <Button onClick={() => { setShowRequestForm(null); setSubmitted(false); setDescription(""); }} variant="outline" className="border-slate-200 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <ClientHeader maxWidth="max-w-4xl" />
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Back button */}
          <button onClick={() => { setShowRequestForm(null); setDescription(""); }} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          {/* Product info */}
          <Card className="bg-white border-slate-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {showRequestForm.productImage ? (
                  <img src={showRequestForm.productImage} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{showRequestForm.productName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Đơn hàng: {showRequestForm.invoiceNumber}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <WarrantyBadge startDate={showRequestForm.warrantyStartDate} expiryDate={showRequestForm.warrantyExpiryDate} />
                    <span className="text-xs text-slate-400">BH {showRequestForm.warrantyMonths} tháng</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request form */}
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800 text-lg">Yêu Cầu Bảo Hành</h2>
              </div>

              {warrantySettings?.termsAndConditions && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-600 text-xs">{warrantySettings.termsAndConditions}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Khách hàng</p>
                    <p className="text-sm font-medium text-slate-800">{customer?.name || customer?.email}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{customer?.email}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-600 text-sm font-medium">Mô tả vấn đề *</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm này..."
                    className="mt-1.5 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 resize-none"
                    rows={5}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ít nhất 10 ký tự</p>
                </div>

                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitMutation.isPending || description.length < 10}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? "Đang gửi..." : "Gửi Yêu Cầu Bảo Hành"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===== Danh sách SP đã mua có bảo hành =====
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
            Bảo Hành <span className="text-blue-600">Sản Phẩm</span>
          </h1>
          <p className="text-slate-500 text-base">Chọn sản phẩm cần bảo hành và gửi yêu cầu trực tiếp</p>
        </div>

        {/* Loading */}
        {productsLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Đang tải sản phẩm...</p>
          </div>
        ) : (warrantyProducts as any[]).length === 0 ? (
          /* Empty state */
          <Card className="bg-white border-slate-200">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 text-lg mb-2">Chưa có sản phẩm bảo hành</h3>
              <p className="text-slate-500 text-sm mb-6">Bạn chưa có sản phẩm nào được bảo hành. Hãy mua sản phẩm có bảo hành để sử dụng tính năng này.</p>
              <Link href="/catalog">
                <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Xem sản phẩm
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Product list */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">
                <strong className="text-slate-800">{(warrantyProducts as any[]).length}</strong> sản phẩm có bảo hành
              </p>
            </div>

            {(warrantyProducts as any[]).map((item: any) => {
              const now = new Date();
              const expiry = item.warrantyExpiryDate ? new Date(item.warrantyExpiryDate) : null;
              const isExpired = expiry ? expiry <= now : false;
              const isActive = item.warrantyStartDate && !isExpired;

              return (
                <Card key={item.id} className="bg-white border-slate-200 hover:border-slate-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Product image */}
                      {item.productImage ? (
                        <img src={item.productImage} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                          <ShoppingBag className="w-7 h-7 text-slate-300" />
                        </div>
                      )}

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{item.productName}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Đơn: {item.invoiceNumber} | {formatDate(item.paidAt)}</p>
                          </div>
                          <WarrantyBadge startDate={item.warrantyStartDate} expiryDate={item.warrantyExpiryDate} />
                        </div>

                        {/* Warranty info */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {item.warrantyMonths} tháng
                          </span>
                          {item.warrantyStartDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(item.warrantyStartDate)}
                            </span>
                          )}
                          {item.warrantyExpiryDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatDate(item.warrantyExpiryDate)}
                            </span>
                          )}
                        </div>

                        <WarrantyProgress
                          startDate={item.warrantyStartDate}
                          expiryDate={item.warrantyExpiryDate}
                          warrantyMonths={item.warrantyMonths}
                        />

                        {/* Action button */}
                        <div className="mt-3">
                          {isActive ? (
                            <Button
                              size="sm"
                              onClick={() => setShowRequestForm(item)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5"
                            >
                              <Shield className="w-3.5 h-3.5" /> Yêu cầu bảo hành
                            </Button>
                          ) : isExpired ? (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <ShieldX className="w-3.5 h-3.5" /> Bảo hành đã hết hạn
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Chưa kích hoạt bảo hành
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Warranty terms */}
        {warrantySettings?.termsAndConditions && (
          <Card className="bg-white border-slate-200 mt-6">
            <CardContent className="p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-amber-500" /> Điều Khoản Bảo Hành
              </h3>
              <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {warrantySettings.termsAndConditions}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        {warrantySettings?.contactInfo && (
          <Card className="bg-white border-slate-200 mt-3">
            <CardContent className="p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-emerald-500" /> Liên Hệ Bảo Hành
              </h3>
              <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {warrantySettings.contactInfo}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}
