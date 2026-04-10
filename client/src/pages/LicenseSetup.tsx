import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Key, Shield, Zap, Star, AlertCircle, Loader2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

interface LicenseSetupProps {
  onActivated: () => void;
}

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
    features: ["Quản lý hóa đơn cơ bản", "Tối đa 500 hóa đơn/tháng", "1 cổng thanh toán", "Email thông báo", "Hỗ trợ qua email"],
  },
  {
    id: "pro",
    name: "Pro",
    color: "bg-purple-500",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    bgColor: "bg-purple-50",
    popular: true,
    features: ["Tất cả tính năng Standard", "Hóa đơn không giới hạn", "Nhiều cổng thanh toán", "Kho avatar & thư viện ảnh", "Telegram bot", "Tùy chỉnh giao diện", "Hỗ trợ ưu tiên"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50",
    features: ["Tất cả tính năng Pro", "Multi-tenant", "API tùy chỉnh", "SLA 99.9%", "Hỗ trợ 24/7", "Onboarding riêng"],
  },
];

export default function LicenseSetup({ onActivated }: LicenseSetupProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [domain, setDomain] = useState(window.location.hostname);
  const [step, setStep] = useState<"intro" | "activate" | "success">("intro");
  const [activatedPlan, setActivatedPlan] = useState<string | null>(null);

  const activateMutation = trpc.license.activate.useMutation({
    onSuccess: (data) => {
      setActivatedPlan(data.plan);
      setStep("success");
      toast.success(data.message || "Kích hoạt license thành công!");
      setTimeout(() => {
        onActivated();
      }, 2500);
    },
    onError: (err) => {
      toast.error(err.message || "Kích hoạt thất bại. Vui lòng kiểm tra lại license key.");
    },
  });

  const handleActivate = () => {
    if (!licenseKey.trim()) {
      toast.error("Vui lòng nhập license key");
      return;
    }
    activateMutation.mutate({ licenseKey: licenseKey.trim(), domain });
  };

  if (step === "success") {
    const plan = PLANS.find(p => p.id === activatedPlan) || PLANS[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kích hoạt thành công!</h1>
          <p className="text-gray-500 mb-4">Hệ thống đang được khởi động với gói <strong>{plan.name}</strong></p>
          <Badge className={`${plan.color} text-white px-4 py-1.5 text-sm`}>
            {plan.name} Plan
          </Badge>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang chuyển hướng...
          </div>
        </div>
      </div>
    );
  }

  if (step === "activate") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Nhập License Key</h1>
            <p className="text-slate-400 mt-1 text-sm">Nhập key để kích hoạt hệ thống Invoice Prime</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">License Key</Label>
                <Input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm h-11 focus:border-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Domain (tự động)</Label>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-slate-300 text-sm h-11"
                />
                <p className="text-xs text-slate-500">Domain này sẽ được liên kết với license key của bạn</p>
              </div>

              <Button
                onClick={handleActivate}
                disabled={activateMutation.isPending || !licenseKey.trim()}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                {activateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang kích hoạt...</>
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
              Chưa có license key?{" "}
              <a href="mailto:support@example.com" className="text-blue-400 hover:underline">
                Liên hệ để mua license
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Intro step
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Invoice Prime
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Hệ thống quản lý hóa đơn chuyên nghiệp. Vui lòng kích hoạt license để bắt đầu sử dụng.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-5 rounded-2xl border ${plan.borderColor} ${plan.bgColor} text-left`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white text-xs px-3">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Phổ biến
                  </Badge>
                </div>
              )}
              <div className={`w-8 h-8 ${plan.color} rounded-lg flex items-center justify-center mb-3`}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className={`font-bold text-base mb-3 ${plan.textColor}`}>{plan.name}</h3>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${plan.textColor} mt-0.5 flex-shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Button
          onClick={() => setStep("activate")}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-12 text-base font-medium shadow-lg shadow-blue-500/25"
        >
          Kích hoạt License
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="mt-4 text-slate-500 text-sm">
          Đã có license key? Nhấn nút trên để nhập và kích hoạt ngay.
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-slate-800">
        <p className="text-slate-600 text-xs">Invoice Prime © 2024 · Cần hỗ trợ? Liên hệ nhà cung cấp của bạn</p>
      </div>
    </div>
  );
}
