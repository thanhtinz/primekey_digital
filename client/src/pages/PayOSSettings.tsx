import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, AlertCircle, Eye, EyeOff, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function PayOSSettings() {
  const [, setLocation] = useLocation();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    payosApiKey: "",
    payosClientId: "",
    payosChecksumKey: "",
  });

  // Load existing config
  const { data: config } = trpc.paymentGateways.get.useQuery();
  const updateGateway = trpc.paymentGateways.update.useMutation();
  const testConnection = trpc.paymentGateways.testConnection.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (config) {
      setFormData({
        payosApiKey: config.payosApiKey || "",
        payosClientId: config.payosClientId || "",
        payosChecksumKey: config.payosChecksumKey || "",
      });
    }
  }, [config]);

  const handleTestConnection = async () => {
    if (!formData.payosApiKey || !formData.payosClientId || !formData.payosChecksumKey) {
      toast.error("Vui lòng nhập đầy đủ thông tin API");
      return;
    }
    setIsTesting(true);
    try {
      // Save first, then test
      await updateGateway.mutateAsync(formData);
      const result = await testConnection.mutateAsync({ gateway: "payos" });
      if (result.success) {
        setConnectionStatus("success");
        toast.success(result.message || "Kết nối PayOS thành công!");
      } else {
        setConnectionStatus("error");
        toast.error(result.message || "Kết nối thất bại");
      }
    } catch (err: any) {
      setConnectionStatus("error");
      toast.error(err.message || "Kết nối thất bại. Kiểm tra lại API Key");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.payosApiKey || !formData.payosClientId || !formData.payosChecksumKey) {
      toast.error("Vui lòng nhập đầy đủ thông tin API");
      return;
    }
    setIsSaving(true);
    try {
      await updateGateway.mutateAsync(formData);
      await utils.paymentGateways.get.invalidate();
      toast.success("Đã lưu cấu hình PayOS!");
    } catch (err) {
      toast.error("Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/settings")} className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cấu Hình PayOS</h1>
            <p className="text-sm text-gray-500">Kết nối cổng thanh toán PayOS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* API Configuration */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Thông Tin API PayOS</CardTitle>
                <CardDescription>Lấy thông tin từ PayOS Developer Dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Client ID</Label>
                  <Input
                    value={formData.payosClientId}
                    onChange={(e) => setFormData({ ...formData, payosClientId: e.target.value })}
                    placeholder="Nhập Client ID từ PayOS Dashboard"
                    className="mt-1.5 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Tìm trong mục "Thông tin tích hợp" trên PayOS Dashboard</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={formData.payosApiKey}
                      onChange={(e) => setFormData({ ...formData, payosApiKey: e.target.value })}
                      placeholder="Nhập API Key"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">API Key bí mật, không chia sẻ với ai</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Checksum Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showChecksum ? "text" : "password"}
                      value={formData.payosChecksumKey}
                      onChange={(e) => setFormData({ ...formData, payosChecksumKey: e.target.value })}
                      placeholder="Nhập Checksum Key"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChecksum(!showChecksum)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showChecksum ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Dùng để xác thực webhook từ PayOS</p>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Kiểm Tra Kết Nối</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectionStatus !== "idle" && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    connectionStatus === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}>
                    {connectionStatus === "success" ? (
                      <>
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800 text-sm">Kết Nối Thành Công</p>
                          <p className="text-xs text-green-600">PayOS API đang hoạt động bình thường</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800 text-sm">Kết Nối Thất Bại</p>
                          <p className="text-xs text-red-600">Vui lòng kiểm tra lại thông tin API</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="w-full"
                >
                  {isTesting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang kiểm tra...</>
                  ) : "Kiểm Tra Kết Nối"}
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 flex-1 bg-blue-600 hover:bg-blue-700">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu Cấu Hình
              </Button>
              <Button variant="outline" onClick={() => setLocation("/settings")}>Hủy</Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="shadow-sm border border-blue-100 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Hướng Dẫn Lấy API Key</h3>
                <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                  <li>Đăng nhập PayOS Dashboard</li>
                  <li>Vào mục "Thông tin tích hợp"</li>
                  <li>Copy Client ID, API Key, Checksum Key</li>
                  <li>Dán vào các trường bên trái</li>
                  <li>Nhấn "Kiểm Tra Kết Nối"</li>
                </ol>
                <a
                  href="https://payos.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-blue-700 hover:underline font-medium"
                >
                  Mở PayOS Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-green-100 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-900 mb-2 text-sm">Bảo Mật</h3>
                <p className="text-sm text-green-800">
                  Các khóa API được mã hóa và lưu trữ an toàn trong database. Không bao giờ chia sẻ API Key với bất kỳ ai.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Webhook URL</h3>
                <p className="text-xs text-gray-500 mb-2">Cấu hình URL này trong PayOS Dashboard:</p>
                <div className="bg-gray-100 rounded p-2 text-xs font-mono text-gray-700 break-all">
                  {window.location.origin}/api/webhooks/payos
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
