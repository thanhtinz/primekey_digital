import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Pencil, Check, X } from "lucide-react";

const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function TagSettings() {
  const utils = trpc.useUtils();
  const { data: tags = [], isLoading } = trpc.productTags.list.useQuery(undefined);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const createTag = trpc.productTags.create.useMutation({
    onSuccess: () => {
      utils.productTags.list.invalidate();
      setNewName("");
      setNewColor("#3b82f6");
      toast.success("Đã tạo tag!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTag = trpc.productTags.update.useMutation({
    onSuccess: () => {
      utils.productTags.list.invalidate();
      setEditingId(null);
      toast.success("Đã cập nhật tag!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTag = trpc.productTags.delete.useMutation({
    onSuccess: () => {
      utils.productTags.list.invalidate();
      toast.success("Đã xóa tag!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newName.trim()) { toast.error("Nhập tên tag"); return; }
    createTag.mutate({ name: newName.trim(), color: newColor });
  };

  const startEdit = (tag: any) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || "#3b82f6");
  };

  const handleUpdate = () => {
    if (!editingId) return;
    if (!editName.trim()) { toast.error("Nhập tên tag"); return; }
    updateTag.mutate({ id: editingId, name: editName.trim(), color: editColor });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý Tag sản phẩm</h1>
            <p className="text-sm text-gray-500">Tạo và quản lý các tag hiển thị trên sản phẩm</p>
          </div>
        </div>

        {/* Create new tag */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo tag mới
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <Input
              placeholder="Tên tag (VD: Hot, New, Sale...)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <div className="relative">
              <input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                title="Chọn màu"
              />
            </div>
          </div>
          {/* Preset colors */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          {/* Preview */}
          {newName && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Preview:</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: newColor }}>{newName}</span>
            </div>
          )}
          <Button onClick={handleCreate} disabled={createTag.isPending} className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Tạo tag
          </Button>
        </div>

        {/* Tag list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Danh sách tag ({(tags as any[]).length})</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : (tags as any[]).length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Chưa có tag nào. Tạo tag đầu tiên!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(tags as any[]).map((tag: any) => (
                <div key={tag.id} className="px-5 py-3 flex items-center gap-3">
                  {editingId === tag.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={e => e.key === "Enter" && handleUpdate()}
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5"
                      />
                      <button onClick={handleUpdate} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: tag.color || '#3b82f6' }}>{tag.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{tag.color}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => startEdit(tag)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xóa tag "${tag.name}"?`)) deleteTag.mutate({ id: tag.id });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Để gán tag cho sản phẩm, vào trang chỉnh sửa sản phẩm và chọn tag trong phần "Tags sản phẩm"
        </p>
      </div>
    </DashboardLayout>
  );
}
