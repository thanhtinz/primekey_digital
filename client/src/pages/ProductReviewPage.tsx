import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Star, CheckCircle, AlertCircle, Package, ArrowLeft, Loader2 } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { toast } from "sonner";

export default function ProductReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isLoggedIn && customer?.name && !customerName) {
      setCustomerName(customer.name);
    }
  }, [isLoggedIn, customer?.name]);

  const { data: reviewInfo, isLoading, error } = trpc.products.getByProductToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const submitMutation = trpc.products.submitByProductToken.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
    },
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }
    submitMutation.mutate({
      token: token || "",
      rating,
      comment: comment || undefined,
      customerName: customerName || undefined,
      customerEmail: customer?.email || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientHeader />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !reviewInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientHeader />
        <div className="pt-14 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Link Không Hợp Lệ</h2>
            <p className="text-slate-500 mb-6">Link đánh giá này không tồn tại hoặc đã hết hạn.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Về Trang Chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted || reviewInfo.reviewSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientHeader />
        <div className="pt-14 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Cảm Ơn Bạn!</h2>
            <p className="text-slate-600 mb-2">
              Đánh giá của bạn cho sản phẩm <strong className="text-slate-800">{reviewInfo.productName}</strong> đã được ghi nhận.
            </p>
            <p className="text-slate-500 text-sm mb-8">Chúng tôi sẽ xem xét và hiển thị đánh giá của bạn sớm nhất.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation("/")} variant="outline">
                Về Trang Chủ
              </Button>
              {reviewInfo.productId && (
                <Button onClick={() => setLocation(`/product/${reviewInfo.productId}`)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Xem Sản Phẩm
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />
      <div className="pt-14 pb-10 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Đánh Giá Sản Phẩm</h1>
            <p className="text-slate-500 text-sm">Chia sẻ trải nghiệm của bạn để giúp người mua khác</p>
          </div>

          {/* Product card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex items-center gap-4">
            {reviewInfo.productImageUrl ? (
              <img src={reviewInfo.productImageUrl} alt={reviewInfo.productName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{reviewInfo.productName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Đơn hàng #{reviewInfo.invoiceNumber}</p>
            </div>
          </div>

          {/* Review form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Đánh giá của bạn *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        i <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-slate-500">
                    {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên của bạn</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhận xét</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                rows={4}
                className="resize-none border-slate-200 rounded-xl text-sm focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending || rating === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang gửi...</>
              ) : (
                "Gửi Đánh Giá"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
