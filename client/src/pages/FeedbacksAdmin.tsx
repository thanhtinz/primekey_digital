import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { Star, CheckCircle, XCircle, Trash2, Eye, EyeOff, MessageSquare, Search, RefreshCw } from "@/components/Icon";
import { toast } from "sonner";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FeedbacksAdmin() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: reviews, isLoading, refetch } = trpc.products.getAllReviews.useQuery();

  const approveMutation = trpc.products.approveReview.useMutation({
    onSuccess: () => {
      utils.products.getAllReviews.invalidate();
      toast.success("Đã cập nhật trạng thái đánh giá");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.products.deleteReview.useMutation({
    onSuccess: () => {
      utils.products.getAllReviews.invalidate();
      toast.success("Đã xóa đánh giá");
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredReviews = (reviews || []).filter((r: any) => {
    const matchSearch = !search ||
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === "all" ||
      (filter === "pending" && !r.isApproved) ||
      (filter === "approved" && r.isApproved);
    return matchSearch && matchStatus;
  });

  const pendingCount = (reviews || []).filter((r: any) => !r.isApproved).length;
  const approvedCount = (reviews || []).filter((r: any) => r.isApproved).length;
  const avgRating = reviews && reviews.length > 0
    ? (reviews as any[]).reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Quản Lý Feedback</h1>
            <p className="ak-page-subtitle">Xem và xử lý phản hồi từ khách hàng</p>
          </div>
        </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{reviews?.length || 0}</p>
              <p className="text-muted-foreground text-sm mt-1">Tổng Đánh Giá</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
              <p className="text-muted-foreground text-sm mt-1">Chờ Duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
              <p className="text-muted-foreground text-sm mt-1">Đã Duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)} ⭐</p>
              <p className="text-muted-foreground text-sm mt-1">Điểm TB</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ({reviews?.length || 0})</SelectItem>
              <SelectItem value="pending">Chờ duyệt ({pendingCount})</SelectItem>
              <SelectItem value="approved">Đã duyệt ({approvedCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có đánh giá nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review: any) => (
              <Card key={review.id} className={`transition-colors ${!review.isApproved ? "border-yellow-500/30 bg-yellow-500/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-semibold text-foreground">{review.customerName || "Khách Hàng"}</span>
                        <StarRating rating={review.rating} />
                        {!review.isApproved ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Chờ Duyệt
                          </Badge>
                        ) : review.isPublic ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Đã Duyệt
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Ẩn
                          </Badge>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-foreground text-sm mb-2">"{review.comment}"</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {review.productId && <span>Sản phẩm #{review.productId}</span>}
                        {review.invoiceId && <span>Đơn hàng #{review.invoiceId}</span>}
                        <span className="text-xs text-muted-foreground">{review.customerEmail}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!review.isApproved ? (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ id: review.id, isApproved: true })}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Duyệt
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate({ id: review.id, isApproved: false })}
                          disabled={approveMutation.isPending}
                          className="h-8 px-3 text-orange-500 border-orange-200 hover:bg-orange-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Hủy duyệt
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Xóa đánh giá này?")) {
                            deleteMutation.mutate({ id: review.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
