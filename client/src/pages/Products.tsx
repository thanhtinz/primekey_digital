import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Package, Loader2, Tag, Shield, Image, Upload, X, AlertTriangle, ChevronDown, ChevronUp, Layers, FolderTree, Star, Settings2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

interface PackageForm {
  id?: number;
  name: string;
  price: string;
  originalPrice: string;
  description: string;
  warrantyMonths: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyPkg = (): PackageForm => ({ name: "", price: "", originalPrice: "", description: "", warrantyMonths: "0", sortOrder: "0", isActive: true });

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "packages" | "customFields">("info");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "",
    imageUrl: "", notes: "",
    categoryId: null as number | null,
  });
  const [packages, setPackages] = useState<PackageForm[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const { data: categories = [] } = trpc.categories.listProtected.useQuery();
  const utils = trpc.useUtils();

  // Build category tree
  const parentCategories = categories.filter((c: any) => !c.parentId);
  const getChildren = (parentId: number) => categories.filter((c: any) => c.parentId === parentId);

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

  const toggleFeatured = trpc.products.toggleFeatured.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Cập nhật thành công"); },
    onError: (err) => toast.error(err.message),
  });
  const createCustomField = trpc.products.createCustomField.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Thêm trường thành công"); },
    onError: (err) => toast.error(err.message),
  });
  const updateCustomField = trpc.products.updateCustomField.useMutation({
    onSuccess: () => { toast.success("Cập nhật thành công"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteCustomField = trpc.products.deleteCustomField.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); },
    onError: (err) => toast.error(err.message),
  });

  const createPkg = trpc.products.createPackage.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Thêm gói thành công"); },
    onError: (err) => toast.error(err.message),
  });
  const updatePkg = trpc.products.updatePackage.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Cập nhật gói thành công"); },
    onError: (err) => toast.error(err.message),
  });
  const deletePkg = trpc.products.deletePackage.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Đã xóa gói"); },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", imageUrl: "", notes: "", categoryId: null });
    setPackages([]);
    setEditingId(null);
    setIsOpen(false);
    setActiveTab("info");
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên sản phẩm"); return; }
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl || undefined,
      notes: formData.notes || undefined,
    };
    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      notes: product.notes || "",
      categoryId: product.categoryId || null,
    });
    const pkgs = (product.packages || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: String(parseFloat(p.price)),
      originalPrice: p.originalPrice ? String(parseFloat(p.originalPrice)) : "",
      description: p.description || "",
      warrantyMonths: String(p.warrantyMonths ?? 0),
      sortOrder: String(p.sortOrder ?? 0),
      isActive: p.isActive !== false,
    }));
    setPackages(pkgs);
    setEditingId(product.id);
    setActiveTab("info");
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    setDeletingId(id);
    try { await deleteProduct.mutateAsync({ id }); } finally { setDeletingId(null); }
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
    if (!file.type.startsWith("image/")) { toast.error("Chỉ hỗ trợ file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await uploadImageMut.mutateAsync({ dataUrl, fileName: file.name });
        setUploading(false);
      };
      reader.onerror = () => { toast.error("Đọc file thất bại"); setUploading(false); };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Lỗi upload: " + (err.message || "Thử lại sau"));
      setUploading(false);
    }
  };

  const handleSavePackage = async (pkg: PackageForm, productId: number) => {
    if (!pkg.name.trim()) { toast.error("Vui lòng nhập tên gói"); return; }
    const price = parseFloat(pkg.price);
    if (isNaN(price) || price < 0) { toast.error("Giá gói không hợp lệ"); return; }
    const payload = {
      productId,
      name: pkg.name,
      price,
      originalPrice: pkg.originalPrice ? parseFloat(pkg.originalPrice) : undefined,
      description: pkg.description || undefined,
      warrantyMonths: parseInt(pkg.warrantyMonths) || 0,
      sortOrder: parseInt(pkg.sortOrder) || 0,
      isActive: pkg.isActive,
    };
    if (pkg.id) {
      await updatePkg.mutateAsync({ id: pkg.id, ...payload });
    } else {
      await createPkg.mutateAsync(payload);
    }
  };

  const formatPrice = (price: any) => {
    const num = typeof price === "string" ? parseFloat(price) : (price || 0);
    return new Intl.NumberFormat("vi-VN").format(num) + " ₫";
  };

  // Get selected category's parent for display
  const getSelectedParentId = () => {
    if (!formData.categoryId) return null;
    const cat = categories.find((c: any) => c.id === formData.categoryId);
    return (cat as any)?.parentId || null;
  };
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

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
          <Button onClick={() => { resetForm(); setSelectedParentId(null); setIsOpen(true); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus className="h-4 w-4" /> Thêm Sản Phẩm
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Tìm theo tên, mô tả..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{filteredProducts.length} sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium">{searchTerm ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}</p>
                <p className="text-sm mt-1 mb-4">{searchTerm ? "Thử từ khóa khác" : "Thêm sản phẩm hoặc dịch vụ đầu tiên"}</p>
                {!searchTerm && (
                  <Button size="sm" onClick={() => { resetForm(); setIsOpen(true); }} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Thêm Sản Phẩm
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Sản Phẩm</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Danh Mục</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Gói</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Giá</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((product: any) => {
                      const pkgs = product.packages || [];
                      const isExpanded = expandedProduct === product.id;
                      return (
                        <>
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Package className="h-4 w-4 text-blue-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  {product.notes && (
                                    <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span className="truncate max-w-40">{product.notes}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 hidden lg:table-cell">
                              {product.categoryName ? (
                                <div className="text-sm">
                                  {product.parentCategoryName && (
                                    <span className="text-gray-400 text-xs">{product.parentCategoryName} &gt; </span>
                                  )}
                                  <span className="text-gray-600 font-medium">{product.categoryName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs">Chưa phân loại</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                              {pkgs.length > 0 ? (
                                <button
                                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition"
                                >
                                  <Layers className="h-3 w-3" />
                                  {pkgs.length} gói
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {pkgs.length > 0 ? (
                                <div className="text-right">
                                  <span className="font-semibold text-red-500 text-sm">
                                    {formatPrice(Math.min(...pkgs.map((p: any) => parseFloat(p.price))))}
                                    {pkgs.length > 1 && " ~"}
                                  </span>
                                  {pkgs.length > 1 && (
                                    <div className="text-xs text-gray-400">{formatPrice(Math.max(...pkgs.map((p: any) => parseFloat(p.price))))}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">Chưa có gói</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => toggleFeatured.mutate({ id: product.id, isFeatured: !(product as any).isFeatured })} className={`h-8 w-8 p-0 ${(product as any).isFeatured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`} title={(product as any).isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}>
                                  <Star className={`h-4 w-4 ${(product as any).isFeatured ? 'fill-yellow-500' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600" title="Sửa">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600" title="Xóa">
                                  {deletingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded packages row */}
                          {isExpanded && pkgs.length > 0 && (
                            <tr className="bg-blue-50/40">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {pkgs.map((pkg: any) => (
                                    <div key={pkg.id} className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2 text-sm shadow-sm">
                                      <Layers className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                      <span className="font-medium text-gray-700">{pkg.name}</span>
                                      <span className="text-red-500 font-semibold">{formatPrice(pkg.price)}</span>
                                      {pkg.originalPrice && (
                                        <span className="text-gray-400 line-through text-xs">{formatPrice(pkg.originalPrice)}</span>
                                      )}
                                      {pkg.warrantyMonths > 0 && (
                                        <span className="text-xs text-blue-500 flex items-center gap-0.5">
                                          <Shield className="h-3 w-3" /> {pkg.warrantyMonths}th
                                        </span>
                                      )}
                                      {!pkg.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Ẩn</span>}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</DialogTitle>
            <DialogDescription>{editingId ? "Cập nhật thông tin sản phẩm hoặc dịch vụ" : "Nhập thông tin sản phẩm mới vào danh mục"}</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Thông Tin Cơ Bản
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "packages" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Layers className="h-3.5 w-3.5" />
              Gói Sản Phẩm
              {packages.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{packages.length}</span>
              )}
            </button>
            {editingId && (
              <button
                onClick={() => setActiveTab("customFields")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "customFields" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Trường Tùy Chỉnh
              </button>
            )}
          </div>

          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Ảnh sản phẩm */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-blue-500" /> Ảnh Sản Phẩm
                </Label>
                <div className="mt-1.5">
                  {formData.imageUrl ? (
                    <div className="relative inline-block">
                      <img src={formData.imageUrl} alt="Preview" className="h-32 w-32 rounded-lg object-cover border border-gray-200" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition text-sm text-gray-500">
                        {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</> : <><Upload className="h-4 w-4" /> Upload ảnh</>}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                      <span className="text-xs text-gray-400 self-center">hoặc</span>
                      <Input placeholder="Dán URL ảnh..." value={formData.imageUrl} onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))} className="flex-1" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tên */}
              <div>
                <Label className="text-sm font-medium">Tên Sản Phẩm / Dịch Vụ <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Netflix Premium, Adobe CC..." className="mt-1.5" />
              </div>

              {/* Danh mục 2 cấp */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <FolderTree className="h-3.5 w-3.5 text-green-500" /> Danh Mục
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div>
                    <select
                      value={selectedParentId ?? getSelectedParentId() ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setSelectedParentId(val);
                        setFormData(prev => ({ ...prev, categoryId: null }));
                      }}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Danh mục lớn --</option>
                      {parentCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={formData.categoryId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setFormData(prev => ({ ...prev, categoryId: val }));
                      }}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedParentId && !getSelectedParentId()}
                    >
                      <option value="">-- Danh mục nhỏ --</option>
                      {getChildren(selectedParentId ?? getSelectedParentId() ?? 0).map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Chọn danh mục lớn trước, sau đó chọn danh mục nhỏ</p>
              </div>

              {/* Mô tả */}
              <div>
                <Label className="text-sm font-medium">Chi Tiết Sản Phẩm</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả chi tiết về sản phẩm/dịch vụ..." className="mt-1.5 min-h-[80px]" rows={3} />
              </div>

              {/* Lưu ý */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Lưu Ý Sản Phẩm</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Lưu ý quan trọng cho khách hàng (VD: không hoàn tiền, thời gian kích hoạt...)" className="mt-1.5 min-h-[60px]" rows={2} />
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium">Giá và bảo hành được quản lý theo gói</p>
                <p className="text-xs mt-1 text-blue-500">Chuyển sang tab "Gói Sản Phẩm" để thêm các gói với giá và thời hạn bảo hành khác nhau.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang lưu...</> : (editingId ? "Cập Nhật" : "Thêm Sản Phẩm")}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isPending}>Hủy</Button>
              </div>
            </div>
          )}

          {activeTab === "packages" && (
            <div className="space-y-4">
              {!editingId && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Lưu sản phẩm trước, sau đó quay lại để thêm gói.
                </div>
              )}
              {editingId && (
                <>
                  <p className="text-sm text-gray-500">Thêm các gói với giá và bảo hành khác nhau. Khách hàng sẽ chọn gói khi mua.</p>
                  {/* Existing packages */}
                  {packages.filter(p => p.id).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gói hiện có</p>
                      {packages.filter(p => p.id).map((pkg, idx) => (
                        <div key={pkg.id} className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Tên gói</Label>
                              <Input value={pkg.name} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="VD: 1 tháng, 1 năm..." />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Giá (₫)</Label>
                              <Input type="number" value={pkg.price} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, price: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="150000" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Giá gốc (₫, tùy chọn)</Label>
                              <Input type="number" value={pkg.originalPrice} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, originalPrice: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="200000" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center gap-1"><Shield className="h-3 w-3 text-blue-500" /> Bảo hành (tháng)</Label>
                              <Input type="number" min="0" value={pkg.warrantyMonths} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, warrantyMonths: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="0" />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-gray-500">Mô tả gói</Label>
                              <Input value={pkg.description} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="Mô tả ngắn..." />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={pkg.isActive} onChange={e => setPackages(prev => prev.map((p, i) => i === idx ? { ...p, isActive: e.target.checked } : p))} className="rounded" />
                              <span className="text-gray-600">Hiển thị</span>
                            </label>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleSavePackage(pkg, editingId)} disabled={updatePkg.isPending} className="h-7 text-xs">
                                {updatePkg.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Lưu"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Xóa gói này?")) deletePkg.mutate({ id: pkg.id! }); setPackages(prev => prev.filter((_, i) => i !== idx)); }} className="h-7 text-xs text-red-500 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New packages */}
                  {packages.filter(p => !p.id).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gói mới (chưa lưu)</p>
                      {packages.filter(p => !p.id).map((pkg, relIdx) => {
                        const absIdx = packages.findIndex((p, i) => !p.id && packages.filter((_, j) => !packages[j].id && j < i).length === relIdx);
                        return (
                          <div key={`new-${relIdx}`} className="border border-dashed border-blue-200 rounded-xl p-3 bg-blue-50/30 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-500">Tên gói <span className="text-red-500">*</span></Label>
                                <Input value={pkg.name} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, name: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="VD: 1 tháng, 1 năm..." />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Giá (₫) <span className="text-red-500">*</span></Label>
                                <Input type="number" value={pkg.price} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, price: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="150000" />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Giá gốc (₫, tùy chọn)</Label>
                                <Input type="number" value={pkg.originalPrice} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, originalPrice: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="200000" />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 flex items-center gap-1"><Shield className="h-3 w-3 text-blue-500" /> Bảo hành (tháng)</Label>
                                <Input type="number" min="0" value={pkg.warrantyMonths} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, warrantyMonths: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="0" />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs text-gray-500">Mô tả gói</Label>
                                <Input value={pkg.description} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, description: e.target.value } : p))} className="mt-1 h-8 text-sm" placeholder="Mô tả ngắn..." />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={pkg.isActive} onChange={e => setPackages(prev => prev.map((p, i) => i === absIdx ? { ...p, isActive: e.target.checked } : p))} className="rounded" />
                                <span className="text-gray-600">Hiển thị</span>
                              </label>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSavePackage(pkg, editingId)} disabled={createPkg.isPending} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                                  {createPkg.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Thêm gói"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setPackages(prev => prev.filter((_, i) => i !== absIdx))} className="h-7 text-xs text-red-500">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={() => setPackages(prev => [...prev, emptyPkg()])} className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 gap-1.5">
                    <Plus className="h-4 w-4" /> Thêm Gói Mới
                  </Button>
                </>
              )}
            </div>
          )}
          {activeTab === "customFields" && editingId && (
            <CustomFieldsTab productId={editingId} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function CustomFieldsTab({ productId }: { productId: number }) {
  const [newField, setNewField] = useState({ fieldName: "", fieldValue: "" });
  const [editingField, setEditingField] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ fieldName: "", fieldValue: "" });

  const { data: fields = [], isLoading } = trpc.products.getCustomFields.useQuery({ productId });
  const utils = trpc.useUtils();

  const createField = trpc.products.createCustomField.useMutation({
    onSuccess: () => { utils.products.getCustomFields.invalidate({ productId }); setNewField({ fieldName: "", fieldValue: "" }); toast.success("Thêm trường thành công"); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateField = trpc.products.updateCustomField.useMutation({
    onSuccess: () => { utils.products.getCustomFields.invalidate({ productId }); setEditingField(null); toast.success("Cập nhật thành công"); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteField = trpc.products.deleteCustomField.useMutation({
    onSuccess: () => { utils.products.getCustomFields.invalidate({ productId }); toast.success("Đã xóa"); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Thêm các trường tùy chỉnh cho sản phẩm (VD: Hệ điều hành, Dung lượng, Màu sắc...)</p>

      {/* Add new field */}
      <div className="flex gap-2">
        <Input placeholder="Tên trường" value={newField.fieldName} onChange={(e) => setNewField(p => ({ ...p, fieldName: e.target.value }))} className="flex-1" />
        <Input placeholder="Giá trị" value={newField.fieldValue} onChange={(e) => setNewField(p => ({ ...p, fieldValue: e.target.value }))} className="flex-1" />
        <Button size="sm" disabled={!newField.fieldName.trim() || createField.isPending} onClick={() => createField.mutate({ productId, fieldName: newField.fieldName, fieldValue: newField.fieldValue || undefined })} className="bg-blue-600 hover:bg-blue-700 gap-1">
          <Plus className="h-4 w-4" /> Thêm
        </Button>
      </div>

      {/* Existing fields */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
      ) : fields.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Chưa có trường tùy chỉnh nào</div>
      ) : (
        <div className="space-y-2">
          {fields.map((field: any) => (
            <div key={field.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              {editingField === field.id ? (
                <>
                  <Input value={editValues.fieldName} onChange={(e) => setEditValues(p => ({ ...p, fieldName: e.target.value }))} className="flex-1" />
                  <Input value={editValues.fieldValue} onChange={(e) => setEditValues(p => ({ ...p, fieldValue: e.target.value }))} className="flex-1" />
                  <Button size="sm" onClick={() => updateField.mutate({ id: field.id, fieldName: editValues.fieldName, fieldValue: editValues.fieldValue })} className="bg-green-600 hover:bg-green-700">Lưu</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Hủy</Button>
                </>
              ) : (
                <>
                  <span className="font-medium text-gray-700 flex-1">{field.fieldName}</span>
                  <span className="text-gray-500 flex-1">{field.fieldValue || "—"}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600" onClick={() => { setEditingField(field.id); setEditValues({ fieldName: field.fieldName, fieldValue: field.fieldValue || "" }); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" onClick={() => deleteField.mutate({ id: field.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
