import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Shield, Zap, Package, ChevronRight, AlertTriangle, ShoppingCart, Heart, MessageSquare, Check, ChevronDown, ChevronUp, Share2, CheckCircle, Phone, Mail, Loader2, Info, Pencil } from "@/components/Icon";
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
  const [showFullDesc, setShowFullDesc] = useState(false);
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
        // Redirect to PayOS payment page
        window.location.href = data.paymentUrl;
      } else {
        // PayOS not configured or failed - invoice created, email sent with /pay link
        toast.success(`Đơn hàng ${data.invoiceNumber} đã được tạo! Kiểm tra email để nhận link thanh toán.`);
        setLocation(`/track-order?invoice=${data.invoiceNumber}`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Lỗi khi tạo đơn hàng"),
  });
  const [buyingNow, setBuyingNow] = useState(false);

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

  // Validate custom fields helper
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
      // Use 0 as placeholder - server validates coupon code validity regardless of amount
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
      <div className="min-h-screen pt-14 bg-gray-50">
        <ClientHeader />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-14 bg-gray-50">
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
  const maxPrice = packages.length > 0
    ? Math.max(...packages.map((p: any) => parseFloat(p.price)))
    : parseFloat(product.price || "0");
  const hasMultiPrice = packages.length > 1;

  const displayPrice = selectedPackage ? parseFloat(selectedPackage.price) : minPrice;
  const displayOriginalPrice = selectedPackage?.originalPrice ? parseFloat(selectedPackage.originalPrice) : null;
  const discount = displayOriginalPrice ? getDiscountPercent(displayPrice, displayOriginalPrice) : 0;

  // Build category tags
  const categoryTags: { name: string; icon: string | null }[] = [];
  if (categoryInfo) {
    if (categoryInfo.parentName) {
      categoryTags.push({ name: categoryInfo.parentName, icon: categoryInfo.parentIcon });
    }
    categoryTags.push({ name: categoryInfo.name, icon: categoryInfo.icon });
  } else if (product.category) {
    categoryTags.push({ name: product.category, icon: null });
  }

  return (
    <div className="min-h-screen pt-14 bg-gray-50">
      <ClientHeader />

      {/* ===== HERO SECTION - Gradient background with product image ===== */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto px-4 pt-3 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-3 flex-wrap">
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
            <span className="text-white font-medium truncate max-w-[120px]">{product.name}</span>
          </nav>

          {/* Product image card - desktop shows in left column */}
          <div className="flex justify-center md:hidden">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-[280px] aspect-square flex items-center justify-center p-2">
              {(product as any).imageUrl ? (
                <img
                  src={(product as any).imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRODUCT INFO SECTION ===== */}
      <div className="max-w-6xl mx-auto px-4 -mt-2 relative z-10 pb-8">
        {/* Responsive layout: flex on desktop, block on mobile */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* LEFT: Product image (desktop only) */}
          <div className="hidden md:block flex-shrink-0 w-[320px] sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center">
              {(product as any).imageUrl ? (
                <img
                  src={(product as any).imageUrl}
                  alt={product.name}
                  className="w-full object-contain rounded-xl max-h-[300px]"
                />
              ) : (
                <div className="w-full h-[260px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>
          {/* RIGHT: All product info, order form, reviews */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 pt-5 pb-4">
          {/* Product name + action buttons */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1">{product.name}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Cashback badge */}
              <div className="relative">
                <button onClick={handleShare} className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center group hover:bg-green-100 transition-colors" title="Chia sẻ">
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 text-green-600" />}
                </button>
              </div>
              {/* Wishlist button */}
              <button
                onClick={() => { if (email) toggleWishlist.mutate({ email, productId }); else toast.info("Vui lòng đăng nhập"); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isInWishlist
                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                    : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
                }`}
                title={isInWishlist ? "Bỏ yêu thích" : "Yêu thích"}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? "fill-white" : ""}`} />
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
            </span>
            <span className="text-sm text-gray-400">
              ({(productReviews as any[]).length} đánh giá)
            </span>
          </div>

          {/* Category tags */}
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {categoryTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700"
                >
                  {tag.icon && <CategoryIcon icon={tag.icon} className="text-sm" />}
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Sold count badge + Product tags - same row */}
          {(totalSold > 0 || (productTagList as any[]).length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {totalSold > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
                  <i className="fa-solid fa-fire text-amber-500" /> Đã bán {totalSold}
                </div>
              )}
              {(productTagList as any[]).map((tag: any) => (
                <span key={tag.id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: tag.color || '#3b82f6' }}>
                  {tag.icon && (tag.icon.startsWith("fa-") ? <i className={`${tag.icon}`} /> : <span>{tag.icon}</span>)}
                  {tag.name}
                </span>
              ))}
            </div>
          )}
            </div>

        {/* ===== PACKAGE LIST - Card style matching reference ===== */}
        {packages.length > 0 && (
          <div className="mt-3">
            <div className="space-y-2">
              {packages.map((pkg: any) => {
                const pkgDiscount = getDiscountPercent(pkg.price, pkg.originalPrice);
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                    className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all shadow-sm hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/30"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Package thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {(product as any).imageUrl ? (
                          <img src={(product as any).imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      {/* Package info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{pkg.name}</h4>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {(productTagList as any[]).length > 0
                            ? (productTagList as any[]).map((tag: any) => (
                                <span key={tag.id} className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color || '#3b82f6' }}>
                                  {tag.icon && (tag.icon.startsWith('fa-') ? <i className={tag.icon} /> : <span>{tag.icon}</span>)}
                                  {tag.name}
                                </span>
                              ))
                            : (pkg.warrantyMonths ?? 0) > 0 && (
                                <span className="text-xs text-blue-500 flex items-center gap-0.5">
                                  <Shield className="w-3 h-3" /> BH {pkg.warrantyMonths}T
                                </span>
                              )
                          }
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-red-500 text-base">{formatVND(pkg.price)}</div>
                        {pkg.originalPrice && (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-gray-400 line-through">{formatVND(pkg.originalPrice)}</span>
                            {pkgDiscount > 0 && (
                              <span className="text-xs bg-red-100 text-red-500 px-1 rounded font-medium">-{pkgDiscount}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes / Lưu ý */}
        {(product as any).notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 text-sm mb-1">Lưu ý quan trọng</h4>
                <p className="text-amber-700 text-sm leading-relaxed whitespace-pre-wrap">{(product as any).notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl overflow-hidden mt-3 shadow-sm border border-gray-100">
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
              <div className="px-4 pb-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-3">{product.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Custom Fields moved into right-column order info card */}

        {/* Contact info */}
        {((publicInfo as any)?.companyPhone || (publicInfo as any)?.companyEmail) && (
          <div className="bg-white rounded-2xl p-4 mt-3 shadow-sm border border-gray-100">
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

        {/* Reviews placeholder - moved below order card */}



          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm liên quan</h3>
              <div className="grid grid-cols-2 gap-3">
                {relatedProducts.map((p: any) => (
                  <a
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-2">{p.name}</p>
                      {p.minPrice && (
                        <p className="text-sm font-bold text-red-500">{formatVND(p.minPrice)}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Order Info: custom fields + coupon + payment + notes */}
          {isLoggedIn && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Thông tin đặt hàng
            </h4>
            {/* Custom Fields - merged here */}
            {(customFields as any[]).length > 0 && (
              <div className="space-y-3 pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">Vui lòng điền đầy đủ thông tin đặt hàng bên dưới</p>
                {(customFields as any[]).map((f: any) => (
                  <div key={f.id}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {f.fieldName} <span className="text-red-500">*</span>
                    </label>
                    {f.fieldValue ? (
                      <p className="text-xs text-gray-400 mb-1 italic">Gợi ý: {f.fieldValue}</p>
                    ) : null}
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
              <label className="text-xs text-gray-500 mb-1 block">Mã giảm giá</label>
              {appliedCoupon ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
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
            {/* Payment method selection */}
            {walletBalance > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Phương thức thanh toán</label>
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
                    <span className="text-base">💰</span>
                    <div className="text-left">
                      <p className="font-semibold text-xs">Số dư ví</p>
                      <p className="text-[10px] text-gray-400">{new Intl.NumberFormat('vi-VN').format(walletBalance)}đ</p>
                    </div>
                  </button>
                </div>
                {payWithWallet && taxRate > 0 && (
                  <p className="text-xs text-emerald-600 mt-1.5">✅ Miễn {taxName} khi thanh toán bằng số dư</p>
                )}
              </div>
            )}
            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ghi chú đơn hàng (tùy chọn)</label>
              <textarea
                placeholder="Nhập ghi chú..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Order Summary - Tổng tiền */}
            {(selectedPackage || packages.length === 1) && (() => {
              const basePrice = selectedPackage ? parseFloat(selectedPackage.price) : parseFloat(packages[0]?.price || "0");
              const couponDiscount = appliedCoupon
                ? appliedCoupon.discountType === 'percentage'
                  ? Math.round(basePrice * appliedCoupon.discountValue / 100)
                  : appliedCoupon.discountValue
                : 0;
              const afterCoupon = Math.max(0, basePrice - couponDiscount);
              const taxAmount = (!payWithWallet && taxRate > 0) ? Math.round(afterCoupon * taxRate / 100) : 0;
              const total = afterCoupon + taxAmount;
              return (
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
                    <span className="font-bold text-red-500 text-lg">{formatVND(total)}</span>
                  </div>
                </div>
              );
            })()}
            {/* Action Buttons - inline in card, not fixed/sticky */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  if (!email) { toast.info("Vui lòng đăng nhập để thêm giỏ hàng"); return; }
                  if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
                  if (!validateCustomFields()) return;
                  const pkgId = selectedPackage?.id || packages[0]?.id;
                  if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
                  addToCart.mutate({ email, productId, packageId: pkgId, customFieldValues: getCustomFieldValues() });
                }}
                className="flex items-center justify-center gap-2 flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Giỏ hàng
              </button>
              <button
                disabled={buyNow.isPending}
                onClick={() => {
                  if (!email) { toast.info("Vui lòng đăng nhập để mua hàng"); return; }
                  if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
                  if (!validateCustomFields()) return;
                  const pkgId = selectedPackage?.id || packages[0]?.id;
                  if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
                  buyNow.mutate({
                    email,
                    customerName: customer?.name || undefined,
                    productId,
                    packageId: pkgId,
                    quantity: 1,
                    customFieldValues: getCustomFieldValues(),
                    couponCode: appliedCoupon?.code || couponCode || undefined,
                    notes: notes || undefined,
                    origin: window.location.origin,
                    payWithWallet: payWithWallet || undefined,
                    customerToken: payWithWallet ? (localStorage.getItem("customerToken") || undefined) : undefined,
                  });
                }}
                className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
              >
                {buyNow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {buyNow.isPending ? "Đang xử lý..." : "Mua ngay"}
              </button>
            </div>
            </div>
          )}

          {/* ===== REVIEWS CARD - below order info ===== */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Đánh giá sản phẩm
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{(productReviews as any[]).length} đánh giá</span>
            </div>

            {/* Rating overview - always shown */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-6">
                {/* Big score */}
                <div className="text-center flex-shrink-0">
                  <div className="text-5xl font-bold text-gray-900 leading-none">{avgRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-0.5 mt-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{(productReviews as any[]).length} đánh giá</p>
                </div>
                {/* Progress bars */}
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

              {/* Write review button */}
              {isLoggedIn ? (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Viết đánh giá
                </button>
              ) : (
                <div className="mt-4 text-center py-2">
                  <p className="text-sm text-gray-400">Đăng nhập để viết đánh giá</p>
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
          </div>{/* end reviews card */}

          </div>{/* end right column */}
        </div>{/* end flex row */}
      </div>{/* end max-w-6xl */}
      <ClientFooter />
    </div>
  );
}
