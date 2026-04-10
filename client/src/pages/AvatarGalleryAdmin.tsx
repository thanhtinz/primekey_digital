import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Eye, EyeOff, Plus, Loader2, ImageIcon, Link, Search, X, Copy, Grid3X3, List } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

export default function AvatarGalleryAdmin() {
  const [uploading, setUploading] = useState(false);
  const utils = trpc.useUtils();
  const { data: settingsData } = trpc.settings.get.useQuery();
  const settings = settingsData as any;
  const featureEnabled = settings?.featureAvatarGallery !== false;

  const toggleFeatureMutation = trpc.settings.updateFeaturesSettings.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success(featureEnabled ? "Đã tắt kho avatar — người dùng không thể chọn avatar" : "Đã bật kho avatar");
    },
    onError: (err) => toast.error(err.message),
  });
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("default");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewAvatar, setPreviewAvatar] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

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

  const categories = ["all", ...Array.from(new Set((avatars as any[]).map((a: any) => a.category || "default")))];
  const filtered = (avatars as any[]).filter((a: any) => {
    const matchCat = filterCategory === "all" || (a.category || "default") === filterCategory;
    const matchSearch = !searchQuery || (a.label || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });
  const activeCount = (avatars as any[]).filter((a: any) => a.isActive).length;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal-600" /> Kho Avatar
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeCount}/{(avatars as any[]).length} ảnh đang hiển thị
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Feature toggle */}
            <button
              onClick={() => toggleFeatureMutation.mutate({ featureAvatarGallery: !featureEnabled })}
              disabled={toggleFeatureMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                featureEnabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <i className={`fa-solid ${featureEnabled ? "fa-toggle-on text-emerald-500" : "fa-toggle-off text-gray-400"} text-base`} />
              {featureEnabled ? "Đang bật" : "Đang tắt"}
            </button>
            <Button
              size="sm"
              onClick={() => setShowAddPanel(p => !p)}
              className="h-8 gap-1.5 text-xs bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm ảnh
            </Button>
          </div>
        </div>

        {/* Feature disabled warning */}
        {!featureEnabled && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <i className="fa-solid fa-circle-exclamation text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Kho avatar đang tắt</p>
              <p className="text-xs text-amber-600 mt-0.5">Người dùng không thể chọn avatar từ kho. Bật lại để cho phép.</p>
            </div>
          </div>
        )}

        {/* Add Panel */}
        {showAddPanel && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-teal-600" /> Thêm ảnh mới
              </h2>
              <button onClick={() => setShowAddPanel(false)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Nhãn hiển thị (tùy chọn)</Label>
                <Input placeholder="VD: Avatar dễ thương..." value={label} onChange={e => setLabel(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Danh mục</Label>
                <Input placeholder="VD: anime, cute, business..." value={category} onChange={e => setCategory(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || uploadToGallery.isPending} className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
                {(uploading || uploadToGallery.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                Upload 1 ảnh
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkFileInputRef.current?.click()} disabled={uploading || uploadToGallery.isPending} className="h-8 text-xs">
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload nhiều
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowUrlInput(!showUrlInput)} className="h-8 text-xs">
                <Link className="h-3.5 w-3.5 mr-1" /> Từ URL
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <input ref={bulkFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            </div>
            {showUrlInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="h-8 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && handleUrlAdd()}
                />
                <Button size="sm" onClick={handleUrlAdd} disabled={addMutation.isPending || !urlInput.trim()} className="h-8 text-xs bg-teal-600 hover:bg-teal-700">
                  {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Thêm"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo nhãn..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-teal-100 text-teal-600" : "text-gray-400 hover:bg-gray-100"}`}>
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-teal-100 text-teal-600" : "text-gray-400 hover:bg-gray-100"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Category pills - scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex-shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                  filterCategory === cat
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat === "all" ? "Tất cả" : cat}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-100">
              <span className="text-xs font-medium text-teal-700">Đã chọn {selectedIds.size}</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} className="h-6 text-xs px-2">
                <Eye className="h-3 w-3 mr-1" /> Hiện
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} className="h-6 text-xs px-2">
                <EyeOff className="h-3 w-3 mr-1" /> Ẩn
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDelete} className="h-6 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3 w-3 mr-1" /> Xóa
              </Button>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Avatar grid/list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} ảnh{filterCategory !== "all" ? ` trong "${filterCategory}"` : ""}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Chưa có ảnh nào</p>
              <p className="text-xs mt-1">Upload ảnh hoặc thêm từ URL để bắt đầu</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filtered.map((avatar: any) => (
                <div
                  key={avatar.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                    selectedIds.has(avatar.id)
                      ? "border-teal-500 ring-2 ring-teal-200"
                      : avatar.isActive
                      ? "border-teal-300 hover:border-teal-400"
                      : "border-gray-200 opacity-50 hover:opacity-70"
                  }`}
                  onClick={() => toggleSelect(avatar.id)}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label || "Avatar"}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Lỗi"; }}
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); setPreviewAvatar(avatar); }}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                    >
                      <Eye className="h-3.5 w-3.5 text-gray-700" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleMutation.mutate({ id: avatar.id, isActive: !avatar.isActive }); }}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                    >
                      {avatar.isActive ? <EyeOff className="h-3.5 w-3.5 text-gray-700" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm("Xóa ảnh này?")) deleteMutation.mutate({ id: avatar.id }); }}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-1 right-1">
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${avatar.isActive ? "bg-teal-500 text-white" : "bg-gray-400 text-white"}`}>
                      {avatar.isActive ? "ON" : "OFF"}
                    </span>
                  </div>
                  {/* Select indicator */}
                  {selectedIds.has(avatar.id) && (
                    <div className="absolute top-1 left-1 h-4 w-4 bg-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((avatar: any) => (
                <div
                  key={avatar.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedIds.has(avatar.id)
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleSelect(avatar.id)}
                >
                  <img src={avatar.url} alt={avatar.label || "Avatar"} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=Lỗi"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{avatar.label || "Không có nhãn"}</p>
                    <p className="text-xs text-gray-400">{avatar.category || "default"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${avatar.isActive ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                    {avatar.isActive ? "Hiện" : "Ẩn"}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPreviewAvatar(avatar)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Eye className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => toggleMutation.mutate({ id: avatar.id, isActive: !avatar.isActive })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      {avatar.isActive ? <EyeOff className="h-3.5 w-3.5 text-gray-500" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(avatar.url); toast.success("Đã copy URL"); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => { if (confirm("Xóa ảnh này?")) deleteMutation.mutate({ id: avatar.id }); }} className="p-1.5 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">Xem trước</h3>
              <button onClick={() => setPreviewAvatar(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center mb-3">
              <img
                src={previewAvatar.url}
                alt={previewAvatar.label}
                className="w-32 h-32 rounded-2xl object-cover shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/128x128?text=Lỗi"; }}
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Nhãn</span>
                <span className="font-medium text-gray-800 text-xs">{previewAvatar.label || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Danh mục</span>
                <span className="font-medium text-gray-800 text-xs">{previewAvatar.category || "default"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Trạng thái</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${previewAvatar.isActive ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                  {previewAvatar.isActive ? "Đang hiển thị" : "Đang ẩn"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(previewAvatar.url); toast.success("Đã copy URL"); }}
                className="flex-1 h-8 text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy URL
              </Button>
              <Button
                size="sm"
                onClick={() => { toggleMutation.mutate({ id: previewAvatar.id, isActive: !previewAvatar.isActive }); setPreviewAvatar(null); }}
                className={`flex-1 h-8 text-xs ${previewAvatar.isActive ? "bg-gray-600 hover:bg-gray-700" : "bg-teal-600 hover:bg-teal-700"}`}
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
