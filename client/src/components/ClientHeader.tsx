/**
 * ClientHeader - Header dùng chung cho tất cả trang client (public-facing)
 *
 * Props:
 *  - backHref: đường dẫn nút "quay lại" (mặc định "/")
 *  - backLabel: nhãn nút quay lại (mặc định "Trang Chủ")
 *  - title: tiêu đề trang hiển thị ở giữa (optional)
 *  - rightSlot: nội dung bên phải (optional, ReactNode)
 *  - maxWidth: max-width container (mặc định "max-w-5xl")
 */
import { useLocation } from "wouter";
import { ArrowLeft, User, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

interface ClientHeaderProps {
  backHref?: string;
  backLabel?: string;
  title?: string;
  rightSlot?: React.ReactNode;
  maxWidth?: string;
}

export function ClientHeader({
  backHref = "/",
  backLabel = "Trang Chủ",
  title,
  rightSlot,
  maxWidth = "max-w-5xl",
}: ClientHeaderProps) {
  const [, navigate] = useLocation();
  const { isLoggedIn } = useCustomerAuth();

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, {
    staleTime: 300_000,
  });

  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const companyName = publicInfo?.companyName || "Invoice Prime";
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className={`${maxWidth} mx-auto px-4 h-14 flex items-center justify-between gap-3`}>
        {/* Left: Back button */}
        <button
          onClick={() => navigate(backHref)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        {/* Center: Title or Logo */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {title ? (
            <span className="text-slate-800 font-semibold text-sm truncate">{title}</span>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="h-7 max-w-[120px] object-contain rounded"
                />
              ) : (
                <>
                  <div className="h-7 w-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">{initials}</span>
                  </div>
                  <span className="text-slate-800 font-semibold text-sm hidden sm:inline">{companyName}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: custom slot or account button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot ?? (
            isLoggedIn ? (
              <button
                onClick={() => navigate("/my-account")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition border border-blue-200"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tài Khoản</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/client-login")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
