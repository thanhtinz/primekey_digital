import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Input } from "@/components/ui/input";
import {
  Star, Zap, Package, ChevronRight, ShoppingCart, Heart,
  MessageSquare, ChevronDown, ChevronUp, Share2, CheckCircle,
  Phone, Mail, Loader2, Pencil, Home, Layers
} from "@/components/Icon";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const formatVND = (val: string | number | null | undefined) => {
  if (!val) return "0 ₫";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
};

const getDiscountPercent = (price: string | number, originalPrice: string | number | null | undefined) => {
  if (!originalPrice) return 0;
  const p = typeof price === "string" ? parseFloat(price) : price;
  const op = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  if (op <= p) return 0;
  return Math.round((1 - p / op) * 100);
};

function CategoryIcon({ icon, className = "" }: { icon: string | null | undefined; className?: string }) {
  if (!icon) return null;
  // Only render font-awesome icons (fa-), skip emoji/text icons
  if (icon.startsWith("fa-")) return <i className={`fa ${icon} ${className}`} />;
  return null;
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const productId = useMemo(() => parseInt(params.id || "0"), [params.id]);

  const { customer, isLoggedIn } = useCustomerAuth();
  const email = customer?.email || "";
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [customFieldInputs, setCustomFieldInputs] = useState<Record<string, string>>({});
  const [showCustomFieldError, setShowCustomFieldError] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showAffiliatePopup, setShowAffiliatePopup] = useState(false);
  const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);

  const { data: product, isLoading } = trpc.products.getPublicById.useQuery(
    { id: productId },
    { enabled: !!productId, staleTime: 60_000 }
  );
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: taxConfig } = trpc.tax.getPublic.useQuery(undefined, { staleTime: 300_000 });
  const taxRate = taxConfig?.isEnabled ? parseFloat(taxConfig.taxRate || "0") : 0;
  const taxName = taxConfig?.taxName || "VAT";
  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customerToken') || '' : '';
  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token: customerToken },
    { enabled: !!customerToken, staleTime: 30_000 }
  );
  const walletBalance = (walletData as any)?.balance || 0;
  const { data: productReviews = [] } = trpc.products.getReviews.useQuery({ productId }, { enabled: !!productId });
  const { data: customFields = [] } = trpc.products.getCustomFields.useQuery({ productId }, { enabled: !!productId });
  const { data: wishlistItems = [] } = trpc.wishlist.list.useQuery({ email }, { enabled: !!email });
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();
  const referralFeatureEnabled = isFeatureEnabled("referral");
  const couponFeatureEnabled = isFeatureEnabled("coupon");
  const { data: referralSettings } = trpc.referral.getSettings.useQuery(undefined, { staleTime: 300_000, enabled: referralFeatureEnabled });
  const { data: myReferralCode } = trpc.referral.getMyCode.useQuery(
    { email },
    { enabled: !!email && !!referralSettings?.isEnabled && referralFeatureEnabled, staleTime: 300_000 }
  );
  const { data: inventoryCount } = trpc.inventory.countAvailable.useQuery(
    { productId, packageId: selectedPackageId || undefined },
    { enabled: !!productId }
  );
  // Determine if selected package uses warehouse delivery
  // Must be computed after `packages` is available (after product loads)
  // We use a helper to check deliveryType on the currently selected package
  const _selectedPkgForDelivery = (product as any)?.packages?.find((p: any) => p.id === selectedPackageId)
    || ((product as any)?.packages?.length === 1 ? (product as any)?.packages?.[0] : null);
  const isWarehousePackage = _selectedPkgForDelivery?.deliveryType === "warehouse";
  const { data: relatedProducts = [] } = trpc.products.getRelated.useQuery(
    { productId, categoryId: product?.categoryId || undefined, limit: 8 },
    { enabled: !!productId && !!product }
  );
  const { data: productTagList = [] } = trpc.productTags.getForProduct.useQuery(
    { productId },
    { enabled: !!productId, staleTime: 60_000 }
  );
  const isInWishlist = wishlistItems.some((w: any) => w.productId === productId);
  const utils = trpc.useUtils();

  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data: any) => {
      utils.wishlist.list.invalidate({ email });
      toast.success(data?.added ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích");
    },
    onError: (err) => toast.error(err.message),
  });
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate({ email });
      utils.cart.count.invalidate({ email });
      // Custom toast with inventory info
      const count = inventoryCount?.count ?? 0;
      const isWarehouse = isWarehousePackage;
      if (isWarehouse) {
        toast.custom(() => (
          <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-lg min-w-[260px]">
            <i className="fa-solid fa-box text-xl text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Đã thêm vào giỏ hàng!</p>
              {count > 0 && <p className="text-xs text-slate-500">Kho hàng: <strong className="text-emerald-700">{count} sản phẩm</strong></p>}
              {count === 0 && <p className="text-xs text-amber-600">Hết hàng tạm thời</p>}
            </div>
          </div>
        ));
      } else {
        toast.success("Đã thêm vào giỏ hàng!");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const submitReview = trpc.products.submitReview.useMutation({
    onSuccess: () => {
      utils.products.getReviews.invalidate({ productId });
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      toast.success("Đánh giá đã được gửi! Chờ duyệt.");
    },
    onError: (err) => toast.error(err.message),
  });
  const buyNow = trpc.checkout.buyNow.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to PayOS payment page
        window.location.href = data.paymentUrl;
      } else if (data.invoiceId) {
        // Redirect to internal payment page
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo!`);
        setLocation(`/pay/${data.invoiceId}`);
      } else {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo!`);
        setLocation(`/track-order?invoice=${data.invoiceNumber}`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Lỗi khi tạo đơn hàng"),
  });

  const avgRating = (productReviews as any[]).length > 0
    ? (productReviews as any[]).reduce((sum: number, r: any) => sum + r.rating, 0) / (productReviews as any[]).length
    : 0;

  const handleCopyAffiliateLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setAffiliateLinkCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setAffiliateLinkCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Đã sao chép link sản phẩm!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  const validateCustomFields = () => {
    const cf = customFields as any[];
    if (cf.length > 0) {
      const missing = cf.some((f: any) => !customFieldInputs[f.fieldName]?.trim());
      if (missing) { setShowCustomFieldError(true); toast.error("Vui lòng điền đầy đủ thông tin yêu cầu"); return false; }
    }
    setShowCustomFieldError(false);
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const result = await utils.coupon.validate.fetch({ code: couponCode, orderAmount: 0, customerEmail: email });
      if (result && result.valid) {
        setAppliedCoupon(result);
        toast.success("Áp dụng mã giảm giá thành công!");
      } else {
        toast.error((result as any)?.error || "Mã giảm giá không hợp lệ");
      }
    } catch (err: any) {
      toast.error(err.message || "Mã giảm giá không hợp lệ");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const getCustomFieldValues = () => {
    const cf = customFields as any[];
    return cf.length > 0 ? cf.map((f: any) => ({ fieldName: f.fieldName, fieldValue: customFieldInputs[f.fieldName] || "" })) : undefined;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader />
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-10 space-y-4 animate-pulse">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader />
        <div className="text-center py-24">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h2>
          <button onClick={() => setLocation("/catalog")} className="text-blue-600 hover:underline text-sm">← Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  const packages = (product as any).packages || [];
  const selectedPackage = packages.find((p: any) => p.id === selectedPackageId) || null;
  const categoryInfo = (product as any).categoryInfo;
  const totalSold = (product as any).totalSold || 0;

  const minPrice = packages.length > 0
    ? Math.min(...packages.map((p: any) => parseFloat(p.price)))
    : parseFloat(product.price || "0");

  const categoryTags: { name: string; icon: string | null }[] = [];
  if (categoryInfo) {
    if (categoryInfo.parentName) categoryTags.push({ name: categoryInfo.parentName, icon: categoryInfo.parentIcon });
    categoryTags.push({ name: categoryInfo.name, icon: categoryInfo.icon });
  } else if (product.category) {
    categoryTags.push({ name: product.category, icon: null });
  }

  const unitPrice = selectedPackage ? parseFloat(selectedPackage.price) : (packages.length === 1 ? parseFloat(packages[0]?.price || "0") : 0);
  const basePrice = unitPrice * quantity;
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? Math.round(basePrice * appliedCoupon.discountValue / 100)
      : appliedCoupon.discountValue
    : 0;
  const afterCoupon = Math.max(0, basePrice - couponDiscount);
  const taxAmount = (!payWithWallet && taxRate > 0) ? Math.round(afterCoupon * taxRate / 100) : 0;
  const totalPrice = afterCoupon + taxAmount;
  const hasOrderSummary = selectedPackage || packages.length === 1;

  const handleBuyNow = () => {
    if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
    if (!validateCustomFields()) return;
    const pkgId = selectedPackage?.id || packages[0]?.id;
    if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
    buyNow.mutate({
      email,
      customerName: customer?.name || undefined,
      productId,
      packageId: pkgId,
      quantity,
      customFieldValues: getCustomFieldValues(),
      couponCode: appliedCoupon?.code || couponCode || undefined,
      notes: notes || undefined,
      origin: window.location.origin,
      payWithWallet: payWithWallet || undefined,
      customerToken: payWithWallet ? (localStorage.getItem("customerToken") || undefined) : undefined,
    });
  };

  const handleAddToCart = () => {
    if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
    if (!validateCustomFields()) return;
    const pkgId = selectedPackage?.id || packages[0]?.id;
    if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
    addToCart.mutate({ email, productId, packageId: pkgId, customFieldValues: getCustomFieldValues() });
  };

  // ===== ORDER INFO CARD JSX (biến JSX, không phải component, để tránh re-mount khi state thay đổi) =====
  const orderInfoCardJSX = (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Quantity row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">Số lượng</span>
        <div className="flex items-center gap-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-l-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors"
          >−</button>
          <input
            type="number" min="1" value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 h-10 text-center border-t border-b border-gray-200 bg-white font-semibold text-gray-800 focus:outline-none text-sm"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-r-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors"
          >+</button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Custom Fields */}
        {(customFields as any[]).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Vui lòng điền đầy đủ thông tin đặt hàng</p>
            {(customFields as any[]).map((f: any) => (
              <div key={f.id}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {f.fieldName} <span className="text-red-500">*</span>
                </label>
                {f.fieldValue && <p className="text-xs text-gray-400 mb-1 italic">Gợi ý: {f.fieldValue}</p>}
                <Input
                  placeholder={`Nhập ${f.fieldName.toLowerCase()}...`}
                  value={customFieldInputs[f.fieldName] || ""}
                  onChange={(e) => setCustomFieldInputs(prev => ({ ...prev, [f.fieldName]: e.target.value }))}
                  className={`text-sm ${showCustomFieldError && !customFieldInputs[f.fieldName] ? "border-red-400" : ""}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Coupon - only show when feature enabled */}
        {couponFeatureEnabled && <div>
          <button
            onClick={() => setShowCouponInput(!showCouponInput)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <i className="fa fa-tag text-indigo-500" /> Bạn có mã giảm giá?
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCouponInput ? "rotate-180" : ""}`} />
          </button>
          {showCouponInput && (
            <div className="mt-2">
              {appliedCoupon ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 font-medium flex-1">
                    {appliedCoupon.code} — Giảm {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(appliedCoupon.discountValue)}₫`}
                  </span>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs text-red-500">Hủy</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="text-sm h-9"
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyCoupon(); }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="h-9 px-3 text-xs whitespace-nowrap border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Áp dụng"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>}

        {/* Wallet */}
        {walletBalance > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayWithWallet(false)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${!payWithWallet ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}
            >
              <span className="text-base">🏦</span>
              <div className="text-left">
                <p className="font-semibold text-xs">Banking</p>
                <p className="text-[10px] text-gray-400">PayOS / QR</p>
              </div>
            </button>
            <button
              onClick={() => setPayWithWallet(true)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${payWithWallet ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"}`}
            >
              <span className="text-base">💰</span>
              <div className="text-left">
                <p className="font-semibold text-xs">Số dư ví</p>
                <p className="text-[10px] text-gray-400">{new Intl.NumberFormat('vi-VN').format(walletBalance)}đ</p>
              </div>
            </button>
          </div>
        )}

        {/* Notes */}
        <textarea
          placeholder="Ghi chú (tùy chọn)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-blue-400 transition-colors placeholder:text-gray-400"
        />

        {/* Order Summary */}
        {hasOrderSummary && (
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
            {quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Đơn giá × {quantity}</span>
                <span className="text-gray-500">{formatVND(unitPrice)} × {quantity}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tạm tính</span>
              <span className="text-gray-700">{formatVND(basePrice)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Giảm giá</span>
                <span className="text-green-600">-{formatVND(couponDiscount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{taxName} ({taxRate}%)</span>
                <span className="text-gray-700">{formatVND(taxAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
              <span className="font-bold text-gray-800">Tổng cộng</span>
              <span className="font-bold text-red-500 text-lg">{formatVND(totalPrice)}</span>
            </div>
          </div>
        )}

        {/* Stock - warehouse type: show inventory badge like the design */}
        {isWarehousePackage && (
          <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 ${
            (inventoryCount?.count || 0) > 0
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-amber-50 border border-amber-100"
          }`}>
            <i className={`fa-solid fa-box text-lg ${
              (inventoryCount?.count || 0) > 0 ? "text-emerald-600" : "text-amber-600"
            }`} />
            <span className={`text-sm font-semibold ${
              (inventoryCount?.count || 0) > 0 ? "text-emerald-700" : "text-amber-700"
            }`}>
              Kho hàng: <strong>{(inventoryCount?.count || 0) > 0 ? `${inventoryCount?.count} sản phẩm` : "Hết hàng tạm thời"}</strong>
            </span>
          </div>
        )}
        {/* Stock - legacy field: only show if selected package is manual or no package selected */}
        {!isWarehousePackage && (product as any).stock !== undefined && (product as any).stock !== null && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
            <i className="fa-solid fa-box text-lg text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Kho hàng: <strong>{(product as any).stock} sản phẩm</strong></span>
          </div>
        )}

        {/* Action Buttons */}
        {isLoggedIn ? (
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="w-11 h-11 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
            </button>
            <button
              disabled={buyNow.isPending}
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
            >
              {buyNow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {buyNow.isPending ? "Đang xử lý..." : "Đặt hàng ngay"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="w-11 h-11 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <Zap className="w-4 h-4" />
              Đăng nhập để mua
            </button>
          </div>
        )}


      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <ClientHeader />

      {/* ===== HERO SECTION ===== */}
      <div className="bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-400 pt-16 lg:pt-24">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-6">

          {/* Hero: mobile = stacked, desktop = side by side */}
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Image */}
            <div className="w-full md:w-52 md:flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden aspect-video md:aspect-square flex items-center justify-center">
                {(product as any).imageUrl ? (
                  <img src={(product as any).imageUrl} alt={product.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl md:text-2xl font-extrabold leading-snug flex-1 text-white drop-shadow-sm">{product.name}</h1>
                <div className="flex items-start gap-2 flex-shrink-0 pt-1 -mr-1">
                  {referralFeatureEnabled && referralSettings?.isEnabled && (
                    <div className="relative">
                      <button
                        onClick={() => { if (!email) { toast.info("Vui lòng đăng nhập để lấy link giới thiệu"); return; } setShowAffiliatePopup(true); }}
                        className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
                        title="Chia sẻ kiếm tiền"
                      >
                        <i className="fa fa-hand-holding-usd text-white text-base" />
                      </button>
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap shadow-sm">
                        {referralSettings.rewardType === 'percentage' ? `${referralSettings.rewardAmount}%` : '+đ'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-11 h-11 backdrop-blur rounded-2xl flex items-center justify-center transition-all bg-white/20 hover:bg-white/30 relative"
                    title="Chia sẻ sản phẩm"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-300" /> : <Share2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => { if (email) toggleWishlist.mutate({ email, productId }); else toast.info("Vui lòng đăng nhập"); }}
                    className={`w-11 h-11 backdrop-blur rounded-2xl flex items-center justify-center transition-all ${isInWishlist ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist ? "fill-white" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? "fill-amber-300 text-amber-300" : "text-white/40"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-200">{avgRating > 0 ? avgRating.toFixed(1) : "0.0"}</span>
                <span className="text-sm text-white/80">({(productReviews as any[]).length} đánh giá)</span>
                {totalSold > 0 && <span className="text-sm text-white/80">· Đã bán {totalSold}</span>}
              </div>

              {/* Category + product tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {categoryTags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur rounded-xl text-sm font-medium text-white border border-white/20">
                    {tag.icon && tag.icon.startsWith("fa-") && <i className={`fa ${tag.icon}`} />}
                    {tag.name}
                  </span>
                ))}
                {(productTagList as any[]).map((tag: any) => (
                  <span key={tag.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white border border-white/20" style={{ backgroundColor: tag.color ? `${tag.color}99` : 'rgba(255,255,255,0.2)' }}>
                    {tag.icon && tag.icon.startsWith("fa-") && <i className={`fa ${tag.icon}`} />}
                    {tag.name}
                  </span>
                ))}
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-16">
        {/* PC: 2 columns | Mobile: 1 column */}
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ===== LEFT COLUMN ===== */}
          <div className="w-full md:flex-1 min-w-0 space-y-3">

            {/* Package List */}
            {packages.length > 0 && (
              <div className="space-y-2">
                {packages.map((pkg: any) => {
                  const pkgDiscount = getDiscountPercent(pkg.price, pkg.originalPrice);
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                      className={`w-full text-left bg-white rounded-2xl border-2 p-3.5 transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${
                        isSelected ? "border-purple-500 shadow-purple-100" : "border-transparent hover:border-gray-200"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {(product as any).imageUrl ? (
                          <img src={(product as any).imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm leading-snug">{pkg.name}</h4>
                        {/* Product tags */}
                        {(productTagList as any[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(productTagList as any[]).slice(0, 2).map((tag: any) => (
                              <span key={tag.id} className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: tag.color || '#0d9488' }}>
                                {tag.icon && tag.icon.startsWith('fa-') && <i className={`fa ${tag.icon}`} />} {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-purple-600 text-sm whitespace-nowrap">{formatVND(pkg.price)}</div>
                        {pkg.originalPrice && (
                          <div className="text-xs text-gray-400 line-through">{formatVND(pkg.originalPrice)}</div>
                        )}

                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Chi tiết gói - hiển thị description của gói đang chọn */}
            {packages.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  onClick={() => setShowPackageDetails(!showPackageDetails)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide">Chi tiết gói</p>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{selectedPackage?.name || "Chọn gói để xem chi tiết"}</p>
                    </div>
                  </div>
                  {showPackageDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {showPackageDetails && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {selectedPackage?.description ? (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedPackage.description}</p>
                    ) : selectedPackage ? (
                      <p className="text-sm text-gray-400 italic">Gói này không có mô tả chi tiết.</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Vui lòng chọn một gói để xem chi tiết.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Lưu ý sản phẩm - hiển thị notes của sản phẩm */}
            {(product as any).notes && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fa fa-exclamation-circle text-white text-sm" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Lưu ý</p>
                      <p className="text-sm font-semibold text-gray-800">Lưu ý sản phẩm</p>
                    </div>
                  </div>
                  {showNotes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {showNotes && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{(product as any).notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Mô tả sản phẩm */}
            {product.description && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Giới thiệu</p>
                      <p className="text-sm font-semibold text-gray-800">Mô tả sản phẩm</p>
                    </div>
                  </div>
                  {showFullDesc ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {showFullDesc && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}
              </div>
            )}



            {/* Mobile: Order Info Card */}
            <div className="md:hidden">
              {orderInfoCardJSX}
            </div>

            {/* ===== REVIEWS ===== */}
            <div id="reviews-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Đánh giá sản phẩm
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{(productReviews as any[]).length} đánh giá</span>
              </div>

              {/* Rating overview */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-6">
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-bold text-gray-900 leading-none">{avgRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center gap-0.5 mt-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{(productReviews as any[]).length} đánh giá</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const count = (productReviews as any[]).filter((r: any) => r.rating === star).length;
                      const pct = (productReviews as any[]).length > 0 ? (count / (productReviews as any[]).length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 w-3 text-right">{star}</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm text-gray-400 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Viết đánh giá
                  </button>
                ) : (
                  <p className="mt-4 text-center text-sm text-gray-400">
                    <button onClick={() => setLocation("/login")} className="text-blue-500 hover:underline font-medium">Đăng nhập</button> và mua hàng để đánh giá
                  </p>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-sm text-gray-500 mr-2">Điểm:</span>
                    {[1,2,3,4,5].map(i => (
                      <button key={i} onMouseEnter={() => setReviewHover(i)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(i)}>
                        <Star className={`w-8 h-8 transition ${i <= (reviewHover || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Nhận xét của bạn..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={submitReview.isPending}
                      onClick={() => submitReview.mutate({ productId, customerEmail: email, customerName: customer?.name || undefined, rating: reviewRating, comment: reviewComment || undefined })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Gửi đánh giá
                    </button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-500 text-sm rounded-xl">Hủy</button>
                  </div>
                </div>
              )}

              {/* Review list */}
              {(productReviews as any[]).length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {(productReviews as any[]).slice(0, 5).map((review: any) => (
                    <div key={review.id} className="px-5 py-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        {review.avatarUrl ? (
                          <img src={review.avatarUrl} alt={review.customerName || 'K'} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(review.customerName || 'K')[0].toUpperCase()}
                          </div>
                        )}
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm font-semibold text-gray-900 truncate">{review.customerName || 'Khách hàng'}</span>
                              {review.invoiceId && (
                                <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  Đã mua
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                      {/* Admin reply */}
                      {review.adminReply && (
                        <div className="mt-2.5 ml-2 border-l-2 border-blue-200 pl-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-blue-700">Phản hồi từ Shop</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{review.adminReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">Chưa có đánh giá nào cho sản phẩm này</p>
                  <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên đánh giá sản phẩm!</p>
                </div>
              )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Sản phẩm liên quan</h3>
                    <p className="text-xs text-gray-400">Các sản phẩm cùng chuyên mục có thể bạn quan tâm</p>
                  </div>
                  <button onClick={() => setLocation("/catalog")} className="ml-auto text-sm font-semibold text-white bg-[#1e3a5f] px-3 py-1.5 rounded-lg hover:bg-[#162d4a] transition-colors whitespace-nowrap">
                    Xem tất cả →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.slice(0, 4).map((p: any) => {
                    const relAvgRating = p.avgRating || 0;
                    const relTags = (p.tags || []) as any[];
                    return (
                      <a
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col"
                      >
                        {/* Image */}
                        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex-shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {/* Tags overlay */}
                          {relTags.length > 0 && (
                            <div className="absolute top-1.5 left-1.5">
                              <div
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                                style={{ backgroundColor: relTags[0].color || "#3b82f6", color: "#fff" }}
                              >
                                {relTags[0].name}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-2.5 flex flex-col gap-1 flex-1">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</p>
                          <div className="mt-auto">
                            {p.minPrice ? (
                              <p className="text-sm font-bold text-red-500">
                                {p.maxPrice && p.maxPrice > p.minPrice
                                  ? `${formatVND(p.minPrice)} ~ ${formatVND(p.maxPrice)}`
                                  : formatVND(p.minPrice)
                                }
                              </p>
                            ) : (
                              <p className="text-xs font-semibold text-red-500">Liên hệ</p>
                            )}
                            {relAvgRating > 0 && (
                              <div className="flex items-center gap-0.5 text-amber-500 mt-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span className="text-[10px] font-medium">{relAvgRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN (desktop only, sticky) ===== */}
          <div className="hidden md:block w-72 flex-shrink-0 sticky top-24 self-start">
            {orderInfoCardJSX}
          </div>

        </div>
      </div>

      {/* ===== AFFILIATE POPUP ===== */}
      {showAffiliatePopup && referralFeatureEnabled && referralSettings?.isEnabled && (() => {
        const refCode = myReferralCode?.code || "";
        const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${productId}?ref=${refCode}` : "";
        const rewardLabel = referralSettings.rewardType === 'percentage'
          ? `${referralSettings.rewardAmount}%`
          : referralSettings.rewardType === 'fixed'
          ? `${new Intl.NumberFormat('vi-VN').format(parseFloat(referralSettings.rewardAmount || '0'))}đ`
          : `${referralSettings.rewardAmount} điểm`;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAffiliatePopup(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                    <i className="fa fa-hand-holding-usd text-white text-lg" />
                  </div>
                  <span className="text-white font-bold text-lg">Chia sẻ kiếm tiền</span>
                </div>
                <button onClick={() => setShowAffiliatePopup(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <span className="text-white font-bold text-sm">×</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Reward info */}
                <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa fa-gift text-white" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Nhận ngay <span className="text-teal-600 font-bold text-base">{rewardLabel}</span> hoa hồng khi bạn bè mua hàng qua link của bạn!
                  </p>
                </div>

                {/* Estimated commission per package */}
                {packages.length > 0 && referralSettings.rewardType === 'percentage' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <i className="fa fa-calculator text-gray-400" /> Hoa hồng dự kiến
                    </p>
                    <div className="space-y-1.5">
                      {packages.map((pkg: any) => {
                        const commission = Math.round(parseFloat(pkg.price) * parseFloat(referralSettings.rewardAmount || '0') / 100);
                        return (
                          <div key={pkg.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                            <span className="text-sm text-gray-600 truncate flex-1 mr-2">{pkg.name}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xs text-gray-400">{new Intl.NumberFormat('vi-VN').format(parseFloat(pkg.price))}đ</span>
                              <span className="text-gray-300">→</span>
                              <span className="text-sm font-bold text-teal-600">+{new Intl.NumberFormat('vi-VN').format(commission)}đ</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Referral link */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <i className="fa fa-link text-gray-400" /> Link giới thiệu của bạn
                  </p>
                  {refCode ? (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate">
                        {productUrl}
                      </div>
                      <button
                        onClick={() => handleCopyAffiliateLink(productUrl)}
                        className="w-10 h-10 flex-shrink-0 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-colors"
                      >
                        {affiliateLinkCopied ? <CheckCircle className="w-4 h-4" /> : <i className="fa fa-copy text-sm" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Mã giới thiệu đang được tạo...</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">Chia sẻ link này để nhận hoa hồng</p>
                </div>

                {/* Quick share */}
                {refCode && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chia sẻ nhanh</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Facebook', color: 'bg-[#1877f2]', icon: 'fa-brands fa-facebook-f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}` },
                        { label: 'Telegram', color: 'bg-[#2ca5e0]', icon: 'fa-brands fa-telegram', url: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product?.name || '')}` },
                        { label: 'Zalo', color: 'bg-[#0068ff]', icon: 'fa-solid fa-z', url: `https://zalo.me/share/url?url=${encodeURIComponent(productUrl)}` },
                        { label: 'WhatsApp', color: 'bg-[#25d366]', icon: 'fa-brands fa-whatsapp', url: `https://wa.me/?text=${encodeURIComponent((product?.name || '') + ' ' + productUrl)}` },
                        { label: 'X / Twitter', color: 'bg-black', icon: 'fa-brands fa-x-twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product?.name || '')}` },
                      ].map(s => (
                        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                          className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity`}
                          title={s.label}
                        >
                          <i className={`${s.icon} text-white text-sm`} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* View stats */}
                <button
                  onClick={() => { setShowAffiliatePopup(false); setLocation("/my-account?tab=referral"); }}
                  className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white py-3 rounded-xl font-semibold text-sm transition-all"
                >
                  <i className="fa-solid fa-chart-line text-sm" /> Xem thống kê hoa hồng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ClientFooter />
    </div>
  );
}
