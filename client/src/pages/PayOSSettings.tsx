import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Check, AlertCircle, Eye, EyeOff, ArrowLeft, Loader2, ExternalLink, Copy, Webhook, RefreshCw, CheckCircle2, XCircle } from "@/components/Icon";
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
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "success" | "error">("idle");
  const [webhookMessage, setWebhookMessage] = useState("");
  const [formData, setFormData] = useState({
    payosApiKey: "",
    payosClientId: "",
    payosChecksumKey: "",
  });

  const webhookUrl = `${window.location.origin}/api/webhooks/payos`;

  // Load existing config
  const { data: config } = trpc.paymentGateways.get.useQuery();
  const updateGateway = trpc.paymentGateways.update.useMutation();
  const testConnection = trpc.paymentGateways.testConnection.useMutation();
  const testWebhookMutation = trpc.paymentGateways.testWebhook.useMutation();
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

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookStatus("idle");
    try {
      const result = await testWebhookMutation.mutateAsync({ webhookUrl });
      if (result.success) {
        setWebhookStatus("success");
        setWebhookMessage(result.message || "Webhook phản hồi thành công");
        toast.success("Webhook endpoint hoạt động tốt!");
      } else {
        setWebhookStatus("error");
        setWebhookMessage(result.message || `HTTP ${result.statusCode}`);
        toast.error("Webhook không phản hồi đúng");
      }
    } catch (err: any) {
      setWebhookStatus("error");
      setWebhookMessage(err.message || "Không thể kết nối");
      toast.error("Test webhook thất bại");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Đã sao chép Webhook URL!");
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
                  <p className="text-xs text-gray-400 mt-1">Dùng để xác thực chữ ký webhook từ PayOS</p>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Kiểm Tra Kết Nối API</CardTitle>
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
                  ) : "Kiểm Tra Kết Nối API"}
                </Button>
              </CardContent>
            </Card>

            {/* Webhook Status Card */}
            <Card className="shadow-sm border border-purple-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-purple-600" />
                    <CardTitle className="text-base font-semibold">Webhook PayOS</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      webhookStatus === "success"
                        ? "border-green-300 text-green-700 bg-green-50"
                        : webhookStatus === "error"
                        ? "border-red-300 text-red-700 bg-red-50"
                        : "border-gray-200 text-gray-500 bg-gray-50"
                    }
                  >
                    {webhookStatus === "success" ? "Hoạt động" : webhookStatus === "error" ? "Lỗi" : "Chưa kiểm tra"}
                  </Badge>
                </div>
                <CardDescription>
                  Cấu hình URL này trong PayOS Dashboard để nhận thông báo thanh toán tức thì
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Webhook URL display */}
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Webhook URL</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all select-all">
                      {webhookUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyWebhookUrl}
                      className="shrink-0 gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Sao chép
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Webhook test result */}
                {webhookStatus !== "idle" && (
                  <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                    webhookStatus === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}>
                    {webhookStatus === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${webhookStatus === "success" ? "text-green-800" : "text-red-800"}`}>
                        {webhookStatus === "success" ? "Webhook hoạt động tốt" : "Webhook không phản hồi"}
                      </p>
                      <p className={`text-xs mt-0.5 ${webhookStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                        {webhookMessage}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  variant="outline"
                  className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isTestingWebhook ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Đang gửi test...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" />Gửi Test Webhook</>
                  )}
                </Button>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Hướng dẫn cấu hình:</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Đăng nhập <a href="https://my.payos.vn" target="_blank" rel="noopener noreferrer" className="underline font-medium">PayOS Dashboard</a></li>
                    <li>Vào <strong>Cài đặt → Webhook</strong></li>
                    <li>Dán URL webhook ở trên vào trường "Webhook URL"</li>
                    <li>Nhấn "Gửi Test Webhook" để xác nhận kết nối</li>
                  </ol>
                </div>
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
                  href="https://my.payos.vn"
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

            <Card className="shadow-sm border border-purple-100 bg-purple-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-purple-900 mb-2 text-sm">Webhook hoạt động như thế nào?</h3>
                <p className="text-sm text-purple-800">
                  Khi khách hàng thanh toán thành công, PayOS sẽ gọi về URL webhook của bạn. Hệ thống sẽ tự động cập nhật trạng thái hóa đơn sang <strong>PAID</strong> và gửi email xác nhận cho khách — không cần chờ polling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
