import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Bell, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [companyName, setCompanyName] = useState("Invoice Prime");
  const [companyEmail, setCompanyEmail] = useState("info@invoiceprime.com");

  const handleSaveSettings = () => {
    toast.loading("Đang lưu cài đặt...");
    setTimeout(() => {
      toast.success("Cài đặt đã được lưu thành công!");
    }, 1000);
  };

  const handleChangePassword = () => {
    toast.info("Mở form đổi mật khẩu...");
  };

  const handleBackupNow = () => {
    toast.loading("Đang tạo backup...");
    setTimeout(() => {
      toast.success("Backup đã được tạo thành công!");
    }, 2000);
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    toast.success(checked ? "Bật chế độ tối!" : "Tắt chế độ tối!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài Đặt</h1>
          <p className="text-gray-600">Quản lý cài đặt hệ thống của bạn</p>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Công Ty</CardTitle>
            <CardDescription>Cập nhật thông tin công ty của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Tên Công Ty</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nhập tên công ty..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="company-email">Email Công Ty</Label>
              <Input
                id="company-email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="Nhập email công ty..."
                className="mt-2"
              />
            </div>
            <Button onClick={handleSaveSettings}>Lưu Thông Tin</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Giao Diện</CardTitle>
            <CardDescription>Tùy chỉnh giao diện ứng dụng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-gray-600" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
                <Label htmlFor="dark-mode" className="cursor-pointer">
                  Chế Độ Tối
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleToggleDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Báo</CardTitle>
            <CardDescription>Quản lý cài đặt thông báo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <Label htmlFor="email-notif" className="cursor-pointer">
                  Thông Báo Qua Email
                </Label>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                  toast.success(checked ? "Bật thông báo email!" : "Tắt thông báo email!");
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <Label htmlFor="push-notif" className="cursor-pointer">
                  Thông Báo Trên Ứng Dụng
                </Label>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={(checked) => {
                  setPushNotifications(checked);
                  toast.success(checked ? "Bật thông báo push!" : "Tắt thông báo push!");
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle>Sao Lưu & Khôi Phục</CardTitle>
            <CardDescription>Quản lý sao lưu dữ liệu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-backup" className="cursor-pointer">
                  Tự Động Sao Lưu Hàng Ngày
                </Label>
                <p className="text-sm text-gray-600 mt-1">Lần sao lưu cuối: 31/03/2026 10:30</p>
              </div>
              <Switch
                id="auto-backup"
                checked={autoBackup}
                onCheckedChange={(checked) => {
                  setAutoBackup(checked);
                  toast.success(checked ? "Bật tự động sao lưu!" : "Tắt tự động sao lưu!");
                }}
              />
            </div>
            <Button variant="outline" onClick={handleBackupNow}>
              Sao Lưu Ngay
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Bảo Mật</CardTitle>
            <CardDescription>Quản lý bảo mật tài khoản</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-600" />
                <div>
                  <Label className="cursor-pointer">Đổi Mật Khẩu</Label>
                  <p className="text-sm text-gray-600">Cập nhật mật khẩu tài khoản của bạn</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleChangePassword}>
                Đổi Mật Khẩu
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>Về Invoice Prime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>Phiên bản:</strong> 1.0.0
            </p>
            <p className="text-sm">
              <strong>Cập nhật lần cuối:</strong> 31/03/2026
            </p>
            <p className="text-sm text-gray-600">
              Invoice Prime - Công cụ quản lý hóa đơn chuyên nghiệp với tích hợp PayOS và PayPal
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
