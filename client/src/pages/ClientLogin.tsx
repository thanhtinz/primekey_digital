import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail, Lock, Eye, EyeOff, Phone, User, KeyRound, ArrowLeft, CheckCircle, Loader2, ShieldCheck,
} from "@/components/Icon";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

type View = "login" | "register" | "forgot" | "reset";

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { login } = useCustomerAuth();
  const params = new URLSearchParams(search);
  const redirectTo = params.get("redirect");
  const resetToken = params.get("resetToken");
  const refCode = params.get("ref") || "";

  const [view, setView] = useState<View>(resetToken ? "reset" : refCode ? "register" : "login");

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

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  const { data: referrerInfo } = trpc.referral.getReferrerByCode.useQuery(
    { code: refCode },
    { enabled: !!refCode, staleTime: 60_000 }
  );
  const logoUrl = (publicInfo as any)?.logoUrl || (publicInfo as any)?.companyLogo;
  const appName = (publicInfo as any)?.companyName || "";

  const handleSuccess = (data: { token: string; email: string | null; name?: string | null; role?: string | null }) => {
    login(data.token, data.email || "", data.role);
    toast.success(`Chào mừng ${data.name || data.email}!`);
    navigate(redirectTo ? decodeURIComponent(redirectTo) : "/");
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
    onSuccess: () => setForgotSent(true),
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
    if (regPassword !== regConfirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    if (regPassword.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
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
    if (newPassword !== newPasswordConfirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    resetMutation.mutate({ token: resetToken, newPassword });
  };

  // ─── Shared input style ───────────────────────────────────────────────────
  const inputCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition text-sm";
  const iconCls = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none";
  const btnPrimary = "w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-block mb-4 hover:opacity-80 transition">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-14 object-contain mx-auto" />
            ) : (
              <div className="text-3xl font-black text-white tracking-tight">{appName}</div>
            )}
          </button>
          {view === "login" && <p className="text-blue-200/70 text-sm">Chào mừng trở lại!</p>}
          {view === "register" && <p className="text-blue-200/70 text-sm">Tạo tài khoản mới</p>}
          {view === "forgot" && <p className="text-blue-200/70 text-sm">Khôi phục mật khẩu</p>}
          {view === "reset" && <p className="text-blue-200/70 text-sm">Đặt mật khẩu mới</p>}
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Card header accent */}
          <div className={`h-1 w-full ${view === "register" ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`} />

          <div className="p-7">

            {/* ═══════════════ LOGIN FORM ═══════════════ */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-5">Đăng nhập</h2>

                <div className="relative">
                  <Mail className={iconCls} />
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Email của bạn" required autoComplete="email" className={inputCls} />
                </div>

                <div className="relative">
                  <Lock className={iconCls} />
                  <input type={showLoginPwd ? "text" : "password"} value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Mật khẩu" required autoComplete="current-password"
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setView("forgot")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                    Quên mật khẩu?
                  </button>
                </div>

                <button type="submit" disabled={loginMutation.isPending}
                  className={`${btnPrimary} bg-blue-600 hover:bg-blue-700 text-white mt-1`}>
                  {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-slate-400">hoặc</span>
                  </div>
                </div>

                {/* Switch to register */}
                <p className="text-center text-sm text-slate-500">
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => setView("register")}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            )}

            {/* ═══════════════ REGISTER FORM ═══════════════ */}
            {view === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <h2 className="text-xl font-bold text-slate-800 mb-5">Tạo tài khoản</h2>

                {/* Referral banner */}
                {refCode && (referrerInfo as any)?.name && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Được giới thiệu bởi <strong>{(referrerInfo as any).name}</strong></span>
                  </div>
                )}

                <div className="relative">
                  <User className={iconCls} />
                  <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Họ và tên *" required autoComplete="name" className={inputCls} />
                </div>

                <div className="relative">
                  <Mail className={iconCls} />
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="Email *" required autoComplete="email" className={inputCls} />
                </div>

                <div className="relative">
                  <Phone className={iconCls} />
                  <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                    placeholder="Số điện thoại (tuỳ chọn)" autoComplete="tel" className={inputCls} />
                </div>

                <div className="relative">
                  <Lock className={iconCls} />
                  <input type={showRegPwd ? "text" : "password"} value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Mật khẩu (tối thiểu 6 ký tự) *" required minLength={6}
                    autoComplete="new-password" className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowRegPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <ShieldCheck className={iconCls} />
                  <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                    placeholder="Xác nhận mật khẩu *" required autoComplete="new-password"
                    className={`${inputCls} ${regConfirm && regConfirm !== regPassword ? "border-red-400 focus:ring-red-400" : ""}`} />
                  {regConfirm && regConfirm !== regPassword && (
                    <p className="text-red-500 text-xs mt-1 ml-1">Mật khẩu không khớp</p>
                  )}
                </div>

                {/* Referral code (hidden if already from ref link) */}
                {!refCode && (
                  <div className="relative">
                    <KeyRound className={iconCls} />
                    <input type="text" value={regReferralCode} onChange={e => setRegReferralCode(e.target.value)}
                      placeholder="Mã giới thiệu (tuỳ chọn)" className={inputCls} />
                  </div>
                )}

                <button type="submit" disabled={registerMutation.isPending}
                  className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700 text-white mt-1`}>
                  {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                  {registerMutation.isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-slate-400">hoặc</span>
                  </div>
                </div>

                {/* Switch to login */}
                <p className="text-center text-sm text-slate-500">
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={() => setView("login")}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition">
                    Đăng nhập ngay
                  </button>
                </p>
              </form>
            )}

            {/* ═══════════════ FORGOT PASSWORD ═══════════════ */}
            {view === "forgot" && (
              <div>
                <button onClick={() => setView("login")}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại đăng nhập
                </button>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Quên mật khẩu?</h2>
                <p className="text-sm text-slate-500 mb-5">Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

                {forgotSent ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-7 w-7 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-slate-800 mb-1">Email đã được gửi!</p>
                    <p className="text-sm text-slate-500">Kiểm tra hộp thư và làm theo hướng dẫn.</p>
                    <button onClick={() => { setForgotSent(false); setView("login"); }}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition">
                      Quay lại đăng nhập
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className={iconCls} />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="Email của bạn" required className={inputCls} />
                    </div>
                    <button type="submit" disabled={forgotMutation.isPending}
                      className={`${btnPrimary} bg-blue-600 hover:bg-blue-700 text-white`}>
                      {forgotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      {forgotMutation.isPending ? "Đang gửi..." : "Gửi link đặt lại"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ═══════════════ RESET PASSWORD ═══════════════ */}
            {view === "reset" && (
              <form onSubmit={handleReset} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Đặt lại mật khẩu</h2>
                <p className="text-sm text-slate-500 mb-5">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                <div className="relative">
                  <Lock className={iconCls} />
                  <input type={showNewPwd ? "text" : "password"} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" required minLength={6}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <ShieldCheck className={iconCls} />
                  <input type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới" required
                    className={`${inputCls} ${newPasswordConfirm && newPasswordConfirm !== newPassword ? "border-red-400 focus:ring-red-400" : ""}`} />
                  {newPasswordConfirm && newPasswordConfirm !== newPassword && (
                    <p className="text-red-500 text-xs mt-1 ml-1">Mật khẩu không khớp</p>
                  )}
                </div>

                <button type="submit" disabled={resetMutation.isPending}
                  className={`${btnPrimary} bg-blue-600 hover:bg-blue-700 text-white`}>
                  {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {resetMutation.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <button onClick={() => navigate("/")}
            className="text-sm text-blue-200/60 hover:text-blue-200 transition flex items-center gap-1.5 mx-auto">
            <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
