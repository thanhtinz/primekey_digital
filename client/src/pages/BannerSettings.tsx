import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ExternalLink, ImageIcon, Upload, Link } from "@/components/Icon";

type NewBanner = { imageUrl: string; title: string; linkUrl: string; sortOrder: number };

function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.banner.uploadImage.useMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 5MB)");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          mimeType: file.type,
          fileName: file.name,
        });
        onChange(result.url);
        toast.success("Đã tải ảnh lên");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Tải ảnh lên
        </Button>
        <Button
          type="button"
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("url")}
        >
          <Link className="w-3.5 h-3.5 mr-1.5" /> Nhập URL
        </Button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {value ? (
              <div className="space-y-2">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg mx-auto"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <p className="text-xs text-muted-foreground">Click để đổi ảnh</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {uploading ? "Đang tải lên..." : "Click để chọn ảnh (JPG, PNG, GIF — tối đa 5MB)"}
                </p>
              </div>
            )}
          </div>
          {uploading && (
            <p className="text-xs text-primary mt-1 animate-pulse">Đang tải ảnh lên S3...</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="https://example.com/banner.jpg"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <img
              src={value}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function BannerSettings() {
  const [newBanner, setNewBanner] = useState<NewBanner>({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 });
  const [isAdding, setIsAdding] = useState(false);

  const { data: banners, refetch } = trpc.banner.list.useQuery();
  const createMutation = trpc.banner.create.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm banner");
      setIsAdding(false);
      setNewBanner({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.banner.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.banner.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa banner"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Banner</h1>
          <p className="text-muted-foreground text-sm mt-1">Banner hiển thị trên trang chủ (slideshow)</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Banner
        </Button>
      </div>

      {isAdding && (
        <Card className="border-2 border-primary/30">
          <CardHeader><CardTitle className="text-base">Banner Mới</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ảnh Banner *</Label>
              <ImageUploadField
                value={newBanner.imageUrl}
                onChange={(url) => setNewBanner(p => ({ ...p, imageUrl: url }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiêu đề (tùy chọn)</Label>
                <Input
                  placeholder="Tiêu đề banner"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Link khi click (tùy chọn)</Label>
                <Input
                  placeholder="/catalog hoặc https://..."
                  value={newBanner.linkUrl}
                  onChange={(e) => setNewBanner(p => ({ ...p, linkUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={newBanner.sortOrder}
                onChange={(e) => setNewBanner(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-32"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate(newBanner)}
                disabled={!newBanner.imageUrl || createMutation.isPending}
              >
                {createMutation.isPending ? "Đang lưu..." : "Lưu Banner"}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!banners || banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có banner nào. Thêm banner để hiển thị trên trang chủ.</p>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{banner.title || "Banner không có tiêu đề"}</span>
                      <span className="text-xs text-muted-foreground">#{banner.sortOrder}</span>
                    </div>
                    {banner.linkUrl && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{banner.linkUrl}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive ?? true}
                          onCheckedChange={(checked) => updateMutation.mutate({ id: banner.id, isActive: checked })}
                        />
                        <span className="text-sm text-muted-foreground">{banner.isActive ? "Hiển thị" : "Ẩn"}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Xóa banner này?")) deleteMutation.mutate({ id: banner.id }); }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
