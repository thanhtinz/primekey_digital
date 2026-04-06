import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, Home, FileText, History, Users, Package,
  FileStack, BarChart3, Settings, Zap, CreditCard, ChevronRight,
  Bell, User, Moon, Sun, Mail, MessageSquare
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const adminNavGroups = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Hóa Đơn",
    items: [
      { label: "Tạo Hóa Đơn", href: "/create-invoice", icon: FileText },
      { label: "Lịch Sử", href: "/invoices", icon: History },
    ],
  },
  {
    label: "Quản Lý",
    items: [
      { label: "Khách Hàng", href: "/customers", icon: Users },
      { label: "Sản Phẩm", href: "/products", icon: Package },
      { label: "Mẫu Hóa Đơn", href: "/templates", icon: FileStack },
    ],
  },
  {
    label: "Phân Tích",
    items: [
      { label: "Báo Cáo", href: "/reports", icon: BarChart3 },
      { label: "Feedback KH", href: "/feedbacks", icon: MessageSquare },
    ],
  },
  {
    label: "Thanh Toán",
    items: [
      { label: "Cấu Hình PayOS", href: "/settings/payos", icon: Zap },
      { label: "Cấu Hình PayPal", href: "/settings/paypal", icon: CreditCard },
    ],
  },
  {
    label: "Hệ Thống",
    items: [
      { label: "Cài Đặt", href: "/settings", icon: Settings },
      { label: "Cấu Hình SMTP", href: "/settings/smtp", icon: Mail },
    ],
  },
];

const staffNavGroups = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Hóa Đơn",
    items: [
      { label: "Tạo Hóa Đơn", href: "/create-invoice", icon: FileText },
      { label: "Lịch Sử", href: "/invoices", icon: History },
    ],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60_000, // Cache 60s - tránh refetch khi toggle sidebar
  });
  const { theme, toggleTheme } = useTheme();

  const navGroups = (user as any)?.role === "admin" ? adminNavGroups : staffNavGroups;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Only set sidebar state on initial load or resize crossing breakpoint
      setSidebarOpen(prev => {
        if (!mobile) return true;
        return prev; // Keep current state on mobile resize
      });
    };
    // Initial check
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    setSidebarOpen(!mobile); // Open on desktop, closed on mobile initially

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    window.location.replace("/login");
  }, [logoutMutation]);

  const handleNavClick = useCallback((href: string) => {
    setLocation(href);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setLocation]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const isActive = (href: string) => {
    if (href === "/settings") return location === "/settings";
    return location.startsWith(href);
  };

  const currentPageTitle = [...adminNavGroups, ...staffNavGroups]
    .flatMap(g => g.items)
    .find(item => isActive(item.href))?.label || "Invoice Prime";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - always in DOM, animated with transform */}
      <aside
        style={{
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
        className={`
          ${isMobile ? "fixed" : "relative"}
          w-64 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
          text-white flex flex-col z-40 shadow-2xl flex-shrink-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-base shadow-lg shadow-blue-500/30">
              IP
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Invoice Prime</h1>
              <p className="text-xs text-slate-400">Quản lý hóa đơn</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-left
                        ${active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-medium"
                          : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-100"
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-slate-700/60 space-y-1">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 mb-1">
              <div className="h-7 w-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user.name || user.email}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{(user as any)?.role === "admin" ? "Admin" : "Nhân viên"}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>{logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng Xuất"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay - always in DOM, animated with opacity */}
      <div
        onClick={closeSidebar}
        style={{
          opacity: sidebarOpen && isMobile ? 1 : 0,
          pointerEvents: sidebarOpen && isMobile ? "auto" : "none",
          transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
      />

      {/* Main Content */}
      <div
        style={{
          // On desktop: push content when sidebar opens
          marginLeft: !isMobile && sidebarOpen ? "0" : !isMobile ? "-256px" : "0",
          transition: "margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="flex-1 flex flex-col overflow-hidden min-w-0"
      >
        {/* Header */}
        <header className="bg-background border-b border-border shadow-sm sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen && !isMobile ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">Invoice Prime</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:block" />
                <span className="text-sm font-semibold text-foreground">{currentPageTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400 relative"
                onClick={() => {}}
                title="Thông báo"
              >
                <Bell className="h-4 w-4" />
              </button>
              {toggleTheme && (
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
              {user && (
                <button
                  onClick={() => setLocation("/settings")}
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
