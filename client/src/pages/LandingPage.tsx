import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Menu, X, FileText, Search, MessageSquare, Star, Shield, Zap,
  CheckCircle, ArrowRight, CreditCard, Users, BarChart3, Bell,
  Clock, Smartphone, Lock, TrendingUp, Package, ChevronRight,
  Mail, Phone, MapPin, Building2, Receipt, Send
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

  const navLinks = [
    { label: "Tra Cứu Đơn", href: "/track-order", icon: Search },
    { label: "Đánh Giá", href: "/feedbacks-public", icon: Star },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime đảm bảo", icon: Shield },
    { value: "< 3s", label: "Xác nhận thanh toán", icon: Zap },
    { value: "24/7", label: "Hỗ trợ khách hàng", icon: Clock },
    { value: "100%", label: "Bảo mật dữ liệu", icon: Lock },
  ];

  const features = [
    {
      icon: <Receipt className="h-6 w-6 text-blue-400" />,
      title: "Hóa Đơn Chuyên Nghiệp",
      desc: "Tạo hóa đơn đẹp, có logo thương hiệu riêng trong vài giây. Gửi tự động qua email cho khách hàng.",
      badge: "Phổ biến",
      badgeColor: "bg-blue-500/20 text-blue-300",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-400" />,
      title: "Thanh Toán QR Tức Thì",
      desc: "Tích hợp PayOS — khách quét QR thanh toán ngay, hệ thống xác nhận tự động không cần chờ đợi.",
      badge: "Mới",
      badgeColor: "bg-green-500/20 text-green-300",
    },
    {
      icon: <Search className="h-6 w-6 text-cyan-400" />,
      title: "Tra Cứu Đơn Hàng",
      desc: "Khách hàng tự tra cứu trạng thái đơn hàng 24/7 theo email — giảm tải cho nhân viên hỗ trợ.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <Bell className="h-6 w-6 text-yellow-400" />,
      title: "Thông Báo Tự Động",
      desc: "Email xác nhận đơn hàng, nhắc thanh toán, thông báo bảo hành — tất cả gửi tự động đúng lúc.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />,
      title: "Thu Thập Đánh Giá",
      desc: "Tự động gửi link đánh giá sau khi hoàn thành đơn. Xây dựng uy tín thương hiệu một cách tự nhiên.",
      badge: null,
      badgeColor: "",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-rose-400" />,
      title: "Báo Cáo & Thống Kê",
      desc: "Dashboard trực quan theo dõi doanh thu, sản phẩm bán chạy, khách hàng thân thiết theo ngày/tuần/tháng.",
      badge: null,
      badgeColor: "",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      icon: Building2,
      title: "Nhận Hóa Đơn",
      desc: "Khi mua hàng, bạn nhận email hóa đơn chuyên nghiệp với đầy đủ thông tin sản phẩm, giá cả và mã đơn hàng.",
      color: "from-blue-500 to-blue-600",
    },
    {
      step: "02",
      icon: Smartphone,
      title: "Thanh Toán Dễ Dàng",
      desc: "Quét mã QR trong hóa đơn để thanh toán ngay qua ứng dụng ngân hàng. Xác nhận tức thì, không cần chờ đợi.",
      color: "from-green-500 to-emerald-600",
    },
    {
      step: "03",
      icon: Search,
      title: "Theo Dõi Đơn Hàng",
      desc: "Nhập email để tra cứu trạng thái đơn hàng bất cứ lúc nào — từ lúc đặt hàng đến khi nhận hàng và bảo hành.",
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
                className="w-9 h-9 rounded-xl object-contain bg-white/10"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-sm">
                  {publicInfo?.companyName ? publicInfo.companyName.slice(0, 2).toUpperCase() : "IP"}
                </span>
              </div>
            )}
            <span className="font-bold text-lg hidden sm:block">{publicInfo?.companyName || "Invoice Prime"}</span>
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
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-300 text-sm mb-8">
              <Zap className="h-4 w-4 fill-blue-400 text-blue-400" />
              Nền tảng hóa đơn & thanh toán cho doanh nghiệp Việt
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Hóa Đơn Chuyên Nghiệp,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                Thanh Toán Tức Thì
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Nhận hóa đơn qua email, thanh toán bằng QR code, theo dõi đơn hàng và bảo hành
              — tất cả trong một nền tảng đơn giản, không cần cài đặt ứng dụng.
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Chỉ 3 Bước Đơn Giản</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Từ khi mua hàng đến khi theo dõi bảo hành — mọi thứ đều minh bạch và tự động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line desktop */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-500/50 via-green-500/50 to-purple-500/50" />

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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mọi Thứ Bạn Cần</h2>
            <p className="text-slate-400 text-lg">Giải pháp toàn diện cho hóa đơn và thanh toán doanh nghiệp</p>
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
            <p className="text-slate-400 text-lg">Không cần đăng nhập — tra cứu và xem đánh giá ngay</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
              className="bg-gradient-to-br from-yellow-600/15 to-amber-800/15 border-yellow-500/25 cursor-pointer hover:border-yellow-400/50 hover:from-yellow-600/20 hover:to-amber-800/20 transition-all group"
              onClick={() => setLocation("/feedbacks-public")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/30 transition-colors">
                    <Star className="h-7 w-7 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1.5 text-lg">Đánh Giá Khách Hàng</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      Xem những phản hồi thực tế từ khách hàng đã mua hàng và sử dụng dịch vụ.
                    </p>
                    <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium group-hover:gap-2.5 transition-all">
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

      {/* Testimonials */}
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
            <p className="text-slate-400">Được tin dùng bởi hàng trăm khách hàng</p>
          </div>

          {/* Dùng reviews thực nếu có, fallback về testimonials mẫu nếu chưa có */}
          {realReviews && realReviews.length > 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/8 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= t.stars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${t.avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-xs">{t.avatar}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{t.name}</div>
                        <div className="text-slate-500 text-xs">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

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
              Tra cứu đơn hàng của bạn hoặc liên hệ với chúng tôi nếu cần hỗ trợ.
              Đội ngũ luôn sẵn sàng giúp đỡ 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation("/track-order")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 text-base gap-2 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
              >
                <Search className="h-5 w-5" />
                Tra Cứu Đơn Hàng
              </Button>
              <Button
                onClick={() => setLocation("/feedbacks-public")}
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-white/5 h-12 px-8 text-base gap-2 hover:-translate-y-0.5 transition-all"
              >
                <Star className="h-5 w-5" />
                Xem Đánh Giá
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
                    className="w-9 h-9 rounded-xl object-contain bg-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-bold text-sm">{publicInfo?.companyName ? publicInfo.companyName.slice(0,2).toUpperCase() : "IP"}</span>
                  </div>
                )}
                <span className="font-bold text-white text-lg">{publicInfo?.companyName || "Invoice Prime"}</span>
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
            <p className="text-slate-600 text-xs">© 2025 Invoice Prime. All rights reserved.</p>
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
