import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderTree, ChevronRight, Loader2, Layers } from "lucide-react";

interface CategoryForm {
  name: string;
  icon: string;
  parentId: number | null;
  sortOrder: number;
}

const defaultForm: CategoryForm = { name: "", icon: "", parentId: null, sortOrder: 0 };

export default function CategorySettings() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.categories.listProtected.useQuery();
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.listProtected.invalidate(); toast.success("Đã tạo danh mục"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.listProtected.invalidate(); toast.success("Đã cập nhật"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.listProtected.invalidate(); toast.success("Đã xóa danh mục"); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);

  // Build tree
  const parentCategories = categories.filter((c: any) => !c.parentId);
  const getChildren = (parentId: number) => categories.filter((c: any) => c.parentId === parentId);

  function openCreate(parentId: number | null = null) {
    setEditingId(null);
    setForm({ ...defaultForm, parentId });
    setDialogOpen(true);
  }

  function openEdit(cat: any) {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon || "", parentId: cat.parentId || null, sortOrder: cat.sortOrder || 0 });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên danh mục");
    if (editingId) {
      updateMutation.mutate({ id: editingId, name: form.name, icon: form.icon || undefined, parentId: form.parentId, sortOrder: form.sortOrder });
    } else {
      createMutation.mutate({ name: form.name, icon: form.icon || undefined, parentId: form.parentId, sortOrder: form.sortOrder });
    }
  }

  function handleDeleteCategory(id: number) {
    const children = getChildren(id);
    if (children.length > 0) {
      toast.error("Không thể xóa danh mục lớn có danh mục nhỏ bên trong. Hãy xóa danh mục nhỏ trước.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    deleteMutation.mutate({ id });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-blue-500" />
              Danh Mục Sản Phẩm
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Quản lý danh mục 2 cấp: danh mục lớn chứa danh mục nhỏ</p>
          </div>
          <Button onClick={() => openCreate(null)} className="bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm">
            <Plus className="w-4 h-4" /> Thêm Danh Mục Lớn
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-blue-500 text-xs font-medium">Danh mục lớn</p>
            <p className="text-blue-700 text-2xl font-bold mt-1">{parentCategories.length}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-green-500 text-xs font-medium">Danh mục nhỏ</p>
            <p className="text-green-700 text-2xl font-bold mt-1">{categories.length - parentCategories.length}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-gray-500 text-xs font-medium">Tổng cộng</p>
            <p className="text-gray-700 text-2xl font-bold mt-1">{categories.length}</p>
          </div>
        </div>

        {/* Category Tree */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : parentCategories.length === 0 ? (
            <div className="py-16 text-center">
              <FolderTree className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Chưa có danh mục nào</p>
              <p className="text-gray-300 text-sm mt-1">Tạo danh mục lớn trước, sau đó thêm danh mục nhỏ bên trong</p>
              <Button onClick={() => openCreate(null)} variant="outline" className="mt-4 gap-1.5">
                <Plus className="w-4 h-4" /> Tạo Danh Mục Đầu Tiên
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {parentCategories.map((parent: any) => {
                const children = getChildren(parent.id);
                return (
                  <div key={parent.id}>
                    {/* Parent row */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                        {parent.icon || parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{parent.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{children.length} danh mục nhỏ</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openCreate(parent.id)} className="text-green-500 hover:text-green-700 hover:bg-green-50 h-8 px-2 text-xs gap-1" title="Thêm danh mục nhỏ">
                          <Plus className="w-3.5 h-3.5" /> Thêm nhỏ
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(parent)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0" title="Sửa">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(parent.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" title="Xóa">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Children rows */}
                    {children.length > 0 && (
                      <div className="bg-white">
                        {children.map((child: any) => (
                          <div key={child.id} className="flex items-center gap-3 pl-12 pr-5 py-2.5 hover:bg-blue-50/30 transition-colors border-t border-gray-50">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <div className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                              {child.icon || <Layers className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-700 text-sm font-medium">{child.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(child)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(child.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Danh Mục" : form.parentId ? "Thêm Danh Mục Nhỏ" : "Thêm Danh Mục Lớn"}</DialogTitle>
            <DialogDescription>
              {form.parentId
                ? `Danh mục nhỏ thuộc "${parentCategories.find((c: any) => c.id === form.parentId)?.name || ""}"`
                : "Danh mục lớn chứa nhiều danh mục nhỏ bên trong"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Tên danh mục <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={form.parentId ? "VD: Netflix, Spotify..." : "VD: Giải trí, Phần mềm..."} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Icon / Emoji</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="VD: 🎬 hoặc 💻" className="mt-1.5" maxLength={10} />
              <p className="text-xs text-gray-400 mt-1">Nhập emoji hoặc ký tự đại diện cho danh mục</p>
            </div>
            {!form.parentId && !editingId && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-600">
                Sau khi tạo danh mục lớn, bạn có thể thêm danh mục nhỏ bên trong.
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Thứ tự hiển thị</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang lưu...</> : editingId ? "Cập Nhật" : "Tạo Danh Mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
