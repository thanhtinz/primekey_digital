import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu, X, LogOut, Home, FileText, History, Users, Package,
  FileStack, BarChart3, Settings, Zap, CreditCard, ChevronRight,
  Bell, User, Moon, Sun, Mail, MessageSquare, Search, Megaphone,
  RefreshCw, Upload, Send, Heart, Database, SearchCode, TrendingUp, Code,
  Shield, ShoppingBag, Tag, Star, Wrench, Receipt, RotateCcw, FileBarChart2, HelpCircle, Users2, MailCheck
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
    label: "Bán Hàng",
    items: [
      { label: "Tạo Hóa Đơn", href: "/create-invoice", icon: FileText },
      { label: "Lịch Sử Đơn", href: "/invoices", icon: History },
      { label: "Hóa Đơn Định Kỳ", href: "/recurring-invoices", icon: RefreshCw },
      { label: "Khách Hàng", href: "/customers", icon: Users },
      { label: "Import Excel", href: "/import-excel", icon: Upload },
      { label: "Tìm Kiếm Nâng Cao", href: "/advanced-search", icon: SearchCode },
    ],
  },
  {
    label: "Sản Phẩm",
    items: [
      { label: "Sản Phẩm", href: "/products", icon: Package },
      { label: "Danh Mục", href: "/settings/categories", icon: Tag },
      { label: "Mẫu Hóa Đơn", href: "/templates", icon: FileStack },
    ],
  },
  {
    label: "Khuyến Mãi & Marketing",
    items: [
      { label: "Flash Sale", href: "/settings/flash-sale", icon: ShoppingBag },
      { label: "Mã Giảm Giá", href: "/settings/coupons", icon: Zap },
      { label: "Giới Thiệu Bạn Bè", href: "/settings/referral", icon: Users2 },
      { label: "Tích Điểm", href: "/settings/loyalty", icon: Star },
      { label: "Email Campaigns", href: "/campaigns", icon: Megaphone },
      { label: "ĐK Flash Sale", href: "/settings/flash-sale-subscribers", icon: MailCheck },
    ],
  },
  {
    label: "Bảo Hành & Hỗ Trợ",
    items: [
      { label: "Quản Lý Bảo Hành", href: "/warranties", icon: Shield },
      { label: "Yêu Cầu BH", href: "/warranty-requests", icon: Wrench },
      { label: "Cấu Hình BH", href: "/settings/warranty", icon: Shield },
      { label: "FAQ / Hỏi Đáp", href: "/settings/faq", icon: HelpCircle },
    ],
  },
  {
    label: "Tài Chính & Báo Cáo",
    items: [
      { label: "Báo Cáo", href: "/reports", icon: BarChart3 },
      { label: "Báo Cáo Nâng Cao", href: "/advanced-reports", icon: TrendingUp },
      { label: "Hóa Đơn VAT", href: "/vat-invoices", icon: Receipt },
      { label: "Hoàn Tiền", href: "/refunds", icon: RotateCcw },
      { label: "Báo Cáo Thuế", href: "/tax-report", icon: FileBarChart2 },
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
      { label: "Nhân Viên", href: "/staff", icon: Users },
      { label: "Nhắc Nhở", href: "/reminders", icon: Bell },
      { label: "Lịch Sử HT", href: "/activity-log", icon: History },
      { label: "Sao Lưu", href: "/backup", icon: Database },
      { label: "Cài Đặt", href: "/settings", icon: Settings },
      { label: "SMTP", href: "/settings/smtp", icon: Mail },
      { label: "Mẫu Email", href: "/settings/email-templates", icon: MessageSquare },
      { label: "Telegram", href: "/settings/telegram", icon: Send },
      { label: "Trang Cảm Ơn", href: "/settings/thank-you", icon: Heart },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60_000, // Cache 60s - tránh refetch khi toggle sidebar
  });
  const { theme, toggleTheme } = useTheme();
  const { data: invoices } = trpc.invoices.list.useQuery(undefined, { staleTime: 30_000 });
  const { data: customers } = trpc.customers.list.useQuery(undefined, { staleTime: 30_000 });
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const appName = publicInfo?.companyName || "Invoice Prime";
  const appLogo = publicInfo?.logoUrl || null;
  const appInitials = appName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "IP";

  // Global search results
  const searchResults = searchQuery.trim().length >= 2 ? [
    ...(invoices || []).filter(inv =>
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv as any).customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4).map(inv => ({ type: "invoice", label: inv.invoiceNumber, sub: (inv as any).customerName || "", href: `/invoices/${inv.id}` })),
    ...(customers || []).filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3).map(c => ({ type: "customer", label: c.name, sub: c.email || c.phone || "", href: `/customers/${c.id}` })),
  ] : [];

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    .find(item => isActive(item.href))?.label || appName;

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
            <div className="flex-shrink-0">
              {appLogo ? (
                <img src={appLogo} alt={appName} className="h-9 max-w-[120px] rounded-lg object-contain" />
              ) : (
                <div className="h-9 px-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-sm">{appInitials}</span>
                </div>
              )}
            </div>
            {!appLogo && (
              <div className="min-w-0">
                <h1 className="font-bold text-base leading-tight truncate">{appName}</h1>
                <p className="text-xs text-slate-400">Quản lý hóa đơn</p>
              </div>
            )}
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
                <span className="text-sm text-muted-foreground hidden sm:block">{appName}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:block" />
                <span className="text-sm font-semibold text-foreground">{currentPageTitle}</span>
              </div>
              {/* Global Search */}
              <div ref={searchRef} className="relative hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                    onFocus={() => setShowSearchResults(true)}
                    className="pl-8 h-8 w-52 text-sm bg-muted/50 border-muted"
                  />
                </div>
                {showSearchResults && searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    {searchResults.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">Không tìm thấy kết quả</div>
                    ) : (
                      <div className="py-1">
                        {searchResults.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => { setLocation(r.href); setSearchQuery(""); setShowSearchResults(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
                          >
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              r.type === "invoice" ? "bg-blue-100" : "bg-green-100"
                            }`}>
                              {r.type === "invoice"
                                ? <FileText className="h-3.5 w-3.5 text-blue-600" />
                                : <Users className="h-3.5 w-3.5 text-green-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{r.label}</p>
                              {r.sub && <p className="text-xs text-muted-foreground truncate">{r.sub}</p>}
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {r.type === "invoice" ? "Hóa đơn" : "Khách hàng"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
