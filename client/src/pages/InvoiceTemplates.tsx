import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Check, Loader2, FileText, X, ZoomIn } from "@/components/Icon";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

// ─── Reusable Invoice Preview Component ───────────────────────────────────────
const DEFAULT_COLORS = {
  headerColor: "#1e40af",
  accentColor: "#3b82f6",
  textColor: "#111827",
  bgColor: "#ffffff",
  fontFamily: "Arial",
};

function InvoicePreview({ template }: { template: any }) {
  const data = {
    companyName: template.companyName || "Công Ty TNHH ABC",
    companyAddress: template.companyAddress || "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    companyPhone: template.companyPhone || "0123 456 789",
    companyEmail: template.companyEmail || "info@congtyabc.vn",
    companyTaxCode: template.companyTaxCode || "0123456789",
    logo: template.logo || "",
    invoiceTitle: template.invoiceTitle || "HÓA ĐƠN BÁN HÀNG",
    footer: template.footer || "Cảm ơn quý khách đã mua hàng!",
    headerColor: template.headerColor || DEFAULT_COLORS.headerColor,
    accentColor: template.accentColor || DEFAULT_COLORS.accentColor,
    textColor: template.textColor || DEFAULT_COLORS.textColor,
    bgColor: template.bgColor || DEFAULT_COLORS.bgColor,
    fontFamily: template.fontFamily || DEFAULT_COLORS.fontFamily,
    showLogo: template.showLogo !== false,
    showTaxCode: template.showTaxCode !== false,
    showBankInfo: template.showBankInfo || false,
    bankInfo: template.bankInfo || "",
    notes: template.notes || "",
  };

  const sampleItems = [
    { name: "Sản phẩm A", qty: 2, price: 500000, total: 1000000 },
    { name: "Dịch vụ B", qty: 1, price: 750000, total: 750000 },
    { name: "Phụ kiện C", qty: 3, price: 150000, total: 450000 },
  ];
  const subtotal = sampleItems.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  return (
    <div style={{ fontFamily: data.fontFamily, color: data.textColor, backgroundColor: data.bgColor, fontSize: "12px", lineHeight: "1.5" }} className="w-full shadow-lg border rounded-lg overflow-hidden">
      {/* Header */}
      <div style={{ backgroundColor: data.headerColor, color: "#fff", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {data.showLogo && data.logo ? (
              <img src={data.logo} alt="Logo" style={{ height: "48px", marginBottom: "8px" }} />
            ) : (
              <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
                {data.companyName.charAt(0)}
              </div>
            )}
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>{data.companyName}</div>
            <div style={{ opacity: 0.85, fontSize: "11px", marginTop: "2px" }}>{data.companyAddress}</div>
            <div style={{ opacity: 0.85, fontSize: "11px" }}>ĐT: {data.companyPhone} | Email: {data.companyEmail}</div>
            {data.showTaxCode && <div style={{ opacity: 0.85, fontSize: "11px" }}>MST: {data.companyTaxCode}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}>{data.invoiceTitle}</div>
            <div style={{ opacity: 0.85, fontSize: "11px", marginTop: "4px" }}>Số: HD-2024-0001</div>
            <div style={{ opacity: 0.85, fontSize: "11px" }}>Ngày: {new Date().toLocaleDateString("vi-VN")}</div>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div style={{ padding: "16px 24px", borderBottom: `2px solid ${data.accentColor}20` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontWeight: "600", color: data.accentColor, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>Thông Tin Khách Hàng</div>
            <div style={{ fontWeight: "600" }}>Nguyễn Văn A</div>
            <div style={{ color: "#6b7280", fontSize: "11px" }}>email@example.com</div>
            <div style={{ color: "#6b7280", fontSize: "11px" }}>0987 654 321</div>
          </div>
          <div>
            <div style={{ fontWeight: "600", color: data.accentColor, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>Trạng Thái</div>
            <span style={{ padding: "2px 8px", borderRadius: "12px", backgroundColor: "#fef3c7", color: "#92400e", fontSize: "10px", fontWeight: "600" }}>Chờ thanh toán</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ padding: "0 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: data.accentColor + "15" }}>
              <th style={{ padding: "8px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Sản phẩm</th>
              <th style={{ padding: "8px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>SL</th>
              <th style={{ padding: "8px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Đơn giá</th>
              <th style={{ padding: "8px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {sampleItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px" }}>{item.name}</td>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.qty}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{fmt(item.price)}</td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: "500" }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: "12px 24px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "220px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: "#6b7280" }}>Tạm tính:</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: "#6b7280" }}>Thuế (10%):</span><span>{fmt(tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${data.accentColor}`, marginTop: "4px", fontWeight: "bold", fontSize: "14px" }}>
            <span style={{ color: data.accentColor }}>Tổng cộng:</span>
            <span style={{ color: data.accentColor }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Bank info */}
      {data.showBankInfo && data.bankInfo && (
        <div style={{ padding: "12px 24px", backgroundColor: data.accentColor + "08", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: "600", fontSize: "11px", color: data.accentColor, marginBottom: "4px" }}>THÔNG TIN CHUYỂN KHOẢN</div>
          <div style={{ fontSize: "11px", whiteSpace: "pre-line" }}>{data.bankInfo}</div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: "600", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>GHI CHÚ</div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>{data.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ backgroundColor: "#f9fafb", padding: "12px 24px", borderTop: "1px solid #e5e7eb", textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
        {data.footer}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoiceTemplates() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const { data: templates = [], isLoading } = trpc.invoiceTemplates.list.useQuery();
  const utils = trpc.useUtils();

  const createTemplate = trpc.invoiceTemplates.create.useMutation({
    onSuccess: (data) => {
      toast.success("Thêm mẫu thành công! Đang mở editor...");
      utils.invoiceTemplates.list.invalidate();
      resetForm();
      if (data?.id) {
        setLocation(`/templates/${data.id}/edit`);
      }
    },
    onError: (err) => toast.error(err.message || "Lỗi khi thêm mẫu"),
  });

  const updateTemplate = trpc.invoiceTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật mẫu thành công!");
      utils.invoiceTemplates.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi cập nhật"),
  });

  const deleteTemplate = trpc.invoiceTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa mẫu");
      utils.invoiceTemplates.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi xóa"),
  });

  const setDefaultTemplate = trpc.invoiceTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Đặt mẫu mặc định thành công!");
      utils.invoiceTemplates.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi đặt mặc định"),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên mẫu");
      return;
    }
    if (editingId) {
      await updateTemplate.mutateAsync({ id: editingId, name: formData.name, description: formData.description });
    } else {
      await createTemplate.mutateAsync({ name: formData.name, description: formData.description });
    }
  };

  const handleEdit = (template: any) => {
    setFormData({ name: template.name, description: template.description || "" });
    setEditingId(template.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa mẫu này?")) return;
    await deleteTemplate.mutateAsync({ id });
  };

  const handleSetDefault = async (id: number) => {
    await setDefaultTemplate.mutateAsync({ id, isDefault: true });
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Mẫu Hóa Đơn</h1>
            <p className="ak-page-subtitle">Tùy chỉnh giao diện hóa đơn</p>
          </div>
        </div>
          <Button
            onClick={() => { resetForm(); setIsOpen(true); }}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Thêm Mẫu
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="h-14 w-14 mb-3 opacity-20" />
            <p className="font-medium text-foreground">Chưa có mẫu hóa đơn nào</p>
            <p className="text-sm mt-1 mb-4">Tạo mẫu đầu tiên để bắt đầu</p>
            <Button
              size="sm"
              onClick={() => { resetForm(); setIsOpen(true); }}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Thêm Mẫu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Mini preview thumbnail */}
                <div
                  className="relative cursor-pointer group overflow-hidden"
                  style={{ height: "160px", backgroundColor: (template as any).bgColor || "#fff" }}
                  onClick={() => setPreviewTemplate(template)}
                >
                  <div className="absolute inset-0 scale-[0.35] origin-top-left" style={{ width: "285%", pointerEvents: "none" }}>
                    <InvoicePreview template={template} />
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
                      <ZoomIn className="h-8 w-8" />
                      <span className="text-sm font-medium">Xem Mẫu</span>
                    </div>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-card-foreground truncate">{template.name}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">
                        {(template as any).invoiceTitle || "Hóa đơn bán hàng"}
                      </p>
                    </div>
                    {template.isDefault && (
                      <span className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3" />
                        Mặc định
                      </span>
                    )}
                  </div>

                  {/* Color swatches */}
                  <div className="flex gap-1.5 mb-3">
                    {[(template as any).headerColor || "#1e40af", (template as any).accentColor || "#3b82f6", (template as any).bgColor || "#ffffff"].map((color, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: color }} title={color} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1 self-center">{(template as any).fontFamily || "Arial"}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem
                    </Button>
                    <Button
                      onClick={() => setLocation(`/templates/${template.id}/edit`)}
                      size="sm"
                      className="gap-1.5 flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Chỉnh Sửa
                    </Button>
                    <Button
                      onClick={() => handleDelete(template.id)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteTemplate.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {!template.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(template.id)}
                      variant="outline"
                      className="w-full mt-2"
                      size="sm"
                      disabled={setDefaultTemplate.isPending}
                    >
                      Đặt Làm Mặc Định
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa Mẫu Hóa Đơn" : "Thêm Mẫu Hóa Đơn"}</DialogTitle>
              <DialogDescription>{editingId ? "Chỉnh sửa tên và mô tả mẫu hóa đơn" : "Tạo mẫu hóa đơn mới, sau đó tùy chỉnh chi tiết trong editor"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên Mẫu <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Mẫu Chuẩn, Mẫu Cao Cấp..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Mô Tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn về mẫu hóa đơn..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Hủy
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Cập Nhật" : "Thêm Mẫu"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Preview Modal */}
        {previewTemplate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => setPreviewTemplate(null)}
          >
            <div
              className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-foreground">{previewTemplate.name}</h3>
                  <p className="text-xs text-muted-foreground">Xem trước mẫu hóa đơn (dữ liệu mẫu)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => { setPreviewTemplate(null); setLocation(`/templates/${previewTemplate.id}/edit`); }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Chỉnh Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview content */}
              <div className="overflow-y-auto flex-1 p-6">
                <InvoicePreview template={previewTemplate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
