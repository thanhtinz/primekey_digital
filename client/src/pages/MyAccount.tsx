import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Package, Star, LogOut, ShoppingBag, Shield,
  Gift, Clock, CheckCircle, XCircle, AlertCircle,
  Wrench, Phone, Mail, ChevronRight, TrendingUp, Award,
  Heart, ShoppingCart, Users2, Camera, Loader2,
  Copy, Share2, Trophy, Search, CreditCard, BarChart3,
  ArrowRight, Sparkles, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ClientHeader } from "@/components/ClientHeader";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      <ClientHeader
        maxWidth="max-w-3xl"
        title="Tài Khoản"
        rightSlot={
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition border border-red-200 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* ===== Profile Hero ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-2 ring-white/30">
              {customerName.charAt(0).toUpperCase()}
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
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex justify-end">
                      <button onClick={() => navigate(`/order/${order.id}`)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
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
          <div className="space-y-3">
            {warrantiesLoading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải yêu cầu bảo hành...
              </div>
            ) : warranties.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                <Shield className="h-14 w-14 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">Không có yêu cầu bảo hành</p>
                <p className="text-slate-400 text-sm mt-1">Các yêu cầu bảo hành sẽ hiển thị tại đây</p>
              </div>
            ) : (
              warranties.map((warranty: any) => {
                const status = warrantyStatusMap[warranty.status] || { label: warranty.status, color: "text-slate-500 bg-slate-100" };
                return (
                  <div key={warranty.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Mã SP: {warranty.productCode}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(warranty.createdAt)}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 border-t border-slate-100 pt-2">Lý do: {warranty.reason}</p>
                  </div>
                );
              })
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
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition" onClick={() => toast.info("Tính năng upload avatar sẽ sớm được hoàn thiện")}>
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{customerName}</p>
                  <p className="text-xs text-slate-400">{customer.email}</p>
                  <p className="text-[10px] text-slate-300 mt-1">Nhấn camera để thay đổi</p>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Thông tin cá nhân</h3>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" onClick={() => toast.info("Tính năng chỉnh sửa hồ sơ sẽ sớm được hoàn thiện")}>
                  <Wrench className="h-3 w-3" /> Chỉnh sửa
                </button>
              </div>
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
