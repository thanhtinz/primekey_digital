import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Check, AlertCircle, Eye, EyeOff, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function PayPalSettings() {
  const [, setLocation] = useLocation();
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    paypalClientId: "",
    paypalSecret: "",
    paypalMode: "sandbox" as "sandbox" | "live",
  });

  const { data: config } = trpc.paymentGateways.get.useQuery();
  const updateGateway = trpc.paymentGateways.update.useMutation();
  const testConnection = trpc.paymentGateways.testConnection.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (config) {
      setFormData({
        paypalClientId: config.paypalClientId || "",
        paypalSecret: config.paypalSecretKey || "",
        paypalMode: (config.paypalMode as "sandbox" | "live") || "sandbox",
      });
    }
  }, [config]);

  const handleTestConnection = async () => {
    if (!formData.paypalClientId || !formData.paypalSecret) {
      toast.error("Vui lòng nhập đầy đủ thông tin API");
      return;
    }
    setIsTesting(true);
    try {
      // Save first, then test
      await updateGateway.mutateAsync({
        paypalClientId: formData.paypalClientId,
        paypalSecret: formData.paypalSecret,
        paypalMode: formData.paypalMode,
      });
      const result = await testConnection.mutateAsync({ gateway: "paypal" });
      if (result.success) {
        setConnectionStatus("success");
        toast.success(result.message || "Kết nối PayPal thành công!");
      } else {
        setConnectionStatus("error");
        toast.error(result.message || "Kết nối thất bại");
      }
    } catch (err: any) {
      setConnectionStatus("error");
      toast.error(err.message || "Kết nối thất bại. Kiểm tra lại thông tin API");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.paypalClientId || !formData.paypalSecret) {
      toast.error("Vui lòng nhập đầy đủ thông tin API");
      return;
    }
    setIsSaving(true);
    try {
      await updateGateway.mutateAsync(formData);
      await utils.paymentGateways.get.invalidate();
      toast.success("Đã lưu cấu hình PayPal!");
    } catch {
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
            <h1 className="text-2xl font-bold text-gray-900">Cấu Hình PayPal</h1>
            <p className="text-sm text-gray-500">Kết nối cổng thanh toán PayPal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* API Configuration */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Thông Tin API PayPal</CardTitle>
                <CardDescription>Lấy thông tin từ PayPal Developer Dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Chế Độ</Label>
                  <Select
                    value={formData.paypalMode}
                    onValueChange={(v) => setFormData({ ...formData, paypalMode: v as "sandbox" | "live" })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                          Sandbox (Thử Nghiệm)
                        </div>
                      </SelectItem>
                      <SelectItem value="live">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                          Live (Thực Tế)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">Dùng Sandbox để thử nghiệm, Live để nhận tiền thật</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Client ID</Label>
                  <Input
                    value={formData.paypalClientId}
                    onChange={(e) => setFormData({ ...formData, paypalClientId: e.target.value })}
                    placeholder="Nhập PayPal Client ID"
                    className="mt-1.5 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lấy từ PayPal Developer → My Apps & Credentials</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Secret Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={formData.paypalSecret}
                      onChange={(e) => setFormData({ ...formData, paypalSecret: e.target.value })}
                      placeholder="Nhập Secret Key"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Secret Key bí mật, không chia sẻ với ai</p>
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
                          <p className="text-xs text-green-600">PayPal API ({formData.paypalMode}) đang hoạt động</p>
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
                  <li>Đăng nhập PayPal Developer</li>
                  <li>Vào "My Apps & Credentials"</li>
                  <li>Tạo hoặc chọn Application</li>
                  <li>Copy Client ID & Secret Key</li>
                  <li>Dán vào các trường bên trái</li>
                </ol>
                <a
                  href="https://developer.paypal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-blue-700 hover:underline font-medium"
                >
                  Mở PayPal Developer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-yellow-100 bg-yellow-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 text-sm">Lưu Ý Sandbox</h3>
                <p className="text-sm text-yellow-800">
                  Chế độ Sandbox dùng để kiểm thử. Khi sẵn sàng nhận tiền thật, chuyển sang chế độ Live.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Webhook URL</h3>
                <p className="text-xs text-gray-500 mb-2">Cấu hình URL này trong PayPal Dashboard:</p>
                <div className="bg-gray-100 rounded p-2 text-xs font-mono text-gray-700 break-all">
                  {window.location.origin}/api/webhooks/paypal
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
