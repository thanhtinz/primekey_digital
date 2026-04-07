import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Package, Loader2, Tag, Shield, Image, Upload, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", warrantyMonths: "0",
    imageUrl: "", notes: "",
  });
  const [uploading, setUploading] = useState(false);

  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const utils = trpc.useUtils();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm sản phẩm thành công!");
      utils.products.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi thêm sản phẩm"),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật thành công!");
      utils.products.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi cập nhật"),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm");
      utils.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi xóa"),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", warrantyMonths: "0", imageUrl: "", notes: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên sản phẩm"); return; }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) { toast.error("Vui lòng nhập giá hợp lệ"); return; }

    const warrantyMonths = parseInt(formData.warrantyMonths) || 0;
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      price,
      warrantyMonths,
      imageUrl: formData.imageUrl || undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
  };

  const handleEdit = (product: typeof products[0]) => {
    const price = typeof product.price === "string" ? parseFloat(product.price) : (product.price || 0);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: price.toString(),
      warrantyMonths: String((product as any).warrantyMonths ?? 0),
      imageUrl: (product as any).imageUrl || "",
      notes: (product as any).notes || "",
    });
    setEditingId(product.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    setDeletingId(id);
    try {
      await deleteProduct.mutateAsync({ id });
    } finally {
      setDeletingId(null);
    }
  };

  const uploadImageMut = trpc.products.uploadImage.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success("Upload ảnh thành công!");
    },
    onError: (err) => toast.error("Lỗi upload: " + (err.message || "Thử lại sau")),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await uploadImageMut.mutateAsync({ dataUrl, fileName: file.name });
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Đọc file thất bại");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Lỗi upload: " + (err.message || "Thử lại sau"));
      setUploading(false);
    }
  };

  const formatPrice = (price: any) => {
    const num = typeof price === "string" ? parseFloat(price) : (price || 0);
    return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sản Phẩm & Dịch Vụ</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} sản phẩm trong danh mục</p>
          </div>
          <Button
            onClick={() => { resetForm(); setIsOpen(true); }}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Thêm Sản Phẩm
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid / Table */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {filteredProducts.length} sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium">
                  {searchTerm ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
                </p>
                <p className="text-sm mt-1 mb-4">
                  {searchTerm ? "Thử từ khóa khác" : "Thêm sản phẩm hoặc dịch vụ đầu tiên"}
                </p>
                {!searchTerm && (
                  <Button
                    size="sm"
                    onClick={() => { resetForm(); setIsOpen(true); }}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm Sản Phẩm
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Sản Phẩm</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Mô Tả</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Bảo Hành</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Giá</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {(product as any).imageUrl ? (
                              <img
                                src={(product as any).imageUrl}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-blue-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-gray-400 md:hidden mt-0.5 truncate max-w-40">{product.description}</p>
                              )}
                              {(product as any).notes && (
                                <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="truncate max-w-40">{(product as any).notes}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <p className="text-gray-500 text-sm truncate max-w-56">
                            {product.description || <span className="text-gray-300">—</span>}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right hidden sm:table-cell">
                          {(product as any).warrantyMonths > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <Shield className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-blue-600 text-sm">{(product as any).warrantyMonths} tháng</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tag className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-semibold text-green-700">{formatPrice(product.price)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                              title="Xóa"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</DialogTitle>
            <DialogDescription>{editingId ? "Cập nhật thông tin sản phẩm hoặc dịch vụ" : "Nhập thông tin sản phẩm mới vào danh mục"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ảnh sản phẩm */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5 text-blue-500" />
                Ảnh Sản Phẩm
              </Label>
              <div className="mt-1.5">
                {formData.imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition text-sm text-gray-500">
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Upload ảnh</>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-xs text-gray-400 self-center">hoặc</span>
                    <Input
                      placeholder="Dán URL ảnh..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tên sản phẩm */}
            <div>
              <Label className="text-sm font-medium">
                Tên Sản Phẩm / Dịch Vụ <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Thiết kế website, Tư vấn..."
                className="mt-1.5"
              />
            </div>

            {/* Mô tả (chi tiết sản phẩm) */}
            <div>
              <Label className="text-sm font-medium">Chi Tiết Sản Phẩm</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về sản phẩm/dịch vụ..."
                className="mt-1.5 min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Giá */}
            <div>
              <Label className="text-sm font-medium">
                Giá (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="500000"
                className="mt-1.5"
              />
              {formData.price && !isNaN(parseFloat(formData.price)) && (
                <p className="text-xs text-gray-400 mt-1">
                  = {new Intl.NumberFormat("vi-VN").format(parseFloat(formData.price))} ₫
                </p>
              )}
            </div>

            {/* Bảo hành */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                Thời Hạn Bảo Hành (tháng)
              </Label>
              <Input
                type="number"
                min="0"
                max="120"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                placeholder="0 = không bảo hành"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">
                {parseInt(formData.warrantyMonths) > 0
                  ? `Bảo hành ${formData.warrantyMonths} tháng kể từ ngày chuyển sang trạng thái Bảo Hành`
                  : "Nhập 0 nếu sản phẩm không có bảo hành"}
              </p>
            </div>

            {/* Lưu ý sản phẩm */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Lưu Ý Sản Phẩm
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Lưu ý quan trọng cho khách hàng (VD: không hoàn tiền, thời gian kích hoạt...)"
                className="mt-1.5 min-h-[60px]"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang lưu...</> : (editingId ? "Cập Nhật" : "Thêm Sản Phẩm")}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isPending}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
