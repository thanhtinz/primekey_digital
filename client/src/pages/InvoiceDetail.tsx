import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Download, Mail, Edit, Trash2, CheckCircle, Clock, XCircle, AlertCircle, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

const STATUS_CONFIG = {
  PENDING: { label: "Chờ Thanh Toán", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  PAID: { label: "Đã Thanh Toán", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  FAILED: { label: "Thất Bại", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  EXPIRED: { label: "Hết Hạn", color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertCircle },
};

function formatCurrency(amount: number | string | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function InvoiceDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const invoiceId = parseInt(params.id || "0");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: invoice, isLoading, error } = trpc.invoices.get.useQuery({ id: invoiceId }, { enabled: !!invoiceId });
  const deleteInvoice = trpc.invoices.delete.useMutation();
  const sendEmailMutation = trpc.email.sendInvoice.useMutation();
  const exportPDFMutation = trpc.pdf.exportInvoice.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này không?")) return;
    setIsDeleting(true);
    try {
      await deleteInvoice.mutateAsync({ id: invoiceId });
      await utils.invoices.list.invalidate();
      toast.success("Đã xóa hóa đơn thành công");
      setLocation("/invoices");
    } catch (err: any) {
      toast.error(err.message || "Xóa hóa đơn thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    if (!invoice.customerEmail) {
      toast.error("Hóa đơn này không có email khách hàng");
      return;
    }
    setIsSendingEmail(true);
    try {
      await sendEmailMutation.mutateAsync({ invoiceId, recipientEmail: invoice.customerEmail });
      toast.success("Đã gửi email hóa đơn thành công");
    } catch (err: any) {
      toast.error(err.message || "Gửi email thất bại");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoice) return;
    setIsExportingPDF(true);
    try {
      const data = await exportPDFMutation.mutateAsync({ invoiceId });
      // data.buffer is a base64 encoded PDF
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất PDF thành công");
    } catch (err: any) {
      toast.error(err.message || "Xuất PDF thất bại");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (invoice?.invoiceNumber) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      toast.success("Đã sao chép số hóa đơn");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy hóa đơn</h2>
          <Button onClick={() => setLocation("/invoices")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = invoice.status as keyof typeof STATUS_CONFIG;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="gap-1 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">#{invoice.invoiceNumber}</h1>
                <button onClick={handleCopyInvoiceNumber} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">Tạo ngày {formatDate(invoice.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusConfig.color} border flex items-center gap-1.5 px-3 py-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="gap-2"
          >
            {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Xuất PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="gap-2"
          >
            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Gửi Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/invoices/${invoiceId}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Chỉnh Sửa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Thông Tin Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Số Hóa Đơn</p>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Loại Tiền</p>
                    <p className="font-medium">{invoice.currency || "VND"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Ngày Tạo</p>
                    <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Ngày Cập Nhật</p>
                    <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
                  </div>
                  {invoice.paidAt && (
                    <div>
                      <p className="text-gray-500 mb-1">Ngày Thanh Toán</p>
                      <p className="font-medium text-green-600">{formatDate(invoice.paidAt)}</p>
                    </div>
                  )}
                  {invoice.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-500 mb-1">Ghi Chú</p>
                      <p className="font-medium">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Link Card */}
            {invoice.paymentUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Link Thanh Toán</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                    <a
                      href={invoice.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate"
                    >
                      {invoice.paymentUrl}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invoice.paymentUrl!);
                        toast.success("Đã sao chép link thanh toán");
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            {/* Amount Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Tóm Tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm Tính</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency || "VND")}</span>
                </div>
                {invoice.taxAmount && parseFloat(String(invoice.taxAmount)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Thuế</span>
                    <span>{formatCurrency(invoice.taxAmount, invoice.currency || "VND")}</span>
                  </div>
                )}
                {invoice.discountAmount && parseFloat(String(invoice.discountAmount)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm Giá</span>
                    <span className="text-green-600">-{formatCurrency(invoice.discountAmount, invoice.currency || "VND")}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Tổng Cộng</span>
                  <span className="text-blue-600 text-lg">{formatCurrency(invoice.totalAmount, invoice.currency || "VND")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Trạng Thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">Đã tạo hóa đơn</p>
                      <p className="text-xs text-gray-500">{formatDate(invoice.createdAt)}</p>
                    </div>
                  </div>
                  {invoice.status === "PAID" && invoice.paidAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium">Đã thanh toán</p>
                        <p className="text-xs text-gray-500">{formatDate(invoice.paidAt)}</p>
                      </div>
                    </div>
                  )}
                  {invoice.status === "EXPIRED" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <div>
                        <p className="text-sm font-medium">Đã hết hạn</p>
                        <p className="text-xs text-gray-500">{formatDate(invoice.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {invoice.status === "FAILED" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div>
                        <p className="text-sm font-medium">Thanh toán thất bại</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
