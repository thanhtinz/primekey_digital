import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Package, Star, LogOut, ShoppingBag, Shield,
  ArrowLeft, Gift, Clock, CheckCircle, XCircle, AlertCircle,
  Wrench, Phone, Mail, ChevronRight, TrendingUp, Award
} from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const orderStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  CREATED: { label: "Chờ Xử Lý", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Clock },
  PAID: { label: "Đã Thanh Toán", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: CheckCircle },
  SHIPPING: { label: "Đang Giao", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Package },
  WARRANTY: { label: "Bảo Hành", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Shield },
  CANCELLED: { label: "Đã Hủy", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  COMPLETED: { label: "Hoàn Thành", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
};

const warrantyStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ Xử Lý", color: "text-yellow-400 bg-yellow-400/10" },
  IN_PROGRESS: { label: "Đang Xử Lý", color: "text-blue-400 bg-blue-400/10" },
  COMPLETED: { label: "Hoàn Thành", color: "text-green-400 bg-green-400/10" },
  REJECTED: { label: "Từ Chối", color: "text-red-400 bg-red-400/10" },
};

type TabType = "orders" | "points" | "warranty" | "profile";

export default function MyAccount() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
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
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400">Đang tải...</p>
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

  const tabs: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "orders", label: "Đơn Hàng", icon: Package, badge: totalOrders },
    { id: "points", label: "Điểm Thưởng", icon: Star, badge: totalPoints > 0 ? totalPoints : undefined },
    { id: "warranty", label: "Bảo Hành", icon: Shield, badge: (warranties as any[]).length > 0 ? (warranties as any[]).length : undefined },
    { id: "profile", label: "Hồ Sơ", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <header className="bg-[#0d1526]/95 backdrop-blur border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition">
            <ArrowLeft className="h-4 w-4" />
            Trang chủ
          </button>
          <h1 className="text-white font-semibold">Tài Khoản Của Tôi</h1>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="text-red-400 hover:text-red-300 flex items-center gap-1.5 text-sm transition disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Thoát
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-900 border border-white/10 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30 flex-shrink-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-xl font-bold truncate">{customerName}</h2>
              <p className="text-slate-400 text-sm truncate">{customer.email}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                  <Star className="h-4 w-4" />
                  {totalPoints} điểm
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-400 text-sm">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {totalOrders} đơn hàng
                </span>
                {completedOrders > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-emerald-400 text-sm">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {completedOrders} hoàn thành
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-xs text-slate-500 mt-0.5">Đơn hàng</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalPoints}</p>
              <p className="text-xs text-slate-500 mt-0.5">Điểm tích lũy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{(warranties as any[]).length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Bảo hành</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition relative ${
                activeTab === id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${activeTab === id ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== Tab: Orders ===== */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="text-center py-16 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải đơn hàng...
              </div>
            ) : (orders as any[]).length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium">Chưa có đơn hàng nào</p>
                <p className="text-slate-500 text-sm mt-1">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
                <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition">
                  Xem Sản Phẩm
                </button>
              </div>
            ) : (
              (orders as any[]).map((order: any) => {
                const st = orderStatusMap[order.status] || { label: order.status, color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: AlertCircle };
                const StatusIcon = st.icon;
                return (
                  <div key={order.id} className="bg-[#161b22] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-mono font-semibold text-sm">{order.invoiceNumber}</p>
                          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{formatCurrency(Number(order.totalAmount ?? order.total ?? 0))}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border mt-1 ${st.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                      </div>
                      {order.items?.length > 0 && (
                        <div className="border-t border-white/8 pt-3 space-y-1.5">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-slate-300 truncate flex-1 mr-2">{item.productName} <span className="text-slate-500">×{item.quantity}</span></span>
                              <span className="text-slate-400 flex-shrink-0">{formatCurrency(Number(item.total ?? item.totalAmount ?? 0))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {order.paymentUrl && order.status === "CREATED" && (
                      <div className="px-4 pb-4">
                        <a
                          href={order.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition"
                        >
                          Thanh Toán Ngay
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Tab: Points ===== */}
        {activeTab === "points" && (
          <div className="space-y-4">
            {/* Points balance card */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/30">
                <Award className="h-8 w-8 text-white" />
              </div>
              <p className="text-5xl font-bold text-white mb-1">{totalPoints}</p>
              <p className="text-yellow-400 font-medium">Điểm tích lũy</p>
              <p className="text-slate-500 text-sm mt-2">Tích điểm qua mỗi đơn hàng thành công</p>
            </div>

            {/* Points history */}
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Lịch Sử Điểm
              </h3>
              {(pointsData?.history as any[] ?? []).length === 0 ? (
                <div className="text-center py-10">
                  <Gift className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">Chưa có lịch sử điểm</p>
                  <p className="text-slate-500 text-sm mt-1">Điểm được tích lũy khi đơn hàng hoàn thành</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(pointsData?.history as any[]).map((h: any) => (
                    <div key={h.id} className="bg-[#161b22] border border-white/8 rounded-xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${h.points > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          {h.points > 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : <ChevronRight className="h-4 w-4 text-red-400 rotate-180" />}
                        </div>
                        <div>
                          <p className="text-white text-sm">{h.reason === "EARNED_ORDER" ? "Tích điểm đơn hàng" : h.reason === "REDEEMED" ? "Đổi điểm" : "Điều chỉnh thủ công"}</p>
                          <p className="text-slate-500 text-xs">{formatDate(h.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${h.points > 0 ? "text-green-400" : "text-red-400"}`}>
                        {h.points > 0 ? "+" : ""}{h.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: Warranty ===== */}
        {activeTab === "warranty" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Danh Sách Bảo Hành
              </h3>
              <button
                onClick={() => navigate("/warranty-request")}
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                <Wrench className="h-3.5 w-3.5" />
                Gửi Yêu Cầu
              </button>
            </div>

            {warrantiesLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải...
              </div>
            ) : (warranties as any[]).length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium">Chưa có bảo hành nào</p>
                <p className="text-slate-500 text-sm mt-1">Bảo hành được tạo khi đơn hàng chuyển sang trạng thái bảo hành</p>
                <button
                  onClick={() => navigate("/warranty-request")}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm transition flex items-center gap-2 mx-auto"
                >
                  <Wrench className="h-4 w-4" />
                  Gửi Yêu Cầu Bảo Hành
                </button>
              </div>
            ) : (
              (warranties as any[]).map((w: any) => {
                const ws = warrantyStatusMap[w.status] || { label: w.status, color: "text-slate-400 bg-slate-400/10" };
                return (
                  <div key={w.id} className="bg-[#161b22] border border-white/8 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-mono font-semibold text-sm">{w.invoiceNumber}</p>
                        <p className="text-slate-400 text-sm mt-0.5">{w.productNames || "Sản phẩm bảo hành"}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ws.color}`}>{ws.label}</span>
                    </div>
                    {(w.warrantyStartDate || w.warrantyExpiryDate) && (
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/8">
                        {w.warrantyStartDate && (
                          <div>
                            <p className="text-xs text-slate-500">Bắt đầu</p>
                            <p className="text-sm text-white">{formatDate(w.warrantyStartDate)}</p>
                          </div>
                        )}
                        {w.warrantyExpiryDate && (
                          <div>
                            <p className="text-xs text-slate-500">Hết hạn</p>
                            <p className={`text-sm font-medium ${new Date(w.warrantyExpiryDate) < new Date() ? "text-red-400" : "text-green-400"}`}>
                              {formatDate(w.warrantyExpiryDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {w.reason && (
                      <p className="text-slate-400 text-xs mt-2 pt-2 border-t border-white/8">{w.reason}</p>
                    )}
                    {w.resolution && (
                      <div className="mt-2 p-2 bg-green-500/10 rounded-lg">
                        <p className="text-green-400 text-xs"><span className="font-medium">Kết quả:</span> {w.resolution}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Tab: Profile ===== */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="bg-[#161b22] border border-white/8 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">Tên</p>
                  <p className="text-white font-medium">{customerName}</p>
                </div>
              </div>
              <div className="bg-[#161b22] border border-white/8 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">Email</p>
                  <p className="text-white font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="bg-[#161b22] border border-white/8 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">Điểm tích lũy</p>
                  <p className="text-yellow-400 font-bold">{totalPoints} điểm</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Tiện Ích</h3>
              <div className="space-y-2">
                {[
                  { label: "Tra Cứu Đơn Hàng", icon: Package, href: "/track-order", color: "text-blue-400" },
                  { label: "Tra Cứu Bảo Hành", icon: Shield, href: "/warranty", color: "text-green-400" },
                  { label: "Gửi Yêu Cầu Bảo Hành", icon: Wrench, href: "/warranty-request", color: "text-purple-400" },
                  { label: "Flash Sale", icon: Star, href: "/flash-sale", color: "text-orange-400" },
                  { label: "Bảng Xếp Hạng", icon: Award, href: "/leaderboard", color: "text-yellow-400" },
                ].map(({ label, icon: Icon, href, color }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className="w-full bg-[#161b22] border border-white/8 rounded-xl p-3.5 flex items-center gap-3 hover:border-white/15 hover:bg-white/5 transition text-left"
                  >
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-white text-sm flex-1">{label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng Xuất"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
