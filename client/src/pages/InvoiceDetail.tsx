import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail, Edit, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function InvoiceDetail() {
  const [countdown, setCountdown] = useState(3600); // 1 hour in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownloadPDF = () => {
    toast.loading("Đang tạo file PDF...");
    setTimeout(() => {
      toast.success("Hóa đơn đã được tải xuống thành công!");
    }, 1500);
  };

  const handleSendEmail = () => {
    toast.loading("Đang gửi email...");
    setTimeout(() => {
      toast.success("Email đã được gửi thành công!");
    }, 1200);
  };

  const handleCopyQRCode = () => {
    toast.success("Đã sao chép mã QR!");
  };

  const handleEdit = () => {
    toast.info("Đang mở chỉnh sửa hóa đơn...");
  };

  const handleDelete = () => {
    toast.error("Xác nhận hủy hóa đơn này?", {
      action: {
        label: "Hủy",
        onClick: () => {
          toast.loading("Đang hủy...");
          setTimeout(() => {
            toast.success("Hóa đơn đã được hủy thành công!");
          }, 800);
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chi Tiết Hóa Đơn</h1>
            <p className="text-gray-600">Hóa đơn #INV001</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh Sửa
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Hủy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Số Hóa Đơn</p>
                    <p className="font-semibold">INV001</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày Tạo</p>
                    <p className="font-semibold">30/03/2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hạn Thanh Toán</p>
                    <p className="font-semibold">06/04/2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loại Tiền Tệ</p>
                    <p className="font-semibold">VND</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Khách Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">Công Ty ABC</p>
                <p className="text-sm text-gray-600">Email: contact@abc.com</p>
                <p className="text-sm text-gray-600">Điện thoại: 0912345678</p>
                <p className="text-sm text-gray-600">Địa chỉ: 123 Đường Nguyễn Huệ, TP.HCM</p>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Chi Tiết Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Mô Tả</th>
                        <th className="text-center py-2 px-4">Số Lượng</th>
                        <th className="text-right py-2 px-4">Giá</th>
                        <th className="text-right py-2 px-4">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4">Dịch vụ thiết kế web</td>
                        <td className="text-center py-2 px-4">1</td>
                        <td className="text-right py-2 px-4">5,000,000 VND</td>
                        <td className="text-right py-2 px-4">5,000,000 VND</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p>Cộng:</p>
                    <p className="font-semibold">5,000,000 VND</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Thuế (10%):</p>
                    <p className="font-semibold">500,000 VND</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Giảm giá:</p>
                    <p className="font-semibold">0 VND</p>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <p className="font-bold">Tổng Cộng:</p>
                    <p className="font-bold text-lg">5,500,000 VND</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng Thái Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-100 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800">⏳ Chờ Thanh Toán</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Hết hạn trong:</p>
                  <p className="text-2xl font-bold text-red-600">{formatTime(countdown)}</p>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>Mã QR Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">QR Code</p>
                    <p className="text-xs text-gray-500 mt-2">Quét để thanh toán qua PayOS</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleCopyQRCode}
                >
                  <Copy className="h-4 w-4" />
                  Sao Chép Mã QR
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành Động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full gap-2" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4" />
                  Tải PDF
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handleSendEmail}>
                  <Mail className="h-4 w-4" />
                  Gửi Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
