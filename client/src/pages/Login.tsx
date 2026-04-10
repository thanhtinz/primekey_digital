import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff, FileText, TrendingUp, Shield, CheckCircle2, User } from "@/components/Icon";
import { toast } from "sonner";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Đăng nhập thất bại");
      }
      toast.success("Đăng nhập thành công! Đang chuyển hướng...");
      onLoginSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FileText className="h-5 w-5 text-blue-400" />, text: "Tạo hóa đơn chuyên nghiệp" },
    { icon: <TrendingUp className="h-5 w-5 text-green-400" />, text: "Theo dõi doanh thu realtime" },
    { icon: <Shield className="h-5 w-5 text-purple-400" />, text: "Thanh toán qua PayOS" },
    { icon: <CheckCircle2 className="h-5 w-5 text-yellow-400" />, text: "Xuất PDF & gửi email tự động" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
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
            Tạo, gửi và theo dõi hóa đơn dễ dàng. Tích hợp thanh toán PayOS.
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
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Chào mừng trở lại!</h2>
                <p className="text-slate-400 text-sm">Đăng nhập để tiếp tục quản lý hóa đơn</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="tinklh"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng nhập...</>
                ) : "Đăng Nhập"}
              </Button>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300">
                <p className="font-medium mb-1">Hệ thống dành cho Admin & Nhân viên</p>
                <p className="text-slate-400">Liên hệ quản trị viên để được cấp tài khoản</p>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            © 2025 Invoice Prime. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
