import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function ProductEdit() {
  const [, params] = useRoute("/products/:id/edit");
  const [, navigate] = useLocation();
  const productId = params ? parseInt(params.id) : null;

  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const { data: categories = [] } = trpc.categories.listProtected.useQuery();
  const { data: allTags = [] } = trpc.productTags.list.useQuery();
  const utils = trpc.useUtils();

  const product = (products as any[]).find(p => p.id === productId);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    notes: "",
    categoryId: null as number | null,
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const parentCategories = (categories as any[]).filter((c: any) => !c.parentId);
  const getChildren = (parentId: number) => (categories as any[]).filter((c: any) => c.parentId === parentId);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        notes: product.notes || "",
        categoryId: product.categoryId || null,
      });
      setSelectedTagIds((product.tags || []).map((t: any) => t.id));
      // Auto-set parent dropdown from loaded product
      if (product.categoryId) {
        const cat = (categories as any[]).find((c: any) => c.id === product.categoryId);
        if (cat?.parentId) setSelectedParentId(cat.parentId);
      }
    }
  }, [product?.id, categories]);

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật sản phẩm thành công!");
      utils.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Lỗi khi cập nhật"),
  });

  const assignTags = trpc.productTags.assignToProduct.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
    onError: (err: any) => toast.error("Lỗi gán tag: " + (err.message || "")),
  });

  const uploadImageMut = trpc.products.uploadImage.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success("Upload ảnh thành công!");
      setUploading(false);
    },
    onError: (err) => { toast.error("Lỗi upload: " + (err.message || "")); setUploading(false); },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Chỉ hỗ trợ file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadImageMut.mutate({ dataUrl, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!productId) return;
    if (!formData.name.trim()) { toast.error("Vui lòng nhập tên sản phẩm"); return; }
    await updateProduct.mutateAsync({
      id: productId,
      name: formData.name,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl || undefined,
      notes: formData.notes || undefined,
    });
    await assignTags.mutateAsync({ productId, tagIds: selectedTagIds });
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <i className="fa-solid fa-spinner fa-spin text-blue-500 text-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <i className="fa-solid fa-box-open text-gray-300 text-5xl mb-4 block" />
          <h2 className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm</h2>
          <Button className="mt-4" onClick={() => navigate("/products")}>
            <i className="fa-solid fa-arrow-left mr-2" /> Quay lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate("/products")} className="hover:text-blue-600 transition-colors">
            <i className="fa-solid fa-box mr-1" /> Sản Phẩm
          </button>
          <i className="fa-solid fa-chevron-right text-xs" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
          <i className="fa-solid fa-chevron-right text-xs" />
          <span className="text-gray-700 font-medium">Chỉnh Sửa</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} alt={formData.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-box text-blue-500" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{product.name}</h1>
              <p className="text-xs text-gray-500">Chỉnh sửa thông tin cơ bản</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/packages")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-layer-group" />
              <span className="hidden sm:inline">Gói</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/products/" + productId + "/fields")} className="text-xs gap-1.5 h-8">
              <i className="fa-solid fa-sliders" />
              <span className="hidden sm:inline">Trường</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-blue-500" /> Thông Tin Cơ Bản
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <Label className="text-sm font-medium">Ảnh Sản Phẩm</Label>
              <div className="mt-2 flex items-start gap-4">
                {formData.imageUrl ? (
                  <div className="relative">
                    <img src={formData.imageUrl} alt="preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                    <button onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs">
                      <i className="fa-solid fa-times" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <i className="fa-solid fa-image text-gray-400 text-2xl" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-fit text-sm text-gray-700">
                      {uploading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
                      {uploading ? "Đang tải..." : "Tải ảnh lên"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB</p>
                  <Input placeholder="Hoặc nhập URL ảnh..." value={formData.imageUrl} onChange={e => setFormData(p => ({ ...p, imageUrl: e.target.value }))} className="text-xs h-8 mt-2" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Tên Sản Phẩm <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nhập tên sản phẩm..." className="mt-1.5" />
            </div>

            <div>
              <Label className="text-sm font-medium">Mô Tả</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả sản phẩm..." rows={4} className="mt-1.5 resize-none" />
            </div>

            <div>
              <Label className="text-sm font-medium">Danh Mục</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <select
                  value={selectedParentId ?? ""}
                  onChange={e => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedParentId(val);
                    setFormData(p => ({ ...p, categoryId: null }));
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Danh mục lớn --</option>
                  {parentCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                  ))}
                </select>
                <select
                  value={formData.categoryId ?? ""}
                  onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedParentId}
                >
                  <option value="">-- Danh mục nhỏ --</option>
                  {getChildren(selectedParentId ?? 0).map((child: any) => (
                    <option key={child.id} value={child.id}>{child.icon ? `${child.icon} ` : ""}{child.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Chọn danh mục lớn trước, sau đó chọn danh mục nhỏ</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Ghi Chú Sản Phẩm</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú về sản phẩm (hiển thị cho khách hàng)..." rows={2} className="mt-1.5 resize-none" />
            </div>

            {(allTags as any[]).length > 0 && (
              <div>
                <Label className="text-sm font-medium">Nhãn (Tags)</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(allTags as any[]).map((tag: any) => (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)}
                      className={"px-3 py-1 rounded-full text-xs font-medium border transition-all " + (selectedTagIds.includes(tag.id) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300")}>
                      {selectedTagIds.includes(tag.id) && <i className="fa-solid fa-check mr-1 text-xs" />}
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/products")} className="sm:w-auto">
            <i className="fa-solid fa-arrow-left mr-2" /> Quay lại
          </Button>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => navigate("/products/" + productId + "/packages")} className="gap-1.5 flex-1 sm:flex-none">
              <i className="fa-solid fa-layer-group" />
              <span>Gói</span>
            </Button>
            <Button variant="outline" onClick={() => navigate("/products/" + productId + "/fields")} className="gap-1.5 flex-1 sm:flex-none">
              <i className="fa-solid fa-sliders" />
              <span>Trường</span>
            </Button>
            <Button onClick={handleSave} disabled={updateProduct.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-1 sm:flex-none">
              {updateProduct.isPending ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
              Lưu
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
