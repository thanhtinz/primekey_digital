import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, FileText, Trash2, Eye, Download, Plus, Loader2, RefreshCw, CheckCircle, FileSpreadsheet, Files } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Tạo Đơn",
  PAID: "Đã Thanh Toán",
  SHIPPING: "Đang Giao",
  WARRANTY: "Bảo Hành",
  FAILED: "Thất Bại",
  EXPIRED: "Hết Hạn",
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-100 text-blue-800 border-blue-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  SHIPPING: "bg-orange-100 text-orange-800 border-orange-200",
  WARRANTY: "bg-purple-100 text-purple-800 border-purple-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function InvoiceHistory() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productSearchInput, setProductSearchInput] = useState("");
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: invoices = [], isLoading, refetch } = trpc.invoices.list.useQuery();
  const { data: invoicesByProduct = [], isFetching: isSearchingProduct } = trpc.invoices.listByProduct.useQuery(
    { productName: productSearch },
    { enabled: productSearch.trim().length > 0 }
  );
  const deleteInvoiceMutation = trpc.invoices.delete.useMutation();
  const updateInvoiceMutation = trpc.invoices.update.useMutation();
  const exportExcelMutation = trpc.invoices.exportExcel.useMutation();
  const bulkExportPDFMutation = trpc.invoices.bulkExportPDF.useMutation();
  const utils = trpc.useUtils();

  // Use product search results when active, otherwise use full list
  const baseInvoices = productSearch.trim() ? invoicesByProduct : invoices;

  const filteredInvoices = baseInvoices.filter(inv => {
    const matchSearch = !searchTerm || inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchCurrency = filterCurrency === "all" || inv.currency === filterCurrency;
    return matchSearch && matchStatus && matchCurrency;
  });

  const allFilteredIds = filteredInvoices.map(inv => inv.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleProductSearch = () => {
    setProductSearch(productSearchInput);
  };

  const clearProductSearch = () => {
    setProductSearch("");
    setProductSearchInput("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;
    setDeletingId(id);
    try {
      await deleteInvoiceMutation.mutateAsync({ id });
      await utils.invoices.list.invalidate();
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
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

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const invoiceIds = someSelected ? Array.from(selectedIds) : undefined;
      const result = await exportExcelMutation.mutateAsync({
        invoiceIds,
        status: filterStatus !== "all" ? filterStatus : undefined,
        currency: filterCurrency !== "all" ? filterCurrency : undefined,
        productName: productSearch.trim() || undefined,
      });
      // Download the Excel file
      const bytes = Uint8Array.from(atob(result.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hoa-don-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${result.count} hóa đơn ra Excel`);
    } catch {
      toast.error("Xuất Excel thất bại");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleBulkExportPDF = async () => {
    if (selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 hóa đơn");
      return;
    }
    setIsExportingPDF(true);
    try {
      const result = await bulkExportPDFMutation.mutateAsync({ invoiceIds: Array.from(selectedIds) });
      // Download each PDF
      result.pdfs.forEach((base64: string, i: number) => {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hoa-don-${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
      toast.success(`Đã xuất ${result.count} file PDF`);
    } catch {
      toast.error("Xuất PDF thất bại");
    } finally {
      setIsExportingPDF(false);
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

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tổng HĐ", value: invoices.length, color: "text-gray-900" },
            { label: "Tạo Đơn", value: invoices.filter(i => i.status === "CREATED").length, color: "text-blue-600" },
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
          <CardContent className="p-4 space-y-3">
            {/* Row 1: Search by invoice number + status + currency */}
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
                  <SelectItem value="CREATED">Tạo Đơn</SelectItem>
                  <SelectItem value="SHIPPING">Đang Giao</SelectItem>
                  <SelectItem value="WARRANTY">Bảo Hành</SelectItem>
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
            {/* Row 2: Filter by product name */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên sản phẩm / dịch vụ..."
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleProductSearch}
                disabled={isSearchingProduct}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
              >
                {isSearchingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Tìm Sản Phẩm</span>
              </Button>
              {productSearch && (
                <Button
                  onClick={clearProductSearch}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-gray-500 hover:text-gray-700"
                >
                  × Xóa
                </Button>
              )}
            </div>
            {productSearch && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                <Search className="h-3.5 w-3.5" />
                <span>Đang lọc theo sản phẩm: <strong>"{productSearch}"</strong> — {filteredInvoices.length} kết quả</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {someSelected && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-blue-700">Đã chọn {selectedIds.size} hóa đơn</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
              >
                {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Xuất Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkExportPDF}
                disabled={isExportingPDF}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              >
                {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Files className="h-4 w-4" />}
                Xuất PDF
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-500 hover:text-gray-700"
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {filteredInvoices.length} hóa đơn
              </CardTitle>
              {!someSelected && filteredInvoices.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                >
                  {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                  <span className="hidden sm:inline">Xuất Excel</span>
                </Button>
              )}
            </div>
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

              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Chọn tất cả"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Số HĐ</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Khách Hàng</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Ngày Tạo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Số Tiền</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Trạng Thái</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((inv) => {
                      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
                      const status = inv.status || "CREATED";
                      const isSelected = selectedIds.has(inv.id);
                      return (
                        <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                          <td className="py-3.5 px-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(inv.id)}
                              aria-label={`Chọn ${inv.invoiceNumber}`}
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-blue-600">{inv.invoiceNumber}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell">
                            <span className="text-gray-700 text-sm">{(inv as any).customerName || <span className="text-gray-400 italic">—</span>}</span>
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
                                onClick={() => {
                                  setSelectedIds(new Set([inv.id]));
                                  setTimeout(() => handleBulkExportPDF(), 100);
                                }}
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
            <DialogDescription>Xem thông tin chi tiết và các thao tác cho hóa đơn này</DialogDescription>
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[viewInvoice.status || "CREATED"]}`}>
                    {STATUS_LABELS[viewInvoice.status || "CREATED"]}
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
            {viewInvoice?.status === "CREATED" && (
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
