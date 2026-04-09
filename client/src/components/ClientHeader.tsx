/**
 * ClientHeader - Header dùng chung cho tất cả trang client
 * Dark theme, logo, search, bell thông báo, avatar dropdown, hamburger
 * Thiết kế theo ảnh tham khảo sieuthicode.vn style
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { useLocation } from "wouter";
import {
  Menu, X, Search, Bell, Gift, User, Home, Package,
  CreditCard, BookOpen, ChevronRight, Settings, LogOut,
  Wallet, ShoppingCart, LayoutGrid, Star, Ticket, Tag, HelpCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientHeaderProps {
  maxWidth?: string;
}

export function ClientHeader({ maxWidth = "max-w-7xl" }: ClientHeaderProps) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const companyName = publicInfo?.companyName || "ShopKey";

  const token = typeof window !== "undefined" ? localStorage.getItem("customerToken") || "" : "";
  const isLoggedIn = !!token;

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

  const { data: sessionData } = trpc.customer.me.useQuery(
    { token },
    { enabled: isLoggedIn, staleTime: 60_000 }
  );

  const walletBalance = walletData?.balance ?? 0;
  const unreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.items ?? [];
  const avatarUrl = sessionData?.avatarUrl;
  const displayName = sessionData?.name || sessionData?.email?.split("@")[0] || "Tài Khoản";
  const email = sessionData?.email || "";
  const isAdmin = (sessionData as any)?.role === "admin";

  const go = useCallback((href: string) => {
    setMenuOpen(false);
    setNotifOpen(false);
    setAvatarOpen(false);
    setSearchOpen(false);
    navigate(href);
  }, [navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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

  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 300_000 });

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
            <button
              onClick={() => go("/coupons")}
              className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Kho mã giảm giá"
            >
              <Gift className="h-5 w-5" />
            </button>

            {/* Notification Bell */}
            {isLoggedIn && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { setNotifOpen(v => !v); setAvatarOpen(false); }}
                  className="relative p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
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
                    <div className="px-4 py-2 border-t border-white/10">
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
                      <div className="mt-3 bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Wallet className="h-4 w-4" />
                          <span>Số dư</span>
                        </div>
                        <span className="text-blue-400 font-bold text-sm">{formatBalance(walletBalance)}</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {[
                        { icon: LayoutGrid, label: "Bảng điều khiển", href: "/my-account" },
                        { icon: User, label: "Trang cá nhân", href: "/my-account?tab=profile" },
                        { icon: CreditCard, label: "Nạp tiền", href: "/wallet" },
                        { icon: ShoppingCart, label: "Đơn hàng", href: "/my-account?tab=orders" },
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
                          onClick={() => go("/dashboard")}
                          className="w-full flex items-center gap-3 px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 transition-colors text-sm"
                        >
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          <span>Quản Trị</span>
                        </button>
                      </div>
                    )}
                    <div className="border-t border-white/10 py-1">
                      <button
                        onClick={() => {
                          localStorage.removeItem("customerToken");
                          setAvatarOpen(false);
                          navigate("/");
                          window.location.reload();
                        }}
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

        {/* Drawer */}
        <div className={`absolute top-0 right-0 h-full w-72 bg-[#111] border-l border-white/10 transition-transform duration-300 overflow-y-auto ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
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

          {/* Balance (if logged in) */}
          {isLoggedIn && (
            <div className="mx-4 mt-3 bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Wallet className="h-4 w-4" />
                <span>Số dư</span>
              </div>
              <span className="text-blue-400 font-bold text-sm">{formatBalance(walletBalance)}</span>
            </div>
          )}

          {/* Nav Links */}
          <nav className="px-2 py-3 space-y-0.5">
            {[
              { icon: Home, label: "Trang chủ", href: "/" },
              { icon: Package, label: "Sản phẩm", href: "/catalog" },
              { icon: CreditCard, label: "Nạp tiền", href: "/wallet" },
              { icon: Tag, label: "Kho Mã Giảm Giá", href: "/coupons" },
              { icon: BookOpen, label: "Hướng dẫn", href: "/faq" },
              { icon: HelpCircle, label: "Hỗ trợ", href: "/support" },
            ].map(link => (
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

            {/* Categories */}
            {categories && categories.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Danh mục</p>
                </div>
                {categories.slice(0, 8).map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => go(`/catalog?category=${cat.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm"
                  >
                    <LayoutGrid className="h-4 w-4 text-white/30" />
                    <span>{cat.name}</span>
                    {cat.productCount > 0 && (
                      <span className="ml-auto text-xs text-white/30">{cat.productCount}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 pb-6 pt-2 border-t border-white/10 mt-2 space-y-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => go("/my-account")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <User className="h-4 w-4" /> Tài khoản của tôi
                </button>
                <button
                  onClick={() => go("/support")}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Ticket className="h-4 w-4" /> Hỗ trợ
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
    </>
  );
}
