import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Eye, EyeOff, Image, Plus, Loader2, ImageIcon, Link } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

export default function AvatarGalleryAdmin() {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("default");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File ảnh tối đa 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        await uploadToGallery.mutateAsync({
          dataUrl,
          label: label || file.name.replace(/\.[^.]+$/, ""),
          category: category || "default",
        });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.onerror = () => {
        toast.error("Không thể đọc file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Upload thất bại");
      setUploading(false);
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
    } catch {
      toast.error("URL không hợp lệ");
      return;
    }
    await addMutation.mutateAsync({
      url: urlInput.trim(),
      fileKey: `external-${Date.now()}`,
      label: label || "Avatar",
      category: category || "default",
    });
  };

  const activeCount = (avatars as any[]).filter((a: any) => a.isActive).length;

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kho Ảnh Avatar</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý ảnh avatar để khách hàng lựa chọn trong trang cá nhân</p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <span className="text-teal-600 font-semibold">{activeCount}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span>{(avatars as any[]).length}</span>
            <span className="ml-1 text-gray-500">đang hiển thị</span>
          </Badge>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#1e3a6e]" /> Thêm ảnh avatar mới
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Nhãn hiển thị (tùy chọn)</Label>
              <Input
                placeholder="VD: Avatar dễ thương, Anime..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Danh mục</Label>
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
              className="bg-[#1e3a6e] hover:bg-[#1e3a6e]/90"
            >
              {(uploading || uploadToGallery.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload từ máy tính
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <Link className="h-4 w-4 mr-2" />
              Thêm từ URL
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          {/* URL input */}
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

        {/* Avatar grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-[#1e3a6e]" /> Danh sách ảnh avatar ({(avatars as any[]).length})
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (avatars as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có ảnh avatar nào</p>
              <p className="text-xs mt-1">Upload ảnh hoặc thêm từ URL để bắt đầu</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {(avatars as any[]).map((avatar: any) => (
                <div
                  key={avatar.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                    avatar.isActive ? "border-teal-400 shadow-sm" : "border-gray-200 opacity-60"
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label || "Avatar"}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Lỗi";
                    }}
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: avatar.id, isActive: !avatar.isActive })}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title={avatar.isActive ? "Ẩn khỏi kho" : "Hiện trong kho"}
                    >
                      {avatar.isActive ? (
                        <EyeOff className="h-4 w-4 text-gray-700" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa ảnh "${avatar.label || "này"}"?`)) {
                          deleteMutation.mutate({ id: avatar.id });
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      avatar.isActive ? "bg-teal-500 text-white" : "bg-gray-400 text-white"
                    }`}>
                      {avatar.isActive ? "ON" : "OFF"}
                    </span>
                  </div>
                  {/* Label */}
                  {avatar.label && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-white text-[10px] truncate font-medium">{avatar.label}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
