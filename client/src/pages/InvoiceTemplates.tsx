import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Check, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function InvoiceTemplates() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: templates = [], isLoading } = trpc.invoiceTemplates.list.useQuery();
  const utils = trpc.useUtils();

  const createTemplate = trpc.invoiceTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm mẫu thành công!");
      utils.invoiceTemplates.list.invalidate();
      resetForm();
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

  const handleEdit = (template: { id: number; name: string }) => {
    setFormData({ name: template.name, description: "" });
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mẫu Hóa Đơn</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Quản lý các mẫu hóa đơn của bạn</p>
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
                className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-card-foreground truncate">{template.name}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
                      {template.invoiceTitle || "Hóa đơn bán hàng"}
                    </p>
                  </div>
                  {template.isDefault && (
                    <span className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                      <Check className="h-3 w-3" />
                      Mặc định
                    </span>
                  )}
                </div>

                {/* Footer preview */}
                {template.footer && (
                  <p className="mb-4 text-xs text-muted-foreground line-clamp-1 italic">{template.footer}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => toast.info("Tính năng xem trước đang được phát triển")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Xem
                  </Button>
                  <Button
                    onClick={() => setLocation(`/templates/${template.id}/edit`)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  <Button
                    onClick={() => handleDelete(template.id)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteTemplate.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
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
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa Mẫu Hóa Đơn" : "Thêm Mẫu Hóa Đơn"}</DialogTitle>
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
      </div>
    </DashboardLayout>
  );
}
