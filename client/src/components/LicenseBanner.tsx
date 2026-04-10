import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, EyeOff, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Zap, Bell, Download, X, ChevronDown, ChevronUp, Shield, Key
} from "@/components/Icon";
import { toast } from "sonner";
import { useLocation } from "wouter";

const HIDE_KEY = "license_banner_hidden_until";

interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  createdAt: string;
}

// Mock broadcasts từ chủ src (trong thực tế sẽ fetch từ UPDATE_CHECK_URL)
const MOCK_BROADCASTS: SystemBroadcast[] = [];

export default function LicenseBanner() {
  const [, setLocation] = useLocation();
  const [isHidden, setIsHidden] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState<string[]>([]);

  const { data: sysInfo, isLoading, refetch } = trpc.settings.getSystemInfo.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const updateSettingsMutation = trpc.settings.updateGeneral.useMutation();

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(HIDE_KEY);
    if (hiddenUntil && Date.now() < parseInt(hiddenUntil)) {
      setIsHidden(true);
    }
    const dismissed = JSON.parse(localStorage.getItem("dismissed_broadcasts") || "[]");
    setDismissedBroadcasts(dismissed);
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

  const handleDismissBroadcast = (id: string) => {
    const updated = [...dismissedBroadcasts, id];
    setDismissedBroadcasts(updated);
    localStorage.setItem("dismissed_broadcasts", JSON.stringify(updated));
  };

  if (isHidden || isLoading) return null;

  const activeBroadcasts = MOCK_BROADCASTS.filter(b => !dismissedBroadcasts.includes(b.id));
  const licenseValid = sysInfo?.licenseValid ?? true;
  const isDevMode = sysInfo?.licensePlan === "development";

  const getLicenseBadgeColor = () => {
    if (isDevMode) return "bg-gray-100 text-gray-600 border-gray-200";
    if (!licenseValid) return "bg-red-100 text-red-700 border-red-200";
    if (sysInfo?.licenseExpiresAt) {
      const daysLeft = Math.ceil((new Date(sysInfo.licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 30) return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getPlanLabel = () => {
    if (isDevMode) return "Development";
    const plan = sysInfo?.licensePlan || "Unknown";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-2 mb-4">
      {/* Main License Card */}
      <div className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
        !licenseValid ? "border-red-200 bg-red-50" :
        sysInfo?.updateAvailable ? "border-blue-200 bg-blue-50/50" :
        "border-gray-200 bg-white"
      }`}>
        {/* Header Row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* App Icon + Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{sysInfo?.appName || "Invoice Prime"}</span>
                  <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    v{sysInfo?.appVersion || "1.0.0"}
                  </span>
                  {sysInfo?.updateAvailable && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 animate-pulse">
                      <Download className="h-3 w-3" /> v{sysInfo.latestVersion} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {licenseValid ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${getLicenseBadgeColor().split(" ")[1]}`}>
                    {licenseValid ? (isDevMode ? "Chế độ phát triển" : `Giấy phép hợp lệ · ${getPlanLabel()}`) : "Giấy phép không hợp lệ"}
                  </span>
                  {sysInfo?.licenseExpiresAt && !isDevMode && (
                    <span className="text-xs text-gray-400">
                      · hết hạn {new Date(sysInfo.licenseExpiresAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {sysInfo?.licenseKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLicense}
                className="h-7 px-2.5 text-xs gap-1 bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
              >
                <Copy className="h-3 w-3" /> Sao chép giấy phép
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleHide24h}
              className="h-7 px-2.5 text-xs gap-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <EyeOff className="h-3 w-3" /> Ẩn 24 giờ
            </Button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
            {/* Auto Update Info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                sysInfo?.autoUpdate ? "bg-green-100" : "bg-gray-100"
              }`}>
                <RefreshCw className={`h-4 w-4 ${sysInfo?.autoUpdate ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  {sysInfo?.autoUpdate
                    ? "Hệ thống sẽ tự động cập nhật phiên bản mới khi có. Để tắt, vào "
                    : "Cập nhật tự động đang tắt. Bạn cần cập nhật thủ công khi có phiên bản mới. Để bật, vào "}
                  <button
                    onClick={() => setLocation("/settings")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Cài Đặt → Cài đặt chung → Cập nhật tự động
                  </button>
                  {sysInfo?.autoUpdate ? " → OFF." : " → ON."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAutoUpdate}
                disabled={updateSettingsMutation.isPending}
                className="h-7 px-2.5 text-xs flex-shrink-0"
              >
                {sysInfo?.autoUpdate ? "Tắt" : "Bật"}
              </Button>
            </div>

            {/* License Details */}
            {!isDevMode && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-white border border-gray-100 text-center">
                  <div className="text-xs text-gray-400 mb-0.5">Gói</div>
                  <div className="text-sm font-semibold text-gray-800">{getPlanLabel()}</div>
                </div>
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
            )}

            {/* Invalid License Warning */}
            {!licenseValid && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{sysInfo?.licenseMessage || "Giấy phép không hợp lệ. Vui lòng liên hệ nhà cung cấp để gia hạn."}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Broadcasts */}
      {activeBroadcasts.map(broadcast => (
        <div key={broadcast.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
          broadcast.type === "warning" ? "bg-amber-50 border-amber-200" :
          broadcast.type === "error" ? "bg-red-50 border-red-200" :
          broadcast.type === "success" ? "bg-emerald-50 border-emerald-200" :
          "bg-blue-50 border-blue-200"
        }`}>
          <Bell className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
            broadcast.type === "warning" ? "text-amber-500" :
            broadcast.type === "error" ? "text-red-500" :
            broadcast.type === "success" ? "text-emerald-500" :
            "text-blue-500"
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{broadcast.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{broadcast.message}</p>
          </div>
          <button
            onClick={() => handleDismissBroadcast(broadcast.id)}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-black/10 text-gray-400 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Update Available Banner */}
      {sysInfo?.updateAvailable && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Download className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">
              Có phiên bản mới: v{sysInfo.latestVersion}
            </p>
            <p className="text-xs text-blue-600">
              {sysInfo.autoUpdate ? "Hệ thống sẽ tự động cập nhật khi bạn truy cập trang này." : "Cập nhật tự động đang tắt. Bật để nhận cập nhật tự động."}
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
  );
}
