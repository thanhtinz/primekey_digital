import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Package, Star, LogOut, ShoppingBag, Shield,
  Gift, Clock, CheckCircle, XCircle, AlertCircle,
  Wrench, Phone, Mail, ChevronRight, TrendingUp, Award,
  Heart, ShoppingCart, Users2, Camera, Loader2
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

  const tabs: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: "orders", label: "Đơn Hàng", icon: Package, badge: totalOrders },
    { id: "points", label: "Điểm Thưởng", icon: Star, badge: totalPoints > 0 ? totalPoints : undefined },
    { id: "warranty", label: "Bảo Hành", icon: Shield, badge: (warranties as any[]).length > 0 ? (warranties as any[]).length : undefined },
    { id: "profile", label: "Hồ Sơ", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader
        maxWidth="max-w-3xl"
        title="Tài Khoản Của Tôi"
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

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/50 via-purple-50/50 to-slate-100 border border-slate-200 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/20 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/10 flex-shrink-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-slate-800 text-xl font-bold truncate">{customerName}</h2>
              <p className="text-slate-500 text-sm truncate">{customer.email}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                  <Star className="h-4 w-4" />
                  {totalPoints} điểm
                </span>
                <span className="text-slate-400"> • </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {totalOrders} đơn hàng
                </span>
                {completedOrders > 0 && (
                  <>
                    <span className="text-slate-400"> • </span>
                    <span className="flex items-center gap-1 text-emerald-500 text-sm">
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
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
              <p className="text-xs text-slate-500 mt-0.5">Đơn hàng</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{totalPoints}</p>
              <p className="text-xs text-slate-500 mt-0.5">Điểm tích lũy</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{warranties.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Bảo hành</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button onClick={() => navigate("/cart")} className="flex flex-col items-center gap-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl p-3 transition">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Giỏ hàng</span>
            </button>
            <button onClick={() => navigate("/wishlist")} className="flex flex-col items-center gap-1.5 bg-red-50 hover:bg-red-100 rounded-xl p-3 transition">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-xs font-medium text-red-600">Yêu thích</span>
            </button>
            <button onClick={() => navigate("/referral")} className="flex flex-col items-center gap-1.5 bg-purple-50 hover:bg-purple-100 rounded-xl p-3 transition">
              <Users2 className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Giới thiệu</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition relative ${
                activeTab === id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
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
              <div className="text-center py-16 text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">Chưa có đơn hàng nào</p>
                <p className="text-slate-500 text-sm mt-1">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
                <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition">
                  Xem Sản Phẩm
                </button>
              </div>
            ) : (
              orders.map((order: any) => {
                const st = orderStatusMap[order.status] || { label: order.status, color: "text-slate-500 bg-slate-100 border-slate-200", icon: AlertCircle };
                const StatusIcon = st.icon;
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-slate-800 font-mono font-semibold text-sm">{order.invoiceNumber}</p>
                          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-800 font-bold text-sm">{formatCurrency(Number(order.totalAmount ?? order.total ?? 0))}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium border ${st.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {st.label}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 font-medium truncate">{item.name}</p>
                              <p className="text-slate-500 text-xs">SL: {item.quantity}</p>
                            </div>
                            <p className="text-slate-600 font-medium">{formatCurrency(item.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex justify-end">
                      <button onClick={() => navigate(`/order/${order.id}`)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                        Xem Chi Tiết <ChevronRight className="h-3.5 w-3.5" />
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Lịch Sử Điểm</h3>
              <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                <Star className="h-5 w-5" />
                <span className="text-xl">{totalPoints}</span>
              </div>
            </div>
            {pointsData?.history && pointsData.history.length > 0 ? (
              <ul className="space-y-3">
                {pointsData.history.map((entry: any) => (
                  <li key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-700">{entry.reason}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(entry.createdAt)}</p>
                    </div>
                    <p className={`font-bold text-lg ${entry.points > 0 ? "text-green-500" : "text-red-500"}`}>
                      {entry.points > 0 ? "+" : ""}{entry.points}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">Chưa có lịch sử điểm</p>
                <p className="text-slate-500 text-sm mt-1">Điểm thưởng sẽ được tích lũy khi mua hàng.</p>
              </div>
            )}
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
              <div className="text-center py-16">
                <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">Không có yêu cầu bảo hành</p>
                <p className="text-slate-500 text-sm mt-1">Các yêu cầu bảo hành của bạn sẽ được hiển thị tại đây.</p>
              </div>
            ) : (
              warranties.map((warranty: any) => {
                const status = warrantyStatusMap[warranty.status] || { label: warranty.status, color: "text-slate-500 bg-slate-100" };
                return (
                  <div key={warranty.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">Mã SP: {warranty.productCode}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(warranty.createdAt)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 border-t border-slate-200 pt-2">Lý do: {warranty.reason}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== Tab: Profile ===== */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Avatar section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Ảnh Đại Diện</h3>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition" onClick={() => toast.info("Tính năng upload avatar sẽ sớm được hoàn thiện")}>
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{customerName}</p>
                  <p className="text-sm text-slate-500">{customer.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Nhấn vào biểu tượng camera để thay đổi ảnh</p>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Thông Tin Cá Nhân</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Họ và tên</span>
                  <span className="font-medium text-slate-700">{customer.name || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-700">{customer.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Số điện thoại</span>
                  <span className="font-medium text-slate-700">Chưa cập nhật</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Địa chỉ</span>
                  <span className="font-medium text-slate-700">Chưa cập nhật</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" onClick={() => toast.info("Tính năng chỉnh sửa hồ sơ sẽ sớm được hoàn thiện")}>
                  Chỉnh Sửa <Wrench className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Account actions */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button onClick={() => navigate("/cart")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Giỏ hàng của tôi</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => navigate("/wishlist")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-slate-700">Sản phẩm yêu thích</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => navigate("/referral")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Users2 className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Giới thiệu bạn bè</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => navigate("/track-order")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Tra cứu đơn hàng</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
