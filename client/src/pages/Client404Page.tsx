import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Client404Page() {
  const [, navigate] = useLocation();
  const { data: publicInfo, isLoading } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Đang tải...</div>
      </div>
    );
  }

  const info = publicInfo as any;
  const isCustomEnabled = info?.featureCustom404 === true || info?.featureCustom404 === 1;

  // ── Custom 404 (enabled by admin) ────────────────────────────────────────
  if (isCustomEnabled) {
    // If admin provided raw HTML, render it in an iframe
    if (info?.custom404CustomHtml) {
      const html =
        `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">` +
        `</head><body style="margin:0;padding:0">${info.custom404CustomHtml}</body></html>`;
      return (
        <iframe
          srcDoc={html}
          className="w-full min-h-screen border-0"
          title="404"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      );
    }

    // Render from config fields
    const bg = info?.custom404BgColor || "#0a0a0a";
    const tc = info?.custom404TextColor || "#ffffff";
    const title = info?.custom404Title || "Trang Không Tồn Tại";
    const message = info?.custom404Message || "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.";
    const btnText = info?.custom404ButtonText || "Về Trang Chủ";
    const btnUrl = info?.custom404ButtonUrl || "/";
    const imgUrl = info?.custom404ImageUrl || "";

    // Determine button colors (invert bg/tc for contrast)
    const btnBg = tc;
    const btnColor = bg;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-16"
        style={{ backgroundColor: bg, color: tc }}
      >
        <div className="max-w-lg w-full text-center">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt="404"
              className="max-w-full max-h-48 object-contain rounded-xl mx-auto mb-6"
            />
          ) : (
            <div
              className="text-8xl font-black leading-none mb-4 select-none"
              style={{ color: tc, opacity: 0.12 }}
            >
              404
            </div>
          )}

          <h1
            className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight"
            style={{ color: tc }}
          >
            {title}
          </h1>

          <p
            className="text-sm sm:text-base leading-relaxed mb-8"
            style={{ color: tc + "bb" }}
          >
            {message}
          </p>

          {btnText && (
            <button
              onClick={() => navigate(btnUrl.startsWith("http") ? btnUrl : btnUrl)}
              className="inline-block px-7 py-3 rounded-full text-sm font-semibold transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: btnBg, color: btnColor }}
            >
              {btnText}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Default 404 (custom disabled) ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-slate-200 leading-none mb-2 select-none">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">Trang không tìm thấy</h1>
        <p className="text-slate-500 text-sm mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
