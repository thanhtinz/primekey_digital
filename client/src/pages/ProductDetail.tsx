import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Star, Shield, Zap, Package, ChevronRight, AlertTriangle,
  ShoppingCart, Heart, MessageSquare, Check, ChevronDown, ChevronUp,
  Share2, CheckCircle, Phone, Mail, Loader2, Info
} from "lucide-react";
import { toast } from "sonner";

const formatVND = (val: string | number | null | undefined) => {
  if (!val) return "0 ₫";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
};

const getDiscountPercent = (price: string | number, originalPrice: string | number | null | undefined) => {
  if (!originalPrice) return 0;
  const p = typeof price === "string" ? parseFloat(price) : price;
  const op = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  if (op <= p) return 0;
  return Math.round((1 - p / op) * 100);
};

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

  const { data: product, isLoading } = trpc.products.getPublicById.useQuery(
    { id: productId },
    { enabled: !!productId, staleTime: 60_000 }
  );

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: productReviews = [] } = trpc.products.getReviews.useQuery({ productId }, { enabled: !!productId });
  const { data: customFields = [] } = trpc.products.getCustomFields.useQuery({ productId }, { enabled: !!productId });
  const { data: wishlistItems = [] } = trpc.wishlist.list.useQuery({ email }, { enabled: !!email });
  const isInWishlist = wishlistItems.some((w: any) => w.productId === productId);
  const utils = trpc.useUtils();

  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data: any) => {
      utils.wishlist.list.invalidate({ email });
      toast.success(data?.added ? "\u0110\u00e3 th\u00eam v\u00e0o y\u00eau th\u00edch" : "\u0110\u00e3 b\u1ecf kh\u1ecfi y\u00eau th\u00edch");
    },
    onError: (err) => toast.error(err.message),
  });
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { utils.cart.count.invalidate({ email }); toast.success("\u0110\u00e3 th\u00eam v\u00e0o gi\u1ecf h\u00e0ng!"); },
    onError: (err) => toast.error(err.message),
  });
  const submitReview = trpc.products.submitReview.useMutation({
    onSuccess: () => {
      utils.products.getReviews.invalidate({ productId });
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      toast.success("\u0110\u00e1nh gi\u00e1 \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1eedi! Ch\u1edd duy\u1ec7t.");
    },
    onError: (err) => toast.error(err.message),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader backHref="/catalog" />
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
      <div className="min-h-screen bg-gray-50">
        <ClientHeader backHref="/catalog" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader backHref="/catalog" />

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-3 flex-wrap">
          <button onClick={() => setLocation("/")} className="hover:text-blue-600">Trang chủ</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => setLocation("/catalog")} className="hover:text-blue-600">Sản phẩm</button>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600">{product.category}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium truncate max-w-[120px]">{product.name}</span>
        </nav>

        {/* Hero image with gradient overlay */}
        <div className="relative rounded-2xl overflow-hidden mb-4 shadow-md">
          {(product as any).imageUrl ? (
            <div className="relative">
              <img src={(product as any).imageUrl} alt={product.name} className="w-full aspect-[16/9] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                {product.category && (
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    GIẢM {discount}%
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={handleShare} className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-gray-500" />}
                </button>
                <button onClick={() => { if (email) toggleWishlist.mutate({ email, productId }); else toast.info("Vui l\u00f2ng \u0111\u0103ng nh\u1eadp"); }} className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                  <Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 flex items-center justify-center relative">
              <Package className="w-20 h-20 text-white/60" />
              <div className="absolute top-3 left-3 flex gap-2">
                {product.category && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/30">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={handleShare} className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-300" /> : <Share2 className="w-4 h-4 text-white" />}
                </button>
                <button onClick={() => { if (email) toggleWishlist.mutate({ email, productId }); else toast.info("Vui l\u00f2ng \u0111\u0103ng nh\u1eadp"); }} className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product name + meta */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"} ({(productReviews as any[]).length} \u0111\u00e1nh gi\u00e1)
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
              <Zap className="w-4 h-4" /> Giao ngay
            </div>
            {(() => {
              const maxW = packages.length > 0 ? Math.max(...packages.map((p: any) => p.warrantyMonths || 0)) : 0;
              return maxW > 0 ? (
                <div className="flex items-center gap-1 text-blue-600 text-sm">
                  <Shield className="w-4 h-4" /> BH lên đến {maxW} tháng
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Price display */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-2xl font-bold text-red-500">
              {selectedPackage
                ? formatVND(displayPrice)
                : hasMultiPrice
                  ? `${formatVND(minPrice)} ~ ${formatVND(maxPrice)}`
                  : formatVND(displayPrice)
              }
            </span>
            {displayOriginalPrice && (
              <span className="text-gray-400 text-sm line-through">{formatVND(displayOriginalPrice)}</span>
            )}
            {discount > 0 && (
              <span className="bg-red-100 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
            )}
          </div>
          {!selectedPackage && hasMultiPrice && (
            <p className="text-xs text-gray-500">Chọn gói bên dưới để xem giá cụ thể</p>
          )}
        </div>

        {/* Package selection */}
        {packages.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Chọn gói
            </h3>
            {packages.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sản phẩm này hiện chưa có gói nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {packages.map((pkg: any) => {
                  const pkgDiscount = getDiscountPercent(pkg.price, pkg.originalPrice);
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 text-sm">{pkg.name}</span>
                            {pkg.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                            )}
                            {(pkg.warrantyMonths ?? 0) > 0 && (
                              <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-0.5">
                                <Shield className="w-3 h-3" /> BH {pkg.warrantyMonths} tháng
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="font-bold text-red-500 text-sm">{formatVND(pkg.price)}</div>
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
            )}
          </div>
        )}

        {/* Notes / Lưu ý */}
        {(product as any).notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
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
          <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100">
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

        {/* Custom Fields - User Input Required */}
        {(customFields as any[]).length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Thông tin cần điền
            </h3>
            <p className="text-xs text-gray-400 mb-3">Vui lòng điền đầy đủ thông tin trước khi đặt hàng</p>
            <div className="space-y-3">
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
          </div>
        )}

        {/* Contact info */}
        {((publicInfo as any)?.companyPhone || (publicInfo as any)?.companyEmail) && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
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

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Đánh giá ({(productReviews as any[]).length})
            </h3>
            {isLoggedIn && (
              <Button size="sm" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)} className="text-xs gap-1">
                <MessageSquare className="w-3 h-3" /> Viết đánh giá
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 mr-2">Điểm:</span>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onMouseEnter={() => setReviewHover(i)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(i)}>
                    <Star className={`w-6 h-6 transition ${i <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder="Nhận xét của bạn..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" disabled={submitReview.isPending} onClick={() => submitReview.mutate({ productId, customerEmail: email, customerName: customer?.name || undefined, rating: reviewRating, comment: reviewComment || undefined })} className="bg-blue-600 hover:bg-blue-700 gap-1">
                  {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Gửi đánh giá
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {!isLoggedIn && (productReviews as any[]).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Đăng nhập để viết đánh giá đầu tiên</p>
          )}

          {(productReviews as any[]).length > 0 && (
            <div className="space-y-3">
              {(productReviews as any[]).slice(0, 5).map((review: any) => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {(review.customerName || "K")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{review.customerName || "Khách hàng"}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-xs text-gray-600 ml-9">{review.comment}</p>}
                  <p className="text-[10px] text-gray-400 ml-9 mt-0.5">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 leading-none mb-0.5 truncate">
              {selectedPackage ? selectedPackage.name : hasMultiPrice ? "Chọn gói để đặt hàng" : product.name}
            </p>
            <p className="text-lg font-bold text-red-500 leading-none">
              {selectedPackage
                ? formatVND(selectedPackage.price)
                : hasMultiPrice
                  ? `${formatVND(minPrice)} ~ ${formatVND(maxPrice)}`
                  : formatVND(product.price)
              }
            </p>
          </div>
          <button
            onClick={() => {
              if (!email) { toast.info("Vui lòng đăng nhập để thêm giỏ hàng"); return; }
              if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
              // Validate custom fields
              const cf = customFields as any[];
              if (cf.length > 0) {
                const missing = cf.some((f: any) => !customFieldInputs[f.fieldName]?.trim());
                if (missing) { setShowCustomFieldError(true); toast.error("Vui lòng điền đầy đủ thông tin yêu cầu"); return; }
              }
              setShowCustomFieldError(false);
              const pkgId = selectedPackage?.id || packages[0]?.id;
              if (!pkgId) { toast.error("Sản phẩm chưa có gói"); return; }
              const cfValues = cf.length > 0 ? cf.map((f: any) => ({ fieldName: f.fieldName, fieldValue: customFieldInputs[f.fieldName] || "" })) : undefined;
              addToCart.mutate({ email, productId, packageId: pkgId, customFieldValues: cfValues });
            }}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            Giỏ hàng
          </button>
          <button
            onClick={() => {
              if (!email) { toast.info("Vui lòng đăng nhập để mua hàng"); return; }
              if (!selectedPackage && packages.length > 1) { toast.info("Vui lòng chọn gói"); return; }
              // Validate custom fields
              const cf = customFields as any[];
              if (cf.length > 0) {
                const missing = cf.some((f: any) => !customFieldInputs[f.fieldName]?.trim());
                if (missing) { setShowCustomFieldError(true); toast.error("Vui lòng điền đầy đủ thông tin yêu cầu"); return; }
              }
              setShowCustomFieldError(false);
              toast.info("Chức năng mua ngay sẽ sớm được hoàn thiện");
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
          >
            <Zap className="w-4 h-4" />
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}
