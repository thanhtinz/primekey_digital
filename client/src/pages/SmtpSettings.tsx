import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { Mail, Save, TestTube, CheckCircle, AlertCircle, Eye, EyeOff, Info } from "@/components/Icon";
import { toast } from "sonner";

export default function SmtpSettings() {
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState("Invoice Prime");
  const [fromEmail, setFromEmail] = useState("");
  const [secure, setSecure] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestForm, setShowTestForm] = useState(false);

  const { data: config, isLoading } = trpc.smtp.get.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (config) {
      setHost(config.host || "smtp.gmail.com");
      setPort(config.port || 587);
      setUser(config.user || "");
      // Don't set password - server never returns it for security
      // hasPassword flag tells us if password is already saved
      setFromName(config.fromName || "Invoice Prime");
      setFromEmail(config.fromEmail || "");
      setSecure(config.secure || false);
      setEnabled(config.enabled !== false);
    }
  }, [config]);

  const updateMutation = trpc.smtp.update.useMutation({
    onSuccess: () => {
      utils.smtp.get.invalidate();
      toast.success("Đã lưu cấu hình SMTP");
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.smtp.test.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Email test đã gửi đến ${testEmail}`);
      } else {
        toast.error("Gửi email thất bại. Kiểm tra lại cấu hình.");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      host, port, user,
      password: password || undefined,
      fromName, fromEmail,
      secure, enabled,
    });
  };

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    testMutation.mutate({ testEmail });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cấu Hình SMTP</h1>
          <p className="text-muted-foreground mt-1">Thiết lập email để gửi thông báo đơn hàng cho khách hàng</p>
        </div>

        {/* Gmail Setup Guide */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-semibold">Hướng dẫn cấu hình Gmail:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                  <li>Vào Google Account → Security → 2-Step Verification (bật lên)</li>
                  <li>Vào App Passwords → Tạo mật khẩu ứng dụng cho "Mail"</li>
                  <li>Dùng mật khẩu ứng dụng đó (16 ký tự) thay vì mật khẩu Gmail thường</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMTP Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Cấu Hình Máy Chủ Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">Kích hoạt gửi email</p>
                    <p className="text-muted-foreground text-xs">Bật để gửi email thông báo đến khách hàng</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium text-foreground">SMTP Host</label>
                    <Input
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Port</label>
                    <Input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Email đăng nhập</label>
                  <Input
                    type="email"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="youremail@gmail.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Mật khẩu ứng dụng</label>
                  {config?.hasPassword && !password && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Đã lưu mật khẩu. Nhập mới để thay đổi.</span>
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={config?.hasPassword ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập App Password (16 ký tự)"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Dùng App Password từ Google (16 ký tự) — không dùng mật khẩu Gmail thường</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Tên người gửi</label>
                    <Input
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Invoice Prime"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Email người gửi</label>
                    <Input
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="secure"
                    checked={secure}
                    onChange={(e) => setSecure(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="secure" className="text-sm text-foreground">
                    Dùng SSL/TLS (port 465)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                    {updateMutation.isPending ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Lưu Cấu Hình
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTestForm(!showTestForm)}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Gửi Email Test
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Test Email Form */}
        {showTestForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube className="h-5 w-5 text-primary" />
                Gửi Email Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTest} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Nhập email để test..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={testMutation.isPending} className="gap-2">
                  {testMutation.isPending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Gửi Test
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Lưu cấu hình trước khi gửi email test
              </p>
            </CardContent>
          </Card>
        )}

        {/* Email Templates Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Các Mẫu Email Tự Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Tạo Đơn Hàng", desc: "Gửi khi đơn hàng được tạo mới", color: "bg-blue-100 text-blue-800" },
                { name: "Xác Nhận Thanh Toán", desc: "Gửi khi thanh toán thành công", color: "bg-green-100 text-green-800" },
                { name: "Đang Giao Hàng", desc: "Gửi khi đơn hàng được giao", color: "bg-yellow-100 text-yellow-800" },
                { name: "Bảo Hành", desc: "Gửi kèm link đánh giá sản phẩm", color: "bg-purple-100 text-purple-800" },
              ].map((template) => (
                <div key={template.name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-foreground text-sm">{template.name}</p>
                    <p className="text-muted-foreground text-xs">{template.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${template.color}`}>
                    Sẵn sàng
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
