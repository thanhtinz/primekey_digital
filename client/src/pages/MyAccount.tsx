import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Package, Star, LogOut, ShoppingBag, Shield,
  Gift, Clock, CheckCircle, XCircle, AlertCircle,
  Wrench, Phone, Mail, ChevronRight, TrendingUp, Award,
  Heart, ShoppingCart, Users2, Camera, Loader2,
  Copy, Share2, Trophy, Search, CreditCard, BarChart3,
  ArrowRight, Sparkles, Eye, Lock, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ClientHeader } from "@/components/ClientHeader";

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
  CREATED: { label: "Chờ Xử Lý", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock },
  PAID: { label: "Đã Thanh Toán", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle },
  SHIPPING: { label: "Đang Giao", color: "text-yellow-500 bg-yellow-50 border-yellow-200", icon: Package },
  WARRANTY: { label: "Bảo Hành", color: "text-purple-600 bg-purple-50 border-purple-200", icon: Shield },
  CANCELLED: { label: "Đã Hủy", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
  COMPLETED: { label: "Hoàn Thành", color: "text-emerald-500 bg-emerald-50 border-emerald-200", icon: CheckCircle },
};

const warrantyStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ Xử Lý", color: "text-yellow-500 bg-yellow-50" },
  IN_PROGRESS: { label: "Đang Xử Lý", color: "text-blue-600 bg-blue-50" },
  COMPLETED: { label: "Hoàn Thành", color: "text-green-600 bg-green-50" },
  REJECTED: { label: "Từ Chối", color: "text-red-600 bg-red-50" },
};

type TabType = "overview" | "orders" | "points" | "warranty" | "referral" | "profile";

export default function MyAccount() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { customer, token, logout, isLoading: authLoading } = useCustomerAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
      <div className="min-h-screen pt-14 bg-slate-50 flex items-center justify-center">
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
  const completedOrders = (orders as any[]).filter((o: any) => o.status === "COMPLETED").length;
  const pendingOrders = (orders as any[]).filter((o: any) => o.status === "CREATED" || o.status === "PAID").length;

  const tabs: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "orders", label: "Đơn hàng", icon: Package, badge: pendingOrders > 0 ? pendingOrders : undefined },
    { id: "points", label: "Điểm", icon: Star },
    { id: "warranty", label: "Bảo hành", icon: Shield },
    { id: "referral", label: "Giới thiệu", icon: Users2 },
    { id: "profile", label: "Hồ sơ", icon: User },
  ];

  const copyReferralCode = () => {
    const code = customer.email.split("@")[0].toUpperCase().slice(0, 8);
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã giới thiệu!");
  };

  const referralCode = customer.email.split("@")[0].toUpperCase().slice(0, 8);

  return (
    <div className="min-h-screen pt-14 bg-slate-50">
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
          {/* Quick stats row */}
          <div className="relative grid grid-cols-4 gap-2 mt-4">
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
          <button onClick={() => navigate("/wishlist")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 rounded-xl p-3 transition group">
            <div className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition">
              <Heart className="h-4.5 w-4.5 text-red-500" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-red-600">Yêu thích</span>
          </button>
          <button onClick={() => navigate("/track-order")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50 rounded-xl p-3 transition group">
            <div className="w-9 h-9 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition">
              <Search className="h-4.5 w-4.5 text-green-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-green-700">Tra cứu đơn</span>
          </button>
          <button onClick={() => navigate("/leaderboard")} className="flex flex-col items-center gap-1.5 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl p-3 transition group">
            <div className="w-9 h-9 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition">
              <Trophy className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-amber-700">BXH</span>
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 min-w-max">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition relative whitespace-nowrap ${
                  activeTab === id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className={`ml-1 w-4.5 h-4.5 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab === id ? "bg-white text-blue-600" : "bg-red-500 text-white"}`}>
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

            {/* Referral card */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-800">Giới thiệu bạn bè</p>
                  <p className="text-xs text-purple-600">Nhận thưởng khi bạn bè đăng ký</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 font-mono text-sm font-bold text-purple-700 tracking-wider">
                  {referralCode}
                </div>
                <button
                  onClick={copyReferralCode}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Sao chép
                </button>
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Đơn hàng gần đây</h3>
                <button onClick={() => setActiveTab("orders")} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
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
            </div>
          </div>
        )}

        {/* ===== Tab: Orders ===== */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <ShoppingBag className="h-14 w-14 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">Chưa có đơn hàng nào</p>
                <p className="text-slate-400 text-sm mt-1">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
                <button onClick={() => navigate("/catalog")} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition">
                  Xem Sản Phẩm
                </button>
              </div>
            ) : (
              orders.map((order: any) => {
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
                              <p className="text-slate-600 font-medium text-xs">{formatCurrency(item.price)}</p>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-slate-400 pl-12">+{order.items.length - 2} sản phẩm khác</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex justify-between items-center gap-2">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); window.open(`/api/invoices/${order.id}/pdf?token=${token}`, '_blank'); }}
                        className="text-slate-500 hover:text-slate-700 text-xs font-medium flex items-center gap-1"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Xuất PDF
                      </a>
                      {(order.status === 'CREATED' || order.status === 'sent') && order.paymentLink && (
                        <a href={order.paymentLink} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Thanh toán ngay
                        </a>
                      )}
                      <button onClick={() => navigate(`/track-order?invoice=${order.invoiceNumber}`)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                        Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
        {activeTab === "referral" && (
          <div className="space-y-4">
            {/* Referral hero */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5" />
                  <h3 className="font-bold">Giới thiệu bạn bè</h3>
                </div>
                <p className="text-purple-200 text-sm mb-4">Chia sẻ mã giới thiệu và nhận phần thưởng khi bạn bè đăng ký thành công!</p>
                
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 mb-3">
                  <p className="text-[10px] text-purple-200 uppercase tracking-wider mb-1">Mã giới thiệu của bạn</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-lg font-bold tracking-widest">{referralCode}</span>
                    <button
                      onClick={copyReferralCode}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Sao chép
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?ref=${referralCode}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Đã sao chép link giới thiệu!");
                  }}
                  className="w-full py-2.5 bg-white text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" /> Chia sẻ link giới thiệu
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Cách thức hoạt động</h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Chia sẻ mã", desc: "Gửi mã giới thiệu cho bạn bè", icon: Share2, color: "bg-blue-50 text-blue-600" },
                  { step: "2", title: "Bạn bè đăng ký", desc: "Bạn bè nhập mã khi tạo tài khoản", icon: Users2, color: "bg-green-50 text-green-600" },
                  { step: "3", title: "Nhận thưởng", desc: "Cả hai cùng nhận phần thưởng hấp dẫn", icon: Gift, color: "bg-purple-50 text-purple-600" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to full referral page */}
            <button
              onClick={() => navigate("/referral")}
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Xem thống kê chi tiết</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* ===== Tab: Profile ===== */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Avatar section */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Ảnh đại diện</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-xl object-cover shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                    onClick={handleAvatarUpload}
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{customerName}</p>
                  <p className="text-xs text-slate-400">{customer.email}</p>
                  <p className="text-[10px] text-slate-300 mt-1">Nhấn camera để thay đổi (định dạng JPG/PNG, tối đa 2MB)</p>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Thông tin cá nhân</h3>
                {!isEditingProfile ? (
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" onClick={() => { setEditName(customer.name || ""); setEditPhone(""); setIsEditingProfile(true); }}>
                    <Wrench className="h-3 w-3" /> Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button className="text-xs text-slate-500 hover:text-slate-700 font-medium" onClick={() => setIsEditingProfile(false)}>Hủy</button>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Lưu
                    </button>
                  </div>
                )}
              </div>
              {isEditingProfile ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Họ và tên</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nhập họ tên" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Email</label>
                    <Input value={customer.email} disabled className="h-9 text-sm bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Số điện thoại</label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Nhập số điện thoại" className="h-9 text-sm" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Họ và tên", value: customer.name || "Chưa cập nhật", icon: User },
                    { label: "Email", value: customer.email, icon: Mail },
                    { label: "Số điện thoại", value: "Chưa cập nhật", icon: Phone },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                      <field.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{field.label}</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change password */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                Đổi Mật Khẩu
              </h3>
              <ChangePasswordForm token={token!} />
            </div>

            {/* Account security */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Tài khoản</h3>
              </div>
              <button onClick={handleLogout} disabled={logoutMutation.isPending} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition text-left">
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-600">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
