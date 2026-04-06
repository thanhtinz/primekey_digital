import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Menu, X, FileText, Search, MessageSquare, Star, Shield, Zap,
  CheckCircle, ArrowRight, Package, Truck, CreditCard, Users
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Tra Cứu Đơn", href: "/track-order", icon: Search },
    { label: "Đánh Giá", href: "/feedbacks-public", icon: Star },
    { label: "Đăng Nhập", href: "/login", icon: Users },
  ];

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-blue-400" />,
      title: "Hóa Đơn Chuyên Nghiệp",
      desc: "Tạo hóa đơn đẹp, chuyên nghiệp trong vài giây với nhiều mẫu thiết kế.",
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "Thanh Toán Tức Thì",
      desc: "Tích hợp PayOS & PayPal, khách hàng thanh toán nhanh chóng và an toàn.",
    },
    {
      icon: <Search className="h-6 w-6 text-green-400" />,
      title: "Tra Cứu Đơn Hàng",
      desc: "Khách hàng dễ dàng tra cứu trạng thái đơn hàng theo thời gian thực.",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-purple-400" />,
      title: "Đánh Giá & Feedback",
      desc: "Thu thập đánh giá từ khách hàng, xây dựng uy tín thương hiệu.",
    },
    {
      icon: <Shield className="h-6 w-6 text-red-400" />,
      title: "Bảo Hành Theo Dõi",
      desc: "Quản lý trạng thái bảo hành, thông báo tự động qua email.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-cyan-400" />,
      title: "Báo Cáo Chi Tiết",
      desc: "Thống kê doanh thu, xuất báo cáo Excel chuyên nghiệp.",
    },
  ];

  const orderSteps = [
    { icon: Package, label: "Tạo Đơn", color: "bg-blue-500" },
    { icon: CreditCard, label: "Thanh Toán", color: "bg-green-500" },
    { icon: Truck, label: "Giao Hàng", color: "bg-yellow-500" },
    { icon: Shield, label: "Bảo Hành", color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold">IP</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">Invoice Prime</span>
          </button>

          {/* Desktop Nav */}
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

          {/* Mobile Burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
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
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-300 text-sm mb-8">
              <Zap className="h-4 w-4" />
              Hệ thống quản lý hóa đơn thông minh
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Quản Lý Hóa Đơn
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Thông Minh & Hiệu Quả
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Tạo hóa đơn chuyên nghiệp, tích hợp thanh toán PayOS, theo dõi đơn hàng
              và thu thập đánh giá khách hàng — tất cả trong một nền tảng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation("/track-order")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base gap-2"
              >
                <Search className="h-5 w-5" />
                Tra Cứu Đơn Hàng
              </Button>
              <Button
                onClick={() => setLocation("/feedbacks-public")}
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 h-12 px-8 text-base gap-2"
              >
                <Star className="h-5 w-5" />
                Xem Đánh Giá
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Order Status Steps */}
      <section className="py-16 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-white mb-10">
            Theo Dõi Đơn Hàng Theo Thời Gian Thực
          </h2>
          <div className="flex items-center justify-center gap-0 md:gap-4 flex-wrap">
            {orderSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center text-center px-4 py-3">
                    <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-white font-medium text-sm">{step.label}</p>
                  </div>
                  {i < orderSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-slate-600 mx-2 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Tính Năng Nổi Bật</h2>
            <p className="text-slate-400 text-lg">Mọi thứ bạn cần để quản lý hóa đơn hiệu quả</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/8 transition-all hover:border-white/20 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Links Section */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-white mb-10">Dành Cho Khách Hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card
              className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all group"
              onClick={() => setLocation("/track-order")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Tra Cứu Đơn Hàng</h3>
                    <p className="text-slate-400 text-sm">Nhập email để xem trạng thái tất cả đơn hàng của bạn</p>
                    <div className="flex items-center gap-1 text-blue-400 text-sm mt-3 group-hover:gap-2 transition-all">
                      <span>Tra cứu ngay</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 cursor-pointer hover:border-yellow-400/50 transition-all group"
              onClick={() => setLocation("/feedbacks-public")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Đánh Giá Khách Hàng</h3>
                    <p className="text-slate-400 text-sm">Xem những gì khách hàng nói về chúng tôi</p>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm mt-3 group-hover:gap-2 transition-all">
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

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Bắt Đầu Quản Lý Hóa Đơn Ngay Hôm Nay
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Dành cho admin và nhân viên. Liên hệ quản trị viên để được cấp tài khoản.
          </p>
          <Button
            onClick={() => setLocation("/login")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 h-12 px-10 text-base gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Đăng Nhập Hệ Thống
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">IP</span>
            </div>
            <span className="text-slate-400 text-sm">Invoice Prime</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <button onClick={() => setLocation("/track-order")} className="hover:text-slate-300 transition-colors">
              Tra Cứu Đơn
            </button>
            <button onClick={() => setLocation("/feedbacks-public")} className="hover:text-slate-300 transition-colors">
              Đánh Giá
            </button>
            <button onClick={() => setLocation("/login")} className="hover:text-slate-300 transition-colors">
              Đăng Nhập
            </button>
          </div>
          <p className="text-slate-600 text-xs">© 2025 Invoice Prime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
