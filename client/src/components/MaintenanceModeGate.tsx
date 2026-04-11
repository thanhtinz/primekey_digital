/**
 * MaintenanceModeGate - Hiển thị trang bảo trì khi maintenanceMode = true
 * Admin vẫn có thể truy cập bình thường
 */
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function MaintenanceModeGate({ children }: { children: React.ReactNode }) {
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 60_000 });
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const [location] = useLocation();
  const isAdmin = user?.role === "admin";
  const maintenanceMode = (publicInfo as any)?.maintenanceMode;

  // Admin can always access, also allow login routes
  if (maintenanceMode && !isAdmin && location !== "/login" && !location.startsWith("/admin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🛠️</div>
          <h1 className="text-3xl font-bold mb-4">Website đang bảo trì</h1>
          <p className="text-slate-400 text-lg mb-6">
            Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn. Vui lòng quay lại sau.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Đang bảo trì...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
