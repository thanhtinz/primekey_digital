import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, LogIn, ArrowLeft, User } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"email" | "name">("email");

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const loginMutation = trpc.customer.login.useMutation({
    onSuccess: (data) => {
      // Cập nhật CustomerAuth context
      login(data.token, data.email);
      toast.success(`Chào mừng ${data.name || data.email}!`);
      // Redirect về trang trước nếu có redirect param, ngược lại về trang chủ
      const params = new URLSearchParams(search);
      const redirectTo = params.get("redirect");
      navigate(redirectTo ? decodeURIComponent(redirectTo) : "/");
    },
    onError: (err) => {
      toast.error("Đăng nhập thất bại: " + err.message);
    },
  });

  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const appName = (publicInfo as any)?.companyName || (publicInfo as any)?.appName || "Invoice Prime";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate({ email: email.trim(), name: name.trim() || undefined });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      <ClientHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-12 object-contain mx-auto mb-4" />
          ) : (
            <div className="text-2xl font-bold text-white mb-4">{appName}</div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">Đăng Nhập</h1>
          <p className="text-slate-400 text-sm">Nhập email để xem đơn hàng và các tiện ích của bạn</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email của bạn
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Tên của bạn <span className="text-slate-500 text-xs">(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !email.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng Nhập"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              Không cần mật khẩu — chỉ cần email là đủ
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mx-auto transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về trang chủ
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
