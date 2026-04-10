import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Tag } from "@/components/Icon";

export default function BlogCategories() {
  const { data: categories = [], refetch } = trpc.blog.listCategories.useQuery();
  const [form, setForm] = useState({ name: "", slug: "", sortOrder: 0 });

  const createCat = trpc.blog.createCategory.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã tạo chuyên mục"); setForm({ name: "", slug: "", sortOrder: 0 }); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteCat = trpc.blog.deleteCategory.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa chuyên mục"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm(f => ({ ...f, name, slug }));
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6 max-w-2xl">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Chuyên Mục Blog</h1>
            <p className="ak-page-subtitle">Quản lý các chuyên mục bài viết</p>
          </div>
        </div>

        {/* Create Form */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Thêm chuyên mục mới
            </h3>
            <form onSubmit={e => { e.preventDefault(); createCat.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tên chuyên mục</Label>
                  <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="VD: Tin tức" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="tin-tuc" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-32" />
              </div>
              <Button type="submit" disabled={createCat.isPending || !form.name}>
                {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Tạo chuyên mục
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {(categories as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Tag className="h-8 w-8 mb-2 opacity-30" />
                <p>Chưa có chuyên mục nào</p>
              </div>
            ) : (
              <div className="divide-y">
                {(categories as any[]).map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Thứ tự: {cat.sortOrder ?? 0}</span>
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { if (confirm("Xóa chuyên mục này?")) deleteCat.mutate({ id: cat.id }); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
