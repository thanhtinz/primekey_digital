import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, LogIn, ArrowLeft, User, Lock, Eye, EyeOff, Phone, UserPlus, KeyRound, CheckCircle } from "@/components/Icon";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

type Tab = "login" | "register" | "forgot" | "reset";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login } = useCustomerAuth();
  const params = new URLSearchParams(search);
  const redirectTo = params.get("redirect");
  const resetToken = params.get("resetToken");
  const refCode = params.get("ref") || "";

  const [tab, setTab] = useState<Tab>(resetToken ? "reset" : refCode ? "register" : "login");

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
  const [regReferralCode, setRegReferralCode] = useState(refCode);

  // Fetch referrer name if ref code is provided
  const { data: referrerInfo } = trpc.referral.getReferrerByCode.useQuery(
    { code: refCode },
    { enabled: !!refCode, staleTime: 60_000 }
  );

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const appName = (publicInfo as any)?.companyName || "Invoice Prime";

  const handleSuccess = (data: { token: string; email: string | null; name?: string | null; role?: string | null }) => {
    login(data.token, data.email || "", data.role);
    toast.success(`Chào mừng ${data.name || data.email}!`);
    if (data.role === "admin") {
      navigate("/dashboard");
    } else {
      navigate(redirectTo ? decodeURIComponent(redirectTo) : "/");
    }
  };

  const loginMutation = trpc.customer.loginWithPassword.useMutation({
    onSuccess: handleSuccess,
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.customer.register.useMutation({
    onSuccess: (data) => {
      if (data.needsVerification) {
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.");
      }
      handleSuccess(data);
    },
    onError: (err) => toast.error(err.message),
  });

  const forgotMutation = trpc.customer.forgotPassword.useMutation({
    onSuccess: () => {
      setForgotSent(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.customer.resetPassword.useMutation({
    onSuccess: (data) => {
      toast.success("Đặt lại mật khẩu thành công!");
      handleSuccess(data as any);
    },
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
      origin: window.location.origin,
      referralCode: regReferralCode.trim() || undefined,
    });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    forgotMutation.mutate({ email: forgotEmail.trim(), origin: window.location.origin });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    if (newPassword !== newPasswordConfirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    resetMutation.mutate({ token: resetToken, newPassword });
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
            {tab === "login" && "Đăng Nhập"}
            {tab === "register" && "Tạo Tài Khoản"}
            {tab === "forgot" && "Quên Mật Khẩu"}
            {tab === "reset" && "Đặt Lại Mật Khẩu"}
          </h1>
        </div>

        {/* Tab switcher - only show for login/register */}
        {(tab === "login" || tab === "register") && (
          <div className="flex bg-slate-200 rounded-xl p-1 mb-4">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "login" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "register" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng Ký
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          {/* ===== LOGIN FORM ===== */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Mail className="inline h-4 w-4 mr-1" />Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Mật Khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPwd ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    autoComplete="current-password"
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
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Quên mật khẩu?
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
          )}

          {/* ===== REGISTER FORM ===== */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Referrer banner */}
              {referrerInfo && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-emerald-600 text-lg">🎁</span>
                  <p className="text-sm text-emerald-700">
                    Bạn được giới thiệu bởi <strong>{referrerInfo.name}</strong>!
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <User className="inline h-4 w-4 mr-1" />Họ Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  autoComplete="name"
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
                  autoComplete="email"
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
                  autoComplete="tel"
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
                    autoComplete="new-password"
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
                {/* Password strength indicator */}
                {regPassword && (
                  <div className="mt-1.5 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        regPassword.length >= i * 3
                          ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-400"
                          : "bg-slate-200"
                      }`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">
                      {regPassword.length < 6 ? "Yếu" : regPassword.length < 9 ? "Trung bình" : regPassword.length < 12 ? "Khá" : "Mạnh"}
                    </span>
                  </div>
                )}
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
                  autoComplete="new-password"
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
          )}

          {/* ===== FORGOT PASSWORD FORM ===== */}
          {tab === "forgot" && (
            <div>
              {forgotSent ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Email đã được gửi!</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
                  </p>
                  <button
                    onClick={() => { setForgotSent(false); setTab("login"); }}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-slate-500 text-sm mb-4">
                    Nhập email đăng ký của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                      <Mail className="inline h-4 w-4 mr-1" />Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotMutation.isPending || !forgotEmail.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {forgotMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="h-5 w-5" />
                    )}
                    {forgotMutation.isPending ? "Đang gửi..." : "Gửi Link Đặt Lại Mật Khẩu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="w-full text-slate-500 hover:text-slate-700 text-sm transition"
                  >
                    Quay lại đăng nhập
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ===== RESET PASSWORD FORM ===== */}
          {tab === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-slate-500 text-sm mb-4">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Mật Khẩu Mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <Lock className="inline h-4 w-4 mr-1" />Xác Nhận Mật Khẩu Mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    newPasswordConfirm && newPasswordConfirm !== newPassword ? "border-red-400" : "border-slate-300"
                  }`}
                />
                {newPasswordConfirm && newPasswordConfirm !== newPassword && (
                  <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>
                )}
              </div>
              <button
                type="submit"
                disabled={resetMutation.isPending || !newPassword || newPassword !== newPasswordConfirm || !resetToken}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {resetMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
                {resetMutation.isPending ? "Đang đặt lại..." : "Đặt Lại Mật Khẩu"}
              </button>
            </form>
          )}
        </div>

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
