import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { trpc } from "@/lib/trpc";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { Heart, ShoppingCart, Trash2, Package, Star, ArrowRight, LogIn, Loader2 } from "@/components/Icon";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount: number | string | null | undefined) {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return n.toLocaleString("vi-VN") + "đ";
}

function getLowestPrice(packages: { price: string | number | null }[]) {
  if (!packages || packages.length === 0) return null;
  const prices = packages.map(p => typeof p.price === "string" ? parseFloat(p.price) : (p.price || 0)).filter(p => p > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export default function WishlistPage() {
  const { customer } = useCustomerAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const email = customer?.email ?? "";

  const { data: wishlistItems = [], isLoading } = trpc.wishlist.list.useQuery(
    { email },
    { enabled: !!email }
  );

  const toggleMutation = trpc.wishlist.toggle.useMutation({
    onSuccess: () => {
      utils.wishlist.list.invalidate({ email });
      toast.success("Đã xóa khỏi danh sách yêu thích");
    },
    onError: (err) => toast.error(err.message),
  });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.count.invalidate({ email });
      toast.success("Đã thêm vào giỏ hàng!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRemove = (productId: number) => {
    if (!email) return;
    toggleMutation.mutate({ email, productId });
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <ClientHeader />
        <main className="flex-1 pt-16 lg:pt-24 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
              <Heart className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Danh sách yêu thích</h2>
            <p className="text-slate-500 text-sm mb-6">Đăng nhập để lưu và xem danh sách sản phẩm yêu thích của bạn</p>
            <Button
              onClick={() => navigate("/login")}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập ngay
            </Button>
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ClientHeader />
      <main className="flex-1 pt-16 lg:pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Sản phẩm yêu thích</h1>
                <p className="text-slate-500 text-sm">{wishlistItems.length} sản phẩm đã lưu</p>
              </div>
            </div>
            {wishlistItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/products")}
                className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hidden sm:flex"
              >
                Tiếp tục mua sắm
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-dashed border-red-200 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-red-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có sản phẩm yêu thích</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Nhấn vào biểu tượng trái tim trên sản phẩm để lưu vào danh sách yêu thích
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                <ShoppingCart className="h-4 w-4" />
                Khám phá sản phẩm
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistItems.map((item: any) => {
                const product = item.product;
                if (!product) return null;
                const lowestPrice = getLowestPrice(item.packages || []);
                const packageCount = item.packages?.length || 0;
                const imageUrl = product.imageUrl;
                const defaultPkg = item.packages?.[0];

                return (
                  <div
                    key={item.id}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                  >
                    {/* Product Image */}
                    <div
                      className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/product/${product.slug || product.id}`)}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                      {/* Remove button overlay */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(product.id); }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      {/* Package count badge */}
                      {packageCount > 0 && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-black/60 text-white text-xs backdrop-blur-sm border-0">
                            {packageCount} gói
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3
                        className="font-semibold text-slate-800 text-sm leading-snug mb-1 truncate cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => navigate(`/product/${product.slug || product.id}`)}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-slate-400 text-xs line-clamp-2 mb-3">{product.description}</p>
                      )}

                      {/* Price + Rating row */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {lowestPrice !== null ? (
                            <div>
                              <span className="text-xs text-slate-400">Từ </span>
                              <span className="text-blue-600 font-bold text-base">{formatCurrency(lowestPrice)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Liên hệ</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-slate-500 text-xs">4.9</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-xs h-8"
                          onClick={() => {
                            if (defaultPkg) {
                              addToCart.mutate({ email, productId: product.id, packageId: defaultPkg.id });
                            } else {
                              navigate(`/product/${product.slug || product.id}`);
                            }
                          }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {defaultPkg ? "Thêm giỏ" : "Xem thêm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0 border-red-200 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleRemove(product.id)}
                        >
                          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <ClientFooter />
    </div>
  );
}
