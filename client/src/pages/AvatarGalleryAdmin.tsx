import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Eye, EyeOff, Plus, Loader2, ImageIcon, Link, Search, X, Copy, Grid3X3, List } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

export default function AvatarGalleryAdmin() {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("default");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewAvatar, setPreviewAvatar] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: avatars = [], isLoading } = trpc.avatarImages.adminGetAll.useQuery();

  const uploadToGallery = trpc.avatarImages.uploadToGallery.useMutation({
    onSuccess: () => {
      utils.avatarImages.adminGetAll.invalidate();
      utils.avatarImages.getAll.invalidate();
      toast.success("Đã thêm ảnh avatar vào kho");
      setLabel("");
    },
    onError: (err) => toast.error(err.message),
  });

  const addMutation = trpc.avatarImages.add.useMutation({
    onSuccess: () => {
      utils.avatarImages.adminGetAll.invalidate();
      utils.avatarImages.getAll.invalidate();
      toast.success("Đã thêm ảnh avatar từ URL");
      setLabel("");
      setUrlInput("");
      setShowUrlInput(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.avatarImages.toggleActive.useMutation({
    onSuccess: () => {
      utils.avatarImages.adminGetAll.invalidate();
      utils.avatarImages.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.avatarImages.delete.useMutation({
    onSuccess: () => {
      utils.avatarImages.adminGetAll.invalidate();
      utils.avatarImages.getAll.invalidate();
      toast.success("Đã xóa ảnh avatar");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} không phải ảnh`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} vượt quá 5MB`); continue; }
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await uploadToGallery.mutateAsync({
          dataUrl,
          label: files.length === 1 ? (label || file.name.replace(/\.[^.]+$/, "")) : file.name.replace(/\.[^.]+$/, ""),
          category: category || "default",
        });
        successCount++;
      } catch {}
    }
    setUploading(false);
    if (successCount > 0) toast.success(`Đã tải lên ${successCount} ảnh`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    try { new URL(urlInput.trim()); } catch { toast.error("URL không hợp lệ"); return; }
    await addMutation.mutateAsync({
      url: urlInput.trim(),
      fileKey: `external-${Date.now()}`,
      label: label || "Avatar",
      category: category || "default",
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.size} ảnh đã chọn?`)) return;
    for (const id of Array.from(selectedIds)) {
      await deleteMutation.mutateAsync({ id });
    }
    setSelectedIds(new Set());
  };

  const handleBulkToggle = async (active: boolean) => {
    for (const id of Array.from(selectedIds)) {
      await toggleMutation.mutateAsync({ id, isActive: active });
    }
    setSelectedIds(new Set());
  };

  // Get unique categories
  const categories = ["all", ...Array.from(new Set((avatars as any[]).map((a: any) => a.category || "default")))];

  // Filter avatars
  const filtered = (avatars as any[]).filter((a: any) => {
    const matchCat = filterCategory === "all" || (a.category || "default") === filterCategory;
    const matchSearch = !searchQuery || (a.label || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount = (avatars as any[]).filter((a: any) => a.isActive).length;

  return (
    <DashboardLayoutCustom>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Kho Ảnh Avatar</h1>
          <p className="ak-page-subtitle">Quản lý bộ sưu tập avatar cho khách hàng lựa chọn</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            <span className="text-teal-600 font-semibold">{activeCount}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span>{(avatars as any[]).length}</span>
            <span className="ml-1 text-gray-500">đang hiển thị</span>
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Upload section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" /> Thêm ảnh avatar mới
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Nhãn hiển thị (tùy chọn)</Label>
              <Input
                placeholder="VD: Avatar dễ thương, Anime..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">Danh mục</Label>
              <Input
                placeholder="VD: anime, cute, business, default..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || uploadToGallery.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(uploading || uploadToGallery.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload 1 ảnh
            </Button>
            <Button
              variant="outline"
              onClick={() => bulkFileInputRef.current?.click()}
              disabled={uploading || uploadToGallery.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload nhiều ảnh
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <Link className="h-4 w-4 mr-2" />
              Thêm từ URL
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <input ref={bulkFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          </div>
          {showUrlInput && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="https://example.com/avatar.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="h-9 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
              />
              <Button
                onClick={handleUrlAdd}
                disabled={addMutation.isPending || !urlInput.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
              </Button>
            </div>
          )}
        </div>

        {/* Filters & Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo nhãn..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent dark:text-slate-200"
              />
            </div>
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filterCategory === cat
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat === "all" ? "Tất cả" : cat}
                </button>
              ))}
            </div>
            {/* View mode */}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Đã chọn {selectedIds.size} ảnh</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} className="h-7 text-xs">
                <Eye className="h-3 w-3 mr-1" /> Hiện tất cả
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} className="h-7 text-xs">
                <EyeOff className="h-3 w-3 mr-1" /> Ẩn tất cả
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDelete} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3 w-3 mr-1" /> Xóa
              </Button>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Avatar grid/list */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              Danh sách ảnh ({filtered.length}{filterCategory !== "all" ? ` / ${(avatars as any[]).length}` : ""})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có ảnh nào</p>
              <p className="text-xs mt-1">Upload ảnh hoặc thêm từ URL để bắt đầu</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((avatar: any) => (
                <div
                  key={avatar.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedIds.has(avatar.id)
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : avatar.isActive
                      ? "border-teal-400 shadow-sm hover:shadow-md"
                      : "border-gray-200 dark:border-slate-600 opacity-60 hover:opacity-80"
                  }`}
                  onClick={() => toggleSelect(avatar.id)}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label || "Avatar"}
                    className="w-full aspect-square object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Lỗi"; }}
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setPreviewAvatar(avatar); }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                      title="Xem trước"
                    >
                      <Eye className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: avatar.id, isActive: !avatar.isActive }); }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                      title={avatar.isActive ? "Ẩn" : "Hiện"}
                    >
                      {avatar.isActive ? <EyeOff className="h-4 w-4 text-gray-700" /> : <Eye className="h-4 w-4 text-green-600" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(avatar.url); toast.success("Đã copy URL"); }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm(`Xóa ảnh "${avatar.label || "này"}"?`)) deleteMutation.mutate({ id: avatar.id }); }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${avatar.isActive ? "bg-teal-500 text-white" : "bg-gray-400 text-white"}`}>
                      {avatar.isActive ? "ON" : "OFF"}
                    </span>
                  </div>
                  {/* Select indicator */}
                  {selectedIds.has(avatar.id) && (
                    <div className="absolute top-1.5 left-1.5 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {/* Category badge */}
                  {avatar.category && avatar.category !== "default" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-white text-[10px] truncate font-medium">{avatar.label || avatar.category}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((avatar: any) => (
                <div
                  key={avatar.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedIds.has(avatar.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                  onClick={() => toggleSelect(avatar.id)}
                >
                  <img src={avatar.url} alt={avatar.label || "Avatar"} className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=Lỗi"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{avatar.label || "Không có nhãn"}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{avatar.category || "default"}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${avatar.isActive ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                    {avatar.isActive ? "Hiện" : "Ẩn"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setPreviewAvatar(avatar); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded" title="Xem trước">
                      <Eye className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: avatar.id, isActive: !avatar.isActive }); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded">
                      {avatar.isActive ? <EyeOff className="h-3.5 w-3.5 text-gray-500" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(avatar.url); toast.success("Đã copy URL"); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded">
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (confirm(`Xóa ảnh "${avatar.label || "này"}"?`)) deleteMutation.mutate({ id: avatar.id }); }} className="p-1.5 hover:bg-red-50 rounded">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewAvatar && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewAvatar(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-slate-200">Xem trước avatar</h3>
              <button onClick={() => setPreviewAvatar(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <img src={previewAvatar.url} alt={previewAvatar.label || "Avatar"} className="w-40 h-40 rounded-full object-cover border-4 border-gray-200 dark:border-slate-600 shadow-lg" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nhãn:</span>
                <span className="font-medium text-gray-800 dark:text-slate-200">{previewAvatar.label || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Danh mục:</span>
                <span className="font-medium text-gray-800 dark:text-slate-200">{previewAvatar.category || "default"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`font-medium ${previewAvatar.isActive ? "text-teal-600" : "text-gray-400"}`}>
                  {previewAvatar.isActive ? "Đang hiển thị" : "Đã ẩn"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => { navigator.clipboard.writeText(previewAvatar.url); toast.success("Đã copy URL"); }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy URL
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => { toggleMutation.mutate({ id: previewAvatar.id, isActive: !previewAvatar.isActive }); setPreviewAvatar(null); }}
              >
                {previewAvatar.isActive ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Ẩn</> : <><Eye className="h-3.5 w-3.5 mr-1" /> Hiện</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayoutCustom>
  );
}
