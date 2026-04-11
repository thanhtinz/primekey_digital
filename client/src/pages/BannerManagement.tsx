/**
 * BannerManagement - Quản lý tất cả banner:
 * Tab 1: Banner chính (slideshow trang chủ)
 * Tab 2: Side Banner (2 bên trái/phải carousel PC)
 * Tab 3: Mini Banner (lưới 4 ô dưới carousel)
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ImageIcon, Upload, Link, ExternalLink, GripVertical, LayoutDashboard, LayoutGrid, Grid3X3 } from "@/components/Icon";
import { toast } from "sonner";

// ------------------------------------------------------------
function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.banner.uploadImage.useMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh quá lớn (tối đa 5MB)"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, mimeType: file.type, fileName: file.name });
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
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "upload" ? "default" : "outline"} size="sm" onClick={() => setMode("upload")}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Tải lên
        </Button>
        <Button type="button" variant={mode === "url" ? "default" : "outline"} size="sm" onClick={() => setMode("url")}>
          <Link className="w-3.5 h-3.5 mr-1.5" /> URL
        </Button>
      </div>
      {mode === "upload" ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {value ? (
              <div className="space-y-2">
                <img src={value} alt="Preview" className="w-full max-h-36 object-cover rounded-lg mx-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p className="text-xs text-gray-400">Click để đổi ảnh</p>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <Upload className="w-7 h-7 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400">{uploading ? "Đang tải lên..." : "Click để chọn ảnh (JPG, PNG — tối đa 5MB)"}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input placeholder="https://example.com/banner.jpg" value={value} onChange={(e) => onChange(e.target.value)} />
          {value && <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} />}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
type TabId = "banners" | "side" | "mini";

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string; color: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  {
    id: "banners", label: "Banner Chính", icon: <LayoutDashboard className="h-5 w-5" />,
    desc: "Slideshow trang chủ",
    color: "text-violet-500", activeBg: "bg-violet-50", activeText: "text-violet-700", activeBorder: "border-violet-500",
  },
  {
    id: "side", label: "Side Banner", icon: <LayoutGrid className="h-5 w-5" />,
    desc: "Hai bên carousel PC",
    color: "text-sky-500", activeBg: "bg-sky-50", activeText: "text-sky-700", activeBorder: "border-sky-500",
  },
  {
    id: "mini", label: "Mini Banner", icon: <Grid3X3 className="h-5 w-5" />,
    desc: "Lưới 4 ô dưới carousel",
    color: "text-emerald-500", activeBg: "bg-emerald-50", activeText: "text-emerald-700", activeBorder: "border-emerald-500",
  },
];

function TabBar({ active, onChange, counts }: { active: TabId; onChange: (t: TabId) => void; counts: Record<TabId, number> }) {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/80 border-b border-gray-200">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200
              ${
                isActive
                  ? `${tab.activeBg} ${tab.activeBorder} shadow-sm`
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }
            `}
          >
            {/* Icon box */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${isActive ? `${tab.activeBg} ${tab.color}` : `bg-gray-100 text-gray-400 group-hover:bg-gray-200`}
            `}>
              {tab.icon}
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${isActive ? tab.activeText : "text-gray-700"}`}>{tab.label}</span>
                <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex-shrink-0
                  ${isActive ? `${tab.activeBg} ${tab.activeText}` : "bg-gray-100 text-gray-500"}
                `}>{counts[tab.id]}</span>
              </div>
              <p className={`text-xs mt-0.5 truncate ${isActive ? tab.color : "text-gray-400"}`}>{tab.desc}</p>
            </div>
            {/* Active indicator dot */}
            {isActive && (
              <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${tab.color.replace("text-", "bg-")}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
export default function BannerManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("banners");

  // ------------------------------------------------------------
  const { data: banners = [], refetch: refetchBanners } = trpc.banner.list.useQuery();
  const createBannerMutation = trpc.banner.create.useMutation({
    onSuccess: () => { toast.success("Đã thêm banner"); setAddingBanner(false); setNewBanner({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 }); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const updateBannerMutation = trpc.banner.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteBannerMutation = trpc.banner.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa banner"); refetchBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const [addingBanner, setAddingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0 });

  // ------------------------------------------------------------
  const { data: sideBanners = [], refetch: refetchSideBanners } = trpc.sideBanners.list.useQuery();
  const upsertSideBannerMutation = trpc.sideBanners.upsert.useMutation({
    onSuccess: () => { toast.success("Đã lưu side banner"); refetchSideBanners(); setAddingSideBanner(false); setNewSideBanner({ position: "left", imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSideBannerMutation = trpc.sideBanners.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa side banner"); refetchSideBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const [newSideBanner, setNewSideBanner] = useState({ position: "left" as "left" | "right", imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true });
  const [addingSideBanner, setAddingSideBanner] = useState(false);

  // ------------------------------------------------------------
  const { data: miniBanners = [], refetch: refetchMiniBanners } = trpc.miniBanners.list.useQuery();
  const upsertMiniBannerMutation = trpc.miniBanners.upsert.useMutation({
    onSuccess: () => { toast.success("Đã lưu mini banner"); refetchMiniBanners(); setAddingMiniBanner(false); setNewMiniBanner({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMiniBannerMutation = trpc.miniBanners.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa mini banner"); refetchMiniBanners(); },
    onError: (e) => toast.error(e.message),
  });
  const [newMiniBanner, setNewMiniBanner] = useState({ imageUrl: "", title: "", linkUrl: "", sortOrder: 0, isActive: true });
  const [addingMiniBanner, setAddingMiniBanner] = useState(false);

  const counts: Record<TabId, number> = {
    banners: (banners as any[]).length,
    side:    (sideBanners as any[]).length,
    mini:    (miniBanners as any[]).length,
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Banner</h1>
            <p className="ak-page-subtitle">Quản lý banner slideshow, side banner và mini banner trang chủ</p>
          </div>
          {activeTab === "banners" ? (
            <Button onClick={() => setAddingBanner(true)} disabled={addingBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Banner
            </Button>
          ) : activeTab === "side" ? (
            <Button onClick={() => setAddingSideBanner(true)} disabled={addingSideBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Side Banner
            </Button>
          ) : (
            <Button onClick={() => setAddingMiniBanner(true)} disabled={addingMiniBanner} className="gap-1.5 bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4" /> Thêm Mini Banner
            </Button>
          )}
        </div>

        {/* Tab Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TabBar active={activeTab} onChange={setActiveTab} counts={counts} />

          <div className="p-5">

            {/* ── Tab 1: Main Banners ── */}
            {activeTab === "banners" && (
              <div className="space-y-4">
                {addingBanner && (
                  <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50/30 space-y-4">
                    <h3 className="font-semibold text-gray-900">Banner Mới</h3>
                    <div>
                      <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                      <div className="mt-1.5"><ImageUploadField value={newBanner.imageUrl} onChange={(url) => setNewBanner(p => ({ ...p, imageUrl: url }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tiêu đề (tùy chọn)</Label>
                        <Input placeholder="Tiêu đề banner" value={newBanner.title} onChange={(e) => setNewBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Link khi click</Label>
                        <Input placeholder="/catalog hoặc https://..." value={newBanner.linkUrl} onChange={(e) => setNewBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => createBannerMutation.mutate(newBanner)} disabled={!newBanner.imageUrl || createBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {createBannerMutation.isPending ? "Đang lưu..." : "Lưu Banner"}
                      </Button>
                      <Button variant="outline" onClick={() => setAddingBanner(false)}>Hủy</Button>
                    </div>
                  </div>
                )}

                {(banners as any[]).length === 0 && !addingBanner ? (
                  <div className="ak-empty py-12">
                    <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                    <div className="ak-empty-title">Chưa có banner nào</div>
                    <div className="ak-empty-desc">Thêm banner để hiển thị slideshow trên trang chủ</div>
                    <Button onClick={() => setAddingBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Thêm Banner</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(banners as any[]).map((banner: any) => (
                      <div key={banner.id} className={`flex gap-4 items-start p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition ${!banner.isActive ? "opacity-60" : ""}`}>
                        <GripVertical className="w-5 h-5 text-gray-300 mt-2 flex-shrink-0" />
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-28 object-cover rounded-lg flex-shrink-0 border border-gray-100" style={{ height: "72px" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0" style={{ height: "72px" }}>
                            <ImageIcon className="w-7 h-7 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{banner.title || "Banner không có tiêu đề"}</p>
                          {banner.linkUrl && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{banner.linkUrl}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center gap-2">
                              <Switch checked={banner.isActive ?? true} onCheckedChange={(checked) => updateBannerMutation.mutate({ id: banner.id, isActive: checked })} />
                              <span className="text-xs text-gray-500">{banner.isActive ? "Hiển thị" : "Ẩn"}</span>
                            </div>
                            <button onClick={() => { if (confirm("Xóa banner này?")) deleteBannerMutation.mutate({ id: banner.id }); }}
                              className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 2: Side Banners ── */}
            {activeTab === "side" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                  ℹ️ Side banner hiển thị hai bên trái/phải của carousel chính trên màn hình PC. Mỗi vị trí chỉ hiển thị 1 banner.
                </p>
                {addingSideBanner && (
                  <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                    <h3 className="font-semibold text-gray-900">Side Banner Mới</h3>
                    <div>
                      <Label className="text-sm font-medium">Vị trí</Label>
                      <Select value={newSideBanner.position} onValueChange={v => setNewSideBanner(p => ({ ...p, position: v as "left" | "right" }))}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Bên trái</SelectItem>
                          <SelectItem value="right">Bên phải</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                      <div className="mt-1.5"><ImageUploadField value={newSideBanner.imageUrl} onChange={url => setNewSideBanner(p => ({ ...p, imageUrl: url }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Tiêu đề</Label>
                        <Input placeholder="Tiêu đề (tùy chọn)" value={newSideBanner.title} onChange={e => setNewSideBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Link khi click</Label>
                        <Input placeholder="/catalog hoặc https://..." value={newSideBanner.linkUrl} onChange={e => setNewSideBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => upsertSideBannerMutation.mutate(newSideBanner)} disabled={!newSideBanner.imageUrl || upsertSideBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {upsertSideBannerMutation.isPending ? "Đang lưu..." : "Lưu Side Banner"}
                      </Button>
                      <Button variant="outline" onClick={() => setAddingSideBanner(false)}>Hủy</Button>
                    </div>
                  </div>
                )}
                {(sideBanners as any[]).length === 0 && !addingSideBanner ? (
                  <div className="ak-empty py-12">
                    <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                    <div className="ak-empty-title">Chưa có side banner</div>
                    <div className="ak-empty-desc">Thêm banner hiển thị hai bên carousel trên PC</div>
                    <Button onClick={() => setAddingSideBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Thêm</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(sideBanners as any[]).map((sb: any) => (
                      <div key={sb.id} className={`flex gap-4 items-start p-3 rounded-xl border border-gray-100 hover:bg-gray-50 ${!sb.isActive ? "opacity-60" : ""}`}>
                        {sb.imageUrl ? (
                          <img src={sb.imageUrl} alt={sb.title || ""} className="w-24 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" onError={e => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">{sb.title || "Side Banner"}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sb.position === "left" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {sb.position === "left" ? "Trái" : "Phải"}
                            </span>
                          </div>
                          {sb.linkUrl && <p className="text-xs text-gray-400 truncate">{sb.linkUrl}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            <Switch checked={sb.isActive ?? true} onCheckedChange={checked => upsertSideBannerMutation.mutate({ id: sb.id, position: sb.position, imageUrl: sb.imageUrl, title: sb.title, linkUrl: sb.linkUrl, isActive: checked })} />
                            <span className="text-xs text-gray-500">{sb.isActive ? "Hiển thị" : "Ẩn"}</span>
                            <button onClick={() => { if (confirm("Xóa side banner này?")) deleteSideBannerMutation.mutate({ id: sb.id }); }}
                              className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 3: Mini Banners ── */}
            {activeTab === "mini" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                  ℹ️ Mini banner hiển thị dưới carousel chính theo dạng lưới 4 ô. Tối đa 8 banner.
                </p>
                {addingMiniBanner && (
                  <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                    <h3 className="font-semibold text-gray-900">Mini Banner Mới</h3>
                    <div>
                      <Label className="text-sm font-medium">Ảnh Banner <span className="text-red-500">*</span></Label>
                      <div className="mt-1.5"><ImageUploadField value={newMiniBanner.imageUrl} onChange={url => setNewMiniBanner(p => ({ ...p, imageUrl: url }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Tiêu đề</Label>
                        <Input placeholder="Tiêu đề (tùy chọn)" value={newMiniBanner.title} onChange={e => setNewMiniBanner(p => ({ ...p, title: e.target.value }))} className="mt-1.5" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Link khi click</Label>
                        <Input placeholder="/catalog hoặc https://..." value={newMiniBanner.linkUrl} onChange={e => setNewMiniBanner(p => ({ ...p, linkUrl: e.target.value }))} className="mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Thứ tự hiển thị</Label>
                      <Input type="number" placeholder="0" value={newMiniBanner.sortOrder} onChange={e => setNewMiniBanner(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="mt-1.5 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => upsertMiniBannerMutation.mutate(newMiniBanner)} disabled={!newMiniBanner.imageUrl || upsertMiniBannerMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {upsertMiniBannerMutation.isPending ? "Đang lưu..." : "Lưu Mini Banner"}
                      </Button>
                      <Button variant="outline" onClick={() => setAddingMiniBanner(false)}>Hủy</Button>
                    </div>
                  </div>
                )}
                {(miniBanners as any[]).length === 0 && !addingMiniBanner ? (
                  <div className="ak-empty py-12">
                    <div className="ak-empty-icon"><ImageIcon className="h-6 w-6" /></div>
                    <div className="ak-empty-title">Chưa có mini banner</div>
                    <div className="ak-empty-desc">Thêm mini banner hiển thị dưới carousel theo lưới 4 ô</div>
                    <Button onClick={() => setAddingMiniBanner(true)} size="sm" className="mt-3 gap-1.5 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /> Thêm</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(miniBanners as any[]).map((mb: any) => (
                      <div key={mb.id} className={`relative rounded-xl overflow-hidden border border-gray-100 group ${!mb.isActive ? "opacity-60" : ""}`}>
                        {mb.imageUrl ? (
                          <img src={mb.imageUrl} alt={mb.title || ""} className="w-full h-20 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                        )}
                        {mb.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs font-bold leading-tight truncate">{mb.title}</p>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Switch checked={mb.isActive ?? true} onCheckedChange={checked => upsertMiniBannerMutation.mutate({ id: mb.id, imageUrl: mb.imageUrl, title: mb.title, linkUrl: mb.linkUrl, isActive: checked, sortOrder: mb.sortOrder })} />
                          <button onClick={() => { if (confirm("Xóa mini banner?")) deleteMiniBannerMutation.mutate({ id: mb.id }); }}
                            className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
