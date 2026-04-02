import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function Settings() {
  const [formData, setFormData] = useState({
    companyName: "Invoice Prime",
    companyEmail: "info@invoiceprime.com",
    companyPhone: "(028) 1234-5678",
    taxId: "0123456789",
    darkMode: false,
    emailNotifications: true,
    invoiceReminder: true,
  });

  const handleSave = () => {
    toast.loading("Đang lưu cài đặt...");
    setTimeout(() => {
      toast.success("Cài đặt đã được cập nhật thành công!");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài Đặt Chung</h1>
          <p className="text-gray-600">Quản lý thông tin công ty và tùy chọn hệ thống</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-bold">Thông Tin Công Ty</h2>
              <div>
                <Label htmlFor="companyName">Tên Công Ty</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Nhập tên công ty"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">Điện Thoại</Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <Label htmlFor="taxId">Mã Số Thuế</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="Nhập mã số thuế"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-bold">Thông Báo</h2>
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="emailNotifications">Thông Báo Qua Email</Label>
                  <p className="text-sm text-gray-600">Nhận thông báo khi có hóa đơn mới</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="invoiceReminder">Nhắc Nhở Hóa Đơn Chưa Thanh Toán</Label>
                  <p className="text-sm text-gray-600">Nhắc nhở khách hàng thanh toán</p>
                </div>
                <Switch
                  id="invoiceReminder"
                  checked={formData.invoiceReminder}
                  onCheckedChange={(checked) => setFormData({ ...formData, invoiceReminder: checked })}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-bold">Giao Diện</h2>
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="darkMode">Chế Độ Tối</Label>
                  <p className="text-sm text-gray-600">Bật chế độ tối để giảm mỏi mắt</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={formData.darkMode}
                  onCheckedChange={(checked) => setFormData({ ...formData, darkMode: checked })}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="gap-2 w-full">
              <Save className="h-4 w-4" />
              Lưu Cài Đặt
            </Button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-bold text-blue-900 mb-2">Mẹo</h3>
              <p className="text-sm text-blue-800">Cập nhật thông tin công ty để hiển thị chính xác trên hóa đơn.</p>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <h3 className="font-bold text-green-900 mb-2">Hỗ Trợ</h3>
              <p className="text-sm text-green-800">Cần giúp đỡ? Liên hệ với chúng tôi qua email hoặc điện thoại.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
