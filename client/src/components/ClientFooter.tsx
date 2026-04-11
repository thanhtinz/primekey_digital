/**
 * ClientFooter - Footer dùng chung cho tất cả trang client
 * Dark navy theme, logo, liên hệ, liên kết, copyright
 * Các liên kết được ẩn theo feature flags
 */
import { useLocation } from "wouter";
import { Mail, Phone, MapPin, Link2, HelpCircle, MessageCircle, ChevronUp, BookOpen, Tag } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useState, useEffect } from "react";

export function ClientFooter() {
  const [, navigate] = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isEnabled } = useFeatureFlags();

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const companyName = publicInfo?.companyName || "";
  const companyEmail = publicInfo?.companyEmail;
  const companyPhone = publicInfo?.companyPhone;
  const companyAddress = publicInfo?.companyAddress;

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Build links list based on feature flags
  const footerLinks = [
    isEnabled("blog") ? { label: "Blog & Hướng dẫn", href: "/blog", icon: BookOpen } : null,
    isEnabled("ticket") ? { label: "Liên hệ chúng tôi", href: "/support", icon: MessageCircle } : null,
    isEnabled("coupon") ? { label: "Kho mã giảm giá", href: "/coupons", icon: Tag } : null,
  ].filter(Boolean) as { label: string; href: string; icon: any }[];

  return (
    <footer className="bg-[#0f1629] text-white/80 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <button onClick={() => navigate("/")} className="block">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-12 w-auto max-w-[180px] object-contain" />
              ) : (
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {companyName}
                </span>
              )}
            </button>
            <p className="text-sm text-white/50 leading-relaxed">
              Hệ thống bán tài khoản digital, key game tự động
            </p>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <div>
              <h3 className="flex items-center gap-2 text-white font-semibold text-base mb-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                Liên hệ
              </h3>
              <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 mb-4" />
            </div>
            <div className="space-y-3">
              {companyEmail && (
                <a href={`mailto:${companyEmail}`} className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  <span>{companyEmail}</span>
                </a>
              )}
              {!companyEmail && (
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-400/50" />
                  </div>
                  <span>Chưa cấu hình email</span>
                </div>
              )}
              {companyPhone && (
                <a href={`tel:${companyPhone}`} className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Phone className="h-4 w-4 text-blue-400" />
                  </div>
                  <span>{companyPhone}</span>
                </a>
              )}
              {companyAddress && (
                <div className="flex items-start gap-3 text-sm text-white/60">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <span>{companyAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links Column - only show if there are enabled links */}
          {footerLinks.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-white font-semibold text-base mb-2">
                  <Link2 className="h-4 w-4 text-cyan-400" />
                  Liên kết
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 mb-4" />
              </div>
              <div className="space-y-3">
                {footerLinks.map(link => (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full text-left"
                  >
                    <link.icon className="h-4 w-4 text-white/30" />
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-white/30">
          © {new Date().getFullYear()} All Copyrights Reserved by{" "}
          <span className="text-blue-400 font-medium">{companyName.toUpperCase()}</span>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40"
          aria-label="Lên đầu trang"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </footer>
  );
}
