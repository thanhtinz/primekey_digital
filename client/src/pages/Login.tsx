import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff, FileText, CheckCircle2, TrendingUp, Shield } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Đăng nhập thất bại");
      }
      onLoginSuccess();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regName || !regEmail || !regPassword) {
      setRegError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Mật khẩu xác nhận không khớp");
      return;
    }
    setRegLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Đăng ký thất bại");
      }
      setRegSuccess(true);
      // Auto-login after register
      setTimeout(() => {
        setTab("login");
        setLoginEmail(regEmail);
        setRegSuccess(false);
      }, 1500);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setRegLoading(false);
    }
  };

  const features = [
    { icon: <FileText className="h-5 w-5 text-blue-400" />, text: "Tạo hóa đơn chuyên nghiệp" },
    { icon: <TrendingUp className="h-5 w-5 text-green-400" />, text: "Theo dõi doanh thu realtime" },
    { icon: <Shield className="h-5 w-5 text-purple-400" />, text: "Thanh toán qua PayOS & PayPal" },
    { icon: <CheckCircle2 className="h-5 w-5 text-yellow-400" />, text: "Xuất PDF & gửi email tự động" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-2xl">IP</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Invoice Prime</h1>
              <p className="text-blue-300 text-sm">Hệ thống quản lý hóa đơn</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Quản lý hóa đơn<br />
            <span className="text-blue-400">thông minh & hiệu quả</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Tạo, gửi và theo dõi hóa đơn dễ dàng. Tích hợp thanh toán PayOS và PayPal.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IP</span>
            </div>
            <h1 className="text-xl font-bold text-white">Invoice Prime</h1>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-8">
              <button
                onClick={() => { setTab("login"); setLoginError(""); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  tab === "login"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => { setTab("register"); setRegError(""); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  tab === "register"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Đăng Ký
              </button>
            </div>

            {/* Login Form */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Chào mừng trở lại!</h2>
                  <p className="text-slate-400 text-sm">Đăng nhập để tiếp tục quản lý hóa đơn</p>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                  <div className="relative">
                    <Input
                      type={showLoginPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loginLoading}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng nhập...</>
                  ) : "Đăng Nhập"}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-blue-400 hover:text-blue-300">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            )}

            {/* Register Form */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Tạo tài khoản</h2>
                  <p className="text-slate-400 text-sm">Bắt đầu quản lý hóa đơn miễn phí</p>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Đăng ký thành công! Đang chuyển đến trang đăng nhập...</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Họ và tên</label>
                  <Input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    disabled={regLoading}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={regLoading}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                  <div className="relative">
                    <Input
                      type={showRegPass ? "text" : "password"}
                      placeholder="Ít nhất 6 ký tự"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      disabled={regLoading}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Xác nhận mật khẩu</label>
                  <Input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={regLoading}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
                  disabled={regLoading || regSuccess}
                >
                  {regLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng ký...</>
                  ) : "Tạo Tài Khoản"}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-blue-400 hover:text-blue-300">
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            © 2025 Invoice Prime. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
