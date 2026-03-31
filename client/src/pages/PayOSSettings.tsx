import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function PayOSSettings() {
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [checksumKey, setChecksumKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Call API to save PayOS config
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    // TODO: Call API to test PayOS connection
    setTimeout(() => {
      setIsLoading(false);
      setTestResult({
        success: true,
        message: "Kết nối PayOS thành công! ✓",
      });
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cấu Hình PayOS</h1>
          <p className="text-gray-600">Quản lý API Key và thông tin kết nối PayOS</p>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Để tích hợp PayOS, bạn cần cấp API Key, Client ID và Checksum Key từ tài khoản PayOS của bạn.
            <br />
            <a href="https://dashboard.payos.vn" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              Đăng nhập PayOS Dashboard →
            </a>
          </AlertDescription>
        </Alert>

        {/* Success Alert */}
        {isSaved && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Cấu hình PayOS đã được lưu thành công!
            </AlertDescription>
          </Alert>
        )}

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <CheckCircle className={`h-4 w-4 ${testResult.success ? "text-green-600" : "text-red-600"}`} />
            <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Kết Nối</CardTitle>
            <CardDescription>Nhập thông tin API từ PayOS Dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">API Key</label>
              <Input
                type="password"
                placeholder="Nhập API Key từ PayOS"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tìm trong: PayOS Dashboard → Settings → API Keys
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Client ID</label>
              <Input
                type="password"
                placeholder="Nhập Client ID từ PayOS"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tìm trong: PayOS Dashboard → Settings → API Keys
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Checksum Key</label>
              <Input
                type="password"
                placeholder="Nhập Checksum Key từ PayOS"
                value={checksumKey}
                onChange={(e) => setChecksumKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tìm trong: PayOS Dashboard → Settings → API Keys
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={handleTestConnection}
                disabled={isLoading || !apiKey || !clientId || !checksumKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang Kiểm Tra...
                  </>
                ) : (
                  "Kiểm Tra Kết Nối"
                )}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 gap-2"
                onClick={handleSave}
                disabled={isLoading || !apiKey || !clientId || !checksumKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang Lưu...
                  </>
                ) : (
                  "Lưu Cấu Hình"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Webhook</CardTitle>
            <CardDescription>Thêm URL này vào PayOS Dashboard để nhận thông báo thanh toán</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 p-4 rounded border border-gray-300">
              <p className="text-sm font-mono break-all">
                {window.location.origin}/api/webhooks/payos
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/payos`);
            }}>
              Sao Chép URL
            </Button>
            <p className="text-xs text-gray-600">
              Đi tới: PayOS Dashboard → Settings → Webhook → thêm URL trên
            </p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Kết Nối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Chưa kết nối (Vui lòng lưu cấu hình)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
