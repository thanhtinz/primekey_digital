import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import {
  LayoutDashboard, FileText, Package, Users, Wallet, BookOpen,
  BarChart2, Gift, Bell, Settings, LogOut, ExternalLink, Menu, X,
  ChevronDown, ChevronRight, ShieldCheck, Megaphone, Star,
  Tag, Zap, Share2, Wrench, AlertCircle
} from "@/components/Icon";

// ─── Menu structure ──────────────────────────────────────────────────────────
const menuGroups = [
  {
    label: "Tổng quan",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ],
  },
  {
    label: "Quản lý bán hàng",
    items: [
      { icon: FileText, label: "Đơn hàng", path: "/invoices" },
      { icon: Package, label: "Sản phẩm", path: "/products" },
      { icon: Users, label: "Khách hàng", path: "/customers" },
      { icon: Wallet, label: "Quản lý ví", path: "/wallet-management" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { icon: Gift, label: "Mã giảm giá", path: "/settings/coupons" },
      { icon: Zap, label: "Flash Sale", path: "/settings/flash-sale" },
      { icon: Share2, label: "Hoa hồng giới thiệu", path: "/admin/referral-withdrawals" },
      { icon: Star, label: "Đánh giá", path: "/feedbacks" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { icon: BookOpen, label: "Blog", path: "/admin/blog" },
      { icon: Megaphone, label: "Thông báo & Banner", path: "/admin/announcements" },
      { icon: Bell, label: "Gửi thông báo", path: "/admin/notifications" },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { icon: ShieldCheck, label: "Bảo hành", path: "/warranties" },
      { icon: BarChart2, label: "Báo cáo", path: "/reports" },
      { icon: Tag, label: "Nhân viên", path: "/staff" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { icon: Settings, label: "Cài đặt", path: "/settings" },
      { icon: Wrench, label: "Nhật ký hoạt động", path: "/activity-log" },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function isActivePath(location: string, path: string) {
  if (path === "/dashboard") return location === "/dashboard" || location === "/";
  return location === path || location.startsWith(path + "/");
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AdminSidebar({
  open,
  onClose,
  location,
  navigate,
  customer,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  location: string;
  navigate: (path: string) => void;
  customer: any;
  onLogout: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: 240, background: "#1e2a3a", color: "#c8d6e5" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Admin Panel</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuGroups.map(group => {
            const isCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-2 py-1.5 mb-1 rounded text-left"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {group.label}
                  </span>
                  {isCollapsed
                    ? <ChevronRight className="h-3 w-3 text-white/30" />
                    : <ChevronDown className="h-3 w-3 text-white/30" />
                  }
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const active = isActivePath(location, item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className={`
                            flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
                            transition-all duration-150 text-left
                            ${active
                              ? "bg-blue-600 text-white font-medium shadow-sm"
                              : "text-white/65 hover:bg-white/8 hover:text-white"
                            }
                          `}
                        >
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-white" : "text-white/50"}`} />
                          <span className="truncate">{item.label}</span>
                          {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer user */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/8 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-semibold text-sm flex-shrink-0">
              {customer?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">{customer?.name || "Admin"}</p>
              <p className="text-[11px] text-white/40 truncate leading-tight">{customer?.email}</p>
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <button
              onClick={() => window.open("/", "_blank")}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-white/8 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem trang khách hàng</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function AdminHeader({
  onMenuClick,
  pageTitle,
  pageSubtitle,
}: {
  onMenuClick: () => void;
  pageTitle: string;
  pageSubtitle?: string;
}) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-800 leading-tight">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-[11px] text-gray-400 leading-tight hidden sm:block">{pageSubtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.open("/", "_blank")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Xem shop
        </button>
      </div>
    </header>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function AdminLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { customer, isLoading, logout } = useCustomerAuth();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close sidebar on desktop resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (isLoading) return <DashboardLayoutSkeleton />;

  if (!customer || customer.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-sm">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-sm text-gray-500 mb-6">Bạn cần đăng nhập bằng tài khoản quản trị viên.</p>
          <button
            onClick={() => { window.location.href = "/client-login"; }}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Resolve page title from menu
  const activeItem = menuGroups
    .flatMap(g => g.items)
    .find(item => isActivePath(location, item.path));
  const pageTitle = title || activeItem?.label || "Dashboard";
  const pageSubtitle = subtitle || "Quản lý hệ thống";

  const handleLogout = () => {
    logout();
    window.location.href = "/client-login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        location={location}
        navigate={navigate}
        customer={customer}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
