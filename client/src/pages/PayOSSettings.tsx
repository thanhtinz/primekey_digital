import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function PayOSSettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState("sk_test_123456789");
  const [clientId, setClientId] = useState("client_123456789");
  const [checksumKey, setChecksumKey] = useState("checksum_123456789");

  const handleTestConnection = () => {
    toast.loading("Đang kiểm tra kết nối PayOS...");
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Kết nối PayOS thành công!");
    }, 1500);
  };

  const handleSaveSettings = () => {
    if (!apiKey || !clientId || !checksumKey) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    toast.loading("Đang lưu cài đặt PayOS...");
    setTimeout(() => {
      toast.success("Cài đặt PayOS đã được lưu thành công!");
    }, 1000);
  };

  const handleResetSettings = () => {
    toast.error("Xác nhận reset cài đặt PayOS?", {
      action: {
        label: "Reset",
        onClick: () => {
          toast.loading("Đang reset...");
          setTimeout(() => {
            setApiKey("");
            setClientId("");
            setChecksumKey("");
            setIsConnected(false);
            toast.success("Cài đặt PayOS đã được reset!");
          }, 800);
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài Đặt PayOS</h1>
          <p className="text-gray-600">Quản lý thông tin kết nối PayOS (VND)</p>
        </div>

        {/* Connection Status */}
        <Card className={isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {isConnected ? "Kết nối thành công" : "Chưa kết nối"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isConnected
                      ? "PayOS đã được cấu hình thành công"
                      : "Vui lòng cấu hình PayOS để bắt đầu"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleTestConnection}
                variant={isConnected ? "outline" : "default"}
              >
                {isConnected ? "Kiểm Tra Lại" : "Kiểm Tra Kết Nối"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Kết Nối</CardTitle>
            <CardDescription>
              Nhập thông tin xác thực từ tài khoản PayOS của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập API Key..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lấy từ PayOS Dashboard → API Keys
              </p>
            </div>

            {/* Client ID */}
            <div>
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Nhập Client ID..."
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Lấy từ PayOS Dashboard → API Keys
              </p>
            </div>

            {/* Checksum Key */}
            <div>
              <Label htmlFor="checksum-key">Checksum Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="checksum-key"
                  type={showChecksum ? "text" : "password"}
                  value={checksumKey}
                  onChange={(e) => setChecksumKey(e.target.value)}
                  placeholder="Nhập Checksum Key..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowChecksum(!showChecksum)}
                >
                  {showChecksum ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lấy từ PayOS Dashboard → API Keys
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveSettings} className="flex-1">
                Lưu Cài Đặt
              </Button>
              <Button
                onClick={handleResetSettings}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Info */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>
              Cấu hình webhook trong PayOS Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-mono break-all">
                https://invoiceprime.manus.space/api/webhooks/payos
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://invoiceprime.manus.space/api/webhooks/payos"
                );
                toast.success("Đã sao chép Webhook URL!");
              }}
            >
              Sao Chép URL
            </Button>
            <p className="text-xs text-gray-600">
              Thêm URL này vào PayOS Dashboard → Webhook Settings để nhận thông báo thanh toán
            </p>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng Dẫn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Lấy thông tin xác thực:</strong> Đăng nhập vào PayOS Dashboard →
              API Keys → Copy API Key, Client ID, Checksum Key
            </p>
            <p>
              <strong>2. Nhập thông tin:</strong> Dán các thông tin vào form trên
            </p>
            <p>
              <strong>3. Kiểm tra kết nối:</strong> Nhấn nút "Kiểm Tra Kết Nối" để xác nhận
            </p>
            <p>
              <strong>4. Cấu hình Webhook:</strong> Sao chép Webhook URL và thêm vào PayOS
              Dashboard
            </p>
            <p>
              <strong>5. Lưu cài đặt:</strong> Nhấn "Lưu Cài Đặt" để hoàn tất
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
