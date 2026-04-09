import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "@/components/Icon";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const resetMutation = trpc.customer.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Mật khẩu đã được đặt lại thành công!");
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (err) => toast.error(err.message || "Lỗi đặt lại mật khẩu"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Link đặt lại mật khẩu không hợp lệ");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-14">
      <ClientHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md bg-[#111] border-[#222]">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Đặt Lại Mật Khẩu</CardTitle>
            <p className="text-gray-400 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </CardHeader>
          <CardContent className="pt-4">
            {success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Thành Công!</h3>
                <p className="text-gray-400 text-sm">Mật khẩu đã được đặt lại. Đang chuyển hướng về trang đăng nhập...</p>
              </div>
            ) : !token ? (
              <div className="text-center py-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Link Không Hợp Lệ</h3>
                <p className="text-gray-400 text-sm mb-4">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
                <Button onClick={() => setLocation("/login")} className="bg-blue-600 hover:bg-blue-700">
                  Về Trang Đăng Nhập
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="bg-[#1a1a1a] border-[#333] text-white placeholder-gray-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="bg-[#1a1a1a] border-[#333] text-white placeholder-gray-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={resetMutation.isPending || !password || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {resetMutation.isPending ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  className="w-full text-gray-400 hover:text-white"
                >
                  Về Trang Đăng Nhập
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <ClientFooter />
    </div>
  );
}
