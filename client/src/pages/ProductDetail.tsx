import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Zap, Package, ChevronRight, ShoppingCart, Heart, MessageSquare, ChevronDown, ChevronUp, Share2, CheckCircle, Phone, Mail, Loader2, Info, Pencil } from "@/components/Icon";
import { toast } from "sonner";

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
  if (icon.startsWith("fa-")) return <i className={`${icon} ${className}`} />;
  return <span className={className}>{icon}</span>;
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
      toast.success("Đã thêm vào giỏ hàng!");
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
        window.location.href = data.paymentUrl;
      } else {
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo! Kiểm tra email để nhận link thanh toán.`);
        setLocation(`/track-order?invoice=${data.invoiceNumber}`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Lỗi khi tạo đơn hàng"),
  });

  const avgRating = (productReviews as any[]).length > 0
    ? (productReviews as any[]).reduce((sum: number, r: any) => sum + r.rating, 0) / (productReviews as any[]).length
    : 0;

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
      <div className="min-h-screen pt-16 bg-gray-50">
        <ClientHeader />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50">
        <ClientHeader />
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h2>
          <button onClick={() => setLocation("/catalog")} className="text-blue-600 hover:underline text-sm">
            ← Quay lại danh sách
          </button>
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

  const displayPrice = selectedPackage ? parseFloat(selectedPackage.price) : minPrice;
  const displayOriginalPrice = selectedPackage?.originalPrice ? parseFloat(selectedPackage.originalPrice) : null;
  const discount = displayOriginalPrice ? getDiscountPercent(displayPrice, displayOriginalPrice) : 0;

  const categoryTags: { name: string; icon: string | null }[] = [];
  if (categoryInfo) {
    if (categoryInfo.parentName) categoryTags.push({ name: categoryInfo.parentName, icon: categoryInfo.parentIcon });
    categoryTags.push({ name: categoryInfo.name, icon: categoryInfo.icon });
  } else if (product.category) {
    categoryTags.push({ name: product.category, icon: null });
  }

  // Compute order summary
  const basePrice = selectedPackage ? parseFloat(selectedPackage.price) : (packages.length === 1 ? parseFloat(packages[0]?.price || "0") : 0);
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? Math.round(basePrice * appliedCoupon.discountValue / 100)
      : appliedCoupon.discountValue
    : 0;
  const afterCoupon = Math.max(0, basePrice - couponDiscount);
  const taxAmount = (!payWithWallet && taxRate > 0) ? Math.round(afterCoupon * taxRate / 100) : 0;
  const totalPrice = afterCoupon + taxAmount;
  const hasOrderSummary = selectedPackage || packages.length === 1;

  // ===== ORDER INFO CARD (shared between desktop sidebar and mobile bottom) =====
  const OrderInfoCard = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
      {/* Quantity */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block font-medium">Số lượng</label>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1.5">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors font-bold text-lg text-gray-600"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center border-0 bg-transparent font-semibold text-gray-800 focus:outline-none text-base"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors font-bold text-lg text-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Custom Fields */}
      {(customFields as any[]).length > 0 && (
        <div className="space-y-3 pb-3 border-b border-gray-100">
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
                className={`text-sm ${showCustomFieldError && !customFieldInputs[f.fieldName] ? "border-red-400 ring-1 ring-red-200" : ""}`}
              />
              {showCustomFieldError && !customFieldInputs[f.fieldName] && (
                <p className="text-xs text-red-500 mt-0.5">Vui lòng nhập {f.fieldName.toLowerCase()}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Coupon */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block font-medium">Bạn có mã giảm giá?</label>
        {appliedCoupon ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium flex-1">
              {appliedCoupon.code} — Giảm {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(appliedCoupon.discountValue)}₫`}
            </span>
            <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs text-red-500 hover:text-red-700">Hủy</button>
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
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-xs whitespace-nowrap"
              onClick={handleApplyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
            >
              {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Áp dụng"}
            </Button>
          </div>
        )}
      </div>

      {/* Wallet payment */}
      {walletBalance > 0 && (
        <div>
          <label className="text-xs text-gray-500 mb-2 block font-medium">Phương thức thanh toán</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayWithWallet(false)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${!payWithWallet ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              <span className="text-base">🏦</span>
              <div className="text-left">
                <p className="font-semibold text-xs">Banking</p>
                <p className="text-[10px] text-gray-400">PayOS / QR</p>
              </div>
            </button>
            <button
              onClick={() => setPayWithWallet(true)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${payWithWallet ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              <span className="text-base">💰</span>
              <div className="text-left">
                <p className="font-semibold text-xs">Số dư ví</p>
                <p className="text-[10px] text-gray-400">{new Intl.NumberFormat('vi-VN').format(walletBalance)}đ</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Ghi chú (tùy chọn)</label>
        <textarea
          placeholder="Nhập ghi chú..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Order Summary */}
      {hasOrderSummary && (
        <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tạm tính</span>
            <span className="text-gray-700 font-medium">{formatVND(basePrice)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">Giảm giá ({appliedCoupon.code})</span>
              <span className="text-green-600 font-medium">-{formatVND(couponDiscount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{taxName} ({taxRate}%)</span>
              <span className="text-gray-700">{formatVND(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 mt-1">
            <span className="font-bold text-gray-800">Tổng cộng</span>
            <span className="font-bold text-red-500 text-lg">{formatVND(totalPrice)}</span>
          </div>
        </div>
      )}

      {/* Stock */}
      {(product as any).stock !== undefined && (product as any).stock !== null && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <span className="text-green-600 text-sm">🟢</span>
          <span className="text-xs text-green-700 font-medium">Kho hàng: {(product as any).stock} sản phẩm</span>
        </div>
      )}

      {/* Action Buttons */}
      {isLoggedIn ? (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
              if (!validateCustomFields()) return;
              const pkgId = selectedPackage?.id || packages[0]?.id;
              if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
              addToCart.mutate({ email, productId, packageId: pkgId, customFieldValues: getCustomFieldValues() });
            }}
            className="flex items-center justify-center gap-2 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button
            disabled={buyNow.isPending}
            onClick={() => {
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
            }}
            className="flex items-center justify-center gap-2 flex-[3] bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            {buyNow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {buyNow.isPending ? "Đang xử lý..." : "Đăng nhập để mua"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setLocation("/login")}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <Zap className="w-4 h-4" />
          Đăng nhập để mua
        </button>
      )}

      {/* View detail & review */}
      <button
        onClick={() => { const el = document.getElementById('reviews-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 px-4 rounded-xl text-sm hover:bg-gray-50 transition-colors"
      >
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        Xem chi tiết &amp; Đánh giá
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <ClientHeader />

      {/* ===== HERO SECTION ===== */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto px-4 pt-3 pb-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-4 flex-wrap">
            <button onClick={() => setLocation("/")} className="hover:text-white transition-colors">Trang chủ</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setLocation("/catalog")} className="hover:text-white transition-colors">Sản phẩm</button>
            {categoryInfo?.parentName && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/80">{categoryInfo.parentName}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium truncate max-w-[160px]">{product.name}</span>
          </nav>

          {/* Hero content: mobile=stacked, desktop=side-by-side */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">
            {/* Product image - full width on mobile, fixed width on desktop */}
            <div className="w-full md:w-[220px] md:flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full md:aspect-square aspect-video flex items-center justify-center p-2">
                {(product as any).imageUrl ? (
                  <img src={(product as any).imageUrl} alt={product.name} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold leading-tight flex-1">{product.name}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="Chia sẻ"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { if (email) toggleWishlist.mutate({ email, productId }); else toast.info("Vui lòng đăng nhập"); }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isInWishlist ? "bg-red-500 text-white" : "bg-white/20 hover:bg-white/30"}`}
                    title={isInWishlist ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist ? "fill-white" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-white/40"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{avgRating > 0 ? avgRating.toFixed(1) : "0.0"}</span>
                <span className="text-sm text-white/70">({(productReviews as any[]).length} đánh giá)</span>
              </div>

              {/* Category tags */}
              {categoryTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {categoryTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs text-white">
                      {tag.icon && <CategoryIcon icon={tag.icon} className="text-xs" />}
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Product tags */}
              {(productTagList as any[]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(productTagList as any[]).map((tag: any) => (
                    <span key={tag.id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: tag.color || '#3b82f6' }}>
                      {tag.icon && (tag.icon.startsWith("fa-") ? <i className={`${tag.icon}`} /> : <span>{tag.icon}</span>)}
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Short description */}
              {product.description && (
                <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-4 py-5 pb-10">
        {/* Desktop: 2-column layout. Mobile: single column */}
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ===== LEFT COLUMN (main content) ===== */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Package List */}
            {packages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {packages.map((pkg: any) => {
                    const pkgDiscount = getDiscountPercent(pkg.price, pkg.originalPrice);
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                        className={`text-left bg-white rounded-2xl border-2 p-3 transition-all hover:shadow-md flex items-center gap-3 ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/30 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {(product as any).imageUrl ? (
                            <img src={(product as any).imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{pkg.name}</h4>
                          <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1 font-medium">
                            <ShoppingCart className="w-3 h-3" /> Order
                          </p>
                        </div>
                        {/* Price + radio */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-purple-600 text-sm whitespace-nowrap">{formatVND(pkg.price)}</div>
                            {pkg.originalPrice && (
                              <div className="text-xs text-gray-400 line-through">{formatVND(pkg.originalPrice)}</div>
                            )}
                            {pkgDiscount > 0 && (
                              <span className="text-xs bg-red-100 text-red-500 px-1 rounded font-medium">-{pkgDiscount}%</span>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chi tiết gói */}
            {(product as any).notes && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  onClick={() => setShowPackageDetails(!showPackageDetails)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide">Chi tiết gói</p>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{selectedPackage?.name || "Chọn gói để xem chi tiết"}</p>
                    </div>
                  </div>
                  {showPackageDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showPackageDetails && (
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Giới thiệu</p>
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

            {/* Contact info */}
            {((publicInfo as any)?.companyPhone || (publicInfo as any)?.companyEmail) && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Liên hệ tư vấn</p>
                <div className="flex flex-col gap-2">
                  {(publicInfo as any).companyPhone && (
                    <a href={`tel:${(publicInfo as any).companyPhone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500">
                      <Phone className="w-4 h-4" /> {(publicInfo as any).companyPhone}
                    </a>
                  )}
                  {(publicInfo as any).companyEmail && (
                    <a href={`mailto:${(publicInfo as any).companyEmail}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500">
                      <Mail className="w-4 h-4" /> {(publicInfo as any).companyEmail}
                    </a>
                  )}
                </div>
              </div>
            )}


            {/* Mobile: Order Info Card */}
            <div className="md:hidden">
              <OrderInfoCard />
            </div>

            {/* ===== REVIEWS SECTION (full width, below left column) ===== */}
            <div id="reviews-section" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
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
                  <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(star => {
                      const count = (productReviews as any[]).filter((r: any) => r.rating === star).length;
                      const pct = (productReviews as any[]).length > 0 ? (count / (productReviews as any[]).length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-3 text-right">{star}</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm text-gray-500 w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Viết đánh giá
                  </button>
                ) : (
                  <div className="mt-4 text-center py-2">
                    <p className="text-sm text-gray-400">
                      <button onClick={() => setLocation("/login")} className="text-blue-500 hover:underline font-medium">Đăng nhập</button> và mua hàng để đánh giá sản phẩm
                    </p>
                  </div>
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
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={submitReview.isPending}
                      onClick={() => submitReview.mutate({ productId, customerEmail: email, customerName: customer?.name || undefined, rating: reviewRating, comment: reviewComment || undefined })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Gửi đánh giá
                    </button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm rounded-xl transition-colors">Hủy</button>
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
                            <span className="text-sm font-semibold text-gray-900">{review.customerName || 'Khách hàng'}</span>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
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
                <h3 className="text-base font-bold text-gray-900 mb-3">Sản phẩm liên quan</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedProducts.map((p: any) => (
                    <a
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                        {p.minPrice && (
                          <p className="text-sm font-bold text-purple-600">{formatVND(p.minPrice)}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN (sticky order info - desktop only) ===== */}
          <div className="hidden md:block w-[280px] flex-shrink-0 sticky top-24">
            <OrderInfoCard />
          </div>

        </div>
      </div>

      <ClientFooter />
    </div>
  );
}
