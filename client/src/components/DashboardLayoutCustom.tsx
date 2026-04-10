import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, LogOut, Home, FileText, History, Users, Package, FileStack, BarChart3, Settings, Zap, CreditCard, ChevronRight, Bell, User, Moon, Sun, Mail, MessageSquare, Search, Megaphone, RefreshCw, Upload, Send, Heart, Database, SearchCode, TrendingUp, Code, Shield, ShoppingBag, Tag, Star, Wrench, Receipt, RotateCcw, FileBarChart2, HelpCircle, Users2, MailCheck, Image, Percent, Banknote, Wallet, Gift, Plus, ExternalLink, Puzzle, Activity, Terminal, Layers, Navigation, BookOpen, Headphones } from "@/components/Icon";
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
      { label: "Đơn Hàng", href: "/invoices", icon: History },
      { label: "Khách Hàng", href: "/customers", icon: Users },
      { label: "Báo Cáo", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Danh Mục & Sản Phẩm",
    items: [
      { label: "Sản Phẩm", href: "/products", icon: Package },
      { label: "Kho Hàng", href: "/admin/inventory", icon: Database },
      { label: "Danh Mục", href: "/settings/categories", icon: Tag },
      { label: "Tags Sản Phẩm", href: "/settings/tags", icon: Tag },
      { label: "Đánh Giá KH", href: "/feedbacks", icon: MessageSquare },
      { label: "Bảo Hành", href: "/admin/warranty", icon: Shield },
    ],
  },
  {
    label: "Hỗ Trợ & Marketing",
    items: [
      { label: "Flash Sale", href: "/admin/flash-sale", icon: ShoppingBag },
      { label: "Mã Giảm Giá", href: "/settings/coupons", icon: Zap },
      { label: "Mail Campaigns", href: "/admin/mail-campaigns", icon: Mail },
      { label: "Ticket Hỗ Trợ", href: "/admin/tickets", icon: Headphones },
      { label: "Thông Báo", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Affiliate",
    items: [
      { label: "Cấu Hình", href: "/admin/affiliate/config", icon: Settings },
      { label: "Nhật Ký Hoa Hồng", href: "/admin/affiliate/commissions", icon: Banknote },
      { label: "Rút Tiền", href: "/admin/affiliate/withdrawals", icon: Wallet },
    ],
  },
  {
    label: "Tích Điểm",
    items: [
      { label: "Cấu Hình", href: "/admin/loyalty/config", icon: Settings },
      { label: "Lịch Sử", href: "/admin/loyalty/history", icon: History },
      { label: "Phần Thưởng", href: "/admin/loyalty/rewards", icon: Gift },
      { label: "Vòng Quay", href: "/admin/spin-wheel", icon: RotateCcw },
    ],
  },
  {
    label: "Nạp Tiền",
    items: [
      { label: "Cấu Hình PayOS", href: "/settings/payos", icon: Settings },
      { label: "Lịch Sử Nạp", href: "/admin/topup-history", icon: History },
      { label: "Quản Lý Ví", href: "/wallet-management", icon: Wallet },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "Tất Cả Bài Viết", href: "/admin/blog", icon: BookOpen },
      { label: "Viết Bài Mới", href: "/admin/blog/new", icon: Plus },
      { label: "Chuyên Mục", href: "/admin/blog/categories", icon: Tag },
    ],
  },
  {
    label: "Nội Dung",
    items: [
      { label: "Kho Avatar", href: "/admin/avatar-gallery", icon: Image },
      { label: "Thông Báo & Banner", href: "/admin/announcements", icon: Megaphone },
      { label: "Thông Báo Dashboard", href: "/admin/broadcasts", icon: Bell },
      { label: "Tạo Trang", href: "/admin/page-builder", icon: Layers },
      { label: "Quản Lý Menu", href: "/admin/menu-manager", icon: Navigation },
      { label: "Trang Cảm Ơn", href: "/settings/thank-you", icon: Heart },
      { label: "Trang 404", href: "/settings/custom-404", icon: HelpCircle },
    ],
  },
  {
    label: "Hệ Thống",
    items: [
      { label: "Cài Đặt", href: "/settings", icon: Settings },
      { label: "Cập Nhật Tự Động", href: "/admin/auto-update", icon: RefreshCw },
      { label: "Tự Động Hoá", href: "/admin/automations", icon: Zap },
      { label: "Block IP", href: "/admin/block-ip", icon: Shield },
      { label: "Lịch Sử HĐ", href: "/activity-log", icon: History },
      { label: "Trạng Thái HT", href: "/admin/system-status", icon: Activity },
      { label: "Redis", href: "/admin/redis", icon: Database },
      { label: "Console", href: "/admin/console", icon: Terminal },
      { label: "Tính Năng MR", href: "/admin/extensions", icon: Puzzle },
    ],
  },
  {
    label: null,
    items: [
      { label: "Xem Trang Web", href: "__CLIENT__", icon: ExternalLink },
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
      { label: "Danh Sách Đơn Hàng", href: "/invoices", icon: History },
    ],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showContactWidget, setShowContactWidget] = useState(false);
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
    if (href === "__CLIENT__") {
      window.open("/", "_blank");
      return;
    }
    setLocation(href);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setLocation]);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const isActive = (href: string) => {
    if (href === "__CLIENT__") return false;
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
          w-64 h-full bg-[#1e2a3b]
          text-white flex flex-col z-40 shadow-2xl flex-shrink-0
        `}
      >
        {/* Logo - AdminKit style */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-8 max-w-[110px] object-contain" />
            ) : (
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xs">{appInitials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-semibold text-sm leading-tight truncate text-white">{appName}</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
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
                        w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm text-left relative
                        ${active
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }
                      `}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-r-full" />}
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-blue-100" : "text-slate-500"}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Logout - AdminKit bottom bar */}
        <div className="p-3 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-1 bg-white/5">
              <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user.name || user.email?.split("@")[0]}</p>
                <p className="text-[10px] text-slate-500">{(user as any)?.role === "admin" ? "Administrator" : "Staff"}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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
        {/* Header - AdminKit style */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 flex-shrink-0 dark:bg-slate-900 dark:border-slate-700">
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

        {/* Page Content - AdminKit light gray bg */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-slate-800">
          {children}
        </main>
      </div>

      {/* Contact Widget - Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showContactWidget && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-72 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Liên Hệ & Hỗ Trợ</span>
              </div>
              <button onClick={() => setShowContactWidget(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setLocation("/contact-settings"); setShowContactWidget(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Cấu hình Liên Hệ</p>
                  <p className="text-xs text-slate-500">Số điện thoại, email, mạng xã hội</p>
                </div>
              </button>
              <button
                onClick={() => { setLocation("/admin/tickets"); setShowContactWidget(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Headphones className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Ticket Hỗ Trợ</p>
                  <p className="text-xs text-slate-500">Quản lý yêu cầu hỗ trợ khách hàng</p>
                </div>
              </button>
              <button
                onClick={() => { setLocation("/admin/announcements"); setShowContactWidget(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Thông Báo & Banner</p>
                  <p className="text-xs text-slate-500">Quản lý banner và thông báo</p>
                </div>
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowContactWidget(prev => !prev)}
          className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            showContactWidget
              ? "bg-gray-600 hover:bg-gray-700 rotate-45"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          title="Liên hệ & Hỗ trợ"
        >
          {showContactWidget ? <X className="h-5 w-5 text-white" /> : <MessageSquare className="h-5 w-5 text-white" />}
        </button>
      </div>
    </div>
  );
}
