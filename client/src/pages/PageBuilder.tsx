import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Layers, Globe, Copy, ExternalLink } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  isPublished: number;
  createdAt: Date;
}

export default function PageBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "" });

  const { data: pages = [], isLoading, refetch } = trpc.pages.list.useQuery();
  const createPage = trpc.pages.create.useMutation({
    onSuccess: () => { refetch(); setShowDialog(false); toast.success("Đã tạo trang"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updatePage = trpc.pages.update.useMutation({
    onSuccess: () => { refetch(); setShowDialog(false); setEditPage(null); toast.success("Đã cập nhật trang"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deletePage = trpc.pages.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa trang"); },
    onError: (e: any) => toast.error(e.message),
  });
  const togglePublish = trpc.pages.togglePublish.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditPage(null);
    setForm({ title: "", slug: "", content: "" });
    setShowDialog(true);
  };

  const openEdit = (page: Page) => {
    setEditPage(page);
    setForm({ title: page.title, slug: page.slug, content: page.content ?? "" });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!form.slug.trim()) { toast.error("Vui lòng nhập slug"); return; }
    if (editPage) {
      updatePage.mutate({ id: editPage.id, ...form });
    } else {
      createPage.mutate(form);
    }
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <h1 className="ak-page-title">Tạo Trang</h1>
            <p className="ak-page-subtitle">Quản lý các trang tĩnh trên website</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Tạo Trang Mới
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : (pages as unknown as Page[]).length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Chưa có trang nào</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Tạo trang tĩnh như Giới Thiệu, Chính Sách, Điều Khoản...</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Tạo Trang Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {(pages as unknown as Page[]).map(page => (
              <Card key={page.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{page.title}</p>
                      <Badge className={`text-xs ${page.isPublished === 1 ? "bg-green-500/10 text-green-600 border-green-200" : "bg-gray-100 text-gray-500"}`}>
                        {page.isPublished === 1 ? "Đã đăng" : "Nháp"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">/page/{page.slug}</span>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => { navigator.clipboard.writeText(`/page/${page.slug}`); toast.success("Đã copy URL"); }}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/page/${page.slug}`, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePublish.mutate({ id: page.id, isPublished: page.isPublished !== 1 })}>
                      {page.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(page)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Xóa trang này?")) deletePage.mutate({ id: page.id });
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

      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setEditPage(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editPage ? "Chỉnh Sửa Trang" : "Tạo Trang Mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tiêu đề trang *</label>
              <Input
                placeholder="Ví dụ: Giới Thiệu, Chính Sách Bảo Mật..."
                value={form.title}
                onChange={e => {
                  const title = e.target.value;
                  setForm(f => ({ ...f, title, slug: editPage ? f.slug : generateSlug(title) }));
                }}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Slug URL *</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-shrink-0">/page/</span>
                <Input
                  placeholder="gioi-thieu"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nội dung (HTML/Markdown)</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Nhập nội dung trang... Hỗ trợ HTML và Markdown"
                rows={10}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditPage(null); }}>Hủy</Button>
            <Button onClick={handleSave} disabled={createPage.isPending || updatePage.isPending}>
              {createPage.isPending || updatePage.isPending ? "Đang lưu..." : editPage ? "Cập nhật" : "Tạo trang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
