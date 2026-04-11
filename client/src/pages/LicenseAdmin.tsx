import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Key, Shield, CheckCircle2, XCircle, AlertTriangle, Crown,
  Calendar, Globe, User, Copy, RefreshCw, Loader2, Info,
  Award, Zap, Package, Lock, Clock, Star,
  ShieldCheck, ShieldX
} from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

const PLAN_CONFIG: Record<string, {
  label: string; color: string; bgColor: string; borderColor: string;
  icon: React.ReactNode; features: string[]; badge: string;
}> = {
  standard: {
    label: "Standard", color: "text-blue-700", bgColor: "bg-blue-50",
    borderColor: "border-blue-200", badge: "bg-blue-100 text-blue-700",
    icon: <Package className="h-5 w-5 text-blue-600" />,
    features: ["Quản lý hóa đơn cơ bản", "Tối đa 500 hóa đơn/tháng", "1 người dùng", "Hỗ trợ email"],
  },
  pro: {
    label: "Pro", color: "text-purple-700", bgColor: "bg-purple-50",
    borderColor: "border-purple-200", badge: "bg-purple-100 text-purple-700",
    icon: <Zap className="h-5 w-5 text-purple-600" />,
    features: ["Không giới hạn hóa đơn", "Tối đa 5 người dùng", "Báo cáo nâng cao", "Tích hợp PayOS & PayPal", "Hỗ trợ ưu tiên"],
  },
  enterprise: {
    label: "Enterprise", color: "text-amber-700", bgColor: "bg-amber-50",
    borderColor: "border-amber-200", badge: "bg-amber-100 text-amber-700",
    icon: <Crown className="h-5 w-5 text-amber-600" />,
    features: ["Không giới hạn mọi thứ", "Người dùng không giới hạn", "API tùy chỉnh", "SLA 99.9%", "Hỗ trợ 24/7 qua hotline"],
  },
};

function StatusBadge({ activated, expiresAt }: { activated: boolean; expiresAt?: string | null }) {
  if (!activated) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
      <ShieldX className="h-3.5 w-3.5" /> Chưa kích hoạt
    </span>
  );
  if (expiresAt) {
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        <XCircle className="h-3.5 w-3.5" /> Đã hết hạn
      </span>
    );
    if (daysLeft <= 30) return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" /> Còn {daysLeft} ngày
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5" /> Đang hoạt động
    </span>
  );
}

export default function LicenseAdmin() {
  const [newKey, setNewKey] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newToken, setNewToken] = useState("");
  const [domain, setDomain] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const { data: status, isLoading, refetch } = trpc.license.getStatus.useQuery();

  const activateMutation = trpc.license.activate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Kích hoạt thành công!");
      setNewKey(""); setNewEmail(""); setNewToken(""); setDomain(""); refetch();
    },
    onError: (err) => toast.error(err.message || "Kích hoạt thất bại"),
  });

  const deactivateMutation = trpc.license.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Đã hủy kích hoạt license");
      setShowDeactivateConfirm(false); refetch();
    },
    onError: (err) => toast.error(err.message || "Hủy kích hoạt thất bại"),
  });

  const handleActivate = () => {
    if (!newKey.trim()) { toast.error("Vui lòng nhập license key"); return; }
    if (!newEmail.trim()) { toast.error("Vui lòng nhập email đăng ký"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) { toast.error("Email không hợp lệ"); return; }
    activateMutation.mutate({
      licenseKey: newKey.trim(),
      email: newEmail.trim(),
      domain: domain.trim() || undefined,
      activationToken: newToken.trim() || undefined,
    });
  };

  const plan = status?.plan || "standard";
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.standard;
  const daysLeft = status?.expiresAt
    ? Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Quản lý Giấy Phép
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Kích hoạt và quản lý license cho hệ thống</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Status Card */}
            <Card className={`border-2 ${status?.activated ? planConfig.borderColor : "border-red-200"}`}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${status?.activated ? planConfig.bgColor : "bg-red-50"}`}>
                    {status?.activated ? planConfig.icon : <ShieldX className="h-7 w-7 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {status?.activated ? `Gói ${planConfig.label}` : "Chưa có giấy phép"}
                      </h2>
                      <StatusBadge activated={status?.activated ?? false} expiresAt={status?.expiresAt} />
                    </div>
                    {status?.activated ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                        {status.email && (
                          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                            <span className="text-blue-400 flex-shrink-0 text-sm">✉</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Email đăng ký</p>
                              <p className="text-sm font-medium text-gray-800 truncate">{status.email}</p>
                            </div>
                          </div>
                        )}
                        {status.licenseKey && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <Key className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">License Key</p>
                              <p className="text-sm font-mono font-medium text-gray-800 truncate">{status.licenseKey}</p>
                            </div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(status.licenseKey!); toast.success("Đã sao chép!"); }}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {status.domain && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Domain</p>
                              <p className="text-sm font-medium text-gray-800 truncate">{status.domain}</p>
                            </div>
                          </div>
                        )}
                        {status.owner && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Chủ sở hữu</p>
                              <p className="text-sm font-medium text-gray-800 truncate">{status.owner}</p>
                            </div>
                          </div>
                        )}
                        {status.activatedAt && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Ngày kích hoạt</p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(status.activatedAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                        )}
                        {status.expiresAt ? (
                          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${daysLeft !== null && daysLeft <= 30 ? "bg-amber-50" : "bg-gray-50"}`}>
                            <Calendar className={`h-4 w-4 flex-shrink-0 ${daysLeft !== null && daysLeft <= 30 ? "text-amber-500" : "text-gray-400"}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Hết hạn</p>
                              <p className={`text-sm font-medium ${daysLeft !== null && daysLeft <= 30 ? "text-amber-700" : "text-gray-800"}`}>
                                {new Date(status.expiresAt).toLocaleDateString("vi-VN")}
                                {daysLeft !== null && daysLeft > 0 && (
                                  <span className="ml-1 text-xs">({daysLeft} ngày)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                            <Star className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Thời hạn</p>
                              <p className="text-sm font-medium text-emerald-700">Vĩnh viễn</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        Hệ thống chưa được kích hoạt. Nhập license key để bắt đầu sử dụng đầy đủ tính năng.
                      </p>
                    )}
                  </div>
                </div>

                {status?.activated && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    {showDeactivateConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">Xác nhận hủy kích hoạt?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deactivateMutation.mutate()}
                          disabled={deactivateMutation.isPending}
                        >
                          {deactivateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Xác nhận"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowDeactivateConfirm(false)}>Hủy</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setShowDeactivateConfirm(true)}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1.5" /> Hủy kích hoạt
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activate Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  {status?.activated ? "Thay đổi License Key" : "Kích hoạt License Key"}
                </CardTitle>
                <CardDescription>
                  {status?.activated
                    ? "Nhập license key mới để thay thế license hiện tại"
                    : "Nhập license key được cung cấp khi mua để kích hoạt hệ thống"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="activateEmail">Email đăng ký <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span>
                    <Input
                      id="activateEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email phải khớp với email đã đăng ký mua license</p>
                </div>
                {/* License Key */}
                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="licenseKey"
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                      className="pl-9 font-mono tracking-wider"
                      onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                    />
                  </div>
                </div>
                {/* Activation Token */}
                <div className="space-y-2">
                  <Label htmlFor="activationToken">Activation Token <span className="text-red-500">*</span></Label>
                  <textarea
                    id="activationToken"
                    placeholder="Dán activation token được cấp bởi nhà cung cấp..."
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    rows={3}
                    className="w-full border border-input rounded-md px-3 py-2 text-xs font-mono bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <p className="text-xs text-gray-500">Token xác thực chữ ký HMAC-SHA256 từ nhà cung cấp</p>
                </div>
                {/* Advanced: Domain */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    {showAdvanced ? "Ẩn" : "Hiện"} tùy chọn domain
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-2">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="example.com (mặc định: domain hiện tại)"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          className="pl-9 text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-400">Domain phải khớp với domain đã đăng ký trong license</p>
                    </div>
                  )}
                </div>
                {/* Security notice */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600">Xác thực đồng thời: Email + License Key + Domain + Chữ ký HMAC-SHA256</p>
                </div>
                <Button
                  onClick={handleActivate}
                  disabled={activateMutation.isPending || !newKey.trim() || !newEmail.trim()}
                  className="w-full sm:w-auto"
                >
                  {activateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang xác thực...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 mr-2" /> Kích hoạt ngay</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Plan Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" /> So sánh các gói
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
                  const isCurrentPlan = status?.activated && plan === key;
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isCurrentPlan
                          ? `${cfg.borderColor} ${cfg.bgColor}`
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {cfg.icon}
                          <span className="font-semibold text-gray-900">{cfg.label}</span>
                        </div>
                        {isCurrentPlan && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {cfg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Lưu ý về giấy phép</p>
                <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
                  <li>License key được gửi qua email sau khi thanh toán thành công</li>
                  <li>Mỗi license key chỉ dùng cho một domain duy nhất</li>
                  <li>Liên hệ hỗ trợ nếu cần chuyển license sang domain khác</li>
                  <li>Hệ thống sẽ tự xác minh license mỗi 24 giờ</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
