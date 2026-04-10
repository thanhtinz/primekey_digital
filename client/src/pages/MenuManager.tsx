import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical, Navigation, ExternalLink, Globe, ChevronUp, ChevronDown } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  label: string;
  url: string;
  target: "_self" | "_blank";
  order: number;
  isActive: boolean;
}

export default function MenuManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ label: "", url: "", target: "_self" as "_self" | "_blank" });

  const { data: menuItems = [], isLoading, refetch } = trpc.menu.list.useQuery();
  const createItem = trpc.menu.create.useMutation({
    onSuccess: () => { refetch(); setShowDialog(false); toast.success("Đã thêm mục menu"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateItem = trpc.menu.update.useMutation({
    onSuccess: () => { refetch(); setShowDialog(false); setEditItem(null); toast.success("Đã cập nhật"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteItem = trpc.menu.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Đã xóa mục menu"); },
    onError: (e: any) => toast.error(e.message),
  });
  const reorderItem = trpc.menu.reorder.useMutation({
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e.message),
  });
  const toggleActive = trpc.menu.toggleActive.useMutation({
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ label: "", url: "", target: "_self" });
    setShowDialog(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ label: item.label, url: item.url, target: item.target });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.label.trim()) { toast.error("Vui lòng nhập tên mục"); return; }
    if (!form.url.trim()) { toast.error("Vui lòng nhập URL"); return; }
    if (editItem) {
      updateItem.mutate({ id: editItem.id, ...form });
    } else {
      createItem.mutate(form);
    }
  };

  const items = ((menuItems ?? []) as unknown as MenuItem[]).sort((a, b) => a.order - b.order);

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <h1 className="ak-page-title">Quản Lý Menu</h1>
            <p className="ak-page-subtitle">Cấu hình menu điều hướng trang web</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Thêm Mục
          </Button>
        </div>

        {/* Preview */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Xem trước menu</p>
            <div className="flex items-center gap-1 flex-wrap">
              {items.filter(i => i.isActive).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Chưa có mục nào được bật</p>
              ) : (
                items.filter(i => i.isActive).map(item => (
                  <a
                    key={item.id}
                    href={item.url}
                    target={item.target}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-background transition-colors border border-border/50 flex items-center gap-1"
                    onClick={e => e.preventDefault()}
                  >
                    {item.label}
                    {item.target === "_blank" && <ExternalLink className="w-3 h-3 opacity-50" />}
                  </a>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu items list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Navigation className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Chưa có mục menu nào</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Thêm các trang vào menu điều hướng</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Thêm Mục Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <Card key={item.id} className={`hover:shadow-sm transition-shadow ${!item.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-muted-foreground cursor-grab flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.label}</p>
                      {!item.isActive && <Badge variant="secondary" className="text-xs">Ẩn</Badge>}
                      {item.target === "_blank" && <Badge variant="outline" className="text-xs">Tab mới</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" disabled={idx === 0} onClick={() => reorderItem.mutate({ id: item.id, direction: "up" })}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" disabled={idx === items.length - 1} onClick={() => reorderItem.mutate({ id: item.id, direction: "down" })}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => toggleActive.mutate({ id: item.id, isActive: !item.isActive })}>
                      {item.isActive ? <span className="text-xs text-green-600">ON</span> : <span className="text-xs text-gray-400">OFF</span>}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => openEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Xóa mục menu này?")) deleteItem.mutate({ id: item.id });
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

      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setEditItem(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh Sửa Mục Menu" : "Thêm Mục Menu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tên hiển thị *</label>
              <Input placeholder="Ví dụ: Trang Chủ, Giới Thiệu..." value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">URL *</label>
              <Input placeholder="Ví dụ: /, /about, https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mở trong</label>
              <select
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value as "_self" | "_blank" }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="_self">Cùng tab</option>
                <option value="_blank">Tab mới</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditItem(null); }}>Hủy</Button>
            <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
