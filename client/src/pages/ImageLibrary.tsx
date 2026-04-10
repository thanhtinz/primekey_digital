import { useState, useRef } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FolderOpen, FolderTree, Upload, Trash2, Plus, Image, Copy, ChevronRight, X, Search } from "@/components/Icon";

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ImageLibrary() {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders = [], refetch: refetchFolders } = trpc.imageLibrary.getFolders.useQuery();
  const { data: images = [], refetch: refetchImages } = trpc.imageLibrary.getImages.useQuery({ folderId: selectedFolderId });

  const createFolder = trpc.imageLibrary.createFolder.useMutation({
    onSuccess: () => { toast.success("Đã tạo thư mục"); refetchFolders(); setShowNewFolder(false); setNewFolderName(""); },
    onError: (e) => toast.error(e.message),
  });

  const deleteFolder = trpc.imageLibrary.deleteFolder.useMutation({
    onSuccess: () => { toast.success("Đã xóa thư mục"); refetchFolders(); setSelectedFolderId(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteImages = trpc.imageLibrary.deleteImages.useMutation({
    onSuccess: () => { toast.success("Đã xóa ảnh"); refetchImages(); setSelectedImages(new Set()); },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.imageLibrary.uploadImage.useMutation({
    onSuccess: () => { refetchImages(); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} không phải ảnh`); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} vượt quá 10MB`); continue; }
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await uploadImage.mutateAsync({
          folderId: selectedFolderId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          base64Data: base64,
        });
        successCount++;
      } catch {}
    }
    setUploading(false);
    if (successCount > 0) toast.success(`Đã tải lên ${successCount} ảnh`);
  };

  const toggleFolder = (id: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleImageSelect = (id: number) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Đã copy URL");
  };

  // Build folder tree
  const rootFolders = folders.filter(f => !f.parentId);
  const childFolders = (parentId: number) => folders.filter(f => f.parentId === parentId);

  const filteredImages = searchQuery
    ? images.filter(img => img.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
    : images;

  const renderFolder = (folder: typeof folders[0], depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = expandedFolders.has(folder.id);
    const children = childFolders(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
            isSelected ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => { setSelectedFolderId(folder.id); }}
        >
          {children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }} className="p-0.5">
              <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          ) : <span className="w-4" />}
          {isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" /> : <FolderTree className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
          <span className="flex-1 truncate">{folder.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm(`Xóa thư mục "${folder.name}"?`)) deleteFolder.mutate({ id: folder.id }); }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        {isExpanded && children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <DashboardLayoutCustom>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Thư Viện Ảnh</h1>
          <p className="ak-page-subtitle">Quản lý toàn bộ hình ảnh trên website</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setNewFolderParent(selectedFolderId); setShowNewFolder(true); }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thư mục mới
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Đang tải..." : "Tải ảnh lên"}
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold mb-4">Tạo thư mục mới</h3>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createFolder.mutate({ name: newFolderName, parentId: newFolderParent }); }}
              placeholder="Tên thư mục..."
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm mb-4 bg-transparent"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button
                onClick={() => createFolder.mutate({ name: newFolderName, parentId: newFolderParent })}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >Tạo</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Folder tree sidebar */}
        <div className="w-56 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thư mục</p>
          </div>
          <div className="p-2">
            {/* Root */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
                selectedFolderId === null ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              }`}
              onClick={() => setSelectedFolderId(null)}
            >
              <FolderOpen className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Tất cả ảnh</span>
            </div>
            {rootFolders.map(f => renderFolder(f))}
          </div>
        </div>

        {/* Image grid */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ảnh..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent"
              />
            </div>
            {selectedImages.size > 0 && (
              <button
                onClick={() => { if (confirm(`Xóa ${selectedImages.size} ảnh?`)) deleteImages.mutate({ ids: Array.from(selectedImages) }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa {selectedImages.size} ảnh
              </button>
            )}
            <span className="text-xs text-gray-500 ml-auto">{filteredImages.length} ảnh · Chấp nhận PNG, JPG, GIF, WEBP (tối đa 10MB)</span>
          </div>

          {/* Drop zone + grid */}
          <div
            className="flex-1 overflow-y-auto p-4"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          >
            {filteredImages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                <Image className="h-12 w-12 opacity-30" />
                <p className="text-sm">Chưa có ảnh nào. Kéo thả hoặc click "Tải ảnh lên"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredImages.map(img => (
                  <div
                    key={img.id}
                    className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImages.has(img.id) ? "border-blue-500 shadow-md" : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => toggleImageSelect(img.id)}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-slate-700">
                      <img src={img.url} alt={img.originalName} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={e => { e.stopPropagation(); copyUrl(img.url); }}
                        className="p-1.5 bg-white rounded-lg hover:bg-gray-100 shadow"
                        title="Copy URL"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    </div>
                    {/* Checkbox */}
                    {selectedImages.has(img.id) && (
                      <div className="absolute top-1.5 left-1.5 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {/* Info */}
                    <div className="p-1.5">
                      <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{img.originalName}</p>
                      <p className="text-[10px] text-gray-400">{formatBytes(img.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
