import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Star, CheckCircle, AlertCircle, Package, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Tự điền tên từ session khi đã đăng nhập
  useEffect(() => {
    if (isLoggedIn && customer?.name && !customerName) {
      setCustomerName(customer.name);
    }
  }, [isLoggedIn, customer?.name]);

  const { data: reviewInfo, isLoading, error } = trpc.reviews.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const submitMutation = trpc.reviews.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    submitMutation.mutate({
      token: token || "",
      rating,
      comment: comment || undefined,
      customerName: customerName || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !reviewInfo) {
    return (
      <div className="min-h-screen pt-20 bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Link Không Hợp Lệ</h2>
          <p className="text-slate-500 mb-6">Link đánh giá này không tồn tại hoặc đã hết hạn.</p>
          <Button onClick={() => setLocation("/")} variant="outline" className="border-slate-200 text-slate-800 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về Trang Chủ
          </Button>
        </div>
      </div>
    );
  }

  if (submitted || reviewInfo.reviewSubmitted) {
    return (
      <div className="min-h-screen pt-20 bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Cảm Ơn Bạn!</h2>
          <p className="text-slate-600 mb-2">
            Đánh giá của bạn cho đơn hàng <strong className="text-slate-800">{reviewInfo.invoiceNumber}</strong> đã được ghi nhận.
          </p>
          <p className="text-slate-500 text-sm mb-8">Chúng tôi sẽ xem xét và hiển thị đánh giá của bạn sớm nhất.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/")} variant="outline" className="border-slate-200 text-slate-800 hover:bg-slate-100">
              Về Trang Chủ
            </Button>
            <Button onClick={() => setLocation("/track-order")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Tra Cứu Đơn Hàng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <ClientHeader />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl mb-4">
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Đánh Giá Đơn Hàng</h1>
          <p className="text-slate-500">
            Đơn hàng <strong className="text-slate-800">{reviewInfo.invoiceNumber}</strong>
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Stars */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-3">
                  Đánh giá của bạn <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-slate-500 mt-2">
                    {[
                      "",
                      "Rất tệ",
                      "Tệ",
                      "Bình thường",
                      "Tốt",
                      "Xuất sắc",
                    ][rating]}
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Tên của bạn (tùy chọn)
                </label>
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Nhận xét (tùy chọn)
                </label>
                <Textarea
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm/dịch vụ..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              {submitMutation.error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{submitMutation.error.message}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                disabled={rating === 0 || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-slate-400/50 border-t-slate-500 rounded-full animate-spin" />
                ) : (
                  <><Star className="h-4 w-4 mr-2" />Gửi Đánh Giá</>
                )}
              </Button>

              {rating === 0 && (
                <p className="text-center text-xs text-slate-500">Vui lòng chọn số sao để tiếp tục</p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-start gap-3 mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Package className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-sm">
            Đánh giá của bạn sẽ được kiểm duyệt trước khi hiển thị công khai. Cảm ơn bạn đã dành thời gian chia sẻ!
          </p>
        </div>
      </div>
    </div>
  );
}
