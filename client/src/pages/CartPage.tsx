import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Trash2, Minus, Plus, Loader2, Package,
  Tag, Users2, Wallet, CheckCircle, ClipboardList,
  RefreshCw, Receipt, CreditCard, ArrowRight, ArrowLeft, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";

// Progress steps
const STEPS = [
  { label: "GIỎ HÀNG",  icon: ShoppingCart },
  { label: "XÁC NHẬN",  icon: ClipboardList },
  { label: "HOÀN TẤT",  icon: CheckCircle },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone ? "bg-teal-500 border-teal-500" :
                  isActive ? "bg-[#1e3a6e] border-[#1e3a6e]" :
                  "bg-white border-gray-300"
                }`}>
                  <Icon className={`h-5 w-5 ${isDone || isActive ? "text-white" : "text-gray-400"}`} />
                </div>
                <p className={`text-[10px] font-bold mt-2 tracking-wide ${
                  isDone ? "text-teal-500" : isActive ? "text-[#1e3a6e]" : "text-gray-400"
                }`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${isDone ? "bg-teal-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartPage() {
  const { customer } = useCustomerAuth();
  const email = customer?.email || "";
  const [, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [appliedReferral, setAppliedReferral] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notes, setNotes] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [step, setStep] = useState(0); // 0=cart, 1=confirm, 2=done
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);

  const { data: cartItems = [], isLoading } = trpc.cart.list.useQuery(
    { email },
    { enabled: !!email }
  );
  const utils = trpc.useUtils();

  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token: typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "" },
    { enabled: !!customer, staleTime: 30_000 }
  );
  const walletBalance = walletData?.balance || 0;

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate({ email }),
    onError: (err) => toast.error(err.message),
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.list.invalidate({ email }); utils.cart.count.invalidate({ email }); toast.success("Đã xóa khỏi giỏ"); },
    onError: (err) => toast.error(err.message),
  });
  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => { utils.cart.list.invalidate({ email }); utils.cart.count.invalidate({ email }); toast.success("Đã xóa giỏ hàng"); },
    onError: (err) => toast.error(err.message),
  });

  const formatPrice = (price: any) => {
    const num = typeof price === "string" ? parseFloat(price) : (price || 0);
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  const subtotal = useMemo(() => {
    return (cartItems as any[]).reduce((sum, item) => {
      const price = item.package ? parseFloat(item.package.price) : 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const couponDiscount = appliedCoupon
    ? (appliedCoupon.discountType === "percentage"
        ? subtotal * appliedCoupon.discountValue / 100
        : appliedCoupon.discountValue)
    : 0;
  const { data: taxConfig } = trpc.tax.getPublic.useQuery(undefined, { staleTime: 300_000 });
  const taxRate = taxConfig?.isEnabled ? parseFloat(taxConfig.taxRate || "0") : 0;
  const taxName = taxConfig?.taxName || "VAT";
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const taxAmount = payWithWallet ? 0 : Math.round(afterDiscount * taxRate / 100);
  const total = afterDiscount + taxAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await utils.coupon.validate.fetch({ code: couponCode, orderAmount: subtotal, customerEmail: email });
      if (result && result.valid) {
        setAppliedCoupon(result);
        toast.success("Áp dụng mã giảm giá thành công!");
      } else {
        toast.error((result as any)?.error || "Mã giảm giá không hợp lệ");
      }
    } catch (err: any) {
      toast.error(err.message || "Mã giảm giá không hợp lệ");
    }
  };

  const applyReferral = trpc.referral.applyCode.useMutation({
    onSuccess: () => { setAppliedReferral(true); toast.success("Áp dụng mã giới thiệu thành công!"); },
    onError: (err) => toast.error(err.message),
  });

  const cartCheckout = trpc.checkout.cartCheckout.useMutation({
    onSuccess: (data) => {
      setStep(2);
      if (payWithWallet) {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được thanh toán bằng ví!`);
        setTimeout(() => navigate(`/track-order`), 2000);
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo!`);
        setTimeout(() => navigate(`/track-order`), 2000);
      }
    },
    onError: (err: any) => { toast.error(err.message || "Lỗi khi thanh toán"); setCheckingOut(false); setStep(1); },
  });

  const handleCheckout = async () => {
    if ((cartItems as any[]).length === 0) { toast.error("Giỏ hàng trống"); return; }
    setCheckingOut(true);
    try {
      const items = (cartItems as any[]).map((item) => ({
        productId: item.productId,
        packageId: item.packageId,
        name: (item.product?.name || "SP") + (item.package ? ` - ${item.package.name}` : ""),
        quantity: item.quantity,
        unitPrice: item.package ? parseFloat(item.package.price) : 0,
        customFieldValues: item.customFieldValues || undefined,
      }));
      cartCheckout.mutate({
        email,
        customerName: customer?.name || undefined,
        items,
        couponCode: appliedCoupon?.code || undefined,
        referralCode: appliedReferral ? referralCode : undefined,
        notes: notes.trim() || undefined,
        origin: window.location.origin,
        payWithWallet: payWithWallet || undefined,
        customerToken: payWithWallet ? (localStorage.getItem("customerToken") || undefined) : undefined,
      });
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thanh toán");
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-20 pb-6 space-y-4">

        <ProgressBar step={step} />

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : (cartItems as any[]).length === 0 ? (
          /* Empty cart */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1e3a6e] to-teal-500 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-white" />
              </div>
              <span className="absolute top-0 right-0 text-2xl">🎁</span>
              <span className="absolute bottom-0 left-0 text-xl">🏷️</span>
              <span className="absolute top-2 left-0 text-lg">📦</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h3>
            <p className="text-gray-500 text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng để mua sắm</p>
            <button
              onClick={() => navigate("/catalog")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-base bg-gradient-to-r from-[#1e3a6e] to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-teal-200"
            >
              <ShoppingCart className="h-5 w-5" /> Xem sản phẩm
            </button>
          </div>

        ) : step === 0 ? (
          /* ========== STEP 0: GIỎ HÀNG ========== */
          <div className="space-y-4">
            {/* Cart header */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a6e] to-teal-500 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {(cartItems as any[]).length}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Giỏ hàng</h2>
                    <p className="text-xs text-gray-500">{(cartItems as any[]).length} sản phẩm</p>
                  </div>
                </div>
                <button
                  onClick={() => clearCart.mutate({ email })}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa tất cả
                </button>
              </div>
            </div>

            {/* Product list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <ClipboardList className="h-4 w-4 text-[#1e3a6e]" /> Danh sách sản phẩm
              </h3>
              <div className="space-y-3">
                {(cartItems as any[]).map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex gap-3">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product?.name} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="h-7 w-7 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{item.product?.name || "Sản phẩm"}</h4>
                            {item.package && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Package className="h-3 w-3" /> {item.package.name}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem.mutate({ id: item.id })}
                            className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Custom fields - parse JSON string */}
                        {(() => {
                          let fields: Array<{fieldName: string; fieldValue: string}> = [];
                          if (item.customFieldValues) {
                            try {
                              const raw = typeof item.customFieldValues === 'string'
                                ? JSON.parse(item.customFieldValues)
                                : item.customFieldValues;
                              fields = Array.isArray(raw)
                                ? raw
                                : Object.entries(raw).map(([k, v]) => ({ fieldName: k, fieldValue: String(v) }));
                            } catch { fields = []; }
                          }
                          return fields.length > 0 ? (
                            <div className="mt-2 bg-white rounded-lg border border-gray-200 p-2.5">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" /> THÔNG TIN ĐƠN HÀNG
                              </p>
                              {fields.map((f, i) => (
                                <div key={i} className="text-xs text-gray-600">
                                  <span className="text-gray-400">{f.fieldName}:</span> <span className="font-medium">{f.fieldValue}</span>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-red-500 font-bold text-sm">
                            {item.package ? formatPrice(parseFloat(item.package.price) * item.quantity) : "—"}
                          </p>
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                            <button
                              onClick={() => item.quantity > 1 && updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                              className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                              className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#1e3a6e] to-teal-500 px-5 py-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Tóm tắt đơn hàng</h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({(cartItems as any[]).length} sản phẩm)</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedCoupon.code})</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex justify-between items-center mt-2">
                  <span className="font-bold text-gray-900">Tạm tính</span>
                  <span className="font-bold text-[#1e3a6e] text-lg">{formatPrice(afterDiscount)}</span>
                </div>
                <p className="text-xs text-gray-400 text-center">Thuế sẽ được tính ở bước tiếp theo</p>
              </div>
            </div>

            {/* Coupon card - accordion */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => { if (!appliedCoupon) setShowCouponInput(v => !v); }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag className="h-4 w-4 text-orange-500" /> Mã giảm giá
                  {appliedCoupon && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{appliedCoupon.code} ✓</span>}
                </span>
                {appliedCoupon ? (
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={(e) => { e.stopPropagation(); setAppliedCoupon(null); setCouponCode(""); setShowCouponInput(false); }}>Hủy</button>
                ) : (
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showCouponInput ? 'rotate-180' : ''}`} />
                )}
              </button>
              {showCouponInput && !appliedCoupon && (
                <div className="px-5 pb-4 flex gap-2 border-t border-gray-100">
                  <Input placeholder="Nhập mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="text-sm mt-3" autoFocus />
                  <Button size="sm" onClick={handleApplyCoupon} className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap text-white mt-3">Áp dụng</Button>
                </div>
              )}
            </div>

            {/* Referral card - accordion */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => { if (!appliedReferral) setShowReferralInput(v => !v); }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users2 className="h-4 w-4 text-purple-500" /> Mã giới thiệu
                  {appliedReferral && <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{referralCode} ✓</span>}
                </span>
                {appliedReferral ? (
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={(e) => { e.stopPropagation(); setAppliedReferral(false); setReferralCode(""); setShowReferralInput(false); }}>Hủy</button>
                ) : (
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showReferralInput ? 'rotate-180' : ''}`} />
                )}
              </button>
              {showReferralInput && !appliedReferral && (
                <div className="px-5 pb-4 flex gap-2 border-t border-gray-100">
                  <Input placeholder="Nhập mã giới thiệu" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="text-sm mt-3" autoFocus />
                  <Button size="sm" onClick={() => { if (referralCode.trim()) applyReferral.mutate({ code: referralCode, refereeEmail: email }); }} disabled={!referralCode.trim() || applyReferral.isPending} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap text-white mt-3">
                    {applyReferral.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Áp dụng"}
                  </Button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <label className="text-xs font-medium text-gray-500 mb-2 block">Ghi chú đơn hàng (tùy chọn)</label>
              <textarea
                placeholder="Nhập ghi chú..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-gray-800"
              />
            </div>

            {/* Next step button */}
            <button
              onClick={() => setStep(1)}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-teal-200"
            >
              Tiếp tục xác nhận <ArrowRight className="h-5 w-5" />
            </button>

            {/* Refresh */}
            <button
              onClick={() => utils.cart.list.invalidate({ email })}
              className="w-full py-3 rounded-xl text-teal-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors border border-teal-200 bg-white"
            >
              <RefreshCw className="h-4 w-4" /> Cập nhật giá
            </button>
          </div>

        ) : step === 1 ? (
          /* ========== STEP 1: XÁC NHẬN + PHƯƠNG THỨC THANH TOÁN ========== */
          <div className="space-y-4">
            {/* Back button */}
            <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Quay lại giỏ hàng
            </button>

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#1e3a6e] to-teal-500 px-5 py-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Xác nhận đơn hàng</h3>
              </div>
              <div className="p-5">
                {/* Items summary */}
                <div className="space-y-2 mb-4">
                  {(cartItems as any[]).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product?.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                        {item.package && <p className="text-xs text-gray-500">{item.package.name}</p>}
                      </div>
                      <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                        {item.package ? formatPrice(parseFloat(item.package.price) * item.quantity) : "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá ({appliedCoupon.code})</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>{taxName} ({taxRate}%)</span>
                      <span>+{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  {payWithWallet && taxRate > 0 && (
                    <p className="text-xs text-teal-600">✅ Miễn {taxName} khi thanh toán bằng số dư</p>
                  )}
                  <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex justify-between items-center mt-1">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-red-500 text-lg">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <CreditCard className="h-4 w-4 text-[#1e3a6e]" /> Phương thức thanh toán
              </h3>
              <div className="space-y-3">
                {/* Wallet option */}
                <button
                  onClick={() => setPayWithWallet(true)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    payWithWallet ? "border-[#1e3a6e] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a6e] to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">Số dư tài khoản</p>
                    <p className="text-sm font-bold text-[#1e3a6e]">{formatPrice(walletBalance)}</p>
                  </div>
                  {payWithWallet && (
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Banking option */}
                <button
                  onClick={() => setPayWithWallet(false)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    !payWithWallet ? "border-[#1e3a6e] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">🏦</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">Banking / QR Code</p>
                    <p className="text-xs text-gray-500">Thanh toán qua PayOS{taxRate > 0 ? ` (+ ${taxName} ${taxRate}%)` : ""}</p>
                  </div>
                  {!payWithWallet && (
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {payWithWallet && walletBalance < total && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">⚠️ Số dư không đủ. Cần thêm {formatPrice(total - walletBalance)}</p>
              )}
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={checkingOut || (payWithWallet && walletBalance < total)}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : payWithWallet ? <Wallet className="h-5 w-5" /> : <span>🏦</span>}
              {checkingOut ? "Đang xử lý..." : payWithWallet ? `Thanh toán bằng ví (${formatPrice(total)})` : `Thanh toán qua Banking (${formatPrice(total)})`}
            </button>
          </div>

        ) : (
          /* ========== STEP 2: HOÀN TẤT ========== */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
            <p className="text-gray-500 text-sm mb-6">Đơn hàng của bạn đang được xử lý</p>
            <button
              onClick={() => navigate("/track-order")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold bg-gradient-to-r from-[#1e3a6e] to-teal-500 hover:opacity-90 transition-opacity"
            >
              <ClipboardList className="h-5 w-5" /> Xem đơn hàng
            </button>
          </div>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
