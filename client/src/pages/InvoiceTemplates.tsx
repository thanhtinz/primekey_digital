import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Template {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
}

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Mẫu Tiêu Chuẩn",
    description: "Mẫu hóa đơn tiêu chuẩn với logo công ty",
    isDefault: true,
    createdAt: "30/03/2026",
  },
  {
    id: "2",
    name: "Mẫu Tối Giản",
    description: "Mẫu hóa đơn đơn giản, không có logo",
    isDefault: false,
    createdAt: "29/03/2026",
  },
  {
    id: "3",
    name: "Mẫu Chuyên Nghiệp",
    description: "Mẫu hóa đơn chuyên nghiệp với watermark",
    isDefault: false,
    createdAt: "28/03/2026",
  },
];

export default function InvoiceTemplates() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", description: "" });
    setIsOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
    });
    setIsOpen(true);
  };

  const handlePreviewTemplate = (name: string) => {
    toast.info(`Xem trước mẫu: ${name}`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    toast.error(`Xác nhận xóa mẫu ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setTemplates(templates.filter((t) => t.id !== id));
            toast.success(`Mẫu ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const handleSetDefault = (id: string, name: string) => {
    toast.loading("Đang đặt làm mẫu mặc định...");
    setTimeout(() => {
      setTemplates(
        templates.map((t) => ({
          ...t,
          isDefault: t.id === id,
        }))
      );
      toast.success(`Mẫu ${name} đã được đặt làm mặc định!`);
    }, 800);
  };

  const handleSaveTemplate = () => {
    if (!formData.name || !formData.description) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: formData.name, description: formData.description }
            : t
        )
      );
      toast.success("Cập nhật mẫu thành công!");
    } else {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        isDefault: false,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      setTemplates([...templates, newTemplate]);
      toast.success("Tạo mẫu thành công!");
    }
    setIsOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Mẫu Hóa Đơn</h1>
            <p className="text-gray-600">Tạo và quản lý các mẫu hóa đơn</p>
          </div>
          <Button onClick={handleAddTemplate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo Mẫu Mới
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`hover:shadow-lg transition-shadow ${
                template.isDefault ? "border-blue-500 border-2" : ""
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <CardDescription>{template.createdAt}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{template.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template.name)}
                    className="gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Xem Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(template.id, template.name)}
                    disabled={template.isDefault}
                    className="gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Mặc Định
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Chỉnh Sửa Mẫu Hóa Đơn" : "Tạo Mẫu Hóa Đơn Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Cập nhật thông tin mẫu hóa đơn"
                  : "Nhập thông tin mẫu hóa đơn mới"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên Mẫu</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên mẫu hóa đơn"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả mẫu hóa đơn"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? "Cập Nhật" : "Tạo"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
