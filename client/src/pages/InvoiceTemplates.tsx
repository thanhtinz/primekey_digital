import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

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

  const handleAddTemplate = () => {
    toast.success("Mở form tạo mẫu hóa đơn mới!");
  };

  const handleEditTemplate = (name: string) => {
    toast.info(`Đang chỉnh sửa mẫu: ${name}`);
  };

  const handlePreviewTemplate = (name: string) => {
    toast.info(`Xem trước mẫu: ${name}`);
  };

  const handleDeleteTemplate = (name: string) => {
    toast.error(`Xác nhận xóa mẫu ${name}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            setTemplates(templates.filter((t) => t.name !== name));
            toast.success(`Mẫu ${name} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const handleSetDefault = (name: string) => {
    toast.loading("Đang đặt làm mẫu mặc định...");
    setTimeout(() => {
      setTemplates(
        templates.map((t) => ({
          ...t,
          isDefault: t.name === name,
        }))
      );
      toast.success(`Mẫu ${name} đã được đặt làm mặc định!`);
    }, 800);
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
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                        Mặc Định
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-500">Tạo: {template.createdAt}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handlePreviewTemplate(template.name)}
                  >
                    <Eye className="h-4 w-4" />
                    Xem Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleEditTemplate(template.name)}
                  >
                    <Edit className="h-4 w-4" />
                    Chỉnh Sửa
                  </Button>
                </div>
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSetDefault(template.name)}
                    >
                      Đặt Làm Mặc Định
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTemplate(template.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Info */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng Dẫn Tạo Mẫu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>1. Tạo Mẫu Mới:</strong> Nhấn nút "Tạo Mẫu Mới" để bắt đầu tạo một mẫu hóa đơn mới.
            </p>
            <p className="text-sm">
              <strong>2. Tùy Chỉnh:</strong> Chỉnh sửa bố cục, màu sắc, font chữ, logo, và thông tin công ty.
            </p>
            <p className="text-sm">
              <strong>3. Xem Trước:</strong> Xem trước mẫu trước khi lưu để đảm bảo nó trông đúng như mong muốn.
            </p>
            <p className="text-sm">
              <strong>4. Đặt Làm Mặc Định:</strong> Chọn mẫu bạn muốn sử dụng khi tạo hóa đơn mới.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
