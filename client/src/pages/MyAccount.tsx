import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, Package, Star, LogOut, ShoppingBag, Shield, Gift, Clock, CheckCircle, XCircle, AlertCircle, Wrench, Phone, Mail, ChevronRight, ChevronLeft, TrendingUp, Award, Heart, ShoppingCart, Users2, Camera, Loader2, Copy, Share2, Trophy, Search, CreditCard, BarChart3, ArrowRight, Sparkles, Eye, Lock, EyeOff, QrCode, KeyRound, ShieldCheck, ExternalLink, Truck, RefreshCw, Download } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ClientHeader } from "@/components/ClientHeader";
import { ClientFooter } from "@/components/ClientFooter";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

// TwoFASection component
function TwoFASection({ token }: { token: string }) {
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "disable">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  const { data: twoFaStatus, refetch: refetch2fa } = trpc.customer.get2faStatus.useQuery({ token }, { enabled: !!token });
  const enabled = twoFaStatus?.enabled ?? false;

  const setup2fa = trpc.customer.setup2fa.useMutation({
    onSuccess: (data: any) => {
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("verify");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const verify2fa = trpc.customer.verify2fa.useMutation({
    onSuccess: () => {
      toast.success("Xác thực 2 lớp đã được bật!");
      setStep("idle"); setCode("");
      refetch2fa();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const disable2fa = trpc.customer.disable2fa.useMutation({
    onSuccess: () => {
      toast.success("Xác thực 2 lớp đã được tắt!");
      setStep("idle"); setCode("");
      refetch2fa();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Xác thực 2 lớp (2FA)
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {enabled ? "Đã bật" : "Chưa bật"}
        </span>
      </div>

      {step === "idle" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {enabled
              ? "Tài khoản đang được bảo vệ bằng Google Authenticator. Mỗi lần đăng nhập sẽ yêu cầu mã OTP."
              : "Bật xác thực 2 lờbp để bảo vệ tài khoản bằng Google Authenticator."}
          </p>
          {!enabled ? (
            <button
              onClick={() => { setStep("setup"); setup2fa.mutate({ token }); }}
              disabled={setup2fa.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {setup2fa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Cài đặt Google Authenticator
            </button>
          ) : (
            <button
              onClick={() => setStep("disable")}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition border border-red-200"
            >
              <ShieldCheck className="h-4 w-4" /> Tắt 2FA
            </button>
          )}
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <ul className="text-xs text-amber-700 space-y-1">
              <li>✓ Tải ứng dụng Google Authenticator trên điện thoại</li>
              <li>✓ Quét mã QR để liên kết tài khoản</li>
              <li>✓ Nhập mã 6 số từ ứng dụng để xác nhận</li>
            </ul>
          </div>
          {qrDataUrl && (
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="QR Code 2FA" className="w-40 h-40 rounded-xl border border-gray-200" />
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">Secret key (backup):</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">{secret}</code>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Nhập mã 6 số"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => verify2fa.mutate({ token, code })}
              disabled={code.length !== 6 || verify2fa.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
            >
              {verify2fa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Xác nhận
            </button>
          </div>
          <button onClick={() => setStep("idle")} className="text-xs text-slate-400 hover:text-slate-600">Hủy</button>
        </div>
      )}

      {step === "disable" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Nhập mã OTP từ Google Authenticator để tắt 2FA:</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Mã 6 số"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => disable2fa.mutate({ token, code })}
              disabled={code.length !== 6 || disable2fa.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
            >
              {disable2fa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tắt 2FA
            </button>
          </div>
          <button onClick={() => setStep("idle")} className="text-xs text-slate-400 hover:text-slate-600">Hủy</button>
        </div>
      )}
    </div>
  );
}

// ChangePasswordForm component
function ChangePasswordForm({ token }: { token: string }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changePwdMutation = trpc.customer.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    if (newPwd.length < 6) { toast.error("Mật khẩu mới tối thiểu 6 ký tự"); return; }
    changePwdMutation.mutate({ token, oldPassword: oldPwd, newPassword: newPwd });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Mật khẩu hiện tại</label>
        <div className="relative">
          <input type={showOld ? "text" : "password"} value={oldPwd} onChange={e => setOldPwd(e.target.value)}
            placeholder="Nhập mật khẩu cũ" required
            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Mật khẩu mới</label>
        <div className="relative">
          <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
            placeholder="Tối thiểu 6 ký tự" required minLength={6}
            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Xác nhận mật khẩu mới</label>
        <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
          placeholder="Nhập lại mật khẩu mới" required
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            confirmPwd && confirmPwd !== newPwd ? "border-red-400" : "border-slate-300"
          }`} />
        {confirmPwd && confirmPwd !== newPwd && <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>}
      </div>
      <button type="submit" disabled={changePwdMutation.isPending || !oldPwd || !newPwd || newPwd !== confirmPwd}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
        {changePwdMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {changePwdMutation.isPending ? "Đang cập nhật..." : "Đổi Mật Khẩu"}
      </button>
    </form>
  );
}

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const orderStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  CREATED:   { label: "Chờ xác nhận",  color: "text-amber-700 bg-amber-50 border-amber-200",   icon: Clock },
  PAID:      { label: "Đang xử lý",     color: "text-blue-700 bg-blue-50 border-blue-200",     icon: CheckCircle },
  SHIPPING:  { label: "Đang giao hàng", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: Truck },
  COMPLETED: { label: "Hoàn thành",     color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  WARRANTY:  { label: "Bảo hành",       color: "text-purple-700 bg-purple-50 border-purple-200", icon: Shield },
  FAILED:    { label: "Thất bại",       color: "text-red-600 bg-red-50 border-red-200",         icon: XCircle },
  REFUNDED:  { label: "Đã hoàn tiền",  color: "text-teal-700 bg-teal-50 border-teal-200",   icon: RefreshCw },
  CANCELLED: { label: "Đã hủy",         color: "text-slate-600 bg-slate-100 border-slate-200", icon: XCircle },
  EXPIRED:   { label: "Hết hạn",       color: "text-gray-500 bg-gray-100 border-gray-200",     icon: Clock },
};

const warrantyStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ Xử Lý", color: "text-yellow-500 bg-yellow-50" },
  IN_PROGRESS: { label: "Đang Xử Lý", color: "text-blue-600 bg-blue-50" },
  COMPLETED: { label: "Hoàn Thành", color: "text-green-600 bg-green-50" },
  REJECTED: { label: "Từ Chối", color: "text-red-600 bg-red-50" },
};

// ExportPDFButton component
function ExportPDFButton({ orderId, invoiceNumber, token }: { orderId: number; invoiceNumber: string; token: string }) {
  const exportMutation = trpc.pdf.exportMyInvoice.useMutation({
    onSuccess: (result) => {
      if (result?.buffer) {
        const blob = new Blob([Uint8Array.from(atob(result.buffer), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = result.filename || `${invoiceNumber}.pdf`;
        a.click(); URL.revokeObjectURL(url);
      }
    },
    onError: (err: any) => toast.error(err.message || 'Lỗi xuất PDF'),
  });
  return (
    <button
      onClick={() => exportMutation.mutate({ invoiceId: orderId, token })}
      disabled={exportMutation.isPending}
      className="text-slate-500 hover:text-slate-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
    >
      {exportMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <i className="fa-solid fa-file-arrow-down h-3.5 w-3.5" />}
      Xuất PDF
    </button>
  );
}

// ─── SecurityTab Component ───────────────────────────────────────────────────
function SecurityTab({ token, onBack }: { token: string; onBack: () => void }) {
  const [activeSection, setActiveSection] = useState<"overview" | "history" | "sessions">("overview");

  const { data: loginHistory, isLoading: historyLoading } = trpc.customer.getLoginHistory.useQuery(
    { token, limit: 20 },
    { enabled: !!token && activeSection === "history", staleTime: 30_000 }
  );

  const { data: activeSessions, isLoading: sessionsLoading, refetch: refetchSessions } = trpc.customer.getActiveSessions.useQuery(
    { token },
    { enabled: !!token && activeSection === "sessions", staleTime: 10_000 }
  );

  const revokeSession = trpc.customer.revokeSession.useMutation({
    onSuccess: () => { toast.success("Phên đăng nhập đã bị thu hồi"); refetchSessions(); },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeAll = trpc.customer.revokeAllOtherSessions.useMutation({
    onSuccess: () => { toast.success("Đã đăng xuất khỏi tất cả thiết bị khác"); refetchSessions(); },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDateTime = (d: string | Date) =>
    new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <i className="fa-solid fa-chevron-left h-5 w-5 text-slate-600" />
        </button>
        <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><i className="fa fa-shield-alt text-amber-500" /> Bảo mật tài khoản</h3>
          <p className="text-xs text-slate-500">Quản lý mật khẩu, phiên đăng nhập và lịch sử</p>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(["overview", "history", "sessions"] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeSection === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {s === "overview" ? <><i className="fa fa-lock mr-1.5" />Tổng quan</> : s === "history" ? <><i className="fa fa-history mr-1.5" />Lịch sử</> : <><i className="fa fa-mobile-alt mr-1.5" />Thiết bị</>}
          </button>
        ))}
      </div>

      {/* Overview section */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <i className="fa fa-key text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">Đổi mật khẩu</h3>
            </div>
            <div className="p-4">
              <ChangePasswordForm token={token} />
            </div>
          </div>
          {/* 2FA */}
          <TwoFASection token={token} />
          {/* Quick links */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setActiveSection("history")} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition text-left border-b border-slate-100">
              <i className="fa fa-history text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Lịch sử đăng nhập</p>
                <p className="text-xs text-slate-400">Xem các lần đăng nhập gần đây</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button onClick={() => setActiveSection("sessions")} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition text-left">
              <i className="fa fa-desktop text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Quản lý phiên đăng nhập</p>
                <p className="text-xs text-slate-400">Xem và thu hồi phiên trên các thiết bị khác</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Login history section */}
      {activeSection === "history" && (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : !loginHistory || loginHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <i className="fa fa-history text-4xl text-slate-300 block mb-3" />
              <p className="text-sm text-slate-500">Chưa có lịch sử đăng nhập</p>
              <p className="text-xs text-slate-400 mt-1">Lịch sử sẽ xuất hiện sau lần đăng nhập tiếp theo</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Lịch sử đăng nhập gần đây</h3>
                <p className="text-xs text-slate-400 mt-0.5">{loginHistory.length} lần gần nhất</p>
              </div>
              <div className="divide-y divide-slate-100">
                {loginHistory.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 p-4">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      entry.status === "success" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {entry.status === "success"
                        ? <i className="fa fa-check text-green-600 text-xs" />
                        : <i className="fa fa-times text-red-500 text-xs" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${
                          entry.status === "success" ? "text-green-700" : "text-red-600"
                        }`}>
                          {entry.status === "success" ? "Đăng nhập thành công" : "Đăng nhập thất bại"}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      {entry.deviceInfo && <p className="text-xs text-slate-500 mt-0.5">{entry.deviceInfo}</p>}
                      {entry.ipAddress && <p className="text-xs text-slate-400 font-mono">{entry.ipAddress}</p>}
                      {entry.failReason && <p className="text-xs text-red-400 mt-0.5">{entry.failReason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active sessions section */}
      {activeSection === "sessions" && (
        <div className="space-y-3">
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Phiên đang hoạt động</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeSessions?.length || 0} phiên</p>
                  </div>
                  {(activeSessions?.length || 0) > 1 && (
                    <button
                      onClick={() => revokeAll.mutate({ token })}
                      disabled={revokeAll.isPending}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      {revokeAll.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Đăng xuất tất cả
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {(activeSessions || []).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.isCurrent ? "bg-blue-100" : "bg-slate-100"
                      }`}>
                        <Shield className={`h-4 w-4 ${s.isCurrent ? "text-blue-600" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {s.isAdminSession ? "Phên Admin" : "Phên khách hàng"}
                          </p>
                          {s.isCurrent && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Hiện tại</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">Đăng nhập: {formatDateTime(s.createdAt)}</p>
                        <p className="text-xs text-slate-400">Hết hạn: {formatDateTime(s.expiresAt)}</p>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => revokeSession.mutate({ token, sessionId: s.id })}
                          disabled={revokeSession.isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 flex-shrink-0"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// SecurityInlineSection: lịch sử đăng nhập + phiên đang hoạt động (inline, không cần tab riêng)
function SecurityInlineSection({ token }: { token: string }) {
  const [expanded, setExpanded] = useState<"history" | "sessions" | null>(null);

  const { data: loginHistory, isLoading: historyLoading } = trpc.customer.getLoginHistory.useQuery(
    { token, limit: 10 },
    { enabled: !!token && expanded === "history", staleTime: 30_000 }
  );

  const { data: activeSessions, isLoading: sessionsLoading, refetch: refetchSessions } = trpc.customer.getActiveSessions.useQuery(
    { token },
    { enabled: !!token && expanded === "sessions", staleTime: 10_000 }
  );

  const revokeSession = trpc.customer.revokeSession.useMutation({
    onSuccess: () => { toast.success("Phên đăng nhập đã bị thu hồi"); refetchSessions(); },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeAll = trpc.customer.revokeAllOtherSessions.useMutation({
    onSuccess: () => { toast.success("Đã đăng xuất khỏi tất cả thiết bị khác"); refetchSessions(); },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDateTime = (d: string | Date) =>
    new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="divide-y divide-slate-100">
      {/* Lịch sử đăng nhập */}
      <div>
        <button
          onClick={() => setExpanded(expanded === "history" ? null : "history")}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <i className="fa fa-history text-blue-600 text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Lịch sử đăng nhập</p>
            <p className="text-xs text-slate-400">Xem các lần đăng nhập gần đây</p>
          </div>
          <i className={`fa fa-chevron-right text-slate-400 text-xs transition-transform ${expanded === "history" ? "rotate-90" : ""}`} />
        </button>
        {expanded === "history" && (
          <div className="px-5 pb-4">
            {historyLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : !loginHistory || loginHistory.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <i className="fa fa-history text-3xl text-slate-300 block mb-2" />
                <p className="text-sm">Chưa có lịch sử</p>
              </div>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                           <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      entry.status === "success" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {entry.status === "success"
                        ? <i className="fa fa-check text-green-600 text-xs" />
                        : <i className="fa fa-times text-red-500 text-xs" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${
                          entry.status === "success" ? "text-green-700" : "text-red-600"
                        }`}>
                          {entry.status === "success" ? "Đăng nhập thành công" : "Đăng nhập thất bại"}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      {entry.deviceInfo && <p className="text-xs text-slate-500 mt-0.5">{entry.deviceInfo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thiết bị đang đăng nhập */}
      <div>
        <button
          onClick={() => setExpanded(expanded === "sessions" ? null : "sessions")}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <i className="fa fa-laptop text-purple-600 text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Thiết bị đang đăng nhập</p>
            <p className="text-xs text-slate-400">Quản lý và thu hồi phiên trên thiết bị khác</p>
          </div>
          <i className={`fa fa-chevron-right text-slate-400 text-xs transition-transform ${expanded === "sessions" ? "rotate-90" : ""}`} />
        </button>
        {expanded === "sessions" && (
          <div className="px-5 pb-4">
            {sessionsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-2">
                {(activeSessions?.length || 0) > 1 && (
                  <button
                    onClick={() => revokeAll.mutate({ token })}
                    disabled={revokeAll.isPending}
                    className="w-full text-xs text-red-600 hover:text-red-700 font-semibold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {revokeAll.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Đăng xuất tất cả thiết bị khác
                  </button>
                )}
                {(activeSessions || []).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      s.isCurrent ? "bg-blue-100" : "bg-slate-100"
                    }`}>
                      <i className={`fa fa-desktop text-sm ${s.isCurrent ? "text-blue-600" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {s.isAdminSession ? "Phên Admin" : "Phên khách hàng"}
                        </p>
                        {s.isCurrent && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Hiện tại</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{formatDateTime(s.createdAt)}</p>
                    </div>
                    {!s.isCurrent && (
                      <button
                        onClick={() => revokeSession.mutate({ token, sessionId: s.id })}
                        disabled={revokeSession.isPending}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                      >
                        Thu hồi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// NotificationPrefsSection component
function NotificationPrefsSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: meData } = trpc.customer.me.useQuery({ token }, { enabled: !!token });
  const updateNotif = trpc.customer.updateNotificationPrefs.useMutation({
    onSuccess: () => { utils.customer.me.invalidate(); toast.success("Cập nhật thông báo thành công"); },
    onError: (e: any) => toast.error(e.message),
  });
  const [emailOpen, setEmailOpen] = useState(true);
  const [telegramOpen, setTelegramOpen] = useState(false);

  const prefs = meData || {};
  const hasTelegram = !!(prefs as any).telegramChatId;

  const handleToggle = (field: string, value: boolean) => {
    updateNotif.mutate({ token, [field]: value });
  };

  const emailItems = [
    { key: "notifyOrderStatus", label: "Trạng thái đơn hàng", desc: "Nhận email khi đơn hàng được cập nhật", icon: "fa-box", color: "bg-blue-100 text-blue-600" },
    { key: "notifyOnLogin", label: "Cảnh báo đăng nhập", desc: "Nhận email khi có đăng nhập mới", icon: "fa-shield-alt", color: "bg-red-100 text-red-600" },
    { key: "notifyNewProduct", label: "Sản phẩm mới", desc: "Nhận thông báo khi có sản phẩm mới", icon: "fa-star", color: "bg-yellow-100 text-yellow-600" },
    { key: "notifyFlashSale", label: "Flash Sale", desc: "Nhận cảnh báo khi có flash sale", icon: "fa-bolt", color: "bg-orange-100 text-orange-600" },
    { key: "notifyPromotion", label: "Khuyến mãi & ưu đãi", desc: "Nhận email về mã giảm giá và ưu đãi", icon: "fa-gift", color: "bg-purple-100 text-purple-600" },
  ];

  const telegramItems = [
    { key: "notifyTelegramOrderStatus", label: "Trạng thái đơn hàng", desc: "Nhận Telegram khi đơn hàng được cập nhật", icon: "fa-box", color: "bg-blue-100 text-blue-600" },
    { key: "notifyTelegramOrderPaid", label: "Thanh toán thành công", desc: "Nhận Telegram khi đơn hàng được thanh toán", icon: "fa-circle-check", color: "bg-green-100 text-green-600" },
    { key: "notifyTelegramOrderShipping", label: "Đang giao hàng", desc: "Nhận Telegram khi đơn hàng chuyển sang giao hàng", icon: "fa-truck", color: "bg-cyan-100 text-cyan-600" },
    { key: "notifyTelegramOrderCompleted", label: "Hoàn thành đơn hàng", desc: "Nhận Telegram khi đơn hàng hoàn thành", icon: "fa-flag-checkered", color: "bg-emerald-100 text-emerald-600" },
    { key: "notifyTelegramWarranty", label: "Bảo hành", desc: "Nhận Telegram khi đơn hàng chuyển sang bảo hành", icon: "fa-shield-halved", color: "bg-teal-100 text-teal-600" },
    { key: "notifyTelegramFlashSale", label: "Flash Sale", desc: "Nhận Telegram khi có flash sale", icon: "fa-bolt", color: "bg-orange-100 text-orange-600" },
    { key: "notifyTelegramPromotion", label: "Khuyến mãi & ưu đãi", desc: "Nhận Telegram về mã giảm giá và ưu đãi", icon: "fa-gift", color: "bg-purple-100 text-purple-600" },
  ];

  const ToggleSwitch = ({ field, isOn }: { field: string; isOn: boolean }) => (
    <button
      onClick={() => handleToggle(field, !isOn)}
      disabled={updateNotif.isPending}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${isOn ? "bg-green-500" : "bg-slate-200"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOn ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
          <i className="fa fa-bell text-white text-sm" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cài đặt thông báo</h3>
          <p className="text-[11px] text-slate-500">Quản lý thông báo qua email và Telegram</p>
        </div>
      </div>

      {/* Email Accordion */}
      <div className="border-b border-slate-100">
        <button
          onClick={() => setEmailOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fa-solid fa-envelope text-blue-600 text-xs" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Thông báo Email</span>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {emailItems.filter(i => !!(prefs as any)[i.key]).length}/{emailItems.length} bật
            </span>
          </div>
          <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform ${emailOpen ? "rotate-180" : ""}`} />
        </button>
        {emailOpen && (
          <div className="divide-y divide-slate-50 pb-1">
            {emailItems.map(item => {
              const isOn = !!(prefs as any)[item.key];
              return (
                <div key={item.key} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <i className={`fa ${item.icon} text-xs`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <ToggleSwitch field={item.key} isOn={isOn} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Telegram Accordion */}
      <div>
        <button
          onClick={() => setTelegramOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
              <i className="fa-brands fa-telegram text-sky-500 text-xs" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Thông báo Telegram</span>
            {hasTelegram ? (
              <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                {telegramItems.filter(i => !!(prefs as any)[i.key]).length}/{telegramItems.length} bật
              </span>
            ) : (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Chưa liên kết</span>
            )}
          </div>
          <i className={`fa-solid fa-chevron-down text-slate-400 text-xs transition-transform ${telegramOpen ? "rotate-180" : ""}`} />
        </button>
        {telegramOpen && (
          <div className="pb-2">
            {!hasTelegram ? (
              <div className="px-5 py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-3">
                  <i className="fa-brands fa-telegram text-sky-500 text-xl" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Chưa liên kết Telegram</p>
                <p className="text-xs text-slate-400 mb-3">Liên kết tài khoản Telegram để nhận thông báo tức thì</p>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  Đến mục <strong>"Liên kết Telegram"</strong> phía trên để liên kết tài khoản
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 px-5">
                {telegramItems.map(item => {
                  const isOn = !!(prefs as any)[item.key];
                  return (
                    <div key={item.key} className="flex items-center gap-3 py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <i className={`fa ${item.icon} text-xs`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <ToggleSwitch field={item.key} isOn={isOn} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// TelegramLinkSection - liên kết tài khoản Telegram
function TelegramLinkSection({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const { data: meData, refetch: refetchMe } = trpc.customer.me.useQuery({ token }, { enabled: !!token });
  const { data: botConfig } = trpc.telegramBot.getConfig.useQuery({ botType: "user" } as any, { staleTime: 300_000 });
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const sendTestMutation = trpc.customer.sendTelegramTest.useMutation({
    onSuccess: () => toast.success("✅ Đã gửi tin nhắn thử! Kiểm tra Telegram của bạn."),
    onError: (e: any) => toast.error(e.message),
  });

  const unlinkMutation = trpc.customer.unlinkTelegram.useMutation({
    onSuccess: () => {
      utils.customer.me.invalidate();
      setShowUnlinkConfirm(false);
      toast.success("Hủy liên kết Telegram thành công");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const telegramChatId = (meData as any)?.telegramChatId;
  const telegramUsername = (meData as any)?.telegramUsername;
  const telegramLinkedAt = (meData as any)?.telegramLinkedAt;
  const customerEmail = (meData as any)?.email || "";
  const botUsername = (botConfig as any)?.botUsername || "";
  const isLinked = !!telegramChatId;
  const botEnabled = !!(botConfig as any)?.enabled;

  // SSE: khi bấm "Mở Telegram Bot", subscribe SSE để nhận push event realtime
  useEffect(() => {
    if (!isPolling || isLinked || !customerEmail) return;
    const sse = new EventSource(`/api/sse/telegram-link?email=${encodeURIComponent(customerEmail)}`);
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.linked) {
          sse.close();
          setIsPolling(false);
          refetchMe();
          toast.success("🎉 Đã liên kết Telegram thành công!");
        }
      } catch (_) {}
    };
    sse.onerror = () => {
      // SSE failed - fallback to polling 5s
      sse.close();
      const interval = setInterval(() => { refetchMe(); }, 5000);
      return () => clearInterval(interval);
    };
    return () => sse.close();
  }, [isPolling, isLinked, customerEmail, refetchMe]);

  if (!botEnabled) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50">
        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
          <i className="fa-brands fa-telegram text-white text-sm" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800">Liên kết Telegram</h3>
          <p className="text-[11px] text-slate-500">Nhận thông báo đơn hàng qua Telegram</p>
        </div>
        {/* Badge trạng thái trong header */}
        {isLinked ? (
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-semibold">
              {telegramUsername ? `@${telegramUsername}` : "Đã liên kết"}
            </span>
          </div>
        ) : (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Chưa liên kết</span>
        )}
      </div>
      <div className="px-5 py-4">
        {isLinked ? (
          <div className="space-y-3">
            {/* Card thông tin đã liên kết */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fa-brands fa-telegram text-green-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700">Đã liên kết thành công</p>
                {telegramUsername && (
                  <p className="text-xs text-green-600 font-medium">@{telegramUsername}</p>
                )}
                {telegramLinkedAt && (
                  <p className="text-[11px] text-green-500">
                    Liên kết lúc {new Date(telegramLinkedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">Hoạt động</span>
              </div>
            </div>

            {/* Nút gửi tin nhắn test */}
            <button
              onClick={() => sendTestMutation.mutate({ token })}
              disabled={sendTestMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 transition text-sm font-semibold disabled:opacity-50"
            >
              {sendTestMutation.isPending ? (
                <><i className="fa-solid fa-spinner fa-spin text-xs" /> Đang gửi...</>
              ) : (
                <><i className="fa-brands fa-telegram text-xs" /> Gửi tin nhắn thử</>
              )}
            </button>

            {/* Nút hủy liên kết - nổi bật hơn */}
            {!showUnlinkConfirm ? (
              <button
                onClick={() => setShowUnlinkConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition text-sm font-semibold"
              >
                <i className="fa-solid fa-link-slash text-xs" />
                Hủy liên kết Telegram
              </button>
            ) : (
              /* Confirm dialog inline */
              <div className="p-3.5 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Xác nhận hủy liên kết?</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Bạn sẽ không còn nhận thông báo qua Telegram nữa.
                      {telegramUsername && <> Tài khoản <strong>@{telegramUsername}</strong> sẽ bị ngắt kết nối.</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUnlinkConfirm(false)}
                    disabled={unlinkMutation.isPending}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => unlinkMutation.mutate({ token })}
                    disabled={unlinkMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    {unlinkMutation.isPending ? (
                      <><i className="fa-solid fa-spinner fa-spin text-xs" /> Đang hủy...</>
                    ) : (
                      <><i className="fa-solid fa-link-slash text-xs" /> Xác nhận hủy</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <p className="text-xs font-semibold text-sky-700 mb-2">Cách liên kết:</p>
              <ol className="text-xs text-sky-600 space-y-1.5 list-none">
                <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>Mở Telegram và tìm bot <strong>{botUsername ? `@${botUsername}` : "của cửa hàng"}</strong></li>
                <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>Gửi lệnh <code className="bg-sky-100 px-1 rounded">/start</code></li>
                <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>Nhập email tài khoản khi bot yêu cầu</li>
              </ol>
            </div>
            {botUsername && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsPolling(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition text-sm font-medium"
              >
                <i className="fa-brands fa-telegram text-sm" />
                Mở Telegram Bot
              </a>
            )}
            {/* Auto-refresh indicator */}
            {isPolling && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-sky-600">
                <i className="fa-solid fa-spinner fa-spin text-xs" />
                Đang chờ xác nhận từ Telegram...
                <button
                  onClick={() => setIsPolling(false)}
                  className="text-slate-400 hover:text-slate-600 underline"
                >
                  Dừng
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type TabType = "overview" | "orders" | "points" | "warranty" | "referral" | "support" | "profile";

// ─── SupportTab Component ────────────────────────────────────────────────────
function SupportTab({ token, email, name }: { token: string; email: string; name: string }) {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const utils = trpc.useUtils();

  const { data: tickets = [], isLoading } = trpc.support.listMyTickets.useQuery(
    { token },
    { enabled: !!token, staleTime: 30_000 }
  );

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket đã được gửi thành công!");
      setShowForm(false);
      setSubject(""); setMessage(""); setPriority("medium");
      utils.support.listMyTickets.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
    in_progress: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
    resolved: { label: "Đã giải quyết", color: "bg-green-100 text-green-700" },
    closed: { label: "Đã đóng", color: "bg-slate-100 text-slate-500" },
  };

  const priorityMap: Record<string, { label: string; color: string }> = {
    low: { label: "Thấp", color: "text-slate-500" },
    medium: { label: "Trung bình", color: "text-amber-600" },
    high: { label: "Cao", color: "text-red-600" },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createTicket.mutate({ token, customerEmail: email, customerName: name, subject, message, priority });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ticket Hỗ Trợ</h3>
              <p className="text-[11px] text-slate-500">Gửi yêu cầu hỗ trợ và theo dõi trạng thái</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition"
          >
            <span>+</span> Tạo ticket
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tiêu đề *</label>
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Mô tả ngắn vấn đề của bạn"
                required maxLength={200}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nội dung *</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề..."
                required rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Mức ưu tiên</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="low">Thấp - Không gấp</option>
                <option value="medium">Trung bình - Cần hỗ trợ</option>
                <option value="high">Cao - Khẩn cấp</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Gửi ticket
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-sm font-semibold rounded-lg transition">
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Ticket List */}
        {isLoading ? (
          <div className="px-5 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500 mx-auto" />
          </div>
        ) : (tickets as any[]).length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Phone className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">Chưa có ticket nào</p>
            <p className="text-xs text-slate-400 mt-1">Nhấn "Tạo ticket" để gửi yêu cầu hỗ trợ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(tickets as any[]).map((ticket: any) => {
              const status = statusMap[ticket.status] || { label: ticket.status, color: "bg-slate-100 text-slate-500" };
              const prio = priorityMap[ticket.priority] || priorityMap.medium;
              return (
                <div key={ticket.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{ticket.subject}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(ticket.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        <span className={prio.color}>{prio.label}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{ticket.message}</p>
                  {ticket.adminReply && (
                    <div className="mt-3 bg-cyan-50 border border-cyan-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-cyan-600 mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Phản hồi từ admin
                      </p>
                      <p className="text-xs text-slate-700">{ticket.adminReply}</p>
                      {ticket.repliedAt && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(ticket.repliedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyAccount() {
  const [location, navigate] = useLocation();
  const initialTab = (): TabType => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "referral" || tab === "orders" || tab === "points" || tab === "warranty" || tab === "profile" || tab === "support") return tab as TabType;
    return "overview";
  };
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [orderFilter, setOrderFilter] = useState<"all" | "CREATED" | "PAID" | "SHIPPING" | "COMPLETED" | "WARRANTY" | "FAILED" | "REFUNDED" | "CANCELLED">("all");
  const { customer, token, logout, isLoading: authLoading } = useCustomerAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const utils = trpc.useUtils();

  // Sync avatarUrl from customer data (including after reload)
  useEffect(() => {
    if (customer?.avatarUrl !== undefined) {
      setAvatarUrl(customer.avatarUrl || null);
    }
  }, [customer?.avatarUrl]);

  const uploadAvatarMutation = trpc.customer.uploadAvatar.useMutation({
    onSuccess: (data) => {
      setAvatarUrl(data.url);
      // Refresh customer data so avatarUrl persists across page reloads
      utils.customer.me.invalidate({ token: token! });
      toast.success("Ảnh đại diện đã được cập nhật!");
    },
    onError: () => toast.error("Đã xảy ra lỗi khi upload ảnh"),
  });

  // Avatar gallery from admin
  const { data: galleryAvatars = [] } = trpc.avatarImages.getAll.useQuery(
    undefined,
    { enabled: showAvatarGallery, staleTime: 60_000 }
  );

  const selectAvatarMutation = trpc.customer.selectAvatar.useMutation({
    onSuccess: (data: any) => {
      setAvatarUrl(data.url);
      utils.customer.me.invalidate({ token: token! });
      setShowAvatarGallery(false);
      toast.success("Đã cập nhật ảnh đại diện!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateProfileMutation = trpc.customer.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditingProfile(false);
    },
    onError: () => toast.error("Đã xảy ra lỗi"),
  });

  const handleAvatarUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !token) return;
      if (file.size > 2 * 1024 * 1024) { toast.error("Ảnh tối đa 2MB"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        uploadAvatarMutation.mutate({ token, dataUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSaveProfile = () => {
    if (!token) return;
    updateProfileMutation.mutate({ token, name: editName || undefined, phone: editPhone || undefined });
  };

  const { data: orders = [], isLoading: ordersLoading } = trpc.customer.myOrders.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 30_000 }
  );

  const { data: pointsData } = trpc.customer.myPoints.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 30_000 }
  );

  const { data: warranties = [], isLoading: warrantiesLoading } = trpc.customer.myWarranties.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 30_000 }
  );

  const { data: warrantyProducts = [], isLoading: warrantyProductsLoading } = trpc.customer.myWarrantyProducts.useQuery(
    { token: token! },
    { enabled: !!token && activeTab === "warranty", staleTime: 30_000 }
  );

  const [showWarrantyForm, setShowWarrantyForm] = useState(false);
  const [warrantyInvoiceCode, setWarrantyInvoiceCode] = useState("");
  const [warrantyDescription, setWarrantyDescription] = useState("");

  const submitWarrantyRequest = trpc.warrantyRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu bảo hành! Shop sẽ liên hệ sớm.");
      setWarrantyInvoiceCode("");
      setWarrantyDescription("");
      setShowWarrantyForm(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const logoutMutation = trpc.customer.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("Đã đăng xuất thành công");
      navigate("/");
    },
  });

  const handleLogout = () => {
    if (token) logoutMutation.mutate({ token });
    else { logout(); navigate("/"); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-16 lg:pt-24 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!customer || !token) {
    navigate("/client-login");
    return null;
  }

  const customerName = customer.name || customer.email.split("@")[0];
  const totalPoints = pointsData?.points ?? 0;
  const totalOrders = (orders as any[]).length;
  const completedOrders = (orders as any[]).filter((o: any) => o.status === "COMPLETED" || o.status === "WARRANTY").length;
  const pendingOrders = (orders as any[]).filter((o: any) => o.status === "CREATED" || o.status === "PAID" || o.status === "SHIPPING").length;
  const { data: walletData } = trpc.wallet.getBalance.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 60_000 }
  );
  const walletBalance = walletData?.balance ?? 0;
  const formatBalance = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K₫`;
    return `${v.toLocaleString("vi-VN")}₫`;
  };
  // Check admin via dedicated procedure
  const { data: adminCheckData } = trpc.customer.checkIsAdmin.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 60_000, retry: false }
  );
  const isAdmin = adminCheckData?.isAdmin === true;

  const { isEnabled: isFeatureEnabled } = useFeatureFlags();
  const avatarGalleryEnabled = isFeatureEnabled("avatarGallery");
  const tabs: { id: TabType; label: string; icon: any; badge?: number; color: string; activeColor: string }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3, color: "text-blue-500", activeColor: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { id: "orders", label: "Đơn hàng", icon: Package, badge: pendingOrders > 0 ? pendingOrders : undefined, color: "text-orange-500", activeColor: "bg-gradient-to-r from-orange-500 to-amber-500" },
    ...(isFeatureEnabled("points") ? [{ id: "points" as TabType, label: "Điểm", icon: Star, color: "text-yellow-500", activeColor: "bg-gradient-to-r from-yellow-400 to-orange-400" }] : []),
    ...(isFeatureEnabled("warranty") ? [{ id: "warranty" as TabType, label: "Bảo hành", icon: Shield, color: "text-teal-500", activeColor: "bg-gradient-to-r from-teal-500 to-emerald-500" }] : []),
    ...(isFeatureEnabled("referral") ? [{ id: "referral" as TabType, label: "Giới thiệu", icon: Users2, color: "text-indigo-500", activeColor: "bg-gradient-to-r from-indigo-500 to-violet-500" }] : []),
    ...(isFeatureEnabled("ticket") ? [{ id: "support" as TabType, label: "Hỗ trợ", icon: Phone, color: "text-cyan-500", activeColor: "bg-gradient-to-r from-cyan-500 to-blue-500" }] : []),
    { id: "profile", label: "Hồ sơ & Bảo mật", icon: User, color: "text-slate-500", activeColor: "bg-gradient-to-r from-slate-600 to-slate-700" },
  ];

  // Always fetch referral stats so code is consistent across all tabs
  const { data: referralStats, isLoading: referralLoading } = trpc.referral.getStats.useQuery(
    { email: customer.email },
    { enabled: !!customer.email, staleTime: 60_000 }
  );
  // Also call getMyCode to ensure code is created in DB if not exists yet
  const { data: myCodeData } = trpc.referral.getMyCode.useQuery(
    { email: customer.email },
    { enabled: !!customer.email && !referralStats?.code, staleTime: 60_000 }
  );
  const referralCode = referralStats?.code || myCodeData?.code || "";
  const referralBalance = parseFloat(referralStats?.totalRewards?.toString() || "0");

  // Referral withdrawal state
  const [showReferralWithdraw, setShowReferralWithdraw] = useState(false);
  const [refWithdrawType, setRefWithdrawType] = useState<"wallet" | "atm">("wallet");
  const [refWithdrawAmount, setRefWithdrawAmount] = useState("");
  const [refBankName, setRefBankName] = useState("");
  const [refBankAccount, setRefBankAccount] = useState("");
  const [refBankHolder, setRefBankHolder] = useState("");

  const { data: myWithdrawals, refetch: refetchWithdrawals } = trpc.referralWithdrawals.myList.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const referralWithdrawMutation = trpc.referralWithdrawals.create.useMutation({
    onSuccess: (data: any) => {
      if (data.status === "completed") {
        toast.success("Đã chuyển thưởng vào ví thành công!");
      } else {
        toast.success("Yêu cầu rút thưởng đã được gửi! Admin sẽ xử lý trong 1-3 ngày làm việc.");
      }
      setShowReferralWithdraw(false);
      setRefWithdrawAmount("");
      setRefBankName(""); setRefBankAccount(""); setRefBankHolder("");
      refetchWithdrawals();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleReferralWithdraw = () => {
    const amount = parseFloat(refWithdrawAmount);
    if (!amount || amount <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
    if (amount > referralBalance) { toast.error(`Số dư hoa hồng không đủ. Bạn có ${referralBalance.toLocaleString("vi-VN")}₫`); return; }
    if (refWithdrawType === "atm" && (!refBankName || !refBankAccount || !refBankHolder)) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng"); return;
    }
    referralWithdrawMutation.mutate({
      token: token || "",
      customerName: customer?.name || customer?.email || "",
      amount,
      withdrawType: refWithdrawType,
      bankName: refWithdrawType === "atm" ? refBankName : undefined,
      bankAccount: refWithdrawType === "atm" ? refBankAccount : undefined,
      bankHolder: refWithdrawType === "atm" ? refBankHolder : undefined,
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Đã sao chép mã giới thiệu!");
  };

  return (
    <div className="min-h-screen pt-16 lg:pt-24 bg-slate-50">
      <ClientHeader />

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* ===== Profile Hero ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex-shrink-0 ring-2 ring-white/30 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={customerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
                  {customerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{customerName}</h2>
              <p className="text-blue-200 text-sm truncate">{customer.email}</p>
            </div>
          </div>
          {/* Wallet balance */}
          {isFeatureEnabled("wallet") && (
            <div className="relative mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-200" />
                <span className="text-sm text-blue-100">Số dư ví</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-emerald-300">{formatBalance(walletBalance)}</span>
                <button onClick={() => navigate("/wallet")} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">
                  Nạp tiền
                </button>
              </div>
            </div>
          )}
          {/* Quick stats row */}
          <div className="relative grid grid-cols-4 gap-2 mt-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold">{totalOrders}</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Đơn hàng</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-yellow-300">{totalPoints}</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Điểm</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-emerald-300">{completedOrders}</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Hoàn thành</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
              <p className="text-xl font-bold text-purple-300">{(warranties as any[]).length}</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Bảo hành</p>
            </div>
          </div>

        </div>

        {/* ===== Quick Actions Grid ===== */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => navigate("/cart")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-3 transition group">
            <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
              <ShoppingCart className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-blue-700">Giỏ hàng</span>
          </button>
          {isFeatureEnabled("wishlist") && (
            <button onClick={() => navigate("/wishlist")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 rounded-xl p-3 transition group">
              <div className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition">
                <Heart className="h-4.5 w-4.5 text-red-500" />
              </div>
              <span className="text-[11px] font-medium text-slate-600 group-hover:text-red-600">Yêu thích</span>
            </button>
          )}
          <button onClick={() => navigate("/track-order")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50 rounded-xl p-3 transition group">
            <div className="w-9 h-9 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition">
              <Search className="h-4.5 w-4.5 text-green-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-green-700">Tra cứu đơn</span>
          </button>
          {isFeatureEnabled("leaderboard") && (
            <button onClick={() => navigate("/leaderboard")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl p-3 transition group">
              <div className="w-9 h-9 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition">
                <Trophy className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-600 group-hover:text-amber-700">BXH</span>
            </button>
          )}
        </div>

        {/* ===== Tabs ===== */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 min-w-max">
            {tabs.map(({ id, label, icon: Icon, badge, color, activeColor }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all relative whitespace-nowrap ${
                  activeTab === id
                    ? `${activeColor} text-white shadow-md`
                    : `text-slate-500 hover:text-slate-800 hover:bg-slate-50`
                }`}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${activeTab === id ? "text-white" : color}`} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className={`ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab === id ? "bg-white/30 text-white" : "bg-red-500 text-white"}`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Tab: Overview ===== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Pending orders alert */}
            {pendingOrders > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Bạn có {pendingOrders} đơn hàng đang chờ xử lý</p>
                  <p className="text-xs text-amber-600 mt-0.5">Nhấn để xem chi tiết</p>
                </div>
                <button onClick={() => setActiveTab("orders")} className="text-amber-700 hover:text-amber-800">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Recent orders */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Đơn hàng gần đây</h3>
                <button onClick={() => navigate("/track-order")} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                  Xem tất cả đơn hàng <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {(orders as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Chưa có đơn hàng nào</p>
                  <button onClick={() => navigate("/catalog")} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Mua sắm ngay
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(orders as any[]).slice(0, 3).map((order: any) => {
                    const st = orderStatusMap[order.status] || { label: order.status, color: "text-slate-500 bg-slate-100 border-slate-200", icon: AlertCircle };
                    const StatusIcon = st.icon;
                    return (
                      <button key={order.id} onClick={() => navigate(`/order/${order.id}`)} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition text-left">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <StatusIcon className={`h-4 w-4 ${st.color.split(" ")[0]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{order.invoiceNumber}</p>
                          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(Number(order.totalAmount ?? order.total ?? 0))}</p>
                          <span className={`text-[10px] font-medium ${st.color.split(" ")[0]}`}>{st.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feature links */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {isFeatureEnabled("points") && (
                <button onClick={() => setActiveTab("points")} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4.5 w-4.5 text-yellow-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700">Điểm thưởng</p>
                    <p className="text-xs text-slate-400">Tích lũy điểm khi mua hàng</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-500 mr-1">{totalPoints}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                </button>
              )}
              {isFeatureEnabled("warranty") && (
                <button onClick={() => setActiveTab("warranty")} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4.5 w-4.5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700">Bảo hành</p>
                    <p className="text-xs text-slate-400">Quản lý yêu cầu bảo hành</p>
                  </div>
                  <span className="text-sm font-bold text-purple-600 mr-1">{(warranties as any[]).length}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                </button>
              )}
              {isFeatureEnabled("referral") && (
                <button onClick={() => setActiveTab("referral")} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Users2 className="h-4.5 w-4.5 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700">Giới thiệu bạn bè</p>
                    <p className="text-xs text-slate-400">Chia sẻ và nhận thưởng</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                </button>
              )}
              {isFeatureEnabled("leaderboard") && (
                <button onClick={() => navigate("/leaderboard")} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700">Bảng xếp hạng chi tiêu</p>
                    <p className="text-xs text-slate-400">Xem vị trí của bạn</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: Orders ===== */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {/* Header with stats + filter */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                {["all", "CREATED", "PAID", "SHIPPING", "COMPLETED", "WARRANTY", "FAILED", "REFUNDED", "CANCELLED"].map((s) => {
                  const labels: Record<string, string> = {
                    all: "Tất cả", CREATED: "Chờ xác nhận", PAID: "Đang xử lý",
                    SHIPPING: "Đang giao", COMPLETED: "Hoàn thành", WARRANTY: "Bảo hành",
                    FAILED: "Thất bại", REFUNDED: "Hoàn tiền", CANCELLED: "Đã hủy",
                  };
                  const cnt = s === "all" ? orders.length : (orders as any[]).filter((o: any) => o.status === s).length;
                  const isActive = (orderFilter ?? "all") === s;
                  return (
                    <button key={s} onClick={() => setOrderFilter(s as any)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}>
                      {labels[s]} {cnt > 0 && <span className={`ml-1 ${ isActive ? "opacity-80" : "text-slate-400"}`}>({cnt})</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => navigate("/track-order")}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Xem tất cả
              </button>
            </div>
            {ordersLoading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải đơn hàng...
              </div>
            ) : (() => {
              const filteredOrders = orderFilter === "all" ? (orders as any[]) : (orders as any[]).filter((o: any) => o.status === orderFilter);
              return filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <ShoppingBag className="h-14 w-14 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">Chưa có đơn hàng nào</p>
                <p className="text-slate-400 text-sm mt-1">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
                <button onClick={() => navigate("/catalog")} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition">
                  Xem Sản Phẩm
                </button>
              </div>
            ) : (
              <div className="space-y-3">
              {filteredOrders.map((order: any) => {
                const st = orderStatusMap[order.status] || { label: order.status, color: "text-slate-500 bg-slate-100 border-slate-200", icon: AlertCircle };
                const StatusIcon = st.icon;
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-slate-800 font-mono font-semibold text-sm">{order.invoiceNumber}</p>
                          <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-800 font-bold text-sm">{formatCurrency(Number(order.totalAmount ?? order.total ?? 0))}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${st.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          {order.items.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 text-sm">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center">
                                <Package className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-700 font-medium truncate text-xs">{item.name}</p>
                                <p className="text-slate-400 text-[10px]">SL: {item.quantity}</p>
                              </div>
                              <p className="text-slate-600 font-medium text-xs">{formatCurrency(Number(item.unitPrice ?? item.price ?? 0))}</p>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-slate-400 pl-12">+{order.items.length - 2} sản phẩm khác</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex justify-between items-center gap-2">
                      <ExportPDFButton orderId={order.id} invoiceNumber={order.invoiceNumber} token={token || ""} />
                      {(order.status === 'CREATED' || order.status === 'sent') && order.paymentLink && (
                        <a href={order.paymentLink} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Thanh toán ngay
                        </a>
                      )}
                      <button onClick={() => navigate(`/order/${order.invoiceNumber}`)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                        Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            );
            })()}
          </div>
        )}

        {/* ===== Tab: Points ===== */}
        {activeTab === "points" && (
          <div className="space-y-4">
            {/* Points summary */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Tổng điểm tích lũy</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{totalPoints}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="h-7 w-7 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Points history */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Lịch sử điểm</h3>
              </div>
              {pointsData?.history && pointsData.history.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {pointsData.history.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.points > 0 ? "bg-green-50" : "bg-red-50"}`}>
                          {entry.points > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <ArrowRight className="h-4 w-4 text-red-500 rotate-45" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{entry.reason}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                      <p className={`font-bold text-sm ${entry.points > 0 ? "text-green-500" : "text-red-500"}`}>
                        {entry.points > 0 ? "+" : ""}{entry.points}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Star className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Chưa có lịch sử điểm</p>
                  <p className="text-xs text-slate-400 mt-1">Điểm sẽ được tích lũy khi mua hàng</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: Warranty ===== */}
        {activeTab === "warranty" && (
          <div className="space-y-4">
            {/* Hero banner */}
            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5" />
                <h3 className="font-bold">Bảo Hành Sản Phẩm</h3>
              </div>
              <p className="text-teal-100 text-sm">Quản lý bảo hành các sản phẩm đã mua và gửi yêu cầu hỗ trợ khi cần.</p>
              <button
                onClick={() => setShowWarrantyForm(!showWarrantyForm)}
                className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5" /> Yêu cầu bảo hành
              </button>
            </div>

            {/* Warranty request form */}
            {showWarrantyForm && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-teal-500" /> Gửi yêu cầu bảo hành
                </h4>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Mã đơn hàng (nếu có)</label>
                  <Input
                    placeholder="VD: INV-ABC123"
                    value={warrantyInvoiceCode}
                    onChange={(e) => setWarrantyInvoiceCode(e.target.value.toUpperCase())}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Mô tả vấn đề <span className="text-red-400">*</span></label>
                  <textarea
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                    value={warrantyDescription}
                    onChange={(e) => setWarrantyDescription(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={submitWarrantyRequest.isPending || warrantyDescription.length < 10}
                    onClick={() => submitWarrantyRequest.mutate({
                      invoiceCode: warrantyInvoiceCode || undefined,
                      customerEmail: customer.email,
                      customerName: customer.name || undefined,
                      description: warrantyDescription,
                    })}
                    className="bg-teal-600 hover:bg-teal-700 gap-1"
                  >
                    {submitWarrantyRequest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                    Gửi yêu cầu
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowWarrantyForm(false)}>Hủy</Button>
                </div>
              </div>
            )}

            {/* Products with warranty */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-teal-500" /> Sản phẩm được bảo hành
              </h4>
              {warrantyProductsLoading ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
                  Đang tải...
                </div>
              ) : (warrantyProducts as any[]).length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-xl">
                  <Shield className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">Chưa có sản phẩm bảo hành</p>
                  <p className="text-slate-400 text-xs mt-1">Sản phẩm có bảo hành sẽ hiển thị sau khi được xác nhận thanh toán</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(warrantyProducts as any[]).map((item: any) => {
                    const expiryDate = item.warrantyExpiryDate ? new Date(item.warrantyExpiryDate) : null;
                    const now = new Date();
                    const isExpired = expiryDate && expiryDate < now;
                    const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex gap-3">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-14 h-14 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-teal-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm line-clamp-1">{item.productName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Đơn: {item.invoiceNumber}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                                isExpired ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                              }`}>
                                <Shield className="h-2.5 w-2.5" />
                                {isExpired ? "Hết bảo hành" : daysLeft !== null ? `Còn ${daysLeft} ngày` : `${item.warrantyMonths} tháng`}
                              </span>
                              {expiryDate && (
                                <span className="text-[10px] text-slate-400">Hết: {formatDate(expiryDate)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past warranty requests */}
            {(warranties as any[]).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" /> Yêu cầu đã gửi
                </h4>
                <div className="space-y-2">
                  {(warranties as any[]).map((warranty: any) => {
                    const status = warrantyStatusMap[warranty.status] || { label: warranty.status, color: "text-slate-500 bg-slate-100" };
                    return (
                      <div key={warranty.id} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-slate-500">{formatDate(warranty.createdAt)}</p>
                            {warranty.invoiceCode && <p className="text-xs text-slate-600 mt-0.5">Đơn: {warranty.invoiceCode}</p>}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 border-t border-slate-100 pt-1.5 line-clamp-2">{warranty.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Tab: Referral ===== */}
        {activeTab === "referral" && isFeatureEnabled("referral") && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Giới thiệu bạn bè</h2>
              <p className="text-sm text-slate-500">Chia sẻ sản phẩm từ shop với bạn bè để hưởng hoa hồng.</p>
            </div>

            {/* Thông tin chương trình */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-slate-800 mb-3">Thông tin</h3>
              <p className="text-sm text-slate-600 mb-1">
                Khi khách hàng truy cập <strong>link giới thiệu</strong> này để tạo tài khoản mới hoặc sử dụng mã giới thiệu của bạn khi thanh toán đơn hàng đầu tiên, shop sẽ ghi nhận hoa hồng cho bạn.
              </p>
              <p className="text-sm text-slate-600 mb-4">Thông tin chi tiết chương trình xem tại đây</p>

              {/* 2 referral links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Liên kết giới thiệu 1 (theo mã)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-2 border-red-400 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white truncate font-mono">
                      {referralCode ? `${window.location.origin}/?ref=${referralCode}` : "..."}
                    </div>
                    <button
                      onClick={() => { if (!referralCode) return; navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode}`); toast.success("Đã sao chép link 1!"); }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex-shrink-0"
                      title="Sao chép"
                    >
                      <Copy className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Liên kết giới thiệu 2 (theo ID)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-2 border-red-400 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white truncate font-mono">
                      {myCodeData?.id ? `${window.location.origin}/?ri=${myCodeData.id}` : referralStats ? `${window.location.origin}/?ri=...` : "..."}
                    </div>
                    <button
                      onClick={() => { const id = myCodeData?.id; if (!id) return; navigator.clipboard.writeText(`${window.location.origin}/?ri=${id}`); toast.success("Đã sao chép link 2!"); }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex-shrink-0"
                      title="Sao chép"
                    >
                      <Copy className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quy đổi / Stats */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-slate-800 mb-4">Quy đổi</h3>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Tổng tiền nhận được */}
                <div className="flex-1 bg-blue-600 rounded-xl p-4 text-white text-center">
                  <p className="text-xs opacity-80 mb-1">Tổng tiền nhận được</p>
                  <p className="text-xl font-bold">{Number(referralStats?.totalRewards ?? 0).toLocaleString("vi-VN")} đ</p>
                </div>
                {/* Stats row */}
                <div className="flex gap-4 sm:gap-6 justify-around sm:justify-start">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Tổng số người giới thiệu</p>
                    <p className="text-lg font-bold text-slate-800">{referralStats?.totalReferrals ?? 0} người</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Số tiền còn lại</p>
                    <p className="text-lg font-bold text-slate-800">{referralBalance.toLocaleString("vi-VN")} đ</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowReferralWithdraw(true)}
                      disabled={referralBalance <= 0}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
                    >
                      Quy đổi
                    </button>
                  </div>
                </div>
              </div>

              {/* Dialog rút thưởng */}
              {showReferralWithdraw && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800">Quy đổi thưởng</h4>
                      <button onClick={() => setShowReferralWithdraw(false)} className="text-slate-400 hover:text-slate-600">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Số dư có thể rút: <span className="font-bold text-green-600">{referralBalance.toLocaleString("vi-VN")} đ</span></p>

                    {/* Chọn hình thức */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setRefWithdrawType("wallet")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                          refWithdrawType === "wallet" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 inline mr-1" /> Vào ví
                      </button>
                      <button
                        onClick={() => setRefWithdrawType("atm")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                          refWithdrawType === "atm" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <Download className="h-4 w-4 inline mr-1" /> Chuyển khoản
                      </button>
                    </div>

                    {/* Số tiền */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Số tiền rút</label>
                      <input
                        type="number"
                        value={refWithdrawAmount}
                        onChange={e => setRefWithdrawAmount(e.target.value)}
                        placeholder="Nhập số tiền..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {[50000, 100000, 200000, 500000].map(amt => (
                          <button key={amt} onClick={() => setRefWithdrawAmount(Math.min(amt, referralBalance).toString())}
                            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium transition">
                            {(amt/1000).toFixed(0)}K
                          </button>
                        ))}
                        <button onClick={() => setRefWithdrawAmount(referralBalance.toString())}
                          className="text-xs px-2.5 py-1 bg-green-100 hover:bg-green-200 rounded-lg text-green-700 font-medium transition">
                          Tất cả
                        </button>
                      </div>
                    </div>

                    {/* Thông tin ngân hàng (nếu chọn ATM) */}
                    {refWithdrawType === "atm" && (
                      <div className="space-y-2 mb-3">
                        <input value={refBankName} onChange={e => setRefBankName(e.target.value)} placeholder="Tên ngân hàng (VD: Vietcombank)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                        <input value={refBankAccount} onChange={e => setRefBankAccount(e.target.value)} placeholder="Số tài khoản" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                        <input value={refBankHolder} onChange={e => setRefBankHolder(e.target.value)} placeholder="Tên chủ tài khoản" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                      </div>
                    )}

                    <button
                      onClick={handleReferralWithdraw}
                      disabled={referralWithdrawMutation.isPending}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-semibold rounded-xl transition text-sm"
                    >
                      {referralWithdrawMutation.isPending ? "Đang xử lý..." : "Xác nhận rút thưởng"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lịch sử rút thưởng */}
            {(myWithdrawals as any[])?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-slate-800 mb-3">Lịch sử rút thưởng</h3>
                <div className="space-y-2">
                  {(myWithdrawals as any[]).map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{w.withdrawType === "wallet" ? "Vào ví" : "Chuyển khoản"}</p>
                        <p className="text-xs text-slate-400">{new Date(w.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{Number(w.amount).toLocaleString("vi-VN")} đ</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          w.status === "completed" ? "bg-green-100 text-green-700" :
                          w.status === "rejected" ? "bg-red-100 text-red-700" :
                          w.status === "processing" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {w.status === "completed" ? "Hoàn thành" : w.status === "rejected" ? "Từ chối" : w.status === "processing" ? "Đang xử lý" : "Chờ xử lý"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lịch sử giao dịch */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-slate-800 mb-4">Lịch sử giao dịch</h3>
              {referralStats?.history && referralStats.history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-xs font-semibold text-slate-500">Thời gian</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500">Mô tả</th>
                        <th className="text-right py-2 text-xs font-semibold text-slate-500">Số tiền</th>
                        <th className="text-right py-2 text-xs font-semibold text-slate-500">Số dư</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(referralStats.history as any[]).map((h: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 text-xs text-slate-500 whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="py-2.5 text-sm text-slate-700">{h.refereeEmail}</td>
                          <td className="py-2.5 text-right">
                            {h.rewardAmount && Number(h.rewardAmount) > 0 ? (
                              <span className="text-xs font-semibold text-green-600">+{Number(h.rewardAmount).toLocaleString("vi-VN")}đ</span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-xs text-slate-500">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Users2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Chưa có lịch sử giao dịch</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: Hỗ trợ ===== */}
        {activeTab === "support" && isFeatureEnabled("ticket") && (
          <SupportTab token={token!} email={customer.email} name={customer.name || ""} />
        )}
        {/* ===== Tab: Hồ sơ & Bảo mật ===== */}
        {activeTab === "profile" && (
          <div className="space-y-5">

            {/* ── Section 1: Hồ sơ cá nhân ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Hồ sơ cá nhân</h3>
                  <p className="text-[11px] text-slate-500">Thông tin tài khoản và ảnh đại diện</p>
                </div>
              </div>

              {/* Avatar + name row */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-slate-100">
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Nút camera - mở popup chọn/upload avatar */}
                  <button
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition disabled:opacity-50 border-2 border-white"
                    onClick={() => avatarGalleryEnabled ? setShowAvatarGallery(true) : handleAvatarUpload()}
                    disabled={uploadAvatarMutation.isPending}
                    title="Đổi ảnh đại diện"
                  >
                    {uploadAvatarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>

                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{customerName}</p>
                  <p className="text-xs text-slate-500 truncate">{customer.email}</p>
                  <button
                    onClick={() => avatarGalleryEnabled ? setShowAvatarGallery(true) : handleAvatarUpload()}
                    className="mt-1.5 text-[10px] text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <Camera className="h-3 w-3" /> Đổi ảnh đại diện
                  </button>
                </div>
              </div>
              {/* Avatar Gallery Modal - only show when avatarGallery feature is enabled */}
              {showAvatarGallery && avatarGalleryEnabled && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowAvatarGallery(false)}>
                  <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-800">📸 Đổi ảnh đại diện</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Chọn từ kho hoặc tải ảnh mới</p>
                      </div>
                      <button onClick={() => setShowAvatarGallery(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1">
                      {(galleryAvatars as any[]).length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">Kho ảnh trống</p>
                          <p className="text-xs mt-1">Admin chưa thêm ảnh avatar nào</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {(galleryAvatars as any[]).map((av: any) => (
                            <button
                              key={av.id}
                              onClick={() => token && selectAvatarMutation.mutate({ token, avatarUrl: av.url })}
                              disabled={selectAvatarMutation.isPending}
                              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:border-blue-400 hover:shadow-md ${
                                avatarUrl === av.url ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
                              }`}
                            >
                              <img src={av.url} alt={av.label || "Avatar"} className="w-full h-full object-cover" />
                              {avatarUrl === av.url && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100">
                      <button
                        onClick={handleAvatarUpload}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Camera className="h-4 w-4" /> Upload ảnh từ máy tính
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal info fields */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin</p>
                  {!isEditingProfile ? (
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition" onClick={() => { setEditName(customer.name || ""); setEditPhone(""); setIsEditingProfile(true); }}>
                      <Wrench className="h-3 w-3" /> Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-100 transition" onClick={() => setIsEditingProfile(false)}>Hủy</button>
                      <button className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition disabled:opacity-50" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Lưu
                      </button>
                    </div>
                  )}
                </div>
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Họ và tên</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nhập họ tên" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Email</label>
                      <Input value={customer.email} disabled className="h-9 text-sm bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Số điện thoại</label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Nhập số điện thoại" className="h-9 text-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { label: "Họ và tên", value: customer.name || "Chưa cập nhật", icon: User },
                      { label: "Email", value: customer.email, icon: Mail },
                      { label: "Số điện thoại", value: "Chưa cập nhật", icon: Phone },
                    ].map((field) => (
                      <div key={field.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <field.icon className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{field.label}</p>
                          <p className="text-sm font-semibold text-slate-700 truncate">{field.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 2: Bảo mật ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Bảo mật</h3>
                  <p className="text-[11px] text-slate-500">Mật khẩu, xác thực 2 bước và thiết bị</p>
                </div>
              </div>

              {/* Change password */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Đổi mật khẩu</p>
                <ChangePasswordForm token={token!} />
              </div>

              {/* 2FA */}
              <div className="px-5 py-4 border-b border-slate-100">
                <TwoFASection token={token!} />
              </div>

              {/* Security links: history + sessions inline */}
              <SecurityInlineSection token={token!} />
            </div>

            {/* ── Section 3: Liên kết Telegram ── */}
            <TelegramLinkSection token={token!} />

            {/* ── Section 4: Cài đặt thông báo ── */}
            <NotificationPrefsSection token={token!} />

            {/* ── Section 4: Tài khoản ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tài khoản</h3>
                  <p className="text-[11px] text-slate-500">Quản lý phiên đăng nhập</p>
                </div>
              </div>
              <button onClick={handleLogout} disabled={logoutMutation.isPending} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition text-left">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <LogOut className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600">Đăng xuất</p>
                  <p className="text-xs text-slate-400">Thoát khỏi tài khoản trên thiết bị này</p>
                </div>
                {logoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-red-400" />}
              </button>
            </div>

          </div>
        )}
      </div>
      <ClientFooter />
    </div>
  );
}
