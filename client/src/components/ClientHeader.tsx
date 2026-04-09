/**
 * ClientHeader - Header dùng chung cho tất cả trang client
 * Dark theme, logo, search, bell thông báo, avatar dropdown, hamburger
 * Dropdown danh mục 2 cấp (danh mục lớn → danh mục nhỏ)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { useLocation } from "wouter";
import {
  Menu, X, Search, Bell, Gift, User, Home, Package,
  CreditCard, BookOpen, ChevronRight, ChevronDown, Settings, LogOut,
  Wallet, ShoppingCart, LayoutGrid, Star, Ticket, Tag, HelpCircle, MessageSquare, Trophy
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { FontAwesomeIcon, isFontAwesomeIcon } from "@/components/FontAwesomeIconPicker";

// Helper to render category icon (emoji or FontAwesome)
function CatIcon({ icon, className = "" }: { icon?: string | null; className?: string }) {
  if (!icon) return null;
  if (isFontAwesomeIcon(icon)) return <FontAwesomeIcon iconClass={icon} className={className} />;
  return <span className="text-base leading-none">{icon}</span>;
}

interface ClientHeaderProps {
  maxWidth?: string;
}

export function ClientHeader({ maxWidth = "max-w-7xl" }: ClientHeaderProps) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [hoveredParent, setHoveredParent] = useState<number | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const catDropRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const companyName = publicInfo?.companyName || "ShopKey";

  const { token: ctxToken, isLoggedIn: ctxLoggedIn, logout: ctxLogout, customer: ctxCustomer } = useCustomerAuth();
  const token = ctxToken || "";
  const isLoggedIn = ctxLoggedIn;

  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token },
    { enabled: isLoggedIn, staleTime: 60_000 }
  );
  const { data: notifData, refetch: refetchNotif } = trpc.customerNotif.list.useQuery(
    { token },
    { enabled: isLoggedIn, staleTime: 30_000, refetchInterval: 60_000 }
  );
  const markAllReadMutation = trpc.customerNotif.markAllRead.useMutation({
    onSuccess: () => refetchNotif(),
  });

   // Use context customer data (already fetched by CustomerAuthProvider)
  const sessionData = ctxCustomer;
  const { isEnabled } = useFeatureFlags();
  const walletBalance = walletData?.balance ?? 0;
  const unreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.items ?? [];
  const avatarUrl = ctxCustomer?.avatarUrl;
  const displayName = ctxCustomer?.name || ctxCustomer?.email?.split("@")[0] || "Tài Khoản";
  const email = ctxCustomer?.email || "";
  // Check admin role via dedicated procedure (works for both isAdminSession and email-match)
  const { data: adminCheckData } = trpc.customer.checkIsAdmin.useQuery(
    { token },
    { enabled: isLoggedIn && !!token, staleTime: 60_000, retry: false }
  );
  const isAdmin = adminCheckData?.isAdmin === true;

  const { data: allCategories } = trpc.categories.list.useQuery(undefined, { staleTime: 300_000 });

  // Cart count
  const { data: cartData } = trpc.cart.list.useQuery(
    { email },
    { enabled: isLoggedIn && !!email, staleTime: 30_000 }
  );
  const cartCount = (cartData as any[])?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) ?? 0;

  // Build category tree: parent categories and their children
  const parentCategories = (allCategories || []).filter((c: any) => !c.parentId);
  const childrenOf = (parentId: number) => (allCategories || []).filter((c: any) => c.parentId === parentId);

  const go = useCallback((href: string) => {
    setMenuOpen(false);
    setNotifOpen(false);
    setAvatarOpen(false);
    setSearchOpen(false);
    setCatDropOpen(false);
    navigate(href);
  }, [navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (catDropRef.current && !catDropRef.current.contains(e.target as Node)) setCatDropOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      go(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const formatBalance = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K₫`;
    return `${v.toLocaleString("vi-VN")}₫`;
  };

  const formatTime = (d: Date | string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const notifTypeIcon = (type: string) => {
    switch (type) {
      case "order": return "🛒";
      case "payment": return "💳";
      case "success": return "✅";
      case "warning": return "⚠️";
      case "promo": return "🎁";
      default: return "🔔";
    }
  };

  const handleLogout = () => {
    ctxLogout();
    setAvatarOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Announcement banners - shown above header */}
      <AnnouncementBanner />
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/10">
        <div className={`${maxWidth} mx-auto px-4 h-14 flex items-center gap-3`}>
          {/* Logo */}
          <button onClick={() => go("/")} className="flex items-center gap-2 flex-shrink-0 mr-2">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{companyName}</span>
            )}
          </button>

          {/* Desktop Nav - Categories dropdown */}
          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {/* Danh mục dropdown */}
            <div ref={catDropRef} className="relative">
              <button
                onClick={() => setCatDropOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-colors text-sm font-medium"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Danh mục</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${catDropOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Category Mega Dropdown */}
              {catDropOpen && parentCategories.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex overflow-hidden"
                  style={{ minWidth: 220, maxWidth: 600 }}>
                  {/* Left: parent categories */}
                  <div className="w-52 border-r border-white/10 py-2">
                    {parentCategories.map((cat: any) => {
                      const children = childrenOf(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onMouseEnter={() => setHoveredParent(cat.id)}
                          onClick={() => { go(`/catalog?category=${cat.id}`); }}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${hoveredParent === cat.id ? "bg-white/8 text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CatIcon icon={cat.icon} className="text-base flex-shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {children.length > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />}
                        </button>
                      );
                    })}
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        onClick={() => go("/catalog")}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        <span>Tất cả sản phẩm</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: child categories of hovered parent */}
                  {hoveredParent && childrenOf(hoveredParent).length > 0 && (
                    <div className="w-52 py-2">
                      <p className="px-4 py-1.5 text-xs font-semibold text-white/30 uppercase tracking-wider">
                        {parentCategories.find((c: any) => c.id === hoveredParent)?.name}
                      </p>
                      {childrenOf(hoveredParent).map((child: any) => (
                        <button
                          key={child.id}
                          onClick={() => go(`/catalog?category=${child.id}`)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <CatIcon icon={child.icon} className="text-sm" />
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other nav links */}
            {[
              isEnabled("blog") ? { label: "Blog", href: "/blog", icon: BookOpen } : null,
              isEnabled("leaderboard") ? { label: "Bảng Xếp Hạng", href: "/leaderboard", icon: Trophy } : null,
              { label: "Hỗ trợ", href: "/support", icon: MessageSquare },
            ].filter((item): item is { label: string; href: string; icon: any } => item !== null).map(item => (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-colors text-sm font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full bg-white/8 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/12 transition-all"
                />
              </div>
            </form>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            {/* Mobile Search */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="md:hidden p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Gift / Coupons */}
            {isEnabled("coupons") && (
            <button
              onClick={() => go("/coupons")}
              className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Kho mã giảm giá"
            >
              <Gift className="h-5 w-5" />
            </button>
            )}

            {/* Cart Icon - always visible */}
            <button
              onClick={() => go("/cart")}
              className="relative p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Giỏ hàng"
            >
                <ShoppingCart className={`h-5 w-5 ${cartCount > 0 ? "animate-[wiggle_2s_ease-in-out_infinite]" : ""}`} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
            </button>
            {/* Notification Bell */}
            {isLoggedIn && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { setNotifOpen(v => !v); setAvatarOpen(false); }}
                  className="relative p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <span className="font-semibold text-white">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate({ token: token })}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-white/40 text-sm">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Chưa có thông báo
                        </div>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            className={`flex gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 ${!n.isRead ? "bg-blue-500/5" : ""}`}
                            onClick={() => {
                              if (n.link) go(n.link);
                              setNotifOpen(false);
                            }}
                          >
                            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-base">
                              {notifTypeIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-medium leading-tight ${!n.isRead ? "text-white" : "text-white/70"}`}>{n.title}</p>
                                {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" />}
                              </div>
                              <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-white/30 mt-1">{formatTime(n.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-white/10 px-4 py-2">
                      <button onClick={() => go("/my-account?tab=notifications")} className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-1 transition-colors">
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Avatar / Login */}
            {isLoggedIn ? (
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => { setAvatarOpen(v => !v); setNotifOpen(false); }}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 hover:border-blue-400/60 transition-colors flex-shrink-0"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Avatar Dropdown */}
                {avatarOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/30 flex-shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{displayName}</p>
                          <p className="text-xs text-white/40 truncate">{email}</p>
                        </div>
                      </div>
                      {/* Wallet Balance */}
                      <button
                        onClick={() => go("/wallet")}
                        className="mt-3 w-full bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Wallet className="h-4 w-4" />
                          <span>Số dư ví</span>
                        </div>
                        <span className="text-blue-400 font-bold text-sm">{formatBalance(walletBalance)}</span>
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {[
                        { icon: User, label: "Trang cá nhân", href: "/my-account" },
                        { icon: CreditCard, label: "Nạp tiền", href: "/wallet" },
                        { icon: ShoppingCart, label: "Đơn hàng", href: "/track-order" },
                        { icon: Wallet, label: "Lịch sử dòng tiền", href: "/wallet-history" },
                      ].map(item => (
                        <button
                          key={item.href}
                          onClick={() => go(item.href)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {isAdmin && (
                      <div className="border-t border-white/10 py-1">
                        <button
                          onClick={() => { window.location.href = "/login"; }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 transition-colors text-sm"
                        >
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          <span>Quản Trị Admin</span>
                        </button>
                      </div>
                    )}
                    <div className="border-t border-white/10 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-sm"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
             ) : (
              <button
                onClick={() => go("/client-login")}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
            )}

            {/* Hamburger - mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (expandable) */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 bg-[#0a0a0a]">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  autoFocus
                  className="w-full bg-white/8 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Slide-in Menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${menuOpen ? "visible" : "invisible"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer - full height with scroll */}
        <div className={`absolute top-0 right-0 h-full w-72 bg-[#111] border-l border-white/10 transition-transform duration-300 flex flex-col ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{displayName}</p>
                  <p className="text-white/40 text-xs">{email}</p>
                </div>
              </div>
            ) : (
              <span className="text-white font-semibold">Menu</span>
            )}
            <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/60">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Balance (if logged in) */}
            {isLoggedIn && (
              <button
                onClick={() => go("/wallet")}
                className="mx-4 mt-3 w-[calc(100%-2rem)] bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>Số dư ví</span>
                </div>
                <span className="text-blue-400 font-bold text-sm">{formatBalance(walletBalance)}</span>
              </button>
            )}

            {/* Nav Links */}
            <nav className="px-2 py-3 space-y-0.5">
              {[
                { icon: Home, label: "Trang chủ", href: "/" },
                { icon: CreditCard, label: "Nạp tiền", href: "/wallet" },
                { icon: Wallet, label: "Lịch sử dòng tiền", href: "/wallet-history" },
                isEnabled("coupons") ? { icon: Tag, label: "Kho Mã Giảm Giá", href: "/coupons" } : null,
                isEnabled("blog") ? { icon: BookOpen, label: "Blog", href: "/blog" } : null,
                isEnabled("leaderboard") ? { icon: Trophy, label: "Bảng Xếp Hạng", href: "/leaderboard" } : null,
                { icon: HelpCircle, label: "Hỗ trợ", href: "/support" },
              ].filter((link): link is { icon: any; label: string; href: string } => link !== null).map(link => (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm"
                >
                  <link.icon className="h-5 w-5 text-white/40" />
                  <span className="font-medium">{link.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-30" />
                </button>
              ))}

              {/* Categories with accordion */}
              {parentCategories.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Danh mục</p>
                  </div>
                  {parentCategories.map((cat: any) => {
                    const children = childrenOf(cat.id);
                    const isExpanded = expandedMobileCat === cat.id;
                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => {
                            if (children.length > 0) {
                              setExpandedMobileCat(isExpanded ? null : cat.id);
                            } else {
                              go(`/catalog?category=${cat.id}`);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm"
                        >
                          <CatIcon icon={cat.icon} className="text-base" />
                          <span className="flex-1 text-left">{cat.name}</span>
                          {children.length > 0 ? (
                            <ChevronDown className={`h-4 w-4 opacity-40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          ) : (
                            <ChevronRight className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                        {/* Child categories */}
                        {isExpanded && children.length > 0 && (
                          <div className="ml-4 border-l border-white/10 pl-3 space-y-0.5 mb-1">
                            <button
                              onClick={() => go(`/catalog?category=${cat.id}`)}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                              <span>Tất cả {cat.name}</span>
                            </button>
                            {children.map((child: any) => (
                              <button
                                key={child.id}
                                onClick={() => go(`/catalog?category=${child.id}`)}
                                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
                              >
                                <CatIcon icon={child.icon} className="text-sm" />
                                <span>{child.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}


            </nav>
          </div>

          {/* Bottom Actions - fixed at bottom */}
          <div className="px-4 pb-6 pt-3 border-t border-white/10 flex-shrink-0 space-y-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => go("/my-account")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <User className="h-4 w-4" /> Trang cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <button
                onClick={() => go("/client-login")}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <User className="h-4 w-4" /> Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wiggle animation for bell */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-15deg); }
          30% { transform: rotate(12deg); }
          45% { transform: rotate(-10deg); }
          60% { transform: rotate(8deg); }
          75% { transform: rotate(-5deg); }
          90% { transform: rotate(3deg); }
        }
      `}</style>
    </>
  );
}
