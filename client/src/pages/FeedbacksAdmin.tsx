import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { Star, CheckCircle, XCircle, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";
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
  const { data: reviews, isLoading } = trpc.reviews.getAll.useQuery();

  const approveMutation = trpc.reviews.updateApproval.useMutation({
    onSuccess: () => {
      utils.reviews.getAll.invalidate();
      toast.success("Đã cập nhật trạng thái đánh giá");
    },
  });

  const deleteMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.getAll.invalidate();
      toast.success("Đã xóa đánh giá");
    },
  });

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredReviews = reviews?.filter((r) => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved && r.isPublic;
    if (filter === "rejected") return r.isApproved && !r.isPublic;
    return true;
  });

  const pendingCount = reviews?.filter(r => !r.isApproved).length || 0;
  const approvedCount = reviews?.filter(r => r.isApproved && r.isPublic).length || 0;
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản Lý Feedback</h1>
            <p className="text-muted-foreground mt-1">Duyệt và quản lý đánh giá từ khách hàng</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("/feedbacks", "_blank")}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Xem Trang Công Khai
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
              <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
              <p className="text-muted-foreground text-sm mt-1">Điểm TB</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Tất Cả", count: reviews?.length || 0 },
            { key: "pending", label: "Chờ Duyệt", count: pendingCount },
            { key: "approved", label: "Đã Duyệt", count: approvedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? "bg-white/20" : "bg-background"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !filteredReviews || filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có đánh giá nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
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
                        <span>Đơn hàng #{review.invoiceId}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!review.isApproved ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ id: review.id, isApproved: true, isPublic: true })}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveMutation.mutate({ id: review.id, isApproved: true, isPublic: false })}
                            disabled={approveMutation.isPending}
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Từ Chối
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate({ id: review.id, isApproved: true, isPublic: !review.isPublic })}
                          disabled={approveMutation.isPending}
                          className="h-8 px-3"
                        >
                          {review.isPublic ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                          {review.isPublic ? "Ẩn" : "Hiện"}
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
