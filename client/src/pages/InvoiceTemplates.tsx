import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface Template {
  id: string;
  name: string;
  companyName: string;
  companyLogo: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  footer: string;
  createdAt: string;
}

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Mẫu Mặc Định",
    companyName: "Công Ty ABC",
    companyLogo: "https://via.placeholder.com/50",
    companyEmail: "info@abc.com",
    companyPhone: "0123456789",
    companyAddress: "123 Đường ABC, Hà Nội",
    footer: "Cảm ơn bạn đã tin tưởng chúng tôi",
    createdAt: "30/03/2026",
  },
];

export default function InvoiceTemplates() {
  const [templates, setTemplates] = useState(mockTemplates);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mẫu Hóa Đơn</h1>
            <p className="text-gray-600">Quản lý các mẫu hóa đơn của bạn</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" />
            Tạo Mẫu Mới
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-xs">{template.companyName}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold">Email:</span> {template.companyEmail}</p>
                  <p><span className="font-semibold">Điện thoại:</span> {template.companyPhone}</p>
                  <p><span className="font-semibold">Địa chỉ:</span> {template.companyAddress}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600">Tạo lúc: {template.createdAt}</p>
                </div>
                <Button variant="outline" className="w-full">
                  Sử Dụng Mẫu Này
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Chưa có mẫu hóa đơn nào. Hãy tạo mẫu mới!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
