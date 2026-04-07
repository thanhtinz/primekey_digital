import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import {
  Star, Shield, Zap, Package, ChevronRight, AlertTriangle,
  ShoppingCart, Heart, MessageSquare, Check, ChevronDown, ChevronUp,
  Share2, CheckCircle, Phone, Mail
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

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: product, isLoading } = trpc.products.getPublicById.useQuery(
    { id: productId },
    { enabled: !!productId, staleTime: 60_000 }
  );

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: reviews = [] } = trpc.reviews.getPublic.useQuery();
  const productReviews = (reviews as any[]).filter(r => r.productId === productId);
  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / productReviews.length
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
    : parseFloat(product.price);
  const maxPrice = packages.length > 0
    ? Math.max(...packages.map((p: any) => parseFloat(p.price)))
    : parseFloat(product.price);
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
                <button onClick={() => setLiked(!liked)} className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
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
                <button onClick={() => setLiked(!liked)} className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
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
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"} ({productReviews.length} đánh giá)
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
              <Zap className="w-4 h-4" /> Giao ngay
            </div>
            {(product.warrantyMonths ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-blue-600 text-sm">
                <Shield className="w-4 h-4" /> BH {product.warrantyMonths} tháng
              </div>
            )}
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
        {productReviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Đánh giá ({productReviews.length})
            </h3>
            <div className="space-y-3">
              {productReviews.slice(0, 3).map((review: any) => (
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
                </div>
              ))}
            </div>
          </div>
        )}
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
          {(publicInfo as any)?.companyPhone ? (
            <a
              href={`tel:${(publicInfo as any).companyPhone}`}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
              Gọi đặt hàng
            </a>
          ) : (
            <button
              onClick={() => toast.info("Vui lòng liên hệ qua email hoặc mạng xã hội")}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              Đặt hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
