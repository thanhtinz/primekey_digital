import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Menu, X, FileText, Search, MessageSquare, Star, Shield, Zap,
  CheckCircle, ArrowRight, CreditCard, Users, BarChart3, Bell,
  Clock, Smartphone, Lock, TrendingUp, Package, ChevronRight,
  Mail, Phone, MapPin, Building2, Receipt, Send, ListOrdered,
  Trophy, ShoppingBag, Flame, Tag
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// Hook scroll animation dùng Intersection Observer
function useScrollReveal() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const observe = useCallback((id: string) => {
    return (el: HTMLElement | null) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealed(prev => { const next = new Set(prev); next.add(id); return next; });
            observer.disconnect();
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      observer.observe(el);
    };
  }, []);
  return { revealed, observe };
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { revealed, observe } = useScrollReveal();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: realReviews } = trpc.reviews.getPublic.useQuery();
  const { data: activeSales = [] } = trpc.flashSale.getActive.useQuery(undefined, { staleTime: 60_000 });

  const navLinks = [
    { label: "Tra Cứu Đơn", href: "/track-order", icon: Search },
    { label: "Bảo Hành", href: "/warranty", icon: Shield },
    { label: "Hàng Chờ", href: "/queue", icon: ListOrdered },
    { label: "BXH", href: "/leaderboard", icon: Trophy },
    { label: "Flash Sale", href: "/flash-sale", icon: ShoppingBag },
    { label: "Đánh Giá", href: "/feedbacks-public", icon: Star },
  ];

  const stats = [
    { value: "15+", label: "Tính năng quản lý", icon: Package },
    { value: "< 3s", label: "Xác nhận thanh toán", icon: Zap },
    { value: "24/7", label: "Tra cứu & bảo hành", icon: Clock },
    { value: "100%", label: "Bảo mật dữ liệu", icon: Lock },
  ];

  const features = [
    {
      icon: <Receipt className="h-6 w-6 text-blue-400" />,
      title: "Hóa Đơn Chuyên Nghiệp",
      desc: "Nhận hóa đơn đẹp với logo thương hiệu, mã QR thanh toán. Gửi tự động qua email, có thể tải PDF bất cứ lúc nào.",
      badge: "Phổ biến",
      badgeColor: "bg-blue-500/20 text-blue-300",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-400" />,
      title: "Thanh Toán QR Tức Thì",
      desc: "Quét mã QR trong hóa đơn để thanh toán ngay qua ngân hàng. Xác nhận tức thì, không cần chờ đợi.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      title: "Tra Cứu Bảo Hành",
      desc: "Nhập mã hóa đơn để kiểm tra thời hạn bảo hành, điều khoản, thông tin liên hệ và số ngày còn lại.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <ListOrdered className="h-6 w-6 text-orange-400" />,
      title: "Hàng Chờ Đơn Hàng",
      desc: "Xem vị trí đơn hàng của bạn trong hàng chờ xử lý. Cập nhật tự động mỗi 15 giây, miễn phí không cần đăng nhập.",
      badge: "Mới",
      badgeColor: "bg-orange-500/20 text-orange-300",
    },
    {
      icon: <Trophy className="h-6 w-6 text-yellow-400" />,
      title: "BXH Chi Tiêu",
      desc: "Xem bảng xếp hạng khách hàng chi tiêu nhiều nhất theo ngày, tuần, tháng hoặc năm. Top 20 ưu đãi đặc biệt.",
      badge: "Mới",
      badgeColor: "bg-yellow-500/20 text-yellow-300",
    },
    {
      icon: <ShoppingBag className="h-6 w-6 text-red-400" />,
      title: "Flash Sale",
      desc: "Săn sản phẩm giảm giá sốc với đồng hồ đếm ngược. Giá gốc, giá sale và % giảm hiển thị rõ ràng.",
      badge: "Hot",
      badgeColor: "bg-red-500/20 text-red-300",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-amber-400" />,
      title: "Viết Đánh Giá",
      desc: "Nhận link đánh giá sau khi mua hàng. Chia sẻ trải nghiệm của bạn và giúp công ty cải thiện dịch vụ.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-teal-400" />,
      title: "Trang Cảm Ơn Đặc Biệt",
      desc: "Sau khi thanh toán, bạn sẽ thấy trang cảm ơn với logo, màu sắc và lời nhắn riêng của công ty.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <Search className="h-6 w-6 text-indigo-400" />,
      title: "Tra Cứu Đơn Hàng Chi Tiết",
      desc: "Xem đầy đủ thông tin: sản phẩm, số lượng, giá, thuế, giảm giá, ghi chú và trạng thái giao hàng.",
      badge: null,
      badgeColor: "",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      icon: Receipt,
      title: "Nhận Hóa Đơn & Thanh Toán",
      desc: "Khi mua hàng, bạn nhận email hóa đơn đẹp với mã QR. Quét QR thanh toán ngay qua ngân hàng — xác nhận tức thì.",
      color: "from-blue-500 to-blue-600",
    },
    {
      step: "02",
      icon: Search,
      title: "Theo Dõi Đơn Hàng & Hàng Chờ",
      desc: "Nhập email để xem trạng thái đơn hàng realtime. Xem vị trí trong hàng chờ xử lý, cập nhật tự động mỗi 15 giây.",
      color: "from-green-500 to-emerald-600",
    },
    {
      step: "03",
      icon: ShoppingBag,
      title: "Flash Sale & BXH",
      desc: "Săn sản phẩm giảm giá sốc với đồng hồ đếm ngược. Xem BXH khách hàng chi tiêu nhiều nhất theo ngày, tuần, tháng.",
      color: "from-red-500 to-orange-600",
    },
    {
      step: "04",
      icon: Shield,
      title: "Bảo Hành & Đánh Giá",
      desc: "Tra cứu bảo hành bất cứ lúc nào. Xem điều khoản, thời hạn, liên hệ hỗ trợ. Viết đánh giá để giúp cải thiện dịch vụ.",
      color: "from-purple-500 to-violet-600",
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Thị Lan",
      role: "Khách hàng thường xuyên",
      avatar: "NL",
      avatarColor: "from-pink-400 to-rose-500",
      content: "Rất tiện lợi! Tôi nhận hóa đơn qua email, quét QR thanh toán ngay trong 30 giây. Không cần chuyển khoản thủ công nữa.",
      stars: 5,
    },
    {
      name: "Trần Văn Minh",
      role: "Chủ doanh nghiệp nhỏ",
      avatar: "TM",
      avatarColor: "from-blue-400 to-indigo-500",
      content: "Hệ thống tra cứu đơn hàng rất hữu ích. Khách hàng tự tra được, nhân viên tôi không phải trả lời hàng chục tin nhắn mỗi ngày.",
      stars: 5,
    },
    {
      name: "Lê Thị Hoa",
      role: "Khách hàng mới",
      avatar: "LH",
      avatarColor: "from-green-400 to-teal-500",
      content: "Hóa đơn đẹp, chuyên nghiệp. Tôi thích nhất là có thể xem lại lịch sử mua hàng và trạng thái bảo hành bất cứ lúc nào.",
      stars: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-3">
            {publicInfo?.companyLogo ? (
              <img
                src={publicInfo.companyLogo}
                alt={publicInfo?.companyName || "Logo"}
                className="h-9 max-w-[140px] rounded-lg object-contain"
              />
            ) : (
              <div className="h-9 px-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-sm">
                  {publicInfo?.companyName ? publicInfo.companyName.slice(0, 2).toUpperCase() : "IP"}
                </span>
              </div>
            )}
            {!publicInfo?.companyLogo && <span className="font-bold text-lg hidden sm:block">{publicInfo?.companyName || "Invoice Prime"}</span>}
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => setLocation(link.href)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-slate-900/95 border-t border-white/10 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => { setLocation(link.href); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm text-left"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        ref={observe("hero")}
        className={`relative overflow-hidden py-20 md:py-32 transition-all duration-700 ${
          revealed.has("hero") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Flash Sale Banner */}
            {activeSales.length > 0 && (
              <button
                onClick={() => setLocation("/flash-sale")}
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-red-600/20 via-orange-500/15 to-red-600/20 border border-red-500/30 rounded-2xl px-5 py-3 mb-6 hover:border-red-500/50 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="relative">
                  <Flame className="h-5 w-5 text-red-400 animate-bounce" />
                </div>
                <div className="text-left">
                  <p className="text-red-300 font-bold text-sm">
                    Flash Sale đang diễn ra — {activeSales.length} ưu đãi
                  </p>
                  <p className="text-red-400/60 text-xs">
                    Giảm đến {Math.max(...activeSales.map(s => s.discountPercent || 0))}% — Nhanh tay kẻo lỡ!
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-red-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-300 text-sm mb-8">
              <Zap className="h-4 w-4 fill-blue-400 text-blue-400" />
              Nền tảng hóa đơn & thanh toán cho doanh nghiệp Việt
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Quản Lý Hóa Đơn
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                Chuyên Nghiệp & Tự Động
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Tạo hóa đơn, thanh toán QR, quản lý bảo hành, flash sale, BXH chi tiêu,
              hàng chờ đơn hàng và thông báo Telegram — tất cả trong một nền tảng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => setLocation("/track-order")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 text-base gap-2 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <Search className="h-5 w-5" />
                Tra Cứu Đơn Hàng
              </Button>
              <Button
                onClick={() => setLocation("/feedbacks-public")}
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-white/5 h-12 px-8 text-base gap-2 transition-all hover:-translate-y-0.5"
              >
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Xem Đánh Giá
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Không cần đăng ký</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Thanh toán an toàn 256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Hỗ trợ mọi ngân hàng Việt Nam</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        ref={observe("stats")}
        className={`py-12 border-y border-white/10 bg-white/2 transition-all duration-700 delay-100 ${
          revealed.has("stats") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-slate-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={observe("howItWorks")}
        className={`py-20 transition-all duration-700 ${
          revealed.has("howItWorks") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-400 text-xs mb-4">
              <TrendingUp className="h-3.5 w-3.5" />
              QUY TRÌNH ĐƠN GIẢN
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trải Nghiệm Khách Hàng</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Từ khi đặt hàng đến khi hết bảo hành — mọi thứ đều minh bạch và tự động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-500/50 via-green-500/50 via-red-500/50 to-purple-500/50" />

            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="text-5xl font-black text-white/5 leading-none mt-1">{step.step}</div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="md:hidden flex justify-center my-4">
                      <ChevronRight className="h-5 w-5 text-slate-600 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        ref={observe("features")}
        className={`py-20 border-t border-white/10 transition-all duration-700 ${
          revealed.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-400 text-xs mb-4">
              <Package className="h-3.5 w-3.5" />
              TÍNH NĂNG NỔI BẬT
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trải Nghiệm Khách Hàng</h2>
            <p className="text-slate-400 text-lg">Mọi thứ bạn cần để quản lý đơn hàng và bảo hành</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/8 transition-all hover:border-white/20 group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      {feature.icon}
                    </div>
                    {feature.badge && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-base">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Quick Access */}
      <section
        ref={observe("quickAccess")}
        className={`py-20 border-t border-white/10 transition-all duration-700 ${
          revealed.has("quickAccess") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-400 text-xs mb-4">
              <Users className="h-3.5 w-3.5" />
              DÀNH CHO KHÁCH HÀNG
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Truy Cập Nhanh</h2>
            <p className="text-slate-400 text-lg">Không cần đăng nhập — tra cứu, mua sắm và xem đánh giá ngay</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card
              className="bg-gradient-to-br from-blue-600/15 to-blue-800/15 border-blue-500/25 cursor-pointer hover:border-blue-400/50 hover:from-blue-600/20 hover:to-blue-800/20 transition-all group"
              onClick={() => setLocation("/track-order")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Search className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Tra Cứu Đơn Hàng</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Nhập email để xem trạng thái đơn hàng, lịch sử mua hàng và thông tin bảo hành.
                    </p>
                    <div className="flex items-center gap-1.5 text-blue-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Tra cứu ngay</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-blue-600/15 to-indigo-800/15 border-blue-500/25 cursor-pointer hover:border-blue-400/50 hover:from-blue-600/20 hover:to-indigo-800/20 transition-all group"
              onClick={() => setLocation("/warranty")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Shield className="h-7 w-7 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Tra Cứu Bảo Hành</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Nhập mã hóa đơn để kiểm tra thời hạn bảo hành, ngày bắt đầu và số ngày còn lại.
                    </p>
                    <div className="flex items-center gap-1.5 text-blue-300 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Kiểm tra ngay</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-orange-600/15 to-orange-800/15 border-orange-500/25 cursor-pointer hover:border-orange-400/50 hover:from-orange-600/20 hover:to-orange-800/20 transition-all group"
              onClick={() => setLocation("/queue")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                    <ListOrdered className="h-7 w-7 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Hàng Chờ Đơn Hàng</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Xem vị trí đơn hàng trong hàng chờ xử lý, cập nhật tự động mỗi 15 giây.
                    </p>
                    <div className="flex items-center gap-1.5 text-orange-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Xem hàng chờ</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-yellow-600/15 to-amber-800/15 border-yellow-500/25 cursor-pointer hover:border-yellow-400/50 hover:from-yellow-600/20 hover:to-amber-800/20 transition-all group"
              onClick={() => setLocation("/leaderboard")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/30 transition-colors">
                    <Trophy className="h-7 w-7 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">BXH Chi Tiêu</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Top 20 khách hàng chi tiêu nhiều nhất. Lọc theo ngày, tuần, tháng, năm.
                    </p>
                    <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Xem BXH</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-red-600/15 to-red-800/15 border-red-500/25 cursor-pointer hover:border-red-400/50 hover:from-red-600/20 hover:to-red-800/20 transition-all group"
              onClick={() => setLocation("/flash-sale")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                    <ShoppingBag className="h-7 w-7 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Flash Sale</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Săn sản phẩm giảm giá sốc với đồng hồ đếm ngược. Số lượng có hạn!
                    </p>
                    <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Xem Flash Sale</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-amber-600/15 to-amber-800/15 border-amber-500/25 cursor-pointer hover:border-amber-400/50 hover:from-amber-600/20 hover:to-amber-800/20 transition-all group"
              onClick={() => setLocation("/feedbacks-public")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/30 transition-colors">
                    <Star className="h-7 w-7 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Đánh Giá Khách Hàng</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Xem những phản hồi thực tế từ khách hàng đã mua hàng và sử dụng dịch vụ.
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                      <span>Xem đánh giá</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dành Cho Khách Hàng - Chi Tiết */}
      <section
        ref={observe("customer-benefits")}
        className={`py-20 border-t border-white/10 transition-all duration-700 ${
          revealed.has("customer-benefits") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-400 text-xs mb-4">
              <CheckCircle className="h-3.5 w-3.5" />
              LỢI ÍCH KHÁCH HÀNG
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tại Sao Chọn Chúng Tôi?</h2>
            <p className="text-slate-400 text-lg">Khách hàng của chúng tôi tận hưởng một trải nghiệm đẹp và tiện lợi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Hóa Đơn Chuyên Nghiệp */}
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hóa Đơn Đẹp & Đầy Đủ</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Mỗi hóa đơn đều có logo thương hiệu, mã QR thanh toán và thông tin chi tiết. Bạn nhận qua email và có thể tải PDF bất cứ lúc nào.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Nhận tự động qua email
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Mã QR thanh toán sẵn sàng
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Tải PDF khi cần
                </li>
              </ul>
            </div>

            {/* Thanh Toán Dễ Dàng */}
            <div className="bg-gradient-to-br from-green-600/10 to-green-800/10 border border-green-500/20 rounded-2xl p-8 hover:border-green-400/40 transition-all">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Thanh Toán QR Tức Thì</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Quét mã QR trong hóa đơn để thanh toán ngay qua ứng dụng ngân hàng của bạn. Xác nhận tức thì, không cần chờ đợi.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Quét QR từ hóa đơn
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Xác nhận tức thì
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  An toàn và bảo mật
                </li>
              </ul>
            </div>

            {/* Tra Cứu Bảo Hành */}
            <div className="bg-gradient-to-br from-cyan-600/10 to-cyan-800/10 border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Tra Cứu Bảo Hành 24/7</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Nhập mã hóa đơn để kiểm tra thời hạn bảo hành, ngày bắt đầu, ngày hết hạn và số ngày còn lại. Bất cứ lúc nào, bất kỳ đâu.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Tra cứu không cần đăng nhập
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Xem ngày hết hạn rõ ràng
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Nhận thông báo nhắc sắp hết hạn
                </li>
              </ul>
            </div>

            {/* Hàng Chờ & BXH */}
            <div className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 border border-orange-500/20 rounded-2xl p-8 hover:border-orange-400/40 transition-all">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <ListOrdered className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hàng Chờ & BXH Chi Tiêu</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Xem vị trí đơn hàng trong hàng chờ xử lý, cập nhật tự động. Xem bảng xếp hạng khách hàng chi tiêu nhiều nhất.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Cập nhật tự động mỗi 15 giây
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Top 20 khách hàng theo ngày/tuần/tháng/năm
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Không cần đăng nhập
                </li>
              </ul>
            </div>

            {/* Flash Sale */}
            <div className="bg-gradient-to-br from-red-600/10 to-red-800/10 border border-red-500/20 rounded-2xl p-8 hover:border-red-400/40 transition-all">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Flash Sale & Khuyến Mãi</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Săn sản phẩm giảm giá sốc với đồng hồ đếm ngược. Giá gốc, giá sale và % giảm hiển thị rõ ràng.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Đồng hồ đếm ngược realtime
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Giá gốc vs giá sale rõ ràng
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Số lượng có hạn, nhanh tay mua ngay!
                </li>
              </ul>
            </div>

            {/* Viết Đánh Giá & Trang Cảm Ơn */}
            <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 border border-amber-500/20 rounded-2xl p-8 hover:border-amber-400/40 transition-all">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Trải Nghiệm Đẹp</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Sau khi thanh toán, bạn sẽ thấy trang cảm ơn đẹp với logo công ty. Bạn có thể chia sẻ đánh giá và giúp công ty cải thiện.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Trang cảm ơn đẹp và uy tín
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Viết đánh giá dễ dàng
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Giúp công ty phát triển
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - chỉ hiển thị khi có reviews thật đã được duyệt */}
      {realReviews && realReviews.length > 0 && (
        <section
          ref={observe("testimonials")}
          className={`py-20 border-t border-white/10 transition-all duration-700 ${
            revealed.has("testimonials") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-400 text-xs mb-4">
                <MessageSquare className="h-3.5 w-3.5" />
                KHÁCH HÀNG NÓI GÌ
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Phản Hồi Thực Tế</h2>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-400">{realReviews.length} đánh giá từ khách hàng thực tế</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {realReviews.slice(0, 6).map((review, i) => {
                const avatarColors = [
                  "from-pink-400 to-rose-500",
                  "from-blue-400 to-indigo-500",
                  "from-green-400 to-teal-500",
                  "from-yellow-400 to-orange-500",
                  "from-purple-400 to-violet-500",
                  "from-cyan-400 to-sky-500",
                ];
                const name = review.customerName || "Khách hàng";
                const initials = name.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase();
                return (
                  <Card key={review.id} className="bg-white/5 border-white/10 hover:bg-white/8 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        ))}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{review.comment || "Sản phẩm tốt, dịch vụ chuyên nghiệp."}"</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${avatarColors[i % avatarColors.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-xs">{initials}</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm">{name}</div>
                          <div className="text-slate-500 text-xs">{review.productName || "Khách hàng"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section
        ref={observe("cta")}
        className={`py-20 border-t border-white/10 transition-all duration-700 ${
          revealed.has("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-3xl p-10 md:p-14">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bắt Đầu Ngay Hôm Nay
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Tra cứu đơn hàng, săn flash sale, xem BXH chi tiêu hoặc liên hệ nếu cần hỗ trợ.
              Đội ngũ luôn sẵn sàng giúp đỡ 24/7.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setLocation("/track-order")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-6 text-base gap-2 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
              >
                <Search className="h-5 w-5" />
                Tra Cứu Đơn
              </Button>
              <Button
                onClick={() => setLocation("/flash-sale")}
                size="lg"
                className="bg-red-600 hover:bg-red-500 text-white h-12 px-6 text-base gap-2 shadow-lg shadow-red-500/25 hover:-translate-y-0.5 transition-all"
              >
                <ShoppingBag className="h-5 w-5" />
                Flash Sale
              </Button>
              <Button
                onClick={() => setLocation("/warranty")}
                size="lg"
                variant="outline"
                className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 bg-blue-500/5 h-12 px-6 text-base gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Shield className="h-5 w-5" />
                Bảo Hành
              </Button>
              <Button
                onClick={() => setLocation("/leaderboard")}
                size="lg"
                variant="outline"
                className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10 bg-yellow-500/5 h-12 px-6 text-base gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Trophy className="h-5 w-5" />
                BXH
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {publicInfo?.companyLogo ? (
                  <img
                    src={publicInfo.companyLogo}
                    alt={publicInfo?.companyName || "Logo"}
                    className="h-9 max-w-[140px] rounded-lg object-contain"
                  />
                ) : (
                  <div className="h-9 px-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-bold text-sm">{publicInfo?.companyName ? publicInfo.companyName.slice(0,2).toUpperCase() : "IP"}</span>
                  </div>
                )}
                {!publicInfo?.companyLogo && <span className="font-bold text-white text-lg">{publicInfo?.companyName || "Invoice Prime"}</span>}
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nền tảng hóa đơn và thanh toán chuyên nghiệp cho doanh nghiệp Việt Nam.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Khách Hàng</h4>
              <div className="space-y-2">
                <button onClick={() => setLocation("/track-order")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <Search className="h-3.5 w-3.5" /> Tra Cứu Đơn Hàng
                </button>
                <button onClick={() => setLocation("/warranty")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <Shield className="h-3.5 w-3.5" /> Tra Cứu Bảo Hành
                </button>
                <button onClick={() => setLocation("/queue")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <ListOrdered className="h-3.5 w-3.5" /> Hàng Chờ Đơn Hàng
                </button>
                <button onClick={() => setLocation("/leaderboard")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <Trophy className="h-3.5 w-3.5" /> BXH Chi Tiêu
                </button>
                <button onClick={() => setLocation("/flash-sale")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <ShoppingBag className="h-3.5 w-3.5" /> Flash Sale
                </button>
                <button onClick={() => setLocation("/feedbacks-public")} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                  <Star className="h-3.5 w-3.5" /> Xem Đánh Giá
                </button>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên Hệ</h4>
              <div className="space-y-2">
                {(publicInfo?.companyEmail || publicInfo?.companyName) && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{publicInfo?.companyEmail || "support@invoiceprime.vn"}</span>
                  </div>
                )}
                {!publicInfo?.companyEmail && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>support@invoiceprime.vn</span>
                  </div>
                )}
                {publicInfo?.companyPhone ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{publicInfo.companyPhone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Liên hệ qua email</span>
                  </div>
                )}
                {publicInfo?.companyAddress ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{publicInfo.companyAddress}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Việt Nam</span>
                  </div>
                )}
                {publicInfo?.website && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <a href={publicInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">{publicInfo.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} {publicInfo?.companyName || "Invoice Prime"}. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-600 text-xs">
              <Lock className="h-3 w-3" />
              <span>Bảo mật SSL 256-bit</span>
              <span className="mx-2">·</span>
              <Shield className="h-3 w-3" />
              <span>Tuân thủ PCI DSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
