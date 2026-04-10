import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

const FIELD_TYPES = [
  { value: "text", label: "Văn Bản Ngắn", icon: "fa-solid fa-font" },
  { value: "textarea", label: "Văn Bản Dài", icon: "fa-solid fa-align-left" },
  { value: "number", label: "Số", icon: "fa-solid fa-hashtag" },
  { value: "select", label: "Danh Sách Chọn", icon: "fa-solid fa-list-ul" },
  { value: "checkbox", label: "Hộp Kiểm", icon: "fa-solid fa-square-check" },
  { value: "date", label: "Ngày Tháng", icon: "fa-solid fa-calendar" },
  { value: "email", label: "Email", icon: "fa-solid fa-envelope" },
  { value: "phone", label: "Số Điện Thoại", icon: "fa-solid fa-phone" },
];

export default function ProductFields() {
  const [, params] = useRoute("/products/:id/fields");
  const [, navigate] = useLocation();
  const productId = params ? parseInt(params.id) : null;

  const { data: products = [] } = trpc.products.list.useQuery();
  const product = (products as any[]).find(p => p.id === productId);
  const { data: fields = [], refetch } = trpc.products.getCustomFields.useQuery(
    { productId: productId! },
    { enabled: !!productId }
  );

  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState({
    label: "",
    fieldType: "text",
    placeholder: "",
    description: "",
    options: "",
    isRequired: false,
    isVisible: true,
    sortOrder: "0",
  });

  const resetForm = () => setForm({ label: "", fieldType: "text", placeholder: "", description: "", options: "", isRequired: false, isVisible: true, sortOrder: "0" });

  const openCreate = () => { resetForm(); setEditingField(null); setShowDialog(true); };

  const openEdit = (field: any) => {
    setEditingField(field);
    setForm({
      label: field.label || "",
      fieldType: field.fieldType || "text",
      placeholder: field.placeholder || "",
      description: field.description || "",
      options: Array.isArray(field.options) ? field.options.join("\n") : (field.options || ""),
      isRequired: field.isRequired === true,
      isVisible: field.isVisible !== false,
      sortOrder: String(field.sortOrder || 0),
    });
    setShowDialog(true);
  };

  const createField = trpc.products.createCustomField.useMutation({
    onSuccess: () => { toast.success("Đã tạo trường!"); refetch(); setShowDialog(false); resetForm(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updateField = trpc.products.updateCustomField.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật trường!"); refetch(); setShowDialog(false); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteField = trpc.products.deleteCustomField.useMutation({
    onSuccess: () => { toast.success("Đã xóa trường!"); refetch(); setDeleteConfirm(null); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.label.trim()) { toast.error("Vui lòng nhập tên trường"); return; }
    const options = form.fieldType === "select" ? form.options.split("\n").map(s => s.trim()).filter(Boolean) : undefined;
    const payload = {
      label: form.label,
      fieldType: form.fieldType,
      placeholder: form.placeholder || undefined,
      description: form.description || undefined,
      options,
      isRequired: form.isRequired,
      isVisible: form.isVisible,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (editingField) {
      updateField.mutate({ id: editingField.id, ...payload });
    } else {
      createField.mutate({ productId: productId!, ...payload });
    }
  };

  const fieldList = fields as any[];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate("/products")} className="hover:text-blue-600 transition-colors">
            <i className="fa-solid fa-box mr-1" /> Sản Phẩm
          </button>
          <i className="fa-solid fa-chevron-right text-xs" />
          <button onClick={() => navigate("/products/" + productId + "/edit")} className="hover:text-blue-600 transition-colors truncate max-w-[200px]">
            {product?.name || "..."}
          </button>
          <i className="fa-solid fa-chevron-right text-xs" />
          <span className="text-gray-700 font-medium">Trường Tùy Chỉnh</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-sliders text-purple-500" />
              Trường Tùy Chỉnh
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{product?.name} · {fieldList.length} trường</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/edit")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-pen" />
              <span className="hidden sm:inline">Thông tin</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/packages")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-layer-group" />
              <span className="hidden sm:inline">Gói</span>
            </Button>
            <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs h-8">
              <i className="fa-solid fa-plus" /> Thêm trường
            </Button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-start gap-2">
          <i className="fa-solid fa-circle-info mt-0.5 flex-shrink-0" />
          <span>Trường tùy chỉnh cho phép thu thập thêm thông tin từ khách hàng khi họ mua sản phẩm này (VD: tên in trên sản phẩm, màu sắc, kích cỡ...).</span>
        </div>

        {fieldList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <i className="fa-solid fa-sliders text-gray-300 text-5xl mb-4 block" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Chưa có trường tùy chỉnh</h3>
            <p className="text-sm text-gray-400 mb-4">Thêm trường để thu thập thêm thông tin từ khách hàng</p>
            <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
              <i className="fa-solid fa-plus" /> Tạo trường đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fieldList.map((field: any) => {
              const typeInfo = FIELD_TYPES.find(t => t.value === field.fieldType);
              return (
                <div key={field.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-100 flex items-center justify-center">
                      <i className={(typeInfo?.icon || "fa-solid fa-font") + " text-purple-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{field.label}</h3>
                        {field.isRequired && <Badge className="text-xs bg-red-100 text-red-600 border-red-200">Bắt buộc</Badge>}
                        {field.isVisible === false && <Badge variant="secondary" className="text-xs">Ẩn</Badge>}
                        <Badge variant="outline" className="text-xs">{typeInfo?.label || field.fieldType}</Badge>
                      </div>
                      {field.placeholder && <p className="text-xs text-gray-400 mt-0.5">Placeholder: {field.placeholder}</p>}
                      {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
                      {Array.isArray(field.options) && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {field.options.slice(0, 5).map((opt: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{opt}</span>
                          ))}
                          {field.options.length > 5 && <span className="text-xs text-gray-400">+{field.options.length - 5} nữa</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(field)} className="h-8 w-8 p-0">
                        <i className="fa-solid fa-pen text-xs" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(field.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:border-red-300">
                        <i className="fa-solid fa-trash-can text-xs" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/products")}>
            <i className="fa-solid fa-arrow-left mr-2" /> Quay lại
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className={"fa-solid " + (editingField ? "fa-pen" : "fa-plus") + " text-purple-500"} />
              {editingField ? "Chỉnh Sửa Trường" : "Tạo Trường Mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-sm">Tên Trường <span className="text-red-500">*</span></Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="VD: Tên in trên sản phẩm, Màu sắc..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Loại Trường</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {FIELD_TYPES.map(type => (
                  <button key={type.value} onClick={() => setForm(f => ({ ...f, fieldType: type.value }))}
                    className={"flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all " + (form.fieldType === type.value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300")}>
                    <i className={type.icon + " text-sm " + (form.fieldType === type.value ? "text-purple-500" : "text-gray-400")} />
                    <p className={"text-xs font-medium " + (form.fieldType === type.value ? "text-purple-700" : "text-gray-700")}>{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Placeholder</Label>
              <Input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} placeholder="VD: Nhập tên của bạn..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Mô Tả / Hướng Dẫn</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Hướng dẫn cho khách hàng..." rows={2} className="mt-1 resize-none" />
            </div>
            {form.fieldType === "select" && (
              <div>
                <Label className="text-sm">Các Lựa Chọn (mỗi dòng một lựa chọn)</Label>
                <Textarea value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder={"Đỏ\nXanh\nVàng\nTrắng"} rows={4} className="mt-1 resize-none font-mono text-xs" />
              </div>
            )}
            <div>
              <Label className="text-sm">Thứ Tự Hiển Thị</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="0" className="mt-1 w-32" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, isRequired: !f.isRequired }))}
                  className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (form.isRequired ? "bg-red-500" : "bg-gray-300")}>
                  <span className={"inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform " + (form.isRequired ? "translate-x-4" : "translate-x-1")} />
                </button>
                <Label className="text-sm cursor-pointer" onClick={() => setForm(f => ({ ...f, isRequired: !f.isRequired }))}>
                  {form.isRequired ? "Bắt buộc điền" : "Không bắt buộc"}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}
                  className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (form.isVisible ? "bg-blue-600" : "bg-gray-300")}>
                  <span className={"inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform " + (form.isVisible ? "translate-x-4" : "translate-x-1")} />
                </button>
                <Label className="text-sm cursor-pointer" onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}>
                  {form.isVisible ? "Hiển thị trường này" : "Ẩn trường này"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createField.isPending || updateField.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
              {(createField.isPending || updateField.isPending) ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
              {editingField ? "Lưu thay đổi" : "Tạo trường"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <i className="fa-solid fa-triangle-exclamation" /> Xác Nhận Xóa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">Bạn có chắc muốn xóa trường này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button onClick={() => deleteConfirm !== null && deleteField.mutate({ id: deleteConfirm })}
              disabled={deleteField.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteField.isPending ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
              Xóa trường
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
