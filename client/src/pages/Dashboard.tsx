import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import {
  TrendingUp, FileText, CheckCircle, Clock, ArrowUpRight, RefreshCw,
  Package, Users, AlertTriangle, Send, Loader2, ShoppingCart,
  Wallet, Star, ArrowRight, Plus, Zap, BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CREATED:   { label: "Chờ xác nhận", color: "text-blue-700",   bg: "bg-blue-100" },
  PAID:      { label: "Đang xử lý",   color: "text-teal-700",   bg: "bg-teal-100" },
  SHIPPING:  { label: "Đang giao",    color: "text-amber-700",  bg: "bg-amber-100" },
  COMPLETED: { label: "Hoàn thành",   color: "text-green-700",  bg: "bg-green-100" },
  WARRANTY:  { label: "Bảo hành",     color: "text-purple-700", bg: "bg-purple-100" },
  FAILED:    { label: "Thất bại",     color: "text-red-700",    bg: "bg-red-100" },
  REFUNDED:  { label: "Hoàn tiền",    color: "text-orange-700", bg: "bg-orange-100" },
  CANCELLED: { label: "Đã hủy",       color: "text-gray-700",   bg: "bg-gray-100" },
  EXPIRED:   { label: "Hết hạn",      color: "text-gray-700",   bg: "bg-gray-100" },
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = trpc.reports.getDashboardStats.useQuery();
  const { data: revenueByMonth, isLoading: revenueLoading } = trpc.reports.getRevenueByMonth.useQuery();
  const { data: invoiceStats } = trpc.reports.getInvoiceStats.useQuery();
  const { data: recentInvoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery();
  const { data: topProducts } = trpc.reports.getTopProducts.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: expiringSoon, refetch: refetchExpiring } = trpc.invoices.getExpiringSoon.useQuery();
  const sendBulkReminderMutation = trpc.reminders.sendBulkReminder.useMutation();

  const handleSendBulkReminder = async () => {
    if (!expiringSoon || expiringSoon.length === 0) return;
    if (!confirm(`Gửi email nhắc nhở cho ${expiringSoon.length} khách hàng có đơn sắp hết hạn?`)) return;
    setIsSendingBulk(true);
    try {
      const invoiceIds = expiringSoon.map((inv: any) => inv.id);
      const result = await sendBulkReminderMutation.mutateAsync({ invoiceIds, origin: window.location.origin });
      toast.success(`Đã gửi ${result.sent} email nhắc nhở thành công`);
      refetchExpiring();
    } catch {
      toast.error("Gửi email thất bại");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const revenueData = (revenueByMonth || []).map(item => ({
    month: item.month,
    revenue: typeof item.revenue === "string" ? parseFloat(item.revenue) : (item.revenue || 0),
  }));

  const totalRevenue = typeof dashboardStats?.totalRevenue === "string"
    ? parseFloat(dashboardStats.totalRevenue)
    : (dashboardStats?.totalRevenue || 0);

  const paymentRate = dashboardStats?.totalInvoices
    ? Math.round((dashboardStats.paidInvoices / dashboardStats.totalInvoices) * 100) : 0;

  const latestInvoices = (recentInvoices || []).slice(0, 8);

  // Status bar chart data
  const statusBarData = invoiceStats ? Object.entries(invoiceStats)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: STATUS_CONFIG[k]?.label || k, value: v as number, key: k })) : [];

  const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"];

  return (
    <DashboardLayout>
      <div className="space-y-5 p-1">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tổng Quan</h1>
            <p className="text-xs text-gray-400 mt-0.5">Cập nhật theo thời gian thực</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchStats()} className="h-8 gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </Button>
            <Button size="sm" onClick={() => setLocation("/invoices/new")} className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" /> Tạo hóa đơn
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              {/* Revenue */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-blue-100">Tổng Doanh Thu</p>
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold truncate">{totalRevenue.toLocaleString("vi-VN")}</p>
                  <p className="text-xs text-blue-200 mt-0.5">VND</p>
                </CardContent>
              </Card>

              {/* Total invoices */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500">Tổng Hóa Đơn</p>
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalInvoices || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">hóa đơn</p>
                </CardContent>
              </Card>

              {/* Paid */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500">Đã Thanh Toán</p>
                    <div className="bg-green-100 p-1.5 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.paidInvoices || 0}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${paymentRate}%` }} />
                    </div>
                    <span className="text-xs text-green-600 font-medium">{paymentRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pending */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500">Chờ Xử Lý</p>
                    <div className="bg-orange-100 p-1.5 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.pendingInvoices || 0}</p>
                  <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" /> cần xử lý
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Quản lý đơn",   icon: ShoppingCart, href: "/invoices",  color: "text-blue-600",   bg: "bg-blue-50 hover:bg-blue-100" },
            { label: "Sản phẩm",      icon: Package,      href: "/products",  color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" },
            { label: "Khách hàng",    icon: Users,        href: "/customers", color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
            { label: "Quản lý ví",    icon: Wallet,       href: "/wallet-management", color: "text-teal-600", bg: "bg-teal-50 hover:bg-teal-100" },
          ].map(({ label, icon: Icon, href, color, bg }) => (
            <button
              key={href}
              onClick={() => setLocation(href)}
              className={`flex items-center gap-2 p-3 rounded-xl ${bg} transition-colors text-left`}
            >
              <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
              <span className={`text-xs font-medium ${color}`}>{label}</span>
              <ArrowRight className={`h-3 w-3 ${color} ml-auto opacity-60`} />
            </button>
          ))}
        </div>

        {/* ── Revenue Chart + Status Bar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Area Chart */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-500" />
                Doanh Thu Theo Tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-52" />
              ) : revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-gray-300">
                  <TrendingUp className="h-10 w-10 mb-2" />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#D1D5DB" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#D1D5DB" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                      formatter={(v) => [`${(v as number).toLocaleString("vi-VN")} VND`, "Doanh thu"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Bar Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Trạng Thái Đơn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusBarData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-gray-300">
                  <FileText className="h-10 w-10 mb-2" />
                  <p className="text-sm">Chưa có đơn</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={statusBarData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#D1D5DB" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} stroke="#D1D5DB" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v} đơn`, ""]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {statusBarData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Top Products + Recent Customers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Sản Phẩm Nổi Bật
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/products")} className="text-blue-600 text-xs h-7 px-2">
                  Xem tất cả →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!topProducts || topProducts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-300">
                  <Package className="h-10 w-10 mb-2" />
                  <p className="text-sm">Chưa có sản phẩm</p>
                </div>
              ) : topProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400"
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-1 rounded-full"
                        style={{ width: `${Math.min(100, (p.price / (topProducts[0]?.price || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                    {(p.price || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Khách Hàng Gần Đây
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/customers")} className="text-blue-600 text-xs h-7 px-2">
                  Xem tất cả →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-blue-700">{customers?.length || 0}</p>
                  <p className="text-xs text-blue-400">Tổng khách</p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-green-700">{dashboardStats?.paidInvoices || 0}</p>
                  <p className="text-xs text-green-400">Đơn đã TT</p>
                </div>
              </div>
              {customers && customers.length > 0 ? (
                <div className="space-y-1.5">
                  {customers.slice(0, 4).map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/customers/${c.id}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{(c.name || "?").charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email || c.phone || ""}</p>
                      </div>
                      {c.totalInvoices > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">{c.totalInvoices} đơn</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-gray-300">
                  <Users className="h-10 w-10 mb-2" />
                  <p className="text-sm">Chưa có khách hàng</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Expiring Soon Alert ── */}
        {expiringSoon && expiringSoon.length > 0 && (
          <Card className="border-0 shadow-sm border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Hóa Đơn Sắp Hết Hạn ({expiringSoon.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="outline"
                    onClick={handleSendBulkReminder}
                    disabled={isSendingBulk}
                    className="text-xs h-7 px-2.5 border-orange-300 text-orange-700 hover:bg-orange-100 gap-1.5"
                  >
                    {isSendingBulk ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Gửi Nhắc Tất Cả
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="text-orange-600 text-xs h-7 px-2">
                    Xem tất cả →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {expiringSoon.slice(0, 4).map((inv) => {
                  const expiresAt = inv.expiresAt ? new Date(inv.expiresAt) : null;
                  const minutesLeft = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 60000) : null;
                  const hoursLeft = minutesLeft !== null ? Math.floor(minutesLeft / 60) : null;
                  const minsLeft = minutesLeft !== null ? minutesLeft % 60 : null;
                  const timeLabel = hoursLeft !== null
                    ? hoursLeft > 0 ? `Còn ${hoursLeft}h ${minsLeft}m` : `Còn ${minsLeft}m` : "";
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-orange-100 hover:border-orange-300 cursor-pointer transition-all hover:shadow-sm"
                      onClick={() => setLocation(`/invoices/${inv.id}`)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{inv.invoiceNumber}</p>
                          <p className="text-xs text-gray-400">{Number(inv.totalAmount || 0).toLocaleString("vi-VN")}đ</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{timeLabel}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent Invoices Table ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Hóa Đơn Gần Đây
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="text-blue-600 text-xs h-7 px-2">
                Xem tất cả →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="p-4 space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : latestInvoices.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-300">
                <FileText className="h-10 w-10 mb-2" />
                <p className="text-sm">Chưa có hóa đơn nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/80">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Số HĐ</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Ngày</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Khách hàng</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Số Tiền</th>
                      <th className="text-center py-2.5 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestInvoices.map((inv) => {
                      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
                      const status = inv.status || "CREATED";
                      const cfg = STATUS_CONFIG[status] || { label: status, color: "text-gray-700", bg: "bg-gray-100" };
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                          onClick={() => setLocation(`/invoices/${inv.id}`)}
                        >
                          <td className="py-3 px-4 font-semibold text-blue-600 text-xs">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs hidden sm:table-cell">
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell truncate max-w-[120px]">
                            {(inv as any).customerName || "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800 text-xs">
                            {amount.toLocaleString("vi-VN")}đ
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
