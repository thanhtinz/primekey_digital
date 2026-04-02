import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

const mockTemplates = [
  { id: 1, name: "Mẫu Chuẩn", description: "Mẫu hóa đơn chuẩn", isDefault: true },
  { id: 2, name: "Mẫu Nâng Cao", description: "Mẫu hóa đơn với nhiều tùy chỉnh", isDefault: false },
  { id: 3, name: "Mẫu Đơn Giản", description: "Mẫu hóa đơn đơn giản", isDefault: false },
];

export default function InvoiceTemplates() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleAdd = () => {
    if (!formData.name) {
      toast.error("Vui lòng nhập tên mẫu");
      return;
    }
    if (editingId) {
      setTemplates(templates.map(t => t.id === editingId ? { ...t, ...formData } : t));
      toast.success("Cập nhật mẫu thành công!");
    } else {
      setTemplates([...templates, { id: Date.now(), ...formData, isDefault: false }]);
      toast.success("Thêm mẫu thành công!");
    }
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (template: typeof mockTemplates[0]) => {
    setFormData({ name: template.name, description: template.description });
    setEditingId(template.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa mẫu này?")) {
      setTemplates(templates.filter(t => t.id !== id));
      toast.success("Xóa mẫu thành công!");
    }
  };

  const handleSetDefault = (id: number) => {
    setTemplates(templates.map(t => ({ ...t, isDefault: t.id === id })));
    toast.success("Đặt mẫu mặc định thành công!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mẫu Hóa Đơn</h1>
            <p className="text-gray-600">Quản lý các mẫu hóa đơn</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData({ name: "", description: "" }); setEditingId(null); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm Mẫu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Sửa Mẫu" : "Thêm Mẫu"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tên Mẫu</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên mẫu" />
                </div>
                <div>
                  <Label>Mô Tả</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Nhập mô tả" />
                </div>
                <Button onClick={handleAdd} className="w-full">Lưu</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="text-gray-600 text-sm">{template.description}</p>
                </div>
                {template.isDefault && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex gap-1">
                    <Check className="h-3 w-3" />
                    Mặc định
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <Eye className="h-4 w-4" />
                  Xem
                </Button>
                <Button onClick={() => handleEdit(template)} variant="outline" size="sm" className="gap-2 flex-1">
                  <Edit className="h-4 w-4" />
                  Sửa
                </Button>
                <Button onClick={() => handleDelete(template.id)} variant="outline" size="sm" className="gap-2 flex-1 text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
              {!template.isDefault && (
                <Button onClick={() => handleSetDefault(template.id)} className="w-full mt-2" size="sm">
                  Đặt Làm Mặc Định
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
