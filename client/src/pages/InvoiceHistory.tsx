import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, FileText, Trash2, Eye, Download, Plus, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ Thanh Toán",
  PAID: "Đã Thanh Toán",
  FAILED: "Thất Bại",
  EXPIRED: "Hết Hạn",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function InvoiceHistory() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: invoices = [], isLoading, refetch } = trpc.invoices.list.useQuery();
  const deleteInvoiceMutation = trpc.invoices.delete.useMutation();
  const updateInvoiceMutation = trpc.invoices.update.useMutation();
  const utils = trpc.useUtils();

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = !searchTerm || inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchCurrency = filterCurrency === "all" || inv.currency === filterCurrency;
    return matchSearch && matchStatus && matchCurrency;
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;
    setDeletingId(id);
    try {
      await deleteInvoiceMutation.mutateAsync({ id });
      await utils.invoices.list.invalidate();
      toast.success("Đã xóa hóa đơn");
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await updateInvoiceMutation.mutateAsync({ id, status: "PAID" });
      await utils.invoices.list.invalidate();
      toast.success("Đã đánh dấu thanh toán");
      setViewInvoice(null);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const formatAmount = (amount: any, currency: string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "VND",
    }).format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch Sử Hóa Đơn</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả hóa đơn của bạn</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button size="sm" onClick={() => setLocation("/create-invoice")} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo Hóa Đơn</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tổng HĐ", value: invoices.length, color: "text-gray-900" },
            { label: "Chờ TT", value: invoices.filter(i => i.status === "PENDING").length, color: "text-yellow-600" },
            { label: "Đã TT", value: invoices.filter(i => i.status === "PAID").length, color: "text-green-600" },
            { label: "Hết Hạn", value: invoices.filter(i => i.status === "EXPIRED").length, color: "text-gray-500" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm border border-gray-100">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo số hóa đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                  <SelectItem value="PENDING">Chờ Thanh Toán</SelectItem>
                  <SelectItem value="PAID">Đã Thanh Toán</SelectItem>
                  <SelectItem value="FAILED">Thất Bại</SelectItem>
                  <SelectItem value="EXPIRED">Hết Hạn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Tiền tệ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả</SelectItem>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {filteredInvoices.length} hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileText className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium">Không có hóa đơn nào</p>
                <p className="text-sm mt-1 mb-4">
                  {searchTerm || filterStatus !== "all" ? "Thử thay đổi bộ lọc" : "Tạo hóa đơn đầu tiên"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button size="sm" onClick={() => setLocation("/create-invoice")} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Tạo Hóa Đơn
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Số HĐ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Ngày Tạo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Số Tiền</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Trạng Thái</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((inv) => {
                      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
                      const status = inv.status || "PENDING";
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-blue-600">{inv.invoiceNumber}</span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 hidden md:table-cell">
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium">
                            {formatAmount(amount, inv.currency || "VND")}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}>
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/invoices/${inv.id}`)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast.info("Tính năng xuất PDF đang phát triển")}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                                title="Tải PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(inv.id)}
                                disabled={deletingId === inv.id}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                                title="Xóa"
                              >
                                {deletingId === inv.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi Tiết Hóa Đơn</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Số HĐ</p>
                  <p className="font-medium text-blue-600">{viewInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Trạng Thái</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[viewInvoice.status || "PENDING"]}`}>
                    {STATUS_LABELS[viewInvoice.status || "PENDING"]}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Ngày Tạo</p>
                  <p className="font-medium">{new Date(viewInvoice.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tiền Tệ</p>
                  <p className="font-medium">{viewInvoice.currency || "VND"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tạm Tính</p>
                  <p className="font-medium">{formatAmount(viewInvoice.subtotal, viewInvoice.currency || "VND")}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Thuế</p>
                  <p className="font-medium">{formatAmount(viewInvoice.taxAmount, viewInvoice.currency || "VND")}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng Cộng</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatAmount(viewInvoice.totalAmount, viewInvoice.currency || "VND")}
                  </span>
                </div>
              </div>
              {viewInvoice.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p className="font-medium mb-1 text-xs text-gray-500">Ghi chú:</p>
                  <p>{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            {viewInvoice?.status === "PENDING" && (
              <Button
                onClick={() => handleMarkPaid(viewInvoice.id)}
                className="gap-1.5 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={updateInvoiceMutation.isPending}
              >
                {updateInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Đánh Dấu Đã TT
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => toast.info("Tính năng xuất PDF đang phát triển")}>
              <Download className="h-4 w-4 mr-1.5" />
              Tải PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewInvoice(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
