import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Copy, EyeOff, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Zap, Download, ChevronDown, ChevronUp, Key, Calendar
} from "@/components/Icon";
import { toast } from "sonner";
import { useLocation } from "wouter";

const HIDE_KEY = "license_banner_hidden_until";
export default function LicenseBanner() {
  const [, setLocation] = useLocation();
  const [isHidden, setIsHidden] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: sysInfo, isLoading, refetch } = trpc.settings.getSystemInfo.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });

  const updateSettingsMutation = trpc.settings.updateGeneral.useMutation();

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(HIDE_KEY);
    if (hiddenUntil && Date.now() < parseInt(hiddenUntil)) {
      setIsHidden(true);
    }
  }, []);

  const handleHide24h = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(HIDE_KEY, String(until));
    setIsHidden(true);
    toast.success("Đã ẩn banner trong 24 giờ");
  };

  const handleCopyLicense = () => {
    if (sysInfo?.licenseKey) {
      navigator.clipboard.writeText(sysInfo.licenseKey);
      toast.success("Đã sao chép giấy phép");
    }
  };

  const handleToggleAutoUpdate = async () => {
    try {
      await updateSettingsMutation.mutateAsync({ autoUpdate: !sysInfo?.autoUpdate });
      refetch();
      toast.success(sysInfo?.autoUpdate ? "Đã tắt cập nhật tự động" : "Đã bật cập nhật tự động");
    } catch {
      toast.error("Không thể cập nhật cài đặt");
    }
  };

  if (isHidden || isLoading) return null;

  const licenseValid = sysInfo?.licenseValid ?? true;
  const isDevMode = sysInfo?.licensePlan === "development";

  const getLicenseStatus = () => {
    if (isDevMode) return { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", label: "Phát triển" };
    if (!licenseValid) return { color: "text-red-700", bg: "bg-red-100", border: "border-red-200", label: "Không hợp lệ" };
    if (sysInfo?.licenseExpiresAt) {
      const daysLeft = Math.ceil((new Date(sysInfo.licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 30) return { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", label: `Còn ${daysLeft} ngày` };
    }
    return { color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", label: "Hợp lệ" };
  };

  const getPlanLabel = () => isDevMode ? "Development" : "Giấy phép hợp lệ";

  const licenseStatus = getLicenseStatus();

  return (
    <div className="space-y-2 mb-4">
      {/* ── Main License Card ── */}
      <div className={`rounded-xl border overflow-hidden shadow-sm transition-all duration-200 ${
        !licenseValid ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50" :
        sysInfo?.updateAvailable ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50" :
        "border-gray-200 bg-white"
      }`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* App icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>

          {/* App info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm">{sysInfo?.appName || publicInfo?.companyName || ""}</span>
              <span className="text-xs font-mono bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md border border-violet-200">
                v{sysInfo?.appVersion || "1.0.0"}
              </span>
              {sysInfo?.updateAvailable && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200 animate-pulse">
                  <Download className="h-3 w-3" /> v{sysInfo.latestVersion} mới
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {licenseValid ? (
                <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-xs font-medium ${licenseStatus.color}`}>
                {isDevMode ? "Chế độ phát triển" : `Giấy phép ${licenseStatus.label}`}
              </span>

              {sysInfo?.licenseExpiresAt && !isDevMode && (
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(sysInfo.licenseExpiresAt).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsExpanded(e => !e)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              title={isExpanded ? "Thu gọn" : "Mở rộng"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={handleHide24h}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              title="Ẩn 24 giờ"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
            {/* License Key Row */}
            {sysInfo?.licenseKey && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-100">
                <Key className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-mono text-gray-600 flex-1 truncate">{sysInfo.licenseKey}</span>
                <button
                  onClick={handleCopyLicense}
                  className="h-6 px-2 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1 transition flex-shrink-0"
                >
                  <Copy className="h-3 w-3" /> Sao chép
                </button>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

              <div className="p-2.5 rounded-lg bg-white border border-gray-100 text-center">
                <div className="text-xs text-gray-400 mb-0.5">Trạng thái</div>
                <div className={`text-sm font-semibold ${licenseValid ? "text-emerald-600" : "text-red-600"}`}>
                  {licenseValid ? "Hợp lệ" : "Không hợp lệ"}
                </div>
              </div>
              {sysInfo?.licenseExpiresAt && (
                <div className="p-2.5 rounded-lg bg-white border border-gray-100 text-center">
                  <div className="text-xs text-gray-400 mb-0.5">Hết hạn</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {new Date(sysInfo.licenseExpiresAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              )}
              <div className="p-2.5 rounded-lg bg-white border border-gray-100 text-center">
                <div className="text-xs text-gray-400 mb-0.5">Phiên bản</div>
                <div className="text-sm font-semibold text-gray-800">v{sysInfo?.appVersion}</div>
              </div>
            </div>

            {/* Auto Update Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <RefreshCw className={`h-3.5 w-3.5 flex-shrink-0 ${sysInfo?.autoUpdate ? "text-emerald-500" : "text-gray-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">Cập nhật tự động</p>
                  <p className="text-xs text-gray-400 truncate">
                    {sysInfo?.autoUpdate ? "Đang bật — tự cập nhật khi có push lên GitHub" : "Đang tắt — webhook GitHub sẽ không trigger update"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAutoUpdate}
                disabled={updateSettingsMutation.isPending}
                className={`h-7 px-3 text-xs flex-shrink-0 ml-2 ${sysInfo?.autoUpdate ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-gray-50 border-gray-200 text-gray-600"}`}
              >
                {sysInfo?.autoUpdate ? "Tắt" : "Bật"}
              </Button>
            </div>

            {/* Invalid License Warning */}
            {!licenseValid && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Giấy phép không hợp lệ</p>
                  <p className="text-xs text-red-600 mt-0.5">{sysInfo?.licenseMessage || "Vui lòng liên hệ nhà cung cấp để gia hạn."}</p>
                </div>
                <Button size="sm" onClick={() => setLocation("/settings")} className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white flex-shrink-0">
                  Cài đặt
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Update Available Banner (always visible when update available) */}
        {sysInfo?.updateAvailable && (
          <div className="border-t border-blue-100 px-4 py-2.5 flex items-center gap-3">
            <Download className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-800">
                Có phiên bản mới: v{sysInfo.latestVersion}
              </p>
              <p className="text-xs text-blue-600">
                {sysInfo.autoUpdate ? "Hệ thống sẽ tự động cập nhật khi có push lên GitHub." : "Bật để tự động cập nhật khi có push lên GitHub."}
              </p>
            </div>
            {!sysInfo.autoUpdate && (
              <Button
                size="sm"
                onClick={handleToggleAutoUpdate}
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
              >
                Bật tự động
              </Button>
            )}
          </div>
        )}
      </div>


    </div>
  );
}
