import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, GripVertical, Eye, EyeOff } from "lucide-react";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

const defaultForm: CategoryForm = { name: "", slug: "", description: "", sortOrder: 0, isPublished: true };

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

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(cat: any) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder || 0, isPublished: cat.isPublished ?? true });
    setDialogOpen(true);
  }

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm(f => ({ ...f, name, slug }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên danh mục");
    if (!form.slug.trim()) return toast.error("Vui lòng nhập slug");
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Tag className="w-6 h-6 text-blue-400" />
              Danh Mục Sản Phẩm
            </h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý nhóm và danh mục để phân loại sản phẩm</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Thêm Danh Mục
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng danh mục", value: categories.length, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Đang hiển thị", value: categories.filter(c => c.isPublished).length, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
            { label: "Đang ẩn", value: categories.filter(c => !c.isPublished).length, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Đang tải...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Chưa có danh mục nào</p>
              <Button onClick={openCreate} variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" /> Tạo danh mục đầu tiên
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-4 hover:bg-slate-700/30 transition-colors">
                  <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{cat.name}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 font-mono">{cat.slug}</Badge>
                      {!cat.isPublished && <Badge variant="outline" className="text-xs border-yellow-600/50 text-yellow-400">Ẩn</Badge>}
                    </div>
                    {cat.description && <p className="text-slate-400 text-sm mt-0.5 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cat)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: cat.id })} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-sm">Tên danh mục *</Label>
              <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="VD: Điện thoại, Phụ kiện..." className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Slug (URL)</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="dien-thoai" className="mt-1 bg-slate-800 border-slate-600 text-white font-mono text-sm" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về danh mục..." className="mt-1 bg-slate-800 border-slate-600 text-white resize-none" rows={2} />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Thứ tự hiển thị</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm">Hiển thị công khai</Label>
              <Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-white">Hủy</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Đang lưu..." : editingId ? "Cập Nhật" : "Tạo Danh Mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
