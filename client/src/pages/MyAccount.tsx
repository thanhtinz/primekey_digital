import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, Package, Star, LogOut, ChevronRight, ShoppingBag, Shield, Clock, ArrowLeft } from "lucide-react";

export default function MyAccount() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"orders" | "points" | "profile">("orders");

  useEffect(() => {
    const t = localStorage.getItem("customerToken");
    const n = localStorage.getItem("customerName");
    const e = localStorage.getItem("customerEmail");
    if (!t) { navigate("/client-login"); return; }
    setToken(t);
    setCustomerName(n || "");
    setCustomerEmail(e || "");
  }, []);

  const { data: orders = [], isLoading: ordersLoading } = trpc.customer.myOrders.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 30_000 }
  );

  const { data: pointsData } = trpc.customer.myPoints.useQuery(
    { token: token! },
    { enabled: !!token, staleTime: 30_000 }
  );

  const logoutMutation = trpc.customer.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerName");
      localStorage.removeItem("customerEmail");
      toast.success("Đã đăng xuất");
      navigate("/");
    },
  });

  const statusLabel: Record<string, { label: string; color: string }> = {
    CREATED: { label: "Tạo Đơn", color: "text-blue-400 bg-blue-400/10" },
    PAID: { label: "Đã Thanh Toán", color: "text-green-400 bg-green-400/10" },
    SHIPPING: { label: "Đang Giao", color: "text-yellow-400 bg-yellow-400/10" },
    WARRANTY: { label: "Bảo Hành", color: "text-purple-400 bg-purple-400/10" },
    CANCELLED: { label: "Đã Hủy", color: "text-red-400 bg-red-400/10" },
    COMPLETED: { label: "Hoàn Thành", color: "text-emerald-400 bg-emerald-400/10" },
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="bg-[#0d1526] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition">
            <ArrowLeft className="h-4 w-4" />
            Trang chủ
          </button>
          <h1 className="text-white font-semibold">Tài Khoản Của Tôi</h1>
          <button
            onClick={() => logoutMutation.mutate({ token: token! })}
            className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition"
          >
            <LogOut className="h-4 w-4" />
            Thoát
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {customerName.charAt(0).toUpperCase() || "K"}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{customerName || "Khách hàng"}</h2>
              <p className="text-slate-400 text-sm">{customerEmail}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{pointsData?.points ?? 0} điểm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
          {[
            { id: "orders", label: "Đơn Hàng", icon: Package },
            { id: "points", label: "Điểm Thưởng", icon: Star },
            { id: "profile", label: "Hồ Sơ", icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Orders */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Đang tải đơn hàng...
              </div>
            ) : (orders as any[]).length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              (orders as any[]).map((order: any) => {
                const st = statusLabel[order.status] || { label: order.status, color: "text-slate-400 bg-slate-400/10" };
                return (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-mono font-semibold text-sm">{order.invoiceNumber}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(Number(order.total))}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                    {order.items?.length > 0 && (
                      <div className="border-t border-white/10 pt-3 space-y-1">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-300">{item.productName} × {item.quantity}</span>
                            <span className="text-slate-400">{formatCurrency(Number(item.total))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Points */}
        {activeTab === "points" && (
          <div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 rounded-2xl p-6 mb-4 text-center">
              <Star className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
              <p className="text-4xl font-bold text-white">{pointsData?.points ?? 0}</p>
              <p className="text-yellow-400 text-sm mt-1">Điểm tích lũy</p>
            </div>
            <div className="space-y-2">
              {(pointsData?.history as any[] ?? []).length === 0 ? (
                <p className="text-center text-slate-400 py-8">Chưa có lịch sử điểm</p>
              ) : (
                (pointsData?.history as any[]).map((h: any) => (
                  <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm">{h.description || "Tích điểm đơn hàng"}</p>
                      <p className="text-slate-400 text-xs">{new Date(h.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <span className={`font-bold ${h.points > 0 ? "text-green-400" : "text-red-400"}`}>
                      {h.points > 0 ? "+" : ""}{h.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Tên</p>
              <p className="text-white">{customerName || "—"}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Email</p>
              <p className="text-white">{customerEmail}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Điểm tích lũy</p>
              <p className="text-yellow-400 font-bold">{pointsData?.points ?? 0} điểm</p>
            </div>

            <button
              onClick={() => logoutMutation.mutate({ token: token! })}
              className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition flex items-center justify-center gap-2 font-medium"
            >
              <LogOut className="h-4 w-4" />
              Đăng Xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
