import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, Loader2, Package, ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useLocation } from "wouter";

export default function WishlistPage() {
  const { customer } = useCustomerAuth();
  const email = customer?.email || "";
  const [, navigate] = useLocation();

  const { data: items = [], isLoading } = trpc.wishlist.list.useQuery(
    { email },
    { enabled: !!email }
  );
  const utils = trpc.useUtils();

  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: () => { utils.wishlist.list.invalidate({ email }); toast.success("Đã cập nhật"); },
    onError: (err) => toast.error(err.message),
  });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { utils.cart.count.invalidate({ email }); toast.success("Đã thêm vào giỏ hàng!"); },
    onError: (err) => toast.error(err.message),
  });

  const formatPrice = (price: any) => {
    const num = typeof price === "string" ? parseFloat(price) : (price || 0);
    return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader backHref="/catalog" backLabel="Xem sản phẩm" title="Yêu Thích" />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Heart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Chưa có sản phẩm yêu thích</p>
            <p className="text-sm mt-1 mb-4">Hãy thêm sản phẩm bạn thích vào danh sách</p>
            <Button onClick={() => navigate("/catalog")} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4" /> Xem sản phẩm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const product = item.product;
              const packages = item.packages || [];
              const minPrice = packages.length > 0 ? Math.min(...packages.map((p: any) => parseFloat(p.price))) : null;
              return (
                <Card key={item.id} className="shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
                  <div className="relative">
                    {product?.imageUrl ? (
                      <img src={product.imageUrl} alt={product?.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-blue-50 flex items-center justify-center">
                        <Package className="h-12 w-12 text-blue-300" />
                      </div>
                    )}
                    <button
                      onClick={() => toggleWishlist.mutate({ email, productId: item.productId })}
                      className="absolute top-2 right-2 h-8 w-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition shadow-sm"
                    >
                      <Heart className="h-4 w-4 fill-red-500" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3
                      className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {product?.name || "Sản phẩm"}
                    </h3>
                    {minPrice !== null && (
                      <p className="text-red-500 font-bold mt-1">{formatPrice(minPrice)}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1"
                        onClick={() => {
                          const defaultPkg = packages[0];
                          if (defaultPkg) {
                            addToCart.mutate({ email, productId: item.productId, packageId: defaultPkg.id });
                          } else {
                            toast.error("Sản phẩm chưa có gói");
                          }
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Thêm giỏ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => toggleWishlist.mutate({ email, productId: item.productId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
