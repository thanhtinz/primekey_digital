import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function Settings() {
  const [companyName, setCompanyName] = useState("Công Ty ABC");
  const [companyEmail, setCompanyEmail] = useState("info@abc.com");
  const [companyPhone, setCompanyPhone] = useState("0123456789");
  const [companyAddress, setCompanyAddress] = useState("123 Đường ABC, Hà Nội");
  const [taxId, setTaxId] = useState("0123456789");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài Đặt</h1>
          <p className="text-gray-600">Quản lý thông tin công ty và tùy chọn hệ thống</p>
        </div>

        {isSaved && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Cài đặt đã được lưu thành công!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">Thông Tin Công Ty</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="other">Khác</TabsTrigger>
          </TabsList>

          {/* Company Info */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Công Ty</CardTitle>
                <CardDescription>Cập nhật thông tin công ty hiển thị trên hóa đơn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tên Công Ty</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nhập tên công ty"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email</label>
                  <Input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Nhập email công ty"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Điện Thoại</label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Địa Chỉ</label>
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Nhập địa chỉ công ty"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Mã Số Thuế</label>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Nhập mã số thuế"
                  />
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  Lưu Thay Đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Cài Đặt Email</CardTitle>
                <CardDescription>Cấu hình gửi email tự động</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Tính năng gửi email sẽ được bật sau khi bạn cấu hình SMTP server
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">SMTP Server</label>
                  <Input placeholder="smtp.gmail.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">SMTP Port</label>
                  <Input placeholder="587" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email</label>
                  <Input type="email" placeholder="your-email@gmail.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Mật Khẩu</label>
                  <Input type="password" placeholder="••••••••" />
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700">
                  Kiểm Tra Kết Nối
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Settings */}
          <TabsContent value="other">
            <Card>
              <CardHeader>
                <CardTitle>Cài Đặt Khác</CardTitle>
                <CardDescription>Các tùy chọn khác của hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tiền Tệ Mặc Định</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded">
                    <option>VND (Đồng Việt Nam)</option>
                    <option>USD (Đô La Mỹ)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Định Dạng Ngày</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Múi Giờ</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded">
                    <option>UTC+7 (Việt Nam)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+8 (Singapore)</option>
                  </select>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  Lưu Thay Đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Vùng Nguy Hiểm</CardTitle>
            <CardDescription>Các hành động không thể hoàn tác</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Xóa Tất Cả Dữ Liệu
            </Button>
            <p className="text-xs text-gray-600">
              Cảnh báo: Hành động này sẽ xóa vĩnh viễn tất cả hóa đơn, khách hàng và dữ liệu khác
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
