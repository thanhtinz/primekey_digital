import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, Package, Tag, Star, Share2, CheckCircle, Flame, Phone, Mail, ArrowLeft, AlertTriangle, Info } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const productId = useMemo(() => parseInt(params.id || "0"), [params.id]);

  const { data: product, isLoading } = trpc.products.getPublic.useQuery(
    { id: productId },
    { enabled: !!productId, staleTime: 60_000 }
  );

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });

  // Kiểm tra flash sale
  const { data: flashSales = [] } = trpc.flashSale.getActive.useQuery(undefined, { staleTime: 30_000 });
  const activeSale = (flashSales as any[]).find((s: any) => s.productId === productId);

  const productPrice = product ? parseFloat(String(product.price)) : 0;
  const salePrice = activeSale ? Math.round(productPrice * (1 - activeSale.discountPercent / 100)) : null;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép link sản phẩm!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-800">Không tìm thấy sản phẩm</h1>
        <p className="text-slate-500">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => setLocation("/")} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> Về trang chủ
        </Button>
      </div>
    );
  }

  const imageUrl = (product as any).imageUrl;
  const notes = (product as any).notes;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ClientHeader maxWidth="max-w-5xl" backLabel="Quay lại" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ảnh sản phẩm */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <Package className="w-24 h-24" />
                  <span className="text-sm">Chưa có ảnh sản phẩm</span>
                </div>
              )}
            </div>
            {activeSale && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Flame className="w-4 h-4" />
                -{activeSale.discountPercent}% Flash Sale
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div className="flex flex-col gap-5">
            {/* Tên và danh mục */}
            <div>
              {product.category && (
                <Badge variant="outline" className="border-blue-200 text-blue-600 mb-2">
                  <Tag className="w-3 h-3 mr-1" />{product.category}
                </Badge>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 leading-tight">{product.name}</h1>
            </div>

            {/* Giá */}
            <div className="flex items-end gap-3 flex-wrap">
              {salePrice ? (
                <>
                  <span className="text-3xl font-bold text-orange-500">{formatCurrency(salePrice)}</span>
                  <span className="text-lg text-slate-500 line-through">{formatCurrency(productPrice)}</span>
                  <Badge className="bg-red-50 text-red-600 border-red-200">
                    Tiết kiệm {formatCurrency(productPrice - salePrice)}
                  </Badge>
                </>
              ) : (
                <span className="text-3xl font-bold text-blue-600">{formatCurrency(productPrice)}</span>
              )}
            </div>

            {/* Lưu ý sản phẩm */}
            {notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-600 mb-1">Lưu ý</p>
                  <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
                </div>
              </div>
            )}

            {/* Chi tiết sản phẩm */}
            {product.description && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-slate-600">Chi tiết sản phẩm</p>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-2 gap-3">
              {product.warrantyMonths != null && product.warrantyMonths > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Bảo hành</p>
                    <p className="text-sm font-medium text-slate-800">{product.warrantyMonths} tháng</p>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Chất lượng</p>
                  <p className="text-sm font-medium text-slate-800">Chính hãng</p>
                </div>
              </div>
            </div>

            {/* Flash Sale countdown */}
            {activeSale && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-500">Flash Sale đang diễn ra!</span>
                </div>
                <p className="text-xs text-slate-500">
                  Kết thúc lúc: {new Date(activeSale.endTime).toLocaleString("vi-VN")}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {(publicInfo as any)?.companyPhone ? (
                <a
                  href={`tel:${(publicInfo as any).companyPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Gọi Đặt Hàng
                </a>
              ) : (
                <Button
                  onClick={() => toast.info("Vui lòng liên hệ qua email hoặc mạng xã hội")}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-xl"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Liên Hệ Mua Hàng
                </Button>
              )}
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {copied ? <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> : <Share2 className="w-5 h-5 mr-2" />}
                {copied ? "Đã sao chép!" : "Chia sẻ"}
              </Button>
            </div>

            {/* Thông tin liên hệ */}
            {((publicInfo as any)?.companyPhone || (publicInfo as any)?.companyEmail) && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Liên hệ tư vấn</p>
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
          </div>
        </div>
      </main>
    </div>
  );
}
