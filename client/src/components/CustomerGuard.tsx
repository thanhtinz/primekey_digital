import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Loader2 } from "@/components/Icon";

interface CustomerGuardProps {
  children: React.ReactNode;
}

export function CustomerGuard({ children }: CustomerGuardProps) {
  const { isLoggedIn, isLoading } = useCustomerAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      // Lưu trang hiện tại để redirect sau khi login
      const encoded = encodeURIComponent(location);
      setLocation(`/client-login?redirect=${encoded}`);
    }
  }, [isLoading, isLoggedIn, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
