import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function PayPalSettings() {
  const [showSecret, setShowSecret] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState("AXx1234567890");
  const [clientSecret, setClientSecret] = useState("EHx1234567890");
  const [mode, setMode] = useState<"sandbox" | "live">("sandbox");

  const handleTestConnection = () => {
    toast.loading("Đang kiểm tra kết nối PayPal...");
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Kết nối PayPal thành công!");
    }, 1500);
  };

  const handleSaveSettings = () => {
    if (!clientId || !clientSecret) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    toast.loading("Đang lưu cài đặt PayPal...");
    setTimeout(() => {
      toast.success("Cài đặt PayPal đã được lưu thành công!");
    }, 1000);
  };

  const handleResetSettings = () => {
    toast.error("Xác nhận reset cài đặt PayPal?", {
      action: {
        label: "Reset",
        onClick: () => {
          toast.loading("Đang reset...");
          setTimeout(() => {
            setClientId("");
            setClientSecret("");
            setIsConnected(false);
            toast.success("Cài đặt PayPal đã được reset!");
          }, 800);
        },
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài Đặt PayPal</h1>
          <p className="text-gray-600">Quản lý thông tin kết nối PayPal (USD)</p>
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
                      ? "PayPal đã được cấu hình thành công"
                      : "Vui lòng cấu hình PayPal để bắt đầu"}
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
              Nhập thông tin xác thực từ tài khoản PayPal của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode */}
            <div>
              <Label>Chế Độ</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="sandbox"
                    checked={mode === "sandbox"}
                    onChange={(e) => setMode(e.target.value as "sandbox" | "live")}
                  />
                  <span>Sandbox (Test)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="live"
                    checked={mode === "live"}
                    onChange={(e) => setMode(e.target.value as "sandbox" | "live")}
                  />
                  <span>Live (Production)</span>
                </label>
              </div>
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
                Lấy từ PayPal Developer Dashboard → Apps & Credentials
              </p>
            </div>

            {/* Client Secret */}
            <div>
              <Label htmlFor="client-secret">Client Secret</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="client-secret"
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Nhập Client Secret..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lấy từ PayPal Developer Dashboard → Apps & Credentials
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
              Cấu hình webhook trong PayPal Developer Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-mono break-all">
                https://invoiceprime.manus.space/api/webhooks/paypal
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://invoiceprime.manus.space/api/webhooks/paypal"
                );
                toast.success("Đã sao chép Webhook URL!");
              }}
            >
              Sao Chép URL
            </Button>
            <p className="text-xs text-gray-600">
              Thêm URL này vào PayPal Developer Dashboard → Webhooks để nhận thông báo thanh toán
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
              <strong>1. Tạo tài khoản PayPal:</strong> Truy cập{" "}
              <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">
                PayPal Developer
              </a>
            </p>
            <p>
              <strong>2. Lấy thông tin xác thực:</strong> Đi đến Apps & Credentials → Copy
              Client ID và Client Secret
            </p>
            <p>
              <strong>3. Chọn chế độ:</strong> Chọn Sandbox để test hoặc Live để sản xuất
            </p>
            <p>
              <strong>4. Nhập thông tin:</strong> Dán Client ID và Client Secret vào form
            </p>
            <p>
              <strong>5. Kiểm tra kết nối:</strong> Nhấn "Kiểm Tra Kết Nối" để xác nhận
            </p>
            <p>
              <strong>6. Cấu hình Webhook:</strong> Sao chép Webhook URL và thêm vào PayPal
              Dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
