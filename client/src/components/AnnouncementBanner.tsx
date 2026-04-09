import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Bell } from "@/components/Icon";

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

  const dismissAllPopups = () => {
    popupItems.forEach((a: any) => dismissPopup(a.id));
  };

  // Dismiss for 2 hours
  const snoozePopups = () => {
    const snoozeUntil = Date.now() + 2 * 60 * 60 * 1000;
    sessionStorage.setItem("popup_snooze_until", String(snoozeUntil));
    dismissAllPopups();
  };

  // Check snooze
  const snoozeUntil = Number(sessionStorage.getItem("popup_snooze_until") || "0");
  const isSnoozed = snoozeUntil > Date.now();

  return (
    <>
      {/* Banner notifications */}
      {bannerItems.map((a: any) => (
        <div key={a.id} className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-3 text-sm">
          <Bell className="w-4 h-4 flex-shrink-0" />
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
      ))}

      {/* Popup notifications */}
      {popupItems.length > 0 && !isSnoozed && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-lg">Thông Báo</h3>
              </div>
              <button
                onClick={dismissAllPopups}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4 max-h-80 overflow-y-auto">
              {popupItems.map((a: any) => (
                <div key={a.id}>
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">{a.title && a.content ? `${a.title}\n${a.content}` : a.title || a.content}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-1 border-t border-gray-100">
              <button
                onClick={snoozePopups}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3.5 rounded-xl font-semibold text-base transition-colors"
              >
                Không hiển thị lại trong 2 giờ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
