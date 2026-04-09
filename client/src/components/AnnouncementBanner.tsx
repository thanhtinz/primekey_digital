import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, Bell } from "@/components/Icon";

const TYPE_STYLES = {
  info: { bg: "bg-blue-600", icon: <Info className="w-4 h-4" />, text: "text-white" },
  success: { bg: "bg-emerald-600", icon: <CheckCircle className="w-4 h-4" />, text: "text-white" },
  warning: { bg: "bg-amber-500", icon: <AlertTriangle className="w-4 h-4" />, text: "text-white" },
  error: { bg: "bg-red-600", icon: <AlertCircle className="w-4 h-4" />, text: "text-white" },
};

export function AnnouncementBanner() {
  const { data: announcements = [] } = trpc.announcement.listPublic.useQuery(undefined, {
    staleTime: 60_000,
  });

  const [dismissed, setDismissed] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    } catch { return []; }
  });
  const [popupDismissed, setPopupDismissed] = useState<number[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dismissed_popups") || "[]");
    } catch { return []; }
  });

  const bannerItems = (announcements as any[]).filter(
    (a: any) => !a.showAsPopup && !dismissed.includes(a.id)
  );
  const popupItems = (announcements as any[]).filter(
    (a: any) => a.showAsPopup && !popupDismissed.includes(a.id)
  );

  const dismissBanner = (id: number) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem("dismissed_announcements", JSON.stringify(updated));
  };

  const dismissPopup = (id: number) => {
    const updated = [...popupDismissed, id];
    setPopupDismissed(updated);
    sessionStorage.setItem("dismissed_popups", JSON.stringify(updated));
  };

  return (
    <>
      {/* Banner notifications */}
      {bannerItems.map((a: any) => {
        const style = TYPE_STYLES[a.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.info;
        return (
          <div key={a.id} className={`${style.bg} ${style.text} px-4 py-2.5 flex items-center gap-3 text-sm`}>
            <span className="flex-shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold mr-2">{a.title}</span>
              <span className="opacity-90">{a.content}</span>
            </div>
            <button
              onClick={() => dismissBanner(a.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Popup notifications */}
      {popupItems.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="text-white font-bold text-lg">Thông báo</h3>
            </div>
            <div className="px-6 pt-4 pb-2 space-y-3 max-h-96 overflow-y-auto">
              {popupItems.map((a: any) => {
                const style = TYPE_STYLES[a.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.info;
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex-shrink-0 ${
                      a.type === 'info' ? 'text-blue-600' :
                      a.type === 'success' ? 'text-emerald-600' :
                      a.type === 'warning' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>{style.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{a.title}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{a.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pb-5 pt-2">
              <button
                onClick={() => popupItems.forEach((a: any) => dismissPopup(a.id))}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
