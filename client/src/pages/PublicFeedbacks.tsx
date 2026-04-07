import { trpc } from "@/lib/trpc";
import { Star, MessageSquare, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/ClientHeader";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
        />
      ))}
    </div>
  );
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PublicFeedbacks() {
  const [, setLocation] = useLocation();
  const { data: reviews, isLoading } = trpc.reviews.getPublic.useQuery();

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <ClientHeader maxWidth="max-w-5xl" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-2xl mb-4">
            <MessageSquare className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đánh Giá Khách Hàng</h1>
          <p className="text-slate-400">Những gì khách hàng nói về chúng tôi</p>
        </div>

        {/* Stats */}
        {reviews && reviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-white">{reviews.length}</p>
                <p className="text-slate-400 text-sm mt-1">Đánh Giá</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-yellow-400">{avgRating.toFixed(1)}</p>
                <p className="text-slate-400 text-sm mt-1">Điểm Trung Bình</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {reviews.filter(r => r.rating >= 4).length}
                </p>
                <p className="text-slate-400 text-sm mt-1">Đánh Giá Tốt</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Average Rating Display */}
        {reviews && reviews.length > 0 && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
                  <StarRating rating={Math.round(avgRating)} />
                  <p className="text-slate-400 text-sm mt-1">{reviews.length} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-4">{star}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-sm w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Chưa có đánh giá</h3>
            <p className="text-slate-400">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">{review.customerName || "Khách Hàng"}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{formatDate(review.createdAt)}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-slate-300 text-sm leading-relaxed">"{review.comment}"</p>
                  )}
                  {review.productName && (
                    <p className="text-slate-500 text-xs mt-3 border-t border-white/10 pt-3">
                      Sản phẩm: {review.productName}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
