import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { FileText, Plus, Tag, Search, Edit, Trash2, Eye, EyeOff, Loader2 } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// ─── Blog Posts Tab ────────────────────────────────────────────────────────────
function BlogPostsTab() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const { data: posts = [], isLoading, refetch } = trpc.blog.listPosts.useQuery({ page: 1, limit: 50 });
  const deletePost = trpc.blog.deletePost.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa bài viết"); },
    onError: (e: any) => toast.error(e.message),
  });
  const togglePublish = trpc.blog.updatePost.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e: any) => toast.error(e.message),
  });
  const filtered = (posts as any[]).filter((p: any) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm bài viết..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => navigate("/admin/blog/new")}>
          <Plus className="w-4 h-4 mr-1" /> Viết Bài Mới
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((post: any) => (
            <Card key={post.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{post.title}</p>
                    <Badge variant={post.isPublished ? "default" : "secondary"} className="text-xs flex-shrink-0">
                      {post.isPublished ? "Đã đăng" : "Nháp"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt || post.content?.substring(0, 100)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    {post.category && <span className="ml-2 text-primary">#{post.category}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => togglePublish.mutate({ id: post.id, isPublished: !post.isPublished })}>
                    {post.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                    if (confirm("Xóa bài viết này?")) deletePost.mutate({ id: post.id });
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Blog Categories Tab ───────────────────────────────────────────────────────
function BlogCategoriesTab() {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const { data: categories = [], refetch } = trpc.blog.listCategories.useQuery();
  const createCat = trpc.blog.createCategory.useMutation({
    onSuccess: () => { refetch(); setName(""); toast.success("Đã thêm chuyên mục"); },
    onError: (e: any) => toast.error(e.message),
  });
  const generateSlug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const deleteCat = trpc.blog.deleteCategory.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa chuyên mục"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex gap-2">
        <Input placeholder="Tên chuyên mục mới..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && name.trim()) createCat.mutate({ name: name.trim(), slug: generateSlug(name.trim()) }); }} />
        <Button onClick={() => { if (name.trim()) createCat.mutate({ name: name.trim(), slug: generateSlug(name.trim()) }); }} disabled={!name.trim()}>
          <Plus className="w-4 h-4 mr-1" /> Thêm
        </Button>
      </div>
      {(categories as any[]).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có chuyên mục nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(categories as any[]).map((cat: any) => (
            <Card key={cat.id}>
              <CardContent className="p-3 flex items-center gap-3">
                {editId === cat.id ? (
                  <>
                    <Input className="flex-1 h-8 text-sm" value={editName} onChange={e => setEditName(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Escape") setEditId(null); }} />
                    <Button size="sm" onClick={() => { deleteCat.mutate({ id: cat.id }); setEditId(null); }} variant="destructive">Xóa</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Hủy</Button>
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.postCount || 0} bài</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Xóa chuyên mục này?")) deleteCat.mutate({ id: cat.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main BlogHub ──────────────────────────────────────────────────────────────
export default function BlogHub() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-4">
        <div className="ak-page-header">
          <h1 className="ak-page-title">Quản Lý Blog</h1>
          <p className="ak-page-subtitle">Bài viết, viết bài mới và chuyên mục</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="w-4 h-4" /> Tất Cả Bài Viết
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5">
              <Plus className="w-4 h-4" /> Viết Bài Mới
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <Tag className="w-4 h-4" /> Chuyên Mục
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            <BlogPostsTab />
          </TabsContent>
          <TabsContent value="new" className="mt-4">
            {/* Redirect to full editor page for better UX */}
            <div className="text-center py-12">
              <Plus className="w-12 h-12 mx-auto mb-4 text-primary opacity-70" />
              <p className="text-muted-foreground mb-4">Tạo bài viết mới với editor đầy đủ tính năng</p>
              <Button onClick={() => navigate("/admin/blog/new")}>
                <Plus className="w-4 h-4 mr-2" /> Mở Editor Viết Bài
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <BlogCategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
