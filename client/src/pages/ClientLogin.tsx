import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, LogIn, ArrowLeft, User, Lock, Eye, EyeOff, Phone, UserPlus } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

type Tab = "login" | "register";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login } = useCustomerAuth();
  const [tab, setTab] = useState<Tab>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const appName = (publicInfo as any)?.companyName || (publicInfo as any)?.appName || "Invoice Prime";

  const params = new URLSearchParams(search);
  const redirectTo = params.get("redirect");

  const handleSuccess = (data: { token: string; email: string; name?: string | null }) => {
    login(data.token, data.email);
    toast.success(`Chào mừng ${data.name || data.email}!`);
    navigate(redirectTo ? decodeURIComponent(redirectTo) : "/");
  };

  const loginMutation = trpc.customer.loginWithPassword.useMutation({
    onSuccess: handleSuccess,
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.customer.register.useMutation({
    onSuccess: handleSuccess,
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    loginMutation.mutate({ email: loginEmail.trim(), password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword || !regName.trim()) return;
    if (regPassword !== regConfirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    registerMutation.mutate({
      email: regEmail.trim(),
      password: regPassword,
      name: regName.trim(),
      phone: regPhone.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-12 object-contain mx-auto mb-3" />
          ) : (
            <div className="text-2xl font-bold text-slate-800 mb-3">{appName}</div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">
            {tab === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LogIn className="inline h-4 w-4 mr-1" />
            Đăng Nhập
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "register" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus className="inline h-4 w-4 mr-1" />
            Đăng Ký
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Mail className="inline h-4 w-4 mr-1" />Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Mật Khẩu
                </label>
                <div className="relative">
                  <input
                    type={showLoginPwd ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending || !loginEmail.trim() || !loginPassword}
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

            <div className="mt-4 text-center">
              <p className="text-slate-500 text-sm">
                Chưa có tài khoản?{" "}
                <button onClick={() => setTab("register")} className="text-blue-600 hover:underline font-medium">
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <User className="inline h-4 w-4 mr-1" />Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Mail className="inline h-4 w-4 mr-1" />Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Phone className="inline h-4 w-4 mr-1" />Số Điện Thoại <span className="text-slate-400 text-xs">(tuỳ chọn)</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Mật Khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPwd ? "text" : "password"}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    regConfirm && regConfirm !== regPassword ? "border-red-400" : "border-slate-300"
                  }`}
                />
                {regConfirm && regConfirm !== regPassword && (
                  <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending || !regEmail.trim() || !regPassword || !regName.trim() || regPassword !== regConfirm}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {registerMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                {registerMutation.isPending ? "Đang tạo tài khoản..." : "Tạo Tài Khoản"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-slate-500 text-sm">
                Đã có tài khoản?{" "}
                <button onClick={() => setTab("login")} className="text-blue-600 hover:underline font-medium">
                  Đăng nhập
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 mx-auto transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
