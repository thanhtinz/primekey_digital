import { useState, useCallback, memo } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Download, Mail, Trash2, CheckCircle, Clock, XCircle,
  AlertCircle, Copy, ExternalLink, Loader2, Package, Truck, Shield,
  ChevronDown, Star, Link2, CopyPlus, MessageSquare, Send, Trash, Pencil, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  step: number;
}> = {
  CREATED: { label: "Tạo Đơn", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package, step: 1 },
  PAID: { label: "Đã Thanh Toán", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, step: 2 },
  SHIPPING: { label: "Đang Giao Hàng", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Truck, step: 3 },
  WARRANTY: { label: "Bảo Hành", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Shield, step: 4 },
  FAILED: { label: "Thất Bại", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, step: 0 },
  EXPIRED: { label: "Hết Hạn", color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock, step: 0 },
};

const ORDER_STEPS = [
  { key: "CREATED", label: "Tạo Đơn", icon: Package },
  { key: "PAID", label: "Thanh Toán", icon: CheckCircle },
  { key: "SHIPPING", label: "Giao Hàng", icon: Truck },
  { key: "WARRANTY", label: "Bảo Hành", icon: Shield },
];

function formatCurrency(amount: number | string | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  }
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Tách Dialog ra component riêng để tránh re-render InvoiceDetail ──────────
interface TransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingTransition: string | null;
  currentStatus: string;
  invoiceNumber: string;
  invoiceId: number;
  onSuccess: () => void;
}

const TransitionDialog = memo(function TransitionDialog({
  open, onOpenChange, pendingTransition, currentStatus, invoiceNumber, invoiceId, onSuccess
}: TransitionDialogProps) {
  const [transitionNote, setTransitionNote] = useState("");
  const [regenerateQR, setRegenerateQR] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const manualTransitionMutation = trpc.invoices.manualTransition.useMutation();
  const utils = trpc.useUtils();

  const handleConfirm = async () => {
    if (!pendingTransition) return;
    setIsTransitioning(true);
    try {
      const result = await manualTransitionMutation.mutateAsync({
        id: invoiceId,
        newStatus: pendingTransition as any,
        note: transitionNote || undefined,
        regeneratePaymentLink: regenerateQR,
        origin: window.location.origin,
      });
      await utils.invoices.get.invalidate({ id: invoiceId });
      await utils.invoices.list.invalidate();
      const statusLabel = STATUS_CONFIG[pendingTransition]?.label || pendingTransition;
      let msg = `Đã chuyển trạng thái: ${statusLabel}`;
      if (result.emailSent) msg += " · Email đã gửi";
      if (result.paymentLinkRegenerated) msg += " · QR mới đã tạo";
      toast.success(msg);
      if ((result as any).emailError) {
        toast.warning(`Email không gửi được: ${(result as any).emailError}`);
      }
      setTransitionNote("");
      setRegenerateQR(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Chuyển trạng thái thất bại");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleClose = () => {
    if (!isTransitioning) {
      setTransitionNote("");
      setRegenerateQR(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pendingTransition && (() => {
              const cfg = STATUS_CONFIG[pendingTransition];
              const Icon = cfg?.icon;
              return Icon ? <Icon className="h-5 w-5" /> : null;
            })()}
            Chuyển Sang: {pendingTransition ? STATUS_CONFIG[pendingTransition]?.label : ""}
          </DialogTitle>
          <DialogDescription>
            Thao tác này sẽ cập nhật trạng thái đơn hàng và tự động gửi email thông báo cho khách hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hóa đơn</span>
              <span className="font-medium">#{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái hiện tại</span>
              <span className="font-medium">{STATUS_CONFIG[currentStatus]?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chuyển sang</span>
              <span className="font-semibold text-blue-600">{pendingTransition ? STATUS_CONFIG[pendingTransition]?.label : ""}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transition-note" className="text-sm">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="transition-note"
              placeholder="Lý do chuyển trạng thái..."
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {pendingTransition === "CREATED" && (
            <div className="flex items-center gap-2 rounded-lg border p-3 bg-blue-50/50">
              <input
                type="checkbox"
                id="regen-qr"
                checked={regenerateQR}
                onChange={(e) => setRegenerateQR(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <label htmlFor="regen-qr" className="text-sm cursor-pointer">
                Tạo lại QR PayOS mới và gửi link thanh toán cho khách
              </label>
            </div>
          )}

          <div className="rounded-lg border p-3 bg-amber-50/50 text-xs text-amber-700 space-y-0.5">
            <p className="font-medium">ℹ️ Tự động sau khi chuyển:</p>
            <p>• Gửi email thông báo cho khách hàng</p>
            {pendingTransition === "WARRANTY" && <p>• Tạo link đánh giá nếu chưa có</p>}
            <p>• Ghi log hoạt động</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isTransitioning}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isTransitioning} className="gap-2">
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác Nhận Chuyển
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────
export default function InvoiceDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const invoiceId = parseInt(params.id || "0");

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Dialog state - tách riêng để không ảnh hưởng dropdown
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);

  const { data: invoice, isLoading, error, refetch: refetchInvoice } = trpc.invoices.get.useQuery(
    { id: invoiceId },
    { enabled: !!invoiceId, staleTime: 30_000 }
  );
  const { data: notes, refetch: refetchNotes } = trpc.notes.list.useQuery(
    { invoiceId },
    { enabled: !!invoiceId, staleTime: 30_000 }
  );
  const { data: currentUser } = trpc.auth.me.useQuery(undefined, { staleTime: 60_000 });

  const deleteInvoice = trpc.invoices.delete.useMutation();
  const sendEmailMutation = trpc.email.sendInvoice.useMutation();
  const exportPDFMutation = trpc.pdf.exportInvoice.useMutation();
  const duplicateMutation = trpc.invoices.duplicate.useMutation();
  const createNoteMutation = trpc.notes.create.useMutation();
  const deleteNoteMutation = trpc.notes.delete.useMutation();
  const createWarrantyMutation = trpc.warranty.create.useMutation({
    onSuccess: () => toast.success("Đã tạo yêu cầu bảo hành thành công"),
    onError: (e: any) => toast.error(e.message || "Lỗi tạo bảo hành"),
  });
  const utils = trpc.useUtils();

  const handleDelete = useCallback(async () => {
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
  }, [invoiceId]);

  const handleSendEmail = useCallback(async () => {
    if (!invoice) return;
    if (!invoice.customerEmail) {
      toast.error("Hóa đơn này không có email khách hàng");
      return;
    }
    setIsSendingEmail(true);
    try {
      await sendEmailMutation.mutateAsync({ invoiceId, recipientEmail: invoice.customerEmail, origin: window.location.origin });
      toast.success("Đã gửi email hóa đơn thành công");
    } catch (err: any) {
      toast.error(err.message || "Gửi email thất bại");
    } finally {
      setIsSendingEmail(false);
    }
  }, [invoice, invoiceId]);

  const handleExportPDF = useCallback(async () => {
    if (!invoice) return;
    setIsExportingPDF(true);
    try {
      const data = await exportPDFMutation.mutateAsync({ invoiceId });
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
  }, [invoice, invoiceId]);

  const handleCopyReviewLink = useCallback(() => {
    if (invoice?.reviewToken) {
      const url = `${window.location.origin}/review/${invoice.reviewToken}`;
      navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link đánh giá");
    }
  }, [invoice?.reviewToken]);

  const handleCopyPaymentLink = useCallback(() => {
    const url = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link thanh toán! Có thể chia sẻ qua Zalo, Messenger...");
  }, [invoiceId]);

  const handleDuplicate = useCallback(async () => {
    if (!invoice) return;
    setIsDuplicating(true);
    try {
      const result = await duplicateMutation.mutateAsync({ id: invoiceId });
      await utils.invoices.list.invalidate();
      toast.success(`Đã nhân bản thành công! Số HĐ mới: ${result.invoiceNumber}`);
      if (result.newId) setLocation(`/invoices/${result.newId}`);
    } catch (err: any) {
      toast.error(err.message || "Nhân bản hóa đơn thất bại");
    } finally {
      setIsDuplicating(false);
    }
  }, [invoice, invoiceId]);

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await createNoteMutation.mutateAsync({ invoiceId, content: newNote.trim() });
      setNewNote("");
      await refetchNotes();
      toast.success("Đã thêm ghi chú");
    } catch (err: any) {
      toast.error(err.message || "Thêm ghi chú thất bại");
    } finally {
      setIsAddingNote(false);
    }
  }, [newNote, invoiceId]);

  const handleDeleteNote = useCallback(async (noteId: number) => {
    if (!confirm("Xóa ghi chú này?")) return;
    try {
      await deleteNoteMutation.mutateAsync({ id: noteId });
      await refetchNotes();
      toast.success("Đã xóa ghi chú");
    } catch (err: any) {
      toast.error(err.message || "Xóa ghi chú thất bại");
    }
  }, []);

  // Mở dialog chuyển trạng thái - KHÔNG dùng setTimeout nữa
  const openTransitionDialog = useCallback((status: string) => {
    setPendingTransition(status);
    setTransitionDialogOpen(true);
  }, []);

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

  const currentStatus = invoice.status || "CREATED";
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.CREATED;
  const StatusIcon = statusConfig.icon;
  const currentStep = statusConfig.step;
  const isAdmin = (currentUser as any)?.role === "admin";

  return (
    <>
      {/* Dialog nằm NGOÀI DashboardLayout để tránh re-render toàn bộ trang */}
      <TransitionDialog
        open={transitionDialogOpen}
        onOpenChange={setTransitionDialogOpen}
        pendingTransition={pendingTransition}
        currentStatus={currentStatus}
        invoiceNumber={invoice.invoiceNumber}
        invoiceId={invoiceId}
        onSuccess={refetchInvoice}
      />

      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="gap-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">#{invoice.invoiceNumber}</h1>
                  <button
                    onClick={() => { navigator.clipboard.writeText(invoice.invoiceNumber); toast.success("Đã sao chép"); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">Tạo ngày {formatDate(invoice.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusConfig.color} border flex items-center gap-1.5 px-3 py-1`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Order Progress Steps */}
          {currentStep > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted z-0" />
                  <div
                    className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (ORDER_STEPS.length - 1)) * 100}%` }}
                  />
                  {ORDER_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const isCompleted = i + 1 < currentStep;
                    const isCurrent = i + 1 === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted ? "bg-blue-600 border-blue-600" : isCurrent ? "bg-blue-50 border-blue-500" : "bg-background border-border"
                        }`}>
                          <StepIcon className={`h-4 w-4 ${isCompleted || isCurrent ? "text-blue-500" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {invoice.status === "CREATED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/edit-invoice/${invoice.id}`)}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
                Sửa Hóa Đơn
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF} className="gap-2">
              {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Xuất PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 print-hide">
              <Printer className="h-4 w-4" />
              In Hóa Đơn
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={isSendingEmail} className="gap-2">
              {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Gửi Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating} className="gap-2">
              {isDuplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
              Nhân Bản
            </Button>

            {/* Dropdown chuyển trạng thái - KHÔNG có Dialog bên trong */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <ChevronDown className="h-3.5 w-3.5" />
                  Chuyển Trạng Thái
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Chuyển thủ công (có gửi email)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                  const Icon = cfg.icon;
                  const isCurrent = status === currentStatus;
                  return (
                    <DropdownMenuItem
                      key={status}
                      disabled={isCurrent}
                      className={`gap-2 ${isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                      onSelect={() => {
                        if (!isCurrent) openTransitionDialog(status);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                      {isCurrent && <span className="ml-auto text-xs text-muted-foreground">(đang)</span>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Copy Payment Link */}
            {["CREATED", "PAID", "SHIPPING"].includes(invoice.status || "") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPaymentLink}
                className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Link2 className="h-4 w-4" />
                Sao Chép Link TT
              </Button>
            )}
            {/* Review Link */}
            {invoice.reviewToken && (
              <Button variant="outline" size="sm" onClick={handleCopyReviewLink} className="gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Copy Link Đánh Giá
              </Button>
            )}

            {/* Tạo Bảo Hành */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!invoice?.id) return;
                createWarrantyMutation.mutate({ invoiceId: invoice.id });
              }}
              disabled={createWarrantyMutation?.isPending}
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {createWarrantyMutation?.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Tạo Bảo Hành
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
                      <p className="text-muted-foreground mb-1">Số Hóa Đơn</p>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Loại Tiền</p>
                      <p className="font-medium">{invoice.currency || "VND"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Ngày Tạo</p>
                      <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Cập Nhật Lần Cuối</p>
                      <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
                    </div>
                    {invoice.paidAt && (
                      <div>
                        <p className="text-muted-foreground mb-1">Ngày Thanh Toán</p>
                        <p className="font-medium text-green-600">{formatDate(invoice.paidAt)}</p>
                      </div>
                    )}
                    {invoice.customerName && (
                      <div>
                        <p className="text-muted-foreground mb-1">Khách Hàng</p>
                        <p className="font-medium">{invoice.customerName}</p>
                      </div>
                    )}
                    {invoice.customerEmail && (
                      <div>
                        <p className="text-muted-foreground mb-1">Email Khách Hàng</p>
                        <p className="font-medium">{invoice.customerEmail}</p>
                      </div>
                    )}
                    {invoice.orderInfo && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">Thông Tin Đặt Hàng</p>
                        <div className="space-y-1">
                          {(() => {
                            try {
                              const info = JSON.parse(invoice.orderInfo);
                              if (Array.isArray(info)) {
                                return info.flatMap((item: any) =>
                                  item.customFieldValues ? item.customFieldValues.map((f: any, i: number) => (
                                    <p key={i} className="font-medium text-sm"><span className="text-muted-foreground">{f.fieldName}:</span> {f.fieldValue}</p>
                                  )) : []
                                );
                              }
                              return <p className="font-medium text-sm">{invoice.orderInfo}</p>;
                            } catch {
                              return <p className="font-medium text-sm">{invoice.orderInfo}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {invoice.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">Ghi Chú</p>
                        <p className="font-medium">{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items Card */}
              {invoice.items && invoice.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Chi Tiết Sản Phẩm / Dịch Vụ</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tên</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">SL</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Giá</th>
                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-4 py-2.5 font-medium">{item.name}</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">
                                {typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity}
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">
                                {formatCurrency(item.unitPrice, invoice.currency || "VND")}
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium">
                                {formatCurrency(item.totalAmount, invoice.currency || "VND")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                        onClick={() => { navigator.clipboard.writeText(invoice.paymentUrl!); toast.success("Đã sao chép link thanh toán"); }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Link Card */}
              {invoice.reviewToken && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Link Đánh Giá Sản Phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Link2 className="h-4 w-4 text-yellow-600 shrink-0" />
                      <span className="text-yellow-700 text-sm truncate">
                        {window.location.origin}/review/{invoice.reviewToken}
                      </span>
                      <button
                        onClick={handleCopyReviewLink}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {invoice.reviewSubmitted ? "✅ Khách hàng đã đánh giá" : "⏳ Chưa có đánh giá"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Internal Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Ghi Chú Nội Bộ
                    {notes && notes.length > 0 && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{notes.length}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <textarea
                      placeholder="Thêm ghi chú nội bộ (chỉ nhân viên thấy)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                      className="w-full resize-none text-sm border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || isAddingNote} className="gap-2">
                      {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Thêm
                    </Button>
                  </div>
                  {notes && notes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {notes.map((note: any) => (
                        <div key={note.id} className="flex gap-2 p-2.5 bg-muted/40 rounded-lg">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-600">{(note.authorName || "?").charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-medium">{note.authorName || "Nhân viên"}</p>
                              <div className="flex items-center gap-1">
                                <p className="text-[10px] text-muted-foreground">{formatDate(note.createdAt)}</p>
                                {isAdmin && (
                                  <button onClick={() => handleDeleteNote(note.id)} className="p-0.5 hover:text-red-500 text-muted-foreground">
                                    <Trash className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!notes || notes.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-1">Chưa có ghi chú nào</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Amount Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Tóm Tắt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm Tính</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency || "VND")}</span>
                  </div>
                  {invoice.taxAmount && parseFloat(String(invoice.taxAmount)) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Thuế</span>
                      <span>{formatCurrency(invoice.taxAmount, invoice.currency || "VND")}</span>
                    </div>
                  )}
                  {invoice.discountAmount && parseFloat(String(invoice.discountAmount)) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giảm Giá</span>
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

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Lịch Sử Trạng Thái</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium">Đã tạo đơn hàng</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                      </div>
                    </div>
                    {(invoice.status === "PAID" || invoice.status === "SHIPPING" || invoice.status === "WARRANTY") && invoice.paidAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">Đã thanh toán</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.paidAt)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.status === "SHIPPING" && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">Đang giao hàng</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.status === "WARRANTY" && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">Bảo hành</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.status === "EXPIRED" && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">Đã hết hạn</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.status === "FAILED" && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">Thất bại</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.updatedAt)}</p>
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
    </>
  );
}
