import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle, Download, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function InvoiceDetail() {
  const [countdown, setCountdown] = useState(3600); // 1 hour
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chi Tiết Hóa Đơn</h1>
            <p className="text-gray-600">INV001 - Công Ty ABC</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Xuất PDF
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Gửi Email
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className="bg-orange-50 border-orange-200">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Hóa đơn chưa thanh toán - Hết hạn trong: <span className="font-bold">{formatTime(countdown)}</span>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Khách Hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tên Khách Hàng</p>
                    <p className="font-semibold">Công Ty ABC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">info@abc.com</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Điện Thoại</p>
                    <p className="font-semibold">0123456789</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mã Số Thuế</p>
                    <p className="font-semibold">0123456789</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Địa Chỉ</p>
                    <p className="font-semibold">123 Đường ABC, Hà Nội</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Chi Tiết Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Mô Tả</th>
                        <th className="text-right py-2 px-2 w-16">SL</th>
                        <th className="text-right py-2 px-2 w-24">Đơn Giá</th>
                        <th className="text-right py-2 px-2 w-16">Thuế</th>
                        <th className="text-right py-2 px-2 w-24">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-2">Dịch vụ tư vấn</td>
                        <td className="py-2 px-2 text-right">10</td>
                        <td className="py-2 px-2 text-right">500,000</td>
                        <td className="py-2 px-2 text-right">10%</td>
                        <td className="py-2 px-2 text-right font-semibold">5,500,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cộng Tiền:</span>
                    <span className="font-semibold">5,000,000 VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế:</span>
                    <span className="font-semibold">500,000 VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giảm Giá:</span>
                    <span className="font-semibold">0 VND</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Tổng Cộng:</span>
                    <span className="font-bold text-blue-600">5,500,000 VND</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>Mã QR Thanh Toán</CardTitle>
                <CardDescription>PayOS - Quét để thanh toán</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-full aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">QR Code</p>
                    <p className="text-xs text-gray-500">(Mô phỏng)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Khách hàng có thể quét mã QR này để thanh toán
                </p>
              </CardContent>
            </Card>

            {/* Payment Link */}
            <Card>
              <CardHeader>
                <CardTitle>Liên Kết Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-100 p-3 rounded border border-gray-300">
                  <p className="text-xs font-mono break-all text-gray-700">
                    https://payos.vn/pay/...
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => copyToClipboard("https://payos.vn/pay/...")}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Đã Sao Chép" : "Sao Chép Liên Kết"}
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng Thái</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold">Chờ Thanh Toán</span>
                </div>
                <p className="text-xs text-gray-600">
                  Hóa đơn được tạo lúc: 30/03/2026 14:30
                </p>
                <p className="text-xs text-gray-600">
                  Hết hạn lúc: 06/04/2026 14:30
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Đánh Dấu Đã Thanh Toán
              </Button>
              <Button variant="outline" className="w-full">
                Hủy Hóa Đơn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
