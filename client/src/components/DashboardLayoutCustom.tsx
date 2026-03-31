import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Moon, Sun, Home, FileText, History, Users, Package, FileStack, BarChart3, Settings, Zap, CreditCard } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category?: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" />, category: "main" },
    { label: "Tạo Hóa Đơn", href: "/create-invoice", icon: <FileText className="h-5 w-5" />, category: "invoices" },
    { label: "Lịch Sử", href: "/invoices", icon: <History className="h-5 w-5" />, category: "invoices" },
    { label: "Khách Hàng", href: "/customers", icon: <Users className="h-5 w-5" />, category: "management" },
    { label: "Sản Phẩm", href: "/products", icon: <Package className="h-5 w-5" />, category: "management" },
    { label: "Mẫu Hóa Đơn", href: "/templates", icon: <FileStack className="h-5 w-5" />, category: "management" },
    { label: "Báo Cáo", href: "/reports", icon: <BarChart3 className="h-5 w-5" />, category: "analytics" },
    { label: "Cấu Hình PayOS", href: "/settings/payos", icon: <Zap className="h-5 w-5" />, category: "payments" },
    { label: "Cấu Hình PayPal", href: "/settings/paypal", icon: <CreditCard className="h-5 w-5" />, category: "payments" },
    { label: "Cài Đặt", href: "/settings", icon: <Settings className="h-5 w-5" />, category: "settings" },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/");
  };

  const isActive = (href: string) => location === href;

  const groupedNavItems = {
    main: navItems.filter(item => item.category === "main"),
    invoices: navItems.filter(item => item.category === "invoices"),
    management: navItems.filter(item => item.category === "management"),
    analytics: navItems.filter(item => item.category === "analytics"),
    payments: navItems.filter(item => item.category === "payments"),
    settings: navItems.filter(item => item.category === "settings"),
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden flex flex-col fixed lg:relative h-full z-40 shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
              IP
            </div>
            <div>
              <h1 className="font-bold text-lg">Invoice Prime</h1>
              <p className="text-xs text-slate-400">v1.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {/* Main */}
          <div>
            {groupedNavItems.main.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* Invoices */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Hóa Đơn</p>
            {groupedNavItems.invoices.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Management */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quản Lý</p>
            {groupedNavItems.management.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Analytics */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Phân Tích</p>
            {groupedNavItems.analytics.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Payments */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Thanh Toán</p>
            {groupedNavItems.payments.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Settings */}
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Hệ Thống</p>
            {groupedNavItems.settings.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-slate-300 border-slate-600 hover:bg-slate-700/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng Xuất
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Invoice Prime</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-gray-700" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
