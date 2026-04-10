import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, ArrowLeft } from "@/components/Icon";

export default function BlogNewPost() {
  const [, navigate] = useLocation();
  const { data: categories = [] } = trpc.blog.listCategories.useQuery();
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", coverImage: "", categoryId: "", isPublished: false,
  });

  const createPost = trpc.blog.createPost.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo bài viết");
      navigate("/admin/blog/posts");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm(f => ({ ...f, title, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề bài viết");
    createPost.mutate({
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
    });
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blog/posts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="ak-page-header">
            <div>
              <h1 className="ak-page-title">Viết Bài Mới</h1>
              <p className="ak-page-subtitle">Tạo bài viết mới cho blog</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Tiêu đề bài viết <span className="text-red-500">*</span></Label>
                <Input
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="tieu-de-bai-viet"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Chuyên mục</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chuyên mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories as any[]).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Ảnh bìa (URL)</Label>
                <Input
                  value={form.coverImage}
                  onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://..."
                />
                {form.coverImage && (
                  <img src={form.coverImage} alt="Cover preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Tóm tắt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Mô tả ngắn về bài viết..."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Nội dung bài viết <span className="text-red-500">*</span></Label>
                <Textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Nhập nội dung bài viết (hỗ trợ Markdown)..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isPublished}
                    onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))}
                  />
                  <Label>{form.isPublished ? "Đăng ngay" : "Lưu nháp"}</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/blog/posts")}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createPost.isPending}>
                    {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {form.isPublished ? "Đăng bài" : "Lưu nháp"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayoutCustom>
  );
}
