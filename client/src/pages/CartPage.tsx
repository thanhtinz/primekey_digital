import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Minus, Plus, Loader2, Package, ArrowLeft, Tag, Users2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";

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

  const { data: cartItems = [], isLoading } = trpc.cart.list.useQuery(
    { email },
    { enabled: !!email }
  );
  const utils = trpc.useUtils();

  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token: localStorage.getItem("customerToken") || "" },
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
    return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum: number, item: any) => {
      const price = item.package ? parseFloat(item.package.price) : 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const couponDiscount = appliedCoupon ? (appliedCoupon.discountType === "percentage" ? subtotal * appliedCoupon.discountValue / 100 : appliedCoupon.discountValue) : 0;
  const { data: taxConfig } = trpc.tax.getPublic.useQuery(undefined, { staleTime: 300_000 });
  const taxRate = taxConfig?.isEnabled ? parseFloat(taxConfig.taxRate || "0") : 0;
  const taxName = taxConfig?.taxName || "VAT";
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  // No tax when paying with wallet balance
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
      // NOTE: Do NOT clear cart after checkout - user may want to reorder
      if (payWithWallet) {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được thanh toán bằng ví!`);
        navigate(`/track-order?invoice=${data.invoiceNumber}`);
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo! Kiểm tra email để nhận link thanh toán.`);
        navigate(`/track-order?invoice=${data.invoiceNumber}`);
      }
    },
    onError: (err: any) => { toast.error(err.message || "Lỗi khi thanh toán"); setCheckingOut(false); },
  });

  const handleCheckout = async () => {
    if (cartItems.length === 0) { toast.error("Giỏ hàng trống"); return; }
    setCheckingOut(true);
    try {
      const items = cartItems.map((item: any) => ({
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
    <div className="min-h-screen pt-14 bg-gray-50">
      <ClientHeader />
      <div className="container max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Giỏ hàng trống</p>
            <p className="text-sm mt-1 mb-4">Hãy thêm sản phẩm vào giỏ hàng</p>
            <Button onClick={() => navigate("/catalog")} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4" /> Xem sản phẩm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">{cartItems.length} sản phẩm</h2>
                <Button variant="ghost" size="sm" onClick={() => clearCart.mutate({ email })} className="text-red-500 hover:text-red-700 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa tất cả
                </Button>
              </div>

              {cartItems.map((item: any) => (
                <Card key={item.id} className="shadow-sm border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product?.name} className="h-20 w-20 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.product?.name || "Sản phẩm"}</h3>
                        {item.package && (
                          <p className="text-sm text-blue-600 mt-0.5">Gói: {item.package.name}</p>
                        )}
                        <p className="text-red-500 font-bold mt-1">
                          {item.package ? formatPrice(item.package.price) : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button variant="ghost" size="sm" onClick={() => removeItem.mutate({ id: item.id })} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                          <button
                            onClick={() => item.quantity > 1 && updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              <Card className="shadow-sm border border-gray-100 sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Tóm Tắt Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tạm tính</span>
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
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Tổng cộng</span>
                      <span className="font-bold text-red-500 text-lg">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1.5">
                      <Tag className="h-3 w-3" /> Mã giảm giá
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-sm text-green-700 font-medium">{appliedCoupon.code} ✓</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-700 p-0" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>Hủy</Button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <Input
                          placeholder="Nhập mã"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="text-sm"
                        />
                        <Button size="sm" onClick={handleApplyCoupon} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">Áp dụng</Button>
                      </div>
                    )}
                  </div>

                  {/* Referral code */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1.5">
                      <Users2 className="h-3 w-3" /> Mã giới thiệu
                    </label>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Nhập mã giới thiệu"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="text-sm"
                        disabled={appliedReferral}
                      />
                      {appliedReferral ? (
                        <Button variant="outline" size="sm" onClick={() => { setAppliedReferral(false); setReferralCode(""); }}>Hủy</Button>
                      ) : (
                        <Button size="sm" onClick={() => { if (referralCode.trim()) applyReferral.mutate({ code: referralCode, refereeEmail: email }); }} disabled={!referralCode.trim() || applyReferral.isPending} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                          {applyReferral.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Áp dụng"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ghi chú đơn hàng</label>
                    <textarea
                      placeholder="Nhập ghi chú (tùy chọn)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Payment method selection */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPayWithWallet(false)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
                          !payWithWallet ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-base">🏦</span>
                        <div className="text-left">
                          <p className="font-semibold text-xs">Banking</p>
                          <p className="text-[10px] text-gray-400">PayOS / QR</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPayWithWallet(true)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
                          payWithWallet ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        <div className="text-left">
                          <p className="font-semibold text-xs">Số dư ví</p>
                          <p className="text-[10px] text-gray-400">{formatPrice(walletBalance)}</p>
                        </div>
                      </button>
                    </div>
                    {payWithWallet && walletBalance < total && (
                      <p className="text-red-500 text-xs mt-1.5">⚠️ Số dư không đủ. Cần thêm {formatPrice(total - walletBalance)}</p>
                    )}
                    {payWithWallet && taxRate > 0 && (
                      <p className="text-xs text-emerald-600 mt-1.5">✅ Miễn {taxName} khi thanh toán bằng số dư</p>
                    )}
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={checkingOut || cartItems.length === 0 || (payWithWallet && walletBalance < total)}
                    className={`w-full font-semibold py-5 text-base gap-2 ${payWithWallet ? "bg-blue-600 hover:bg-blue-700" : "bg-red-500 hover:bg-red-600"} text-white`}
                  >
                    {checkingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : payWithWallet ? <Wallet className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                    {payWithWallet ? `Thanh Toán Bằng Ví (${formatPrice(total)})` : `Thanh Toán (${formatPrice(total)})`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <ClientFooter />
    </div>
  );
}
