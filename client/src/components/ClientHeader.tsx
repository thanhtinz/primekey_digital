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
    <header className="sticky top-0 z-50 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/8 shadow-sm shadow-black/20">
      <div className={`${maxWidth} mx-auto px-4 h-14 flex items-center justify-between gap-3`}>
        {/* Left: Back button */}
        <button
          onClick={() => navigate(backHref)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        {/* Center: Title or Logo */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {title ? (
            <span className="text-white font-semibold text-sm truncate">{title}</span>
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
                  <span className="text-white font-semibold text-sm hidden sm:inline">{companyName}</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium transition border border-green-600/30"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tài Khoản</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/client-login")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-medium transition border border-white/10"
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
