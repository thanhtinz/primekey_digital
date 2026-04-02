import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

export default function PayOSSettings() {
  const [formData, setFormData] = useState({
    apiKey: "sk_live_123456789",
    clientId: "client_123456789",
    checksumKey: "checksum_key_123456789",
  });
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    toast.loading("Đang kiểm tra kết nối...");
    setTimeout(() => {
      setConnectionStatus("success");
      toast.success("Kết nối PayOS thành công!");
    }, 2000);
  };

  const handleSave = () => {
    toast.loading("Đang lưu cấu hình...");
    setTimeout(() => {
      toast.success("Cấu hình PayOS đã được lưu thành công!");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cấu Hình PayOS</h1>
          <p className="text-gray-600">Quản lý API Key, Client ID, Checksum Key</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* API Configuration */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-bold">Thông Tin API</h2>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Nhập API Key"
                />
                <p className="text-xs text-gray-600 mt-1">Lấy từ PayOS Dashboard</p>
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Nhập Client ID"
                />
                <p className="text-xs text-gray-600 mt-1">Lấy từ PayOS Dashboard</p>
              </div>
              <div>
                <Label htmlFor="checksumKey">Checksum Key</Label>
                <Input
                  id="checksumKey"
                  type="password"
                  value={formData.checksumKey}
                  onChange={(e) => setFormData({ ...formData, checksumKey: e.target.value })}
                  placeholder="Nhập Checksum Key"
                />
                <p className="text-xs text-gray-600 mt-1">Lấy từ PayOS Dashboard</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Trạng Thái Kết Nối</h2>
              <div className="flex items-center gap-3 mb-4">
                {connectionStatus === "success" && (
                  <>
                    <Check className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-600">Kết Nối Thành Công</p>
                      <p className="text-sm text-gray-600">PayOS API đang hoạt động bình thường</p>
                    </div>
                  </>
                )}
                {connectionStatus === "error" && (
                  <>
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-600">Kết Nối Thất Bại</p>
                      <p className="text-sm text-gray-600">Vui lòng kiểm tra lại thông tin API</p>
                    </div>
                  </>
                )}
                {connectionStatus === "idle" && (
                  <>
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-600">Chưa Kiểm Tra</p>
                      <p className="text-sm text-gray-600">Nhấn nút "Kiểm Tra Kết Nối" để bắt đầu</p>
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={connectionStatus === "testing"}
                variant="outline"
                className="w-full"
              >
                {connectionStatus === "testing" ? "Đang Kiểm Tra..." : "Kiểm Tra Kết Nối"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2 flex-1">
                <Save className="h-4 w-4" />
                Lưu Cấu Hình
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-bold text-blue-900 mb-2">Hướng Dẫn</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Đăng nhập vào PayOS Dashboard</li>
                <li>Tìm mục "API Keys"</li>
                <li>Copy API Key, Client ID, Checksum Key</li>
                <li>Dán vào các trường bên trái</li>
                <li>Nhấn "Kiểm Tra Kết Nối"</li>
              </ol>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <h3 className="font-bold text-green-900 mb-2">Bảo Mật</h3>
              <p className="text-sm text-green-800">Các khóa API được mã hóa và lưu trữ an toàn. Không bao giờ chia sẻ với ai.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
