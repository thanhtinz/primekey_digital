import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2, Key, Shield, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Globe, FileKey
} from "lucide-react";
import { toast } from "sonner";

interface LicenseSetupProps {
  onActivated: () => void;
}

const FEATURES = [
  "Quản lý hóa đơn không giới hạn",
  "Nhiều cổng thanh toán (PayOS, PayPal, v.v.)",
  "Kho avatar & thư viện ảnh",
  "Tích hợp Telegram bot",
  "Tùy chỉnh trang cảm ơn & 404",
  "Quản lý sản phẩm & gói dịch vụ",
  "Báo cáo & thống kê chi tiết",
  "Cập nhật tự động qua GitHub",
];

export default function LicenseSetup({ onActivated }: LicenseSetupProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [activationToken, setActivationToken] = useState("");
  const [domain, setDomain] = useState(window.location.hostname);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [step, setStep] = useState<"intro" | "activate" | "success">("intro");

  const activateMutation = trpc.license.activate.useMutation({
    onSuccess: (data) => {
      setStep("success");
      toast.success(data.message || "Kích hoạt license thành công!");
      setTimeout(() => {
        onActivated();
      }, 2500);
    },
    onError: (err) => {
      toast.error(err.message || "Kích hoạt thất bại. Vui lòng kiểm tra lại thông tin.");
    },
  });

  const handleActivate = () => {
    if (!licenseKey.trim()) { toast.error("Vui lòng nhập license key"); return; }
    if (!email.trim()) { toast.error("Vui lòng nhập email đăng ký"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast.error("Email không hợp lệ"); return; }
    activateMutation.mutate({
      licenseKey: licenseKey.trim(),
      email: email.trim(),
      domain,
      activationToken: activationToken.trim() || undefined,
    });
  };

  const handleLicenseKeyChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts: string[] = [];
    for (let i = 0; i < clean.length && i < 25; i += 5) {
      parts.push(clean.slice(i, i + 5));
    }
    setLicenseKey(parts.join("-"));
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kích hoạt thành công!</h1>
          <p className="text-gray-500 mb-6">Hệ thống Invoice Prime đã được kích hoạt và sẵn sàng sử dụng.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang chuyển hướng...
          </div>
        </div>
      </div>
    );
  }

  // Activate form
  if (step === "activate") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Kích Hoạt License</h1>
            <p className="text-slate-400 mt-1 text-sm">Nhập thông tin để kích hoạt hệ thống Invoice Prime</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="pt-6 space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">
                  Email đăng ký <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-sm h-11 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500">Email phải khớp với email đã đăng ký mua license</p>
              </div>

              {/* License Key */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">
                  License Key <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={licenseKey}
                  onChange={(e) => handleLicenseKeyChange(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm h-11 focus:border-blue-500 tracking-wider"
                  maxLength={29}
                />
              </div>

              {/* Activation Token */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                  <FileKey className="w-3.5 h-3.5" />
                  Activation Token <span className="text-red-400">*</span>
                </Label>
                <textarea
                  value={activationToken}
                  onChange={(e) => setActivationToken(e.target.value)}
                  placeholder="Dán activation token được cấp bởi nhà cung cấp..."
                  rows={3}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 font-mono text-xs rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-slate-500">Token xác thực chữ ký HMAC-SHA256 từ nhà cung cấp</p>
              </div>

              {/* Advanced: Domain */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Tùy chọn nâng cao
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      Domain (tự động phát hiện)
                    </Label>
                    <Input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-slate-300 text-xs h-9"
                    />
                    <p className="text-xs text-slate-600">Domain phải khớp với domain đã đăng ký trong license</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleActivate}
                disabled={activateMutation.isPending || !licenseKey.trim() || !email.trim()}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                {activateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xác thực...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" />Kích hoạt License</>
                )}
              </Button>

              {activateMutation.isError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{activateMutation.error?.message}</p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-300 font-medium mb-0.5">Bảo mật 3 lớp</p>
                  <p className="text-xs text-slate-500">
                    Xác thực: Email đăng ký + License Key + Domain + Chữ ký HMAC-SHA256
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 text-center">
            <button
              onClick={() => setStep("intro")}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← Quay lại
            </button>
          </div>

          <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
            <p className="text-xs text-slate-500 text-center">
              Chưa có license?{" "}
              <a href="mailto:support@example.com" className="text-blue-400 hover:underline">
                Liên hệ để mua license
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Intro screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Invoice Prime</h1>
          <p className="text-slate-400 text-base">Hệ thống quản lý hóa đơn chuyên nghiệp</p>
        </div>

        {/* License Required Notice */}
        <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Yêu cầu giấy phép</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Hệ thống này yêu cầu giấy phép hợp lệ để sử dụng. Vui lòng nhập license key được cấp sau khi mua.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Tính năng bao gồm trong giấy phép
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setStep("activate")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 h-12"
          >
            <Key className="w-5 h-5 mr-2" />
            Nhập License Key
          </Button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Chưa có license?{" "}
          <a href="mailto:support@example.com" className="text-blue-400 hover:underline">
            Liên hệ để mua license
          </a>
        </p>
      </div>
    </div>
  );
}
